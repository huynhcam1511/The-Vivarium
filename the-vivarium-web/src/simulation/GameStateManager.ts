// src/simulation/GameStateManager.ts
// ============================================================================
// THE VIVARIUM — Game State Manager (Save / Load MVP with Schema Versioning)
// Schema: version "0.1.0"
// Persistence: Browser localStorage
// ============================================================================

import type { GridCoord } from '../types';
import { OrganicTerrainData } from '../engine/OrganicTerrainData';
import { AntColony } from './AntColony';
import { ClayMudStockpile } from './ClayMudStockpile';
import { JobQueue } from './JobQueue';
import { DesignationManager } from './DesignationManager';
import { HoneydewSource } from './HoneydewSource';

export interface VivariumSaveDataV1 {
  version: '0.1.0';
  timestamp: number;
  biomeId: 'ancient_forest';
  terrain: {
    cols: number;
    rows: number;
    solidCellsRLE: string; // Run-Length Encoded 1s and 0s
  };
  resources: {
    clayMudAvailable: number;
    clayMudReserved: number;
    foodHoneydewAvailable: number;
  };
  colony: {
    speciesId: string;
    ants: Array<{
      id: string;
      type: 'WORKER' | 'QUEEN';
      x: number;
      y: number;
      angle: number;
      state: string;
      energy: number;
      mudPayload: number;
      carriedResource: string | null;
      currentJobId?: number | string | null;
      targetJobCell?: GridCoord | null;
      jobTimer?: number;
      jobDuration?: number;
    }>;
  };
  jobs: {
    pendingDesignations: Array<{ type: 'DIG' | 'FILL'; cx: number; cy: number }>;
  };
}

export class GameStateManager {
  public static readonly STORAGE_KEY = 'vivarium_save_v01';
  public static readonly CURRENT_VERSION = '0.1.0';

  /**
   * Serialize live gameplay state into validated JSON save structure
   */
  public static createSaveData(
    terrain: OrganicTerrainData,
    colony: AntColony,
    stockpile: ClayMudStockpile,
    honeydewSource: HoneydewSource,
    _jobQueue: JobQueue,
    designationManager: DesignationManager
  ): VivariumSaveDataV1 {
    // 1. Pack terrain solid cells via RLE (run-length encoding)
    const totalCells = terrain.cols * terrain.rows;
    let rle = '';
    let currentVal = terrain.isSolid(0, 0) ? 1 : 0;
    let currentCount = 0;

    for (let i = 0; i < totalCells; i++) {
      const cx = i % terrain.cols;
      const cy = Math.floor(i / terrain.cols);
      const val = terrain.isSolid(cx, cy) ? 1 : 0;
      if (val === currentVal) {
        currentCount++;
      } else {
        rle += `${currentVal}:${currentCount},`;
        currentVal = val;
        currentCount = 1;
      }
    }
    rle += `${currentVal}:${currentCount}`;

    // 2. Serialize ants
    const ants = colony.ants.map((a) => ({
      id: a.id,
      type: a.type as 'WORKER' | 'QUEEN',
      x: a.position.x,
      y: a.position.y,
      angle: a.angle,
      state: a.state,
      energy: a.energy,
      mudPayload: a.mudPayload ?? 0,
      carriedResource: a.carriedResource,
      currentJobId: a.currentJobId,
      targetJobCell: a.targetJobCell,
      jobTimer: a.jobTimer,
      jobDuration: a.jobDuration,
    }));

    // 3. Serialize active designations
    const pendingDesignations = designationManager.getAllDesignations().map((d) => ({
      type: d.type as 'DIG' | 'FILL',
      cx: d.cx,
      cy: d.cy,
    }));

    return {
      version: GameStateManager.CURRENT_VERSION,
      timestamp: Date.now(),
      biomeId: 'ancient_forest',
      terrain: {
        cols: terrain.cols,
        rows: terrain.rows,
        solidCellsRLE: rle,
      },
      resources: {
        clayMudAvailable: stockpile.getAvailableCount(),
        clayMudReserved: stockpile.getReservedCount(),
        foodHoneydewAvailable: honeydewSource.getAvailableCount(),
      },
      colony: {
        speciesId: colony.speciesStats.id,
        ants,
      },
      jobs: {
        pendingDesignations,
      },
    };
  }

  /**
   * Save game data to localStorage with error handling
   */
  public static saveGame(
    terrain: OrganicTerrainData,
    colony: AntColony,
    stockpile: ClayMudStockpile,
    honeydewSource: HoneydewSource,
    jobQueue: JobQueue,
    designationManager: DesignationManager
  ): boolean {
    try {
      const data = this.createSaveData(
        terrain,
        colony,
        stockpile,
        honeydewSource,
        jobQueue,
        designationManager
      );
      const json = JSON.stringify(data);
      localStorage.setItem(this.STORAGE_KEY, json);
      return true;
    } catch (err) {
      console.error('[GameStateManager] Failed to save game:', err);
      return false;
    }
  }

  /**
   * Check if a valid save exists in localStorage
   */
  public static hasSaveGame(): boolean {
    return localStorage.getItem(this.STORAGE_KEY) !== null;
  }

  /**
   * Validate raw save object schema integrity
   */
  public static validateSaveData(data: unknown): data is VivariumSaveDataV1 {
    if (!data || typeof data !== 'object') return false;
    const d = data as Record<string, unknown>;
    if (d.version !== GameStateManager.CURRENT_VERSION) return false;
    if (d.biomeId !== 'ancient_forest') return false;
    if (!d.terrain || typeof d.terrain !== 'object') return false;
    if (!d.resources || typeof d.resources !== 'object') return false;
    if (!d.colony || typeof d.colony !== 'object') return false;
    if (!d.jobs || typeof d.jobs !== 'object') return false;
    return true;
  }

  /**
   * Load and restore game state into live engine components
   */
  public static loadGame(
    terrain: OrganicTerrainData,
    colony: AntColony,
    stockpile: ClayMudStockpile,
    honeydewSource: HoneydewSource,
    jobQueue: JobQueue,
    designationManager: DesignationManager,
    onTerrainModified?: (dirtyBox: { minX: number; maxX: number; minY: number; maxY: number }) => void
  ): boolean {
    const raw = localStorage.getItem(this.STORAGE_KEY);
    if (!raw) return false;

    try {
      const parsed = JSON.parse(raw);
      if (!this.validateSaveData(parsed)) {
        console.warn('[GameStateManager] Save file schema validation failed');
        return false;
      }

      // 1. Restore terrain solids from RLE
      const parts = parsed.terrain.solidCellsRLE.split(',');
      let cellIdx = 0;
      for (const part of parts) {
        const [valStr, countStr] = part.split(':');
        const val = parseInt(valStr, 10);
        const count = parseInt(countStr, 10);
        for (let k = 0; k < count; k++) {
          const cx = cellIdx % terrain.cols;
          const cy = Math.floor(cellIdx / terrain.cols);
          terrain.setSolid(cx, cy, val === 1);
          cellIdx++;
        }
      }

      // 2. Restore resources
      // Stockpile available + reserved
      const targetAvail = parsed.resources.clayMudAvailable;
      const targetRes = parsed.resources.clayMudReserved;
      stockpile.unreserve(stockpile.getReservedCount());
      stockpile.withdraw(stockpile.getAvailableCount());
      stockpile.deposit(targetAvail + targetRes);
      if (targetRes > 0) {
        stockpile.reserve(targetRes);
      }

      // Honeydew
      const targetFood = parsed.resources.foodHoneydewAvailable;
      honeydewSource.consume(honeydewSource.getAvailableCount());
      honeydewSource.replenish(targetFood);

      // 3. Restore designations and job queue
      designationManager.clear();
      jobQueue.clear();

      for (const des of parsed.jobs.pendingDesignations) {
        designationManager.addDesignation(des.type, des.cx, des.cy);
        jobQueue.pushJob(des.type, { cx: des.cx, cy: des.cy });
      }

      // 4. Restore ants safely
      colony.ants = [];
      for (const a of parsed.colony.ants) {
        const restoredAnt: any = {
          id: a.id,
          type: a.type,
          position: { x: a.x, y: a.y },
          targetPos: null,
          angle: a.angle,
          speed: colony.speciesStats.moveSpeedPx,
          state: a.state as any,
          path: [],
          pathIndex: 0,
          energy: a.energy,
          carriedResource: a.carriedResource as any,
          walkCycle: 0,
          currentJobId: a.currentJobId,
          jobTimer: a.jobTimer,
          jobDuration: a.jobDuration,
          targetJobCell: a.targetJobCell,
          mudPayload: a.mudPayload,
        };

        // Resume in-flight navigation if path was interrupted
        const antCell = colony.worldToCell(restoredAnt.position);
        if (restoredAnt.state === 'HAULING_MUD') {
          if (restoredAnt.targetJobCell && restoredAnt.currentJobId) {
            // Hauling mud to backfill site
            const adj = colony.pathfinder.findWalkableAdjacent(restoredAnt.targetJobCell, antCell);
            if (adj) {
              const path = colony.pathfinder.findPath(antCell, adj);
              if (path) {
                restoredAnt.path = path;
                restoredAnt.pathIndex = 0;
              }
            }
          } else {
            // Hauling excavated mud back to stockpile
            const returnPath = colony.pathfinder.findPath(antCell, stockpile.pickupWaypoint);
            if (returnPath) {
              restoredAnt.path = returnPath;
              restoredAnt.pathIndex = 0;
            }
          }
        } else if (restoredAnt.state === 'MOVING_TO_JOB' && restoredAnt.targetJobCell) {
          const adj = colony.pathfinder.findWalkableAdjacent(restoredAnt.targetJobCell, antCell);
          if (adj) {
            const path = colony.pathfinder.findPath(antCell, adj);
            if (path) {
              restoredAnt.path = path;
              restoredAnt.pathIndex = 0;
            }
          }
        } else if (restoredAnt.state === 'MOVING_TO_STOCKPILE') {
          const path = colony.pathfinder.findPath(antCell, stockpile.pickupWaypoint);
          if (path) {
            restoredAnt.path = path;
            restoredAnt.pathIndex = 0;
          }
        } else if (restoredAnt.state === 'SEEKING_FOOD') {
          const path = colony.pathfinder.findPath(antCell, honeydewSource.cell);
          if (path) {
            restoredAnt.path = path;
            restoredAnt.pathIndex = 0;
          }
        }

        colony.ants.push(restoredAnt);
      }

      // Rebuild terrain mesh
      if (onTerrainModified) {
        onTerrainModified({
          minX: terrain.originX,
          maxX: terrain.originX + terrain.cols * terrain.cellSize,
          minY: terrain.originY,
          maxY: terrain.originY + terrain.rows * terrain.cellSize,
        });
      }

      return true;
    } catch (err) {
      console.error('[GameStateManager] Error loading save data:', err);
      return false;
    }
  }

  /**
   * Delete save data from localStorage
   */
  public static clearSaveGame(): void {
    localStorage.removeItem(this.STORAGE_KEY);
  }
}
