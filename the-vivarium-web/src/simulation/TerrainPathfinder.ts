// src/simulation/TerrainPathfinder.ts
// ============================================================================
// THE VIVARIUM — 4-Directional A* Pathfinding on OrganicTerrainData
// Resolution: 75 cols x 32 rows, 32px cell size, originX: -1200, originY: 0
// ============================================================================

import type { GridCoord } from '../types';
import type { OrganicTerrainData } from '../engine/OrganicTerrainData';

export class TerrainPathfinder {
  private terrain: OrganicTerrainData;

  constructor(terrain: OrganicTerrainData) {
    this.terrain = terrain;
  }

  isWalkable(cx: number, cy: number): boolean {
    if (cx < 0 || cx >= this.terrain.cols || cy < 0 || cy >= this.terrain.rows) {
      return false;
    }
    return !this.terrain.isSolid(cx, cy);
  }

  findPath(start: GridCoord, goal: GridCoord): GridCoord[] | null {
    if (!this.isWalkable(start.cx, start.cy) || !this.isWalkable(goal.cx, goal.cy)) {
      if (start.cx === goal.cx && start.cy === goal.cy) {
        return [start];
      }
      return null;
    }

    if (start.cx === goal.cx && start.cy === goal.cy) {
      return [start];
    }

    const startKey = `${start.cx},${start.cy}`;

    const queue: { coord: GridCoord; priority: number }[] = [];
    const costSoFar = new Map<string, number>();
    const parentMap = new Map<string, GridCoord>();

    costSoFar.set(startKey, 0);
    queue.push({ coord: start, priority: 0 });

    const neighbors = [
      { dx: 1, dy: 0 },
      { dx: -1, dy: 0 },
      { dx: 0, dy: 1 },
      { dx: 0, dy: -1 },
    ];

    while (queue.length > 0) {
      // Small priority queue: sort ascending
      queue.sort((a, b) => a.priority - b.priority);
      const current = queue.shift()!.coord;
      const currentKey = `${current.cx},${current.cy}`;

      if (current.cx === goal.cx && current.cy === goal.cy) {
        // Reconstruct path
        const path: GridCoord[] = [current];
        let currKey = currentKey;
        while (parentMap.has(currKey)) {
          const p = parentMap.get(currKey)!;
          path.unshift(p);
          currKey = `${p.cx},${p.cy}`;
        }
        return path;
      }

      const currentCost = costSoFar.get(currentKey)!;

      for (const n of neighbors) {
        const nx = current.cx + n.dx;
        const ny = current.cy + n.dy;

        if (this.isWalkable(nx, ny)) {
          const nextKey = `${nx},${ny}`;
          const newCost = currentCost + 1;
          if (!costSoFar.has(nextKey) || newCost < costSoFar.get(nextKey)!) {
            costSoFar.set(nextKey, newCost);
            const heuristic = Math.abs(goal.cx - nx) + Math.abs(goal.cy - ny);
            queue.push({ coord: { cx: nx, cy: ny }, priority: newCost + heuristic });
            parentMap.set(nextKey, current);
          }
        }
      }
    }

    return null; // No path found
  }

  findWalkableAdjacent(target: GridCoord, fromCoord?: GridCoord): GridCoord | null {
    const offsets = [
      { dx: 0, dy: -1 },
      { dx: 0, dy: 1 },
      { dx: -1, dy: 0 },
      { dx: 1, dy: 0 },
    ];

    let bestNeighbor: GridCoord | null = null;
    let bestDist = Infinity;

    for (const o of offsets) {
      const nx = target.cx + o.dx;
      const ny = target.cy + o.dy;
      if (this.isWalkable(nx, ny)) {
        if (!fromCoord) return { cx: nx, cy: ny };
        const dist = Math.abs(fromCoord.cx - nx) + Math.abs(fromCoord.cy - ny);
        if (dist < bestDist) {
          bestDist = dist;
          bestNeighbor = { cx: nx, cy: ny };
        }
      }
    }

    return bestNeighbor;
  }
}
