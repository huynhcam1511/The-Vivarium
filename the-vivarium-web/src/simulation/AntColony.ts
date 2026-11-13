// src/simulation/AntColony.ts
// ============================================================================
// THE VIVARIUM — Worker Ant Colony Simulation & State Machine
// Coordinates aligned to OrganicTerrainData (75 cols x 32 rows, 32px, origin -1200, 0)
// States: IDLE, WANDERING, MOVING_TO_JOB, DIGGING, MOVING_TO_STOCKPILE,
//         RETRIEVING_MUD, HAULING_MUD, BACKFILLING, ATTENDING_QUEEN
// ============================================================================

import type { AntEntity, GridCoord, Vector2D } from '../types';
import { OrganicTerrainData } from '../engine/OrganicTerrainData';
import { TerrainPathfinder } from './TerrainPathfinder';
import { JobQueue } from './JobQueue';
import { ClayMudStockpile } from './ClayMudStockpile';
import { DesignationManager } from './DesignationManager';
import { COMMON_FOREST_ANT, type SpeciesStats } from './SpeciesRegistry';
import { HoneydewSource } from './HoneydewSource';

export class AntColony {
  ants: AntEntity[] = [];
  terrainData: OrganicTerrainData;
  pathfinder: TerrainPathfinder;
  jobQueue: JobQueue;
  stockpile: ClayMudStockpile;
  designationManager: DesignationManager;
  speciesStats: SpeciesStats = COMMON_FOREST_ANT;
  honeydewSource: HoneydewSource;

  // Key Subterranean Chamber Waypoints (in canonical coordinates)
  queenCell: GridCoord = { cx: 57, cy: 14 };      // Royal Chamber (X: 640, Y: 460)
  surfaceCell: GridCoord = { cx: 46, cy: 1 };     // Surface Entry Shaft (X: 280, Y: 20)
  livingCell: GridCoord = { cx: 50, cy: 10 };     // Living Chamber (X: 400, Y: 320)
  nurseryCell: GridCoord = { cx: 26, cy: 8 };     // West Nursery (X: -360, Y: 280)
  stockpileCell: GridCoord = { cx: 48, cy: 8 };   // Clay Stockpile Chamber (X: 352, Y: 256)

  constructor(
    terrainOrGrid?: any,
    pathfinderOrCount?: any,
    jobQueue?: JobQueue,
    stockpile?: ClayMudStockpile,
    designationManager?: DesignationManager,
    honeydewSource?: HoneydewSource,
    workerCount: number = 12
  ) {
    if (terrainOrGrid instanceof OrganicTerrainData) {
      this.terrainData = terrainOrGrid;
    } else if (terrainOrGrid && typeof terrainOrGrid.isSolid === 'function' && terrainOrGrid.cols === 75) {
      this.terrainData = terrainOrGrid;
    } else {
      this.terrainData = new OrganicTerrainData();
    }

    if (pathfinderOrCount instanceof TerrainPathfinder) {
      this.pathfinder = pathfinderOrCount;
    } else {
      this.pathfinder = new TerrainPathfinder(this.terrainData);
    }

    this.jobQueue = jobQueue ?? new JobQueue();
    this.stockpile = stockpile ?? new ClayMudStockpile();
    this.designationManager = designationManager ?? new DesignationManager();
    this.honeydewSource = honeydewSource ?? new HoneydewSource();

    const count = typeof pathfinderOrCount === 'number' ? pathfinderOrCount : workerCount;
    this.initColony(count);
  }

  // Compatibility getter for any legacy code referencing .grid
  get grid(): any {
    return {
      cellToWorld: (cell: GridCoord) => this.cellToWorldCenter(cell),
      worldToCell: (pos: Vector2D) => this.worldToCell(pos),
      isSolid: (cx: number, cy: number) => this.terrainData.isSolid(cx, cy),
      setSolid: (cx: number, cy: number, solid: boolean) => this.terrainData.setSolid(cx, cy, solid),
      findPath: (start: GridCoord, goal: GridCoord) => this.pathfinder.findPath(start, goal),
      getDigOrders: () => [],
    };
  }

  public worldToCell(pos: Vector2D): GridCoord {
    return {
      cx: Math.floor((pos.x - this.terrainData.originX) / this.terrainData.cellSize),
      cy: Math.floor((pos.y - this.terrainData.originY) / this.terrainData.cellSize),
    };
  }

  public cellToWorldCenter(cell: GridCoord): Vector2D {
    return {
      x: this.terrainData.originX + (cell.cx + 0.5) * this.terrainData.cellSize,
      y: this.terrainData.originY + (cell.cy + 0.5) * this.terrainData.cellSize,
    };
  }

  private initColony(workerCount: number): void {
    this.ants = [];

    // 1. Spawn Queen Ant (Stationed inside Royal Chamber)
    const queenPos = this.cellToWorldCenter(this.queenCell);
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
      this.livingCell,
      this.stockpileCell,
      this.nurseryCell,
      { cx: 50, cy: 11 },
      { cx: 48, cy: 7 },
      { cx: 27, cy: 9 },
    ];

    for (let i = 0; i < workerCount; i++) {
      const node = spawnNodes[i % spawnNodes.length];
      const worldPos = this.cellToWorldCenter(node);
      const pos: Vector2D = {
        x: worldPos.x + (Math.random() - 0.5) * 16,
        y: worldPos.y + (Math.random() - 0.5) * 16,
      };

      this.ants.push({
        id: `ant-worker-${i}`,
        type: 'WORKER',
        position: pos,
        targetPos: null,
        angle: Math.random() * Math.PI * 2,
        speed: this.speciesStats.moveSpeedPx,
        state: 'IDLE',
        path: [],
        pathIndex: 0,
        energy: 100,
        carriedResource: null,
        walkCycle: Math.random() * 10,
        currentJobId: null,
        jobTimer: 0,
        jobDuration: this.speciesStats.digDurationSec,
        targetJobCell: null,
        mudPayload: 0,
      });
    }
  }

  update(
    delta: number,
    onTerrainModified?: (dirtyBox: { minX: number; maxX: number; minY: number; maxY: number }) => void
  ): void {
    for (const ant of this.ants) {
      ant.walkCycle += delta * (ant.speed * 0.15);

      if (ant.type === 'QUEEN') {
        ant.angle += Math.sin(ant.walkCycle * 0.1) * 0.005;
        continue;
      }

      this.updateWorker(ant, delta, onTerrainModified);
    }
  }

  private updateWorker(
    ant: AntEntity,
    delta: number,
    onTerrainModified?: (dirtyBox: { minX: number; maxX: number; minY: number; maxY: number }) => void
  ): void {
    // ------------------------------------------------------------------------
    // MOVEMENT PHASE
    // ------------------------------------------------------------------------
    if (ant.path.length > 0 && ant.pathIndex < ant.path.length) {
      const targetCell = ant.path[ant.pathIndex];
      const targetWorld = this.cellToWorldCenter(targetCell);

      const dx = targetWorld.x - ant.position.x;
      const dy = targetWorld.y - ant.position.y;
      const dist = Math.hypot(dx, dy);
      const step = ant.speed * delta;

      if (dist <= step) {
        ant.position.x = targetWorld.x;
        ant.position.y = targetWorld.y;
        ant.pathIndex++;

        if (ant.pathIndex >= ant.path.length) {
          this.handlePathDestinationReached(ant, onTerrainModified);
        }
      } else {
        const moveAngle = Math.atan2(dy, dx);
        ant.position.x += Math.cos(moveAngle) * step;
        ant.position.y += Math.sin(moveAngle) * step;
        ant.angle = moveAngle;
        ant.energy = Math.max(0, ant.energy - delta * this.speciesStats.energyPerMovePerSec);
      }
      return;
    }

    // ------------------------------------------------------------------------
    // WORK / ACTION TIMERS PHASE
    // ------------------------------------------------------------------------
    
    if (ant.state === 'EATING') {
      ant.jobTimer = (ant.jobTimer ?? 0) + delta;
      if (ant.jobTimer >= 1.5) {
        // Finished eating: consume honeydew & restore energy
        const consumed = this.honeydewSource.consume(1);
        if (consumed > 0) {
          ant.energy = Math.min(this.speciesStats.maxEnergy, ant.energy + this.honeydewSource.energyPerFeed);
        }
        ant.state = 'IDLE';
        ant.jobTimer = 0;
      }
      return;
    }

    if (ant.state === 'DIGGING') {
      ant.jobTimer = (ant.jobTimer ?? 0) + delta;
      ant.energy = Math.max(0, ant.energy - delta * (this.speciesStats.energyPerDig / (ant.jobDuration ?? 3.5)));
      const duration = ant.jobDuration ?? 3.5;

      if (ant.jobTimer >= duration) {
        // Complete Excavation!
        const target = ant.targetJobCell;
        if (target) {
          this.terrainData.setSolid(target.cx, target.cy, false);
          const worldPos = this.cellToWorldCenter(target);
          const dirtyBox = {
            minX: worldPos.x - 48,
            maxX: worldPos.x + 48,
            minY: worldPos.y - 48,
            maxY: worldPos.y + 48,
          };
          if (onTerrainModified) onTerrainModified(dirtyBox);

          if (ant.currentJobId) {
            this.jobQueue.completeJob(ant.currentJobId);
          }
          this.designationManager.removeDesignation(target.cx, target.cy);
        }

        // Stratum-aware yield: CLAY yields Clay Mud; other strata (Loam, Peat) do not add clay mud
        const strata = target && this.terrainData.getSoilStrata ? this.terrainData.getSoilStrata(target.cx, target.cy) : 'CLAY';
        if (strata === 'CLAY') {
          ant.carriedResource = 'MUD';
          ant.mudPayload = 1;
        } else {
          ant.carriedResource = null;
          ant.mudPayload = 0;
        }
        ant.currentJobId = null;
        ant.targetJobCell = null;
        ant.state = 'HAULING_MUD';

        // Pathfind to stockpile pickup/deposit waypoint
        const antCell = this.worldToCell(ant.position);
        const returnPath = this.pathfinder.findPath(antCell, this.stockpile.pickupWaypoint);
        if (returnPath) {
          ant.path = returnPath;
          ant.pathIndex = 0;
        } else {
          ant.state = 'IDLE';
        }
      }
      return;
    }

    if (ant.state === 'BACKFILLING') {
      ant.jobTimer = (ant.jobTimer ?? 0) + delta;
      ant.energy = Math.max(0, ant.energy - delta * (this.speciesStats.energyPerDig / (ant.jobDuration ?? 3.5)));
      const duration = ant.jobDuration ?? 3.5;

      if (ant.jobTimer >= duration) {
        // Complete Backfill!
        const target = ant.targetJobCell;
        if (target) {
          this.terrainData.setSolid(target.cx, target.cy, true);
          const worldPos = this.cellToWorldCenter(target);
          const dirtyBox = {
            minX: worldPos.x - 48,
            maxX: worldPos.x + 48,
            minY: worldPos.y - 48,
            maxY: worldPos.y + 48,
          };
          if (onTerrainModified) onTerrainModified(dirtyBox);

          if (ant.currentJobId) {
            this.jobQueue.completeJob(ant.currentJobId);
          }
          this.designationManager.removeDesignation(target.cx, target.cy);
        }

        // Deposit mud and transition to IDLE
        ant.carriedResource = null;
        ant.mudPayload = 0;
        ant.currentJobId = null;
        ant.targetJobCell = null;
        ant.state = 'IDLE';
      }
      return;
    }

    // ------------------------------------------------------------------------
    // JOB CLAIMING PHASE (When IDLE or WANDERING without active payload)
    // ------------------------------------------------------------------------
    
    // LOW ENERGY FORAGING CHECK (Triggers feeding if energy <= threshold and not holding payload)
    if ((ant.state === 'IDLE' || ant.state === 'WANDERING') && ant.energy <= this.speciesStats.energyRestockThreshold && !ant.carriedResource) {
      if (!this.honeydewSource.isEmpty()) {
        const antCell = this.worldToCell(ant.position);
        const foodCell = this.honeydewSource.cell;
        const isAtFood = (antCell.cx === foodCell.cx && antCell.cy === foodCell.cy);
        const path = isAtFood ? [] : this.pathfinder.findPath(antCell, foodCell);
        if (path !== null) {
          ant.state = 'SEEKING_FOOD';
          if (isAtFood) {
            ant.state = 'EATING';
            ant.jobTimer = 0;
          } else {
            ant.path = path;
            ant.pathIndex = 0;
          }
          return;
        }
      }
    }

    if (ant.state === 'IDLE' || ant.state === 'WANDERING') {
      const antCell = this.worldToCell(ant.position);
      const isFillAllowed = this.stockpile.getAvailableCount() > 0;

      const job = this.jobQueue.claimNearestJob(ant.position, ant.id, isFillAllowed);
      if (job) {
        if (job.type === 'DIG') {
          const adj = this.pathfinder.findWalkableAdjacent(job.cell, antCell);
          if (adj) {
            const path = this.pathfinder.findPath(antCell, adj);
            if (path) {
              ant.currentJobId = job.id;
              ant.targetJobCell = job.cell;
              ant.jobDuration = job.workDuration;
              ant.jobTimer = 0;
              ant.state = 'MOVING_TO_JOB';
              ant.path = path;
              ant.pathIndex = 0;
              this.designationManager.assignWorker(job.cell.cx, job.cell.cy, ant.id);
              return;
            }
          }
          // Path unavailable; release job back to queue
          job.status = 'PENDING';
          job.assignedWorkerId = null;
        } else if (job.type === 'FILL') {
          // Atomically reserve mud in stockpile
          if (this.stockpile.reserve(1)) {
            const isAtWaypoint = (antCell.cx === this.stockpile.pickupWaypoint.cx && antCell.cy === this.stockpile.pickupWaypoint.cy);
            const path = isAtWaypoint ? [] : this.pathfinder.findPath(antCell, this.stockpile.pickupWaypoint);
            if (path !== null) {
              ant.currentJobId = job.id;
              ant.targetJobCell = job.cell;
              ant.jobDuration = job.workDuration;
              ant.jobTimer = 0;
              ant.state = 'MOVING_TO_STOCKPILE';
              this.designationManager.assignWorker(job.cell.cx, job.cell.cy, ant.id);
              if (isAtWaypoint) {
                this.handlePathDestinationReached(ant, onTerrainModified);
              } else {
                ant.path = path;
                ant.pathIndex = 0;
              }
              return;
            } else {
              // Path to stockpile blocked; unreserve
              this.stockpile.unreserve(1);
            }
          }
          job.status = 'PENDING';
          job.assignedWorkerId = null;
        }
      }

      // If idle and queue has NO pending jobs, occasionally wander
      if (ant.state === 'IDLE' && this.jobQueue.getPendingCount() === 0 && Math.random() < 0.02) {
        const destinations = [this.livingCell, this.nurseryCell, this.stockpileCell, this.surfaceCell];
        const chosen = destinations[Math.floor(Math.random() * destinations.length)];
        const path = this.pathfinder.findPath(antCell, chosen);
        if (path && path.length > 1) {
          ant.path = path;
          ant.pathIndex = 0;
          ant.state = 'WANDERING';
        }
      }
    }
  }

  private handlePathDestinationReached(
    ant: AntEntity,
    _onTerrainModified?: (dirtyBox: { minX: number; maxX: number; minY: number; maxY: number }) => void
  ): void {
    ant.path = [];
    ant.pathIndex = 0;

    if (ant.state === 'MOVING_TO_JOB' && ant.targetJobCell) {
      // Arrived at neighbor of DIG cell -> Face cell and start digging
      const worldPos = this.cellToWorldCenter(ant.targetJobCell);
      ant.angle = Math.atan2(worldPos.y - ant.position.y, worldPos.x - ant.position.x);
      ant.state = 'DIGGING';
      ant.jobTimer = 0;
    } else if (ant.state === 'MOVING_TO_STOCKPILE') {
      // Arrived at stockpile -> Withdraw reserved mud
      if (this.stockpile.withdraw(1)) {
        ant.carriedResource = 'MUD';
        ant.mudPayload = 1;

        if (ant.targetJobCell) {
          // Pathfind to adjacent neighbor of target backfill cell
          const antCell = this.worldToCell(ant.position);
          const adj = this.pathfinder.findWalkableAdjacent(ant.targetJobCell, antCell);
          if (adj) {
            const path = this.pathfinder.findPath(antCell, adj);
            if (path) {
              ant.state = 'HAULING_MUD';
              ant.path = path;
              ant.pathIndex = 0;
              return;
            }
          }
        }
      }
      // Starved or blocked
      ant.state = 'IDLE';
    } else if (ant.state === 'HAULING_MUD') {
      if (ant.targetJobCell && ant.currentJobId) {
        // Arrived at neighbor of BACKFILL cell -> Face cell and start backfilling
        const worldPos = this.cellToWorldCenter(ant.targetJobCell);
        ant.angle = Math.atan2(worldPos.y - ant.position.y, worldPos.x - ant.position.x);
        ant.state = 'BACKFILLING';
        ant.jobTimer = 0;
      } else {
        // Arrived at stockpile with excavated mud -> Deposit
        this.stockpile.deposit(1);
        ant.carriedResource = null;
        ant.mudPayload = 0;
        ant.state = 'IDLE';
      }
    } else if (ant.state === 'SEEKING_FOOD') {
      // Arrived at honeydew cache -> Start eating
      ant.state = 'EATING';
      ant.jobTimer = 0;
    } else {
      ant.state = 'IDLE';
    }
  }
}
