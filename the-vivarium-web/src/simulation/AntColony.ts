import type { AntEntity, GridCoord, Vector2D } from '../types';
import { SubterraneanGrid } from './SubterraneanGrid';

export class AntColony {
  ants: AntEntity[] = [];
  grid: SubterraneanGrid;

  // Key waypoints
  queenCell: GridCoord = { cx: 10, cy: 13 };
  surfaceCell: GridCoord = { cx: 25, cy: 1 };
  granaryCell: GridCoord = { cx: 42, cy: 11 };

  constructor(grid: SubterraneanGrid, workerCount: number = 12) {
    this.grid = grid;
    this.initColony(workerCount);
  }

  private initColony(workerCount: number): void {
    // 1. Spawn Queen Ant (Larger, stationed inside Royal Chamber)
    const queenPos = this.grid.cellToWorld(this.queenCell);
    this.ants.push({
      id: 'queen-ant-0',
      type: 'QUEEN',
      position: { ...queenPos },
      targetPos: null,
      angle: 0,
      speed: 12,
      state: 'IDLE',
      path: [],
      pathIndex: 0,
      energy: 100,
      carriedResource: null,
      walkCycle: 0,
    });

    // 2. Spawn Worker Ants scattered throughout initial chambers
    const spawnNodes: GridCoord[] = [
      this.queenCell,
      { cx: 18, cy: 12 },
      { cx: 25, cy: 6 },
      this.granaryCell,
      { cx: 26, cy: 20 },
    ];

    for (let i = 0; i < workerCount; i++) {
      const node = spawnNodes[i % spawnNodes.length];
      const worldPos = this.grid.cellToWorld(node);
      // Small jitter so they don't overlap exactly
      const pos: Vector2D = {
        x: worldPos.x + (Math.random() - 0.5) * 20,
        y: worldPos.y + (Math.random() - 0.5) * 20,
      };

      this.ants.push({
        id: `ant-worker-${i}`,
        type: 'WORKER',
        position: pos,
        targetPos: null,
        angle: Math.random() * Math.PI * 2,
        speed: 55 + Math.random() * 20,
        state: 'WANDERING',
        path: [],
        pathIndex: 0,
        energy: 100,
        carriedResource: null,
        walkCycle: Math.random() * 10,
      });
    }
  }

  update(delta: number, onMudExcavated?: () => void): void {
    const digOrders = this.grid.getDigOrders();

    for (const ant of this.ants) {
      ant.walkCycle += delta * (ant.speed * 0.15);

      if (ant.type === 'QUEEN') {
        // Queen idles, rotates gently, breathes
        ant.angle += Math.sin(ant.walkCycle * 0.1) * 0.005;
        continue;
      }

      // Worker Ant Logic
      this.updateWorker(ant, delta, digOrders, onMudExcavated);
    }
  }

  private updateWorker(
    ant: AntEntity,
    delta: number,
    digOrders: GridCoord[],
    onMudExcavated?: () => void
  ): void {
    // 1. Moving along current path
    if (ant.path.length > 0 && ant.pathIndex < ant.path.length) {
      const targetCell = ant.path[ant.pathIndex];
      const targetWorld = this.grid.cellToWorld(targetCell);

      const dx = targetWorld.x - ant.position.x;
      const dy = targetWorld.y - ant.position.y;
      const dist = Math.hypot(dx, dy);
      const step = ant.speed * delta;

      if (dist <= step) {
        ant.position.x = targetWorld.x;
        ant.position.y = targetWorld.y;
        ant.pathIndex++;

        if (ant.pathIndex >= ant.path.length) {
          // Reached end of path
          this.handlePathFinished(ant, onMudExcavated);
        }
      } else {
        const moveAngle = Math.atan2(dy, dx);
        ant.position.x += Math.cos(moveAngle) * step;
        ant.position.y += Math.sin(moveAngle) * step;
        ant.angle = moveAngle;
      }
      return;
    }

    // 2. Idle / Wandering: Check if there is an active dig order to fulfill
    if (digOrders.length > 0 && ant.state !== 'CARRYING_MUD') {
      const currentCell = this.grid.worldToCell(ant.position);
      // Find closest dig order that has an adjacent walkable cell
      for (const order of digOrders) {
        const adj = this.findWalkableAdjacent(order);
        if (adj) {
          const path = this.grid.findPath(currentCell, adj);
          if (path && path.length > 0) {
            ant.path = path;
            ant.pathIndex = 0;
            ant.state = 'MOVING_TO_DIG';
            ant.targetPos = this.grid.cellToWorld(order);
            return;
          }
        }
      }
    }

    // 3. Otherwise wander between key chambers
    if (ant.state === 'WANDERING' || ant.state === 'IDLE') {
      const currentCell = this.grid.worldToCell(ant.position);
      const destinations = [this.queenCell, this.surfaceCell, this.granaryCell, { cx: 26, cy: 24 }];
      const chosen = destinations[Math.floor(Math.random() * destinations.length)];
      
      const path = this.grid.findPath(currentCell, chosen);
      if (path && path.length > 1) {
        ant.path = path;
        ant.pathIndex = 0;
        ant.state = 'WANDERING';
      }
    }
  }

  private handlePathFinished(ant: AntEntity, onMudExcavated?: () => void): void {
    if (ant.state === 'MOVING_TO_DIG' && ant.targetPos) {
      // Reached adjacent cell, perform excavation!
      const targetCell = this.grid.worldToCell(ant.targetPos);
      this.grid.setSolid(targetCell.cx, targetCell.cy, false);
      ant.carriedResource = 'MUD';
      ant.state = 'CARRYING_MUD';
      if (onMudExcavated) onMudExcavated();

      // Return mud to surface entrance
      const currentCell = this.grid.worldToCell(ant.position);
      const returnPath = this.grid.findPath(currentCell, this.surfaceCell);
      if (returnPath) {
        ant.path = returnPath;
        ant.pathIndex = 0;
      } else {
        ant.state = 'WANDERING';
        ant.carriedResource = null;
      }
    } else if (ant.state === 'CARRYING_MUD') {
      // Dump mud at surface entrance
      ant.carriedResource = null;
      ant.state = 'WANDERING';
      ant.path = [];
      ant.pathIndex = 0;
    } else {
      ant.state = 'IDLE';
      ant.path = [];
      ant.pathIndex = 0;
    }
  }

  private findWalkableAdjacent(target: GridCoord): GridCoord | null {
    const offsets = [
      { dx: 0, dy: -1 },
      { dx: 0, dy: 1 },
      { dx: -1, dy: 0 },
      { dx: 1, dy: 0 },
    ];
    for (const o of offsets) {
      const nx = target.cx + o.dx;
      const ny = target.cy + o.dy;
      if (!this.grid.isSolid(nx, ny)) {
        return { cx: nx, cy: ny };
      }
    }
    return null;
  }
}
