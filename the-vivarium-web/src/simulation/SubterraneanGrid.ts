import type { GridCoord, Vector2D } from '../types';

export class SubterraneanGrid {
  readonly cols: number;
  readonly rows: number;
  readonly cellSize: number;
  readonly originY: number; // Y pixel offset where subterranean layer begins

  // Grid occupancy: true = solid soil, false = excavated cavity
  private grid: Uint8Array;
  
  // Pending dig orders set by player: true = queued for excavation
  private digQueue: Set<string>;

  constructor(cols: number = 60, rows: number = 36, cellSize: number = 32, originY: number = 640) {
    this.cols = cols;
    this.rows = rows;
    this.cellSize = cellSize;
    this.originY = originY;
    this.grid = new Uint8Array(cols * rows);
    this.digQueue = new Set();

    // Default all cells to solid (1)
    this.grid.fill(1);

    this.carveInitialColony();
  }

  private cellIndex(cx: number, cy: number): number {
    return cy * this.cols + cx;
  }

  isSolid(cx: number, cy: number): boolean {
    if (cx < 0 || cx >= this.cols || cy < 0 || cy >= this.rows) return true;
    return this.grid[this.cellIndex(cx, cy)] === 1;
  }

  setSolid(cx: number, cy: number, solid: boolean): void {
    if (cx < 0 || cx >= this.cols || cy < 0 || cy >= this.rows) return;
    this.grid[this.cellIndex(cx, cy)] = solid ? 1 : 0;
    if (!solid) {
      this.digQueue.delete(`${cx},${cy}`);
    }
  }

  queueDig(cx: number, cy: number): boolean {
    if (!this.isSolid(cx, cy)) return false;
    this.digQueue.add(`${cx},${cy}`);
    return true;
  }

  hasDigOrder(cx: number, cy: number): boolean {
    return this.digQueue.has(`${cx},${cy}`);
  }

  getDigOrders(): GridCoord[] {
    const list: GridCoord[] = [];
    this.digQueue.forEach((key) => {
      const [cx, cy] = key.split(',').map(Number);
      list.push({ cx, cy });
    });
    return list;
  }

  cancelDigOrder(cx: number, cy: number): void {
    this.digQueue.delete(`${cx},${cy}`);
  }

  worldToCell(worldPos: Vector2D): GridCoord {
    const cx = Math.floor(worldPos.x / this.cellSize);
    const cy = Math.floor((worldPos.y - this.originY) / this.cellSize);
    return { cx, cy };
  }

  cellToWorld(cell: GridCoord): Vector2D {
    return {
      x: cell.cx * this.cellSize + this.cellSize * 0.5,
      y: this.originY + cell.cy * this.cellSize + this.cellSize * 0.5,
    };
  }

  private carveInitialColony(): void {
    // 1. Surface entrance shaft from surface down to central junction
    for (let cy = 0; cy <= 12; cy++) {
      this.setSolid(25, cy, false);
      this.setSolid(26, cy, false);
    }

    // 2. West corridor to Royal Queen Chamber
    for (let cx = 14; cx <= 25; cx++) {
      this.setSolid(cx, 12, false);
      this.setSolid(cx, 13, false);
    }

    // 3. Royal Queen Chamber (Large organic oval) at (10, 13)
    this.carveOval(10, 13, 5, 3);

    // 4. East corridor to Granary & Brood Vault
    for (let cx = 26; cx <= 40; cx++) {
      this.setSolid(cx, 12, false);
      this.setSolid(cx, 13, false);
    }

    // 5. Brood Nursery at (42, 11)
    this.carveOval(42, 11, 4, 3);

    // 6. Deep Moisture Well shaft downwards: (26, 13) -> (26, 24)
    for (let cy = 13; cy <= 24; cy++) {
      this.setSolid(26, cy, false);
    }
    // Deep Granary at (26, 25)
    this.carveOval(26, 25, 4, 3);
  }

  private carveOval(centerCx: number, centerCy: number, rx: number, ry: number): void {
    for (let dy = -ry; dy <= ry; dy++) {
      for (let dx = -rx; dx <= rx; dx++) {
        if ((dx * dx) / (rx * rx) + (dy * dy) / (ry * ry) <= 1.05) {
          this.setSolid(centerCx + dx, centerCy + dy, false);
        }
      }
    }
  }

  // BFS / A* Pathfinding for Ants in 4 cardinal directions
  findPath(start: GridCoord, end: GridCoord): GridCoord[] | null {
    if (this.isSolid(start.cx, start.cy) || this.isSolid(end.cx, end.cy)) {
      return null;
    }
    if (start.cx === end.cx && start.cy === end.cy) {
      return [start];
    }

    const queue: GridCoord[] = [start];
    const visited = new Set<string>();
    const parentMap = new Map<string, GridCoord>();

    const startKey = `${start.cx},${start.cy}`;
    visited.add(startKey);

    const neighbors = [
      { dx: 1, dy: 0 },
      { dx: -1, dy: 0 },
      { dx: 0, dy: 1 },
      { dx: 0, dy: -1 },
    ];

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (current.cx === end.cx && current.cy === end.cy) {
        // Reconstruct path
        const path: GridCoord[] = [current];
        let currKey = `${current.cx},${current.cy}`;
        while (parentMap.has(currKey)) {
          const parent = parentMap.get(currKey)!;
          path.unshift(parent);
          currKey = `${parent.cx},${parent.cy}`;
        }
        return path;
      }

      for (const n of neighbors) {
        const nx = current.cx + n.dx;
        const ny = current.cy + n.dy;

        if (nx >= 0 && nx < this.cols && ny >= 0 && ny < this.rows) {
          const key = `${nx},${ny}`;
          if (!this.isSolid(nx, ny) && !visited.has(key)) {
            visited.add(key);
            parentMap.set(key, current);
            queue.push({ cx: nx, cy: ny });
          }
        }
      }
    }
    return null;
  }
}
