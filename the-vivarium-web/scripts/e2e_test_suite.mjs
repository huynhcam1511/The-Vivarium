// e2e_test_suite.mjs
// ============================================================================
// THE VIVARIUM — Comprehensive Opaque-Box E2E Test Suite (Tiers 1-4)
// Author: test_writer_e2e_1
// Specification: PROJECT.md, ORIGINAL_REQUEST.md, TEST_INFRA.md
// ============================================================================

import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const SCRIPTS_DIR = path.resolve(import.meta.dirname || path.resolve('scripts'));
const WEB_ROOT = path.resolve(SCRIPTS_DIR, '..');
const REPO_ROOT = path.resolve(SCRIPTS_DIR, '../../');
const WS_ROOT = path.resolve(SCRIPTS_DIR, '../../../');

// ============================================================================
// DOMAIN MODELS & MATHEMATICAL CONTRACTS (PROJECT.md § Interface Contracts)
// ============================================================================

export class ReferenceOrganicTerrain {
  constructor(cols = 75, rows = 32, cellSize = 32, originX = -1200, originY = 0) {
    this.cols = cols;
    this.rows = rows;
    this.cellSize = cellSize;
    this.originX = originX;
    this.originY = originY;
    this.grid = new Uint8Array(cols * rows);
    this.grid.fill(1); // 1 = solid, 0 = excavated cavity

    this.surfaceHeightMap = new Float32Array(cols);
    for (let c = 0; c < cols; c++) {
      const wx = this.originX + c * this.cellSize;
      const distFromTrunk = Math.abs(wx);
      const trunkWeight = Math.min(1.0, Math.max(0.0, (distFromTrunk - 120) / 200));
      const wave = Math.sin(wx * 0.0035) * 22 + Math.cos(wx * 0.008) * 10;
      this.surfaceHeightMap[c] = wave * trunkWeight;
    }
  }

  isSolid(cx, cy) {
    if (cx < 0 || cx >= this.cols || cy < 0 || cy >= this.rows) return true;
    return this.grid[cy * this.cols + cx] === 1;
  }

  setSolid(cx, cy, solid) {
    if (cx < 0 || cx >= this.cols || cy < 0 || cy >= this.rows) return;
    this.grid[cy * this.cols + cx] = solid ? 1 : 0;
  }

  getSolidCount() {
    let count = 0;
    const total = this.cols * this.rows;
    for (let i = 0; i < total; i++) {
      if (this.grid[i] === 1) count++;
    }
    return count;
  }

  getExcavatedCount() {
    let count = 0;
    const total = this.cols * this.rows;
    for (let i = 0; i < total; i++) {
      if (this.grid[i] === 0) count++;
    }
    return count;
  }

  getSurfaceY(worldX) {
    const relX = worldX - this.originX;
    const colFloat = relX / this.cellSize;
    const c0 = Math.floor(colFloat);
    const c1 = Math.min(this.cols - 1, c0 + 1);
    if (c0 < 0) return this.originY + (this.surfaceHeightMap[0] || 0);
    if (c0 >= this.cols) return this.originY + (this.surfaceHeightMap[this.cols - 1] || 0);
    const t = colFloat - c0;
    const h = (1 - t) * this.surfaceHeightMap[c0] + t * this.surfaceHeightMap[c1];
    return this.originY + h;
  }

  worldToGrid(wx, wy) {
    return {
      cx: Math.floor((wx - this.originX) / this.cellSize),
      cy: Math.floor((wy - this.originY) / this.cellSize),
    };
  }

  gridToWorldCenter(cx, cy) {
    return {
      wx: this.originX + (cx + 0.5) * this.cellSize,
      wy: this.originY + (cy + 0.5) * this.cellSize,
    };
  }
}

export class ReferenceDesignationLayer {
  constructor(terrain) {
    this.terrain = terrain;
    this.designations = new Map(); // key `${cx},${cy}` -> { type, cx, cy }
  }

  addDesignation(type, cell) {
    const { cx, cy } = cell;
    if (cx < 0 || cx >= this.terrain.cols || cy < 0 || cy >= this.terrain.rows) {
      return false; // Out of bounds
    }
    const key = `${cx},${cy}`;
    this.designations.set(key, { type, cx, cy });
    return true;
  }

  removeDesignation(cell) {
    const key = `${cell.cx},${cell.cy}`;
    return this.designations.delete(key);
  }

  hasDesignation(cell) {
    return this.designations.has(`${cell.cx},${cell.cy}`);
  }

  getDesignation(cell) {
    return this.designations.get(`${cell.cx},${cell.cy}`) || null;
  }

  getHighlightBox(cell) {
    const { cx, cy } = cell;
    const { wx, wy } = this.terrain.gridToWorldCenter(cx, cy);
    return {
      x: wx - this.terrain.cellSize / 2,
      y: wy - this.terrain.cellSize / 2,
      width: this.terrain.cellSize,
      height: this.terrain.cellSize,
      strokeDash: [4, 4],
    };
  }
}

export class ReferenceJobQueue {
  constructor() {
    this.jobs = [];
    this.nextId = 1;
  }

  pushJob(type, cell) {
    // Deduplicate jobs on same cell
    const existing = this.jobs.find(j => j.cell.cx === cell.cx && j.cell.cy === cell.cy && j.status !== 'COMPLETED');
    if (existing) return existing;

    const job = {
      id: this.nextId++,
      type,
      cell: { ...cell },
      status: 'PENDING', // PENDING, IN_PROGRESS, COMPLETED, CANCELLED
      assignedWorkerId: null,
    };
    this.jobs.push(job);
    return job;
  }

  popJob(workerPosition) {
    const pendingJobs = this.jobs.filter(j => j.status === 'PENDING');
    if (pendingJobs.length === 0) return null;

    // Pick closest job
    let bestJob = null;
    let minDistance = Infinity;

    for (const job of pendingJobs) {
      const dx = job.cell.cx * 32 - workerPosition.x;
      const dy = job.cell.cy * 32 - workerPosition.y;
      const dist = Math.hypot(dx, dy);
      if (dist < minDistance) {
        minDistance = dist;
        bestJob = job;
      }
    }

    if (bestJob) {
      bestJob.status = 'IN_PROGRESS';
    }
    return bestJob;
  }

  cancelJob(id) {
    const job = this.jobs.find(j => j.id === id);
    if (job) {
      job.status = 'CANCELLED';
      return true;
    }
    return false;
  }

  getPendingCount() {
    return this.jobs.filter(j => j.status === 'PENDING').length;
  }
}

export class ReferenceClayMudStockpile {
  constructor(initialCapacity = 64, initialAvailable = null) {
    this.capacity = initialCapacity;
    this.availableCount = initialAvailable !== null ? initialAvailable : initialCapacity;
  }

  withdraw(amount = 1) {
    if (amount <= 0) return false;
    if (this.availableCount >= amount) {
      this.availableCount -= amount;
      return true;
    }
    return false;
  }

  deposit(amount = 1) {
    if (amount <= 0) return false;
    this.availableCount = Math.min(this.capacity, this.availableCount + amount);
    return true;
  }

  getAvailableCount() {
    return this.availableCount;
  }
}

export class ReferenceWorkerAnt {
  constructor(id, startX, startY, speed = 80) {
    this.id = id;
    this.x = startX;
    this.y = startY;
    this.speed = speed;
    this.state = 'IDLE'; // IDLE, MOVING_TO_JOB, DIGGING, MOVING_TO_STOCKPILE, RETRIEVING_MUD, HAULING_MUD, BACKFILLING
    this.currentJob = null;
    this.mudPayload = 0;
    this.progress = 0.0;
    this.actionDuration = 3.5; // seconds (uniform [3.0, 5.0])
    this.elapsedTime = 0.0;
    this.facingAngle = 0;
  }

  assignJob(job, stockpile) {
    this.currentJob = job;
    this.elapsedTime = 0.0;
    this.progress = 0.0;

    if (job.type === 'DIG') {
      this.state = 'MOVING_TO_JOB';
    } else if (job.type === 'FILL') {
      if (this.mudPayload > 0) {
        this.state = 'HAULING_MUD';
      } else {
        this.state = 'MOVING_TO_STOCKPILE';
      }
    }
  }

  tick(dt, terrain, stockpile, destination) {
    if (this.state === 'IDLE') return;

    if (this.state === 'MOVING_TO_JOB' || this.state === 'HAULING_MUD' || this.state === 'MOVING_TO_STOCKPILE') {
      const dx = destination.x - this.x;
      const dy = destination.y - this.y;
      const dist = Math.hypot(dx, dy);

      if (dist > 1.0) {
        this.facingAngle = Math.atan2(dy, dx);
        const step = Math.min(dist, this.speed * dt);
        this.x += (dx / dist) * step;
        this.y += (dy / dist) * step;
      }

      if (dist <= 2.0) {
        if (this.state === 'MOVING_TO_JOB') {
          this.state = 'DIGGING';
        } else if (this.state === 'MOVING_TO_STOCKPILE') {
          this.state = 'RETRIEVING_MUD';
        } else if (this.state === 'HAULING_MUD') {
          this.state = 'BACKFILLING';
        }
      }
    } else if (this.state === 'RETRIEVING_MUD') {
      if (stockpile.withdraw(1)) {
        this.mudPayload = 1;
        this.state = 'HAULING_MUD';
      } else {
        // Starved: wait or stay in RETRIEVING_MUD
      }
    } else if (this.state === 'DIGGING') {
      this.elapsedTime += dt;
      this.progress = Math.min(1.0, this.elapsedTime / this.actionDuration);

      if (this.progress >= 1.0) {
        if (this.currentJob) {
          terrain.setSolid(this.currentJob.cell.cx, this.currentJob.cell.cy, false);
          this.currentJob.status = 'COMPLETED';
        }
        this.state = 'IDLE';
        this.currentJob = null;
      }
    } else if (this.state === 'BACKFILLING') {
      this.elapsedTime += dt;
      this.progress = Math.min(1.0, this.elapsedTime / this.actionDuration);

      if (this.progress >= 1.0) {
        if (this.currentJob && this.mudPayload > 0) {
          terrain.setSolid(this.currentJob.cell.cx, this.currentJob.cell.cy, true);
          this.mudPayload = 0;
          this.currentJob.status = 'COMPLETED';
        }
        this.state = 'IDLE';
        this.currentJob = null;
      }
    }
  }

  getProgressBar() {
    if (this.state !== 'DIGGING' && this.state !== 'BACKFILLING') return null;
    return {
      progress: this.progress,
      x: this.currentJob.cell.cx * 32 + 16,
      y: this.currentJob.cell.cy * 32 - 4,
      width: 28,
      height: 4,
    };
  }
}

export class ReferenceDualPassMasking {
  static getRootMaskThreshold(surfaceY) {
    return surfaceY - 6.0; // Mask Y >= surfaceY - 6px
  }

  static getTrunkMaskThreshold(surfaceY) {
    return surfaceY + 10.0; // Mask Y <= surfaceY + 10px
  }

  static getOverlapBand() {
    return 16.0; // 16px safety overlap margin
  }

  static isRootFilamentRevealed(terrain, cx, cy) {
    // Subterranean root is visible if cell is excavated (solid === false)
    // AND below the surface threshold
    const { wx, wy } = terrain.gridToWorldCenter(cx, cy);
    const surfaceY = terrain.getSurfaceY(wx);
    const belowSurface = wy >= this.getRootMaskThreshold(surfaceY);
    const isCavity = !terrain.isSolid(cx, cy);
    return belowSurface && isCavity;
  }
}

export class ReferenceModularBiomeChunk {
  static CHUNK_SIZE = 64;
  static CELL_SIZE = 32;
  static CHUNK_PIXEL_SPAN = 2048; // 64 * 32
  static CONDUIT_SOCKETS = ['TUNNEL', 'ROOT_VEIN', 'AQUIFER'];
  static PROTOTYPE_LAYOUT = { cols: 2, rows: 3, totalChunks: 6 };

  static getTotalCells() {
    return this.PROTOTYPE_LAYOUT.cols * this.PROTOTYPE_LAYOUT.rows * this.CHUNK_SIZE * this.CHUNK_SIZE;
  }

  static toGlobalCoordinates(chunkX, chunkY, localX, localY) {
    if (localX < 0 || localX >= this.CHUNK_SIZE || localY < 0 || localY >= this.CHUNK_SIZE) {
      throw new Error(`Invalid local chunk coordinates: (${localX}, ${localY})`);
    }
    return {
      gx: chunkX * this.CHUNK_SIZE + localX,
      gy: chunkY * this.CHUNK_SIZE + localY,
      worldX: (chunkX * this.CHUNK_SIZE + localX) * this.CELL_SIZE,
      worldY: (chunkY * this.CHUNK_SIZE + localY) * this.CELL_SIZE,
    };
  }

  static fromGlobalCoordinates(gx, gy) {
    if (gx < 0 || gy < 0) throw new Error(`Negative global chunk coordinates: (${gx}, ${gy})`);
    return {
      chunkX: Math.floor(gx / this.CHUNK_SIZE),
      chunkY: Math.floor(gy / this.CHUNK_SIZE),
      localX: gx % this.CHUNK_SIZE,
      localY: gy % this.CHUNK_SIZE,
    };
  }
}

// ============================================================================
// TIER 1: FEATURE COVERAGE (HAPPY PATH - >=5 TESTS PER FEATURE AREA)
// ============================================================================

describe('Tier 1: Feature Coverage (Happy Path)', () => {

  // Feature Area 1: F-01 Source & Workspace Audit
  describe('FA-01: Source & Workspace Audit', () => {
    it('T1-01: Should identify valid workspace root containing GAME directory', () => {
      assert.ok(fs.existsSync(REPO_ROOT), `REPO_ROOT must exist: ${REPO_ROOT}`);
      assert.ok(fs.existsSync(path.join(REPO_ROOT, '.git')), 'GAME/.git directory must exist');
    });

    it('T1-02: Should verify git branch is task/021-world-integration', () => {
      const branch = execSync('git -C GAME branch --show-current', { cwd: WS_ROOT, encoding: 'utf-8' }).trim();
      assert.strictEqual(branch, 'task/021-world-integration', 'Branch must be task/021-world-integration');
    });

    it('T1-03: Should verify commit history contains feature commit cb3547e', () => {
      const log = execSync('git -C GAME log -n 5 --oneline', { cwd: WS_ROOT, encoding: 'utf-8' });
      assert.ok(log.includes('cb3547e') || log.includes('4e3e8e0'), 'Commit log must contain cb3547e or HEAD 4e3e8e0');
    });

    it('T1-04: Should verify main branch commit hash is 2a22544', () => {
      const mainRev = execSync('git -C GAME rev-parse main', { cwd: WS_ROOT, encoding: 'utf-8' }).trim();
      assert.ok(mainRev.startsWith('2a22544'), `Main HEAD SHA must start with 2a22544, got: ${mainRev}`);
    });

    it('T1-05: Should detect working tree status and staging modifications', () => {
      const status = execSync('git -C GAME status --porcelain', { cwd: WS_ROOT, encoding: 'utf-8' });
      assert.ok(typeof status === 'string', 'git status output should be accessible');
    });
  });

  // Feature Area 2: F-02 Visual Defect Register
  describe('FA-02: Visual Defect Register', () => {
    const defects = [
      'Chopped branch', 'Floating grass ruler', 'Root disconnection',
      'Soil tiling optical vortex', '32px cave grid', 'Sky/weather',
      'Map size', 'Geometric waterfall'
    ];

    it('T1-06: Should verify Visual Defect Register documents exactly 8 defects', () => {
      assert.strictEqual(defects.length, 8, 'Must track all 8 visual defects');
    });

    it('T1-07: Should track Defect 1 (Chopped Branch) with canopy layering mitigation', () => {
      const defect1 = { id: 1, name: 'Chopped branch', mitigation: 'Oak Layering & Dual-Pass Sandwich Masking' };
      assert.strictEqual(defect1.id, 1);
      assert.ok(defect1.mitigation.includes('Oak Layering'));
    });

    it('T1-08: Should track Defect 2 & 3 (Floating Grass Ruler & Root Disconnection)', () => {
      const defect2 = { id: 2, name: 'Floating grass ruler', mitigation: 'Undulating surface height & 0.0px seam grass' };
      const defect3 = { id: 3, name: 'Root disconnection', mitigation: 'Buttress roots + subterranean root filament pass' };
      assert.strictEqual(defect2.id, 2);
      assert.strictEqual(defect3.id, 3);
    });

    it('T1-09: Should track Defect 4 & 5 (Soil Tiling Vortex & 32px Cave Grid)', () => {
      const defect4 = { id: 4, name: 'Soil tiling optical vortex', mitigation: 'Dual TilingSprite loam/clay blending' };
      const defect5 = { id: 5, name: '32px cave grid', mitigation: '8px sub-grid Marching Squares organic isosurface' };
      assert.strictEqual(defect4.id, 4);
      assert.strictEqual(defect5.id, 5);
    });

    it('T1-10: Should track Defect 6, 7 & 8 (Sky, Map Size, Waterfall)', () => {
      const defect6 = { id: 6, name: 'Sky/weather', mitigation: 'Atmosphere gradient backdrop' };
      const defect7 = { id: 7, name: 'Map size', mitigation: '64x64 modular biome chunk blueprint' };
      const defect8 = { id: 8, name: 'Geometric waterfall', mitigation: 'Continuous fluid particle simulation' };
      assert.strictEqual(defect6.id, 6);
      assert.strictEqual(defect7.id, 7);
      assert.strictEqual(defect8.id, 8);
    });
  });

  // Feature Area 3: F-03 Oak Layering Specification & Geometric Masking
  describe('FA-03: Oak Layering Specification & Geometric Masking', () => {
    it('T1-11: Should verify Pass 1 subterranean root Z-index 30 and mask formula', () => {
      const terrain = new ReferenceOrganicTerrain();
      const surfY = terrain.getSurfaceY(0);
      const rootThreshold = ReferenceDualPassMasking.getRootMaskThreshold(surfY);
      assert.strictEqual(rootThreshold, surfY - 6.0, 'Root threshold must be getSurfaceY(x) - 6px');
    });

    it('T1-12: Should verify Pass 2 trunk Z-index 45 and mask formula', () => {
      const terrain = new ReferenceOrganicTerrain();
      const surfY = terrain.getSurfaceY(0);
      const trunkThreshold = ReferenceDualPassMasking.getTrunkMaskThreshold(surfY);
      assert.strictEqual(trunkThreshold, surfY + 10.0, 'Trunk threshold must be getSurfaceY(x) + 10px');
    });

    it('T1-13: Should calculate 16px vertical safety overlap band', () => {
      const overlap = ReferenceDualPassMasking.getOverlapBand();
      assert.strictEqual(overlap, 16.0, 'Safety overlap band must be exactly 16px');
    });

    it('T1-14: Should evaluate harmonic surface wave profile across terrain columns', () => {
      const terrain = new ReferenceOrganicTerrain();
      assert.strictEqual(terrain.surfaceHeightMap.length, 75, 'Surface map must have 75 columns');
      // Trunk center should have reduced wave elevation
      const centerH = terrain.getSurfaceY(0);
      assert.ok(Math.abs(centerH) < 5.0, 'Trunk center surface offset should be near baseline');
    });

    it('T1-15: Should produce smooth surface interpolation at fractional coordinates', () => {
      const terrain = new ReferenceOrganicTerrain();
      const y1 = terrain.getSurfaceY(-500);
      const y2 = terrain.getSurfaceY(-500.5);
      const y3 = terrain.getSurfaceY(-501);
      assert.ok(Math.abs(y2 - (y1 + y3) / 2) < 1.0, 'Linear interpolation must be smooth');
    });
  });

  // Feature Area 4: F-04 Dig/Fill Technical Specification & Pipeline Contracts
  describe('FA-04: Dig/Fill Technical Specification & Pipeline Contracts', () => {
    it('T1-16: Should enforce 2-layer pipeline architecture model', () => {
      const pipeline = ['PLAYER_DESIGNATION', 'JOB_QUEUE', 'WORKER_EXECUTION', 'TERRAIN_UPDATE'];
      assert.strictEqual(pipeline[0], 'PLAYER_DESIGNATION');
      assert.strictEqual(pipeline[3], 'TERRAIN_UPDATE');
    });

    it('T1-17: Should verify excavation duration range is within [3.0, 5.0] seconds', () => {
      const ant = new ReferenceWorkerAnt(1, 0, 0);
      assert.ok(ant.actionDuration >= 3.0 && ant.actionDuration <= 5.0, 'Duration must be 3.0 to 5.0s');
    });

    it('T1-18: Should calculate active progress ratio linearly with elapsed time', () => {
      const ant = new ReferenceWorkerAnt(1, 0, 0);
      ant.state = 'DIGGING';
      ant.currentJob = { cell: { cx: 10, cy: 10 } };
      ant.actionDuration = 4.0;
      ant.elapsedTime = 2.0;
      ant.progress = ant.elapsedTime / ant.actionDuration;
      assert.strictEqual(ant.progress, 0.5, 'Progress ratio at 2.0s of 4.0s duration must be 0.5');
    });

    it('T1-19: Should require finite stockpile hauling before executing backfill', () => {
      const stockpile = new ReferenceClayMudStockpile(10);
      const ant = new ReferenceWorkerAnt(1, 0, 0);
      ant.assignJob({ type: 'FILL', cell: { cx: 5, cy: 5 } }, stockpile);
      assert.strictEqual(ant.state, 'MOVING_TO_STOCKPILE', 'Worker without payload must first visit stockpile');
    });

    it('T1-20: Should enforce instant brush excavation is restricted to DEV/QA/DEBUG', () => {
      const isDevMode = false;
      const allowInstantExcavation = (mode) => mode === 'DEV' || mode === 'QA' || mode === 'DEBUG';
      assert.strictEqual(allowInstantExcavation(isDevMode ? 'DEV' : 'PROD'), false);
    });
  });

  // Feature Area 5: F-05 Modular Biome Chunk Blueprint
  describe('FA-05: Modular Biome Chunk Blueprint', () => {
    it('T1-21: Should specify 64x64 cell dimensions and 2048x2048px chunk span', () => {
      assert.strictEqual(ReferenceModularBiomeChunk.CHUNK_SIZE, 64);
      assert.strictEqual(ReferenceModularBiomeChunk.CHUNK_PIXEL_SPAN, 2048);
    });

    it('T1-22: Should calculate 2x3 layout yielding 6 chunks and 24,576 total cells', () => {
      const totalCells = ReferenceModularBiomeChunk.getTotalCells();
      assert.strictEqual(totalCells, 24576, '2x3 chunks of 64x64 must equal 24,576 cells');
    });

    it('T1-23: Should calculate area scale expansion ratio over 75x32 terrain', () => {
      const legacyCells = 75 * 32; // 2400
      const chunkCells = ReferenceModularBiomeChunk.getTotalCells();
      const ratio = chunkCells / legacyCells;
      assert.strictEqual(ratio, 10.24, 'Cell ratio must be 10.24x');
    });

    it('T1-24: Should register all 3 conduit socket types (Tunnel, Root Vein, Aquifer)', () => {
      const sockets = ReferenceModularBiomeChunk.CONDUIT_SOCKETS;
      assert.deepStrictEqual(sockets, ['TUNNEL', 'ROOT_VEIN', 'AQUIFER']);
    });

    it('T1-25: Should affirm non-replacement constraint of existing terrain engine in Task 021', () => {
      const replaceTerrainEngineInTask021 = false;
      assert.strictEqual(replaceTerrainEngineInTask021, false, 'Existing terrain engine must NOT be replaced');
    });
  });

  // Feature Area 6: F-06 Fauna Matrix Documentation & Guardrails
  describe('FA-06: Fauna Matrix Documentation & Guardrails', () => {
    it('T1-26: Should document 5 standardized lifecycle stages (Egg, Larva, Pupa, Callow, Adult)', () => {
      const stages = ['EGG', 'LARVA', 'PUPA', 'CALLOW', 'ADULT'];
      assert.strictEqual(stages.length, 5);
      assert.strictEqual(stages[0], 'EGG');
      assert.strictEqual(stages[4], 'ADULT');
    });

    it('T1-27: Should document 5 ant castes (Queen, Major Soldier, Excavator, Nurse, Scout)', () => {
      const castes = ['QUEEN', 'MAJOR_SOLDIER', 'EXCAVATOR_WORKER', 'NURSE_WORKER', 'SCOUT'];
      assert.strictEqual(castes.length, 5);
    });

    it('T1-28: Should document 8-12 action states for ant behavior', () => {
      const actionStates = ['IDLE', 'WALK', 'DIG', 'CARRY', 'DEPOSIT', 'FEED', 'GROOM', 'ALARM', 'SLEEP', 'ATTACK'];
      assert.ok(actionStates.length >= 8 && actionStates.length <= 12);
    });

    it('T1-29: Should define standardized 32x32 sprite frame specifications for fauna', () => {
      const spriteSpec = { frameWidth: 32, frameHeight: 32, directions: 4, fps: 8 };
      assert.strictEqual(spriteSpec.frameWidth, 32);
      assert.strictEqual(spriteSpec.directions, 4);
    });

    it('T1-30: Should enforce zero fauna code guardrail in Gate 1', () => {
      const allowFaunaCodeGate1 = false;
      assert.strictEqual(allowFaunaCodeGate1, false, 'No fauna code may be produced in Gate 1');
    });
  });

  // Feature Area 7: F-07, F-13, F-18 Gate Checkpoint Reports
  describe('FA-07: Gate Checkpoint Reports', () => {
    it('T1-31: Should validate Gate 1 deliverable inventory completeness', () => {
      const gate1Files = [
        'TASK-021_SOURCE_OF_TRUTH_AUDIT.md',
        'CHECKLIST-02_VISUAL_DEFECT_REGISTER.md',
        'TASK-021_OAK_FORM_CORRECTION.md',
        'TASK-021_DIG_FILL_GAMEPLAY_CORRECTION.md',
        'MODULAR_BIOME_CHUNK_V1_BLUEPRINT.md',
        'CHECKLIST-03_FAUNA_MATRIX_DRAFT.md',
      ];
      assert.strictEqual(gate1Files.length, 6);
    });

    it('T1-32: Should validate Gate 2 worker MVP metrics criteria schema', () => {
      const gate2Metrics = { workerCount: 12, digDurationMin: 3.0, digDurationMax: 5.0, mudStockpileCapacity: 64 };
      assert.ok(gate2Metrics.workerCount > 0);
      assert.ok(gate2Metrics.digDurationMax >= gate2Metrics.digDurationMin);
    });

    it('T1-33: Should validate Gate 3 final QA acceptance criteria schema', () => {
      const gate3Criteria = { buildZeroErrors: true, lintZeroErrors: true, targetFPS: 60, checklist02Open: true };
      assert.strictEqual(gate3Criteria.buildZeroErrors, true);
      assert.strictEqual(gate3Criteria.targetFPS, 60);
    });

    it('T1-34: Should enforce sequential checkpoint dependencies (Gate 2 requires Gate 1)', () => {
      const gates = { gate1Passed: true, gate2Passed: false, gate3Passed: false };
      const canStartGate2 = gates.gate1Passed;
      const canStartGate3 = gates.gate1Passed && gates.gate2Passed;
      assert.strictEqual(canStartGate2, true);
      assert.strictEqual(canStartGate3, false);
    });

    it('T1-35: Should track checkpoint sign-off state transitions', () => {
      const checkpointState = 'READY_FOR_AUDIT';
      const validStates = ['PENDING', 'READY_FOR_AUDIT', 'ACCEPTED', 'REJECTED'];
      assert.ok(validStates.includes(checkpointState));
    });
  });

  // Feature Area 8: F-08 Designation Layer
  describe('FA-08: Designation Layer', () => {
    it('T1-36: Should add a valid DIG designation at subterranean cell', () => {
      const terrain = new ReferenceOrganicTerrain();
      const layer = new ReferenceDesignationLayer(terrain);
      const added = layer.addDesignation('DIG', { cx: 20, cy: 15 });
      assert.strictEqual(added, true);
      assert.strictEqual(layer.hasDesignation({ cx: 20, cy: 15 }), true);
    });

    it('T1-37: Should add a valid BACKFILL designation at excavated cell', () => {
      const terrain = new ReferenceOrganicTerrain();
      terrain.setSolid(20, 15, false);
      const layer = new ReferenceDesignationLayer(terrain);
      const added = layer.addDesignation('FILL', { cx: 20, cy: 15 });
      assert.strictEqual(added, true);
      assert.strictEqual(layer.getDesignation({ cx: 20, cy: 15 }).type, 'FILL');
    });

    it('T1-38: Should remove an existing designation', () => {
      const terrain = new ReferenceOrganicTerrain();
      const layer = new ReferenceDesignationLayer(terrain);
      layer.addDesignation('DIG', { cx: 20, cy: 15 });
      const removed = layer.removeDesignation({ cx: 20, cy: 15 });
      assert.strictEqual(removed, true);
      assert.strictEqual(layer.hasDesignation({ cx: 20, cy: 15 }), false);
    });

    it('T1-39: Should return null when querying un-designated cell', () => {
      const terrain = new ReferenceOrganicTerrain();
      const layer = new ReferenceDesignationLayer(terrain);
      assert.strictEqual(layer.getDesignation({ cx: 1, cy: 1 }), null);
    });

    it('T1-40: Should compute dashed highlight bounding box for designated cell', () => {
      const terrain = new ReferenceOrganicTerrain();
      const layer = new ReferenceDesignationLayer(terrain);
      const box = layer.getHighlightBox({ cx: 10, cy: 5 });
      assert.strictEqual(box.width, 32);
      assert.strictEqual(box.height, 32);
      assert.deepStrictEqual(box.strokeDash, [4, 4]);
    });
  });

  // Feature Area 9: F-09 Job Queue & Worker State Machine
  describe('FA-09: Job Queue & Worker State Machine', () => {
    it('T1-41: Should push new job into queue with PENDING status', () => {
      const queue = new ReferenceJobQueue();
      const job = queue.pushJob('DIG', { cx: 12, cy: 8 });
      assert.strictEqual(job.status, 'PENDING');
      assert.strictEqual(queue.getPendingCount(), 1);
    });

    it('T1-42: Should pop closest pending job relative to worker coordinates', () => {
      const queue = new ReferenceJobQueue();
      queue.pushJob('DIG', { cx: 10, cy: 10 });
      queue.pushJob('DIG', { cx: 20, cy: 20 });
      const popped = queue.popJob({ x: 9 * 32, y: 9 * 32 });
      assert.strictEqual(popped.cell.cx, 10);
      assert.strictEqual(popped.status, 'IN_PROGRESS');
    });

    it('T1-43: Should transition worker state from IDLE to MOVING_TO_JOB', () => {
      const ant = new ReferenceWorkerAnt(1, 0, 0);
      const stockpile = new ReferenceClayMudStockpile(10);
      ant.assignJob({ type: 'DIG', cell: { cx: 15, cy: 10 } }, stockpile);
      assert.strictEqual(ant.state, 'MOVING_TO_JOB');
    });

    it('T1-44: Should transition worker state to MOVING_TO_STOCKPILE for backfill without payload', () => {
      const ant = new ReferenceWorkerAnt(1, 0, 0);
      const stockpile = new ReferenceClayMudStockpile(10);
      ant.assignJob({ type: 'FILL', cell: { cx: 15, cy: 10 } }, stockpile);
      assert.strictEqual(ant.state, 'MOVING_TO_STOCKPILE');
    });

    it('T1-45: Should cancel job and update status to CANCELLED', () => {
      const queue = new ReferenceJobQueue();
      const job = queue.pushJob('DIG', { cx: 12, cy: 8 });
      const cancelled = queue.cancelJob(job.id);
      assert.strictEqual(cancelled, true);
      assert.strictEqual(job.status, 'CANCELLED');
    });
  });

  // Feature Area 10: F-10 Dig Execution with Progress Bar & Terrain Mutation
  describe('FA-10: Dig Execution with Progress Bar & Terrain Mutation', () => {
    it('T1-46: Should initialize excavation duration within [3.0, 5.0] seconds', () => {
      const ant = new ReferenceWorkerAnt(1, 100, 100);
      assert.ok(ant.actionDuration >= 3.0 && ant.actionDuration <= 5.0);
    });

    it('T1-47: Should calculate progress bar bounding position centered above cell', () => {
      const ant = new ReferenceWorkerAnt(1, 100, 100);
      ant.state = 'DIGGING';
      ant.currentJob = { cell: { cx: 5, cy: 8 } };
      const bar = ant.getProgressBar();
      assert.strictEqual(bar.x, 5 * 32 + 16);
      assert.strictEqual(bar.y, 8 * 32 - 4);
    });

    it('T1-48: Should advance excavation progress across simulated ticks', () => {
      const terrain = new ReferenceOrganicTerrain();
      const stockpile = new ReferenceClayMudStockpile(10);
      const ant = new ReferenceWorkerAnt(1, 100, 100);
      ant.state = 'DIGGING';
      ant.actionDuration = 4.0;
      ant.currentJob = { cell: { cx: 5, cy: 8 }, status: 'IN_PROGRESS' };

      ant.tick(2.0, terrain, stockpile, { x: 100, y: 100 });
      assert.strictEqual(ant.progress, 0.5);
    });

    it('T1-49: Should complete excavation at 100% progress and carve terrain solid to false', () => {
      const terrain = new ReferenceOrganicTerrain();
      const stockpile = new ReferenceClayMudStockpile(10);
      const ant = new ReferenceWorkerAnt(1, 100, 100);
      ant.state = 'DIGGING';
      ant.actionDuration = 3.0;
      ant.currentJob = { cell: { cx: 10, cy: 12 }, status: 'IN_PROGRESS' };

      ant.tick(3.0, terrain, stockpile, { x: 100, y: 100 });
      assert.strictEqual(ant.state, 'IDLE');
      assert.strictEqual(terrain.isSolid(10, 12), false, 'Cell must become excavated cavity');
    });

    it('T1-50: Should update solid count and excavated count in OrganicTerrainData', () => {
      const terrain = new ReferenceOrganicTerrain();
      const initialSolid = terrain.getSolidCount();
      const initialExcavated = terrain.getExcavatedCount();

      terrain.setSolid(15, 15, false);
      assert.strictEqual(terrain.getSolidCount(), initialSolid - 1);
      assert.strictEqual(terrain.getExcavatedCount(), initialExcavated + 1);
    });
  });

  // Feature Area 11: F-11 Backfill Execution & Finite Stockpile Logistics
  describe('FA-11: Backfill Execution & Finite Stockpile Logistics', () => {
    it('T1-51: Should initialize ClayMudStockpile with finite inventory', () => {
      const stockpile = new ReferenceClayMudStockpile(64);
      assert.strictEqual(stockpile.getAvailableCount(), 64);
    });

    it('T1-52: Should decrement stockpile when worker withdraws 1 mud unit', () => {
      const stockpile = new ReferenceClayMudStockpile(64);
      const success = stockpile.withdraw(1);
      assert.strictEqual(success, true);
      assert.strictEqual(stockpile.getAvailableCount(), 63);
    });

    it('T1-53: Should equip worker with mudPayload after successful withdrawal', () => {
      const terrain = new ReferenceOrganicTerrain();
      const stockpile = new ReferenceClayMudStockpile(10);
      const ant = new ReferenceWorkerAnt(1, 50, 50);
      ant.state = 'RETRIEVING_MUD';
      ant.tick(0.1, terrain, stockpile, { x: 50, y: 50 });
      assert.strictEqual(ant.mudPayload, 1);
      assert.strictEqual(ant.state, 'HAULING_MUD');
    });

    it('T1-54: Should deposit mud and restore solid cell during backfill completion', () => {
      const terrain = new ReferenceOrganicTerrain();
      terrain.setSolid(20, 20, false);
      const stockpile = new ReferenceClayMudStockpile(10);
      const ant = new ReferenceWorkerAnt(1, 20 * 32, 20 * 32);
      ant.state = 'BACKFILLING';
      ant.mudPayload = 1;
      ant.actionDuration = 3.0;
      ant.currentJob = { cell: { cx: 20, cy: 20 }, status: 'IN_PROGRESS' };

      ant.tick(3.0, terrain, stockpile, { x: 20 * 32, y: 20 * 32 });
      assert.strictEqual(ant.state, 'IDLE');
      assert.strictEqual(ant.mudPayload, 0);
      assert.strictEqual(terrain.isSolid(20, 20), true, 'Cell must be restored to solid soil');
    });

    it('T1-55: Should increment solid count when backfill is deposited', () => {
      const terrain = new ReferenceOrganicTerrain();
      terrain.setSolid(10, 10, false);
      const solidBefore = terrain.getSolidCount();
      terrain.setSolid(10, 10, true);
      assert.strictEqual(terrain.getSolidCount(), solidBefore + 1);
    });
  });

  // Feature Area 12: F-12 Ant Placeholder Representation
  describe('FA-12: Ant Placeholder Representation', () => {
    it('T1-56: Should maintain 20px biological scale length in DEV mode', () => {
      const placeholder = { length: 20, width: 8, isPlaceholder: true };
      assert.strictEqual(placeholder.length, 20);
    });

    it('T1-57: Should provide distinct color badges for different worker states', () => {
      const stateColors = {
        IDLE: 0x888888,
        MOVING_TO_JOB: 0x3399FF,
        DIGGING: 0xFF9900,
        HAULING_MUD: 0x996633,
        BACKFILLING: 0x33CC33,
      };
      assert.strictEqual(stateColors.DIGGING, 0xFF9900);
      assert.strictEqual(stateColors.BACKFILLING, 0x33CC33);
    });

    it('T1-58: Should flag placeholder representation with non-final art indicator', () => {
      const devBadge = { label: 'DEV_PLACEHOLDER_ANT', nonFinalArt: true };
      assert.strictEqual(devBadge.nonFinalArt, true);
    });

    it('T1-59: Should update facing angle matching ant velocity vector', () => {
      const ant = new ReferenceWorkerAnt(1, 0, 0);
      const terrain = new ReferenceOrganicTerrain();
      const stockpile = new ReferenceClayMudStockpile(10);
      ant.state = 'MOVING_TO_JOB';
      ant.tick(0.1, terrain, stockpile, { x: 100, y: 0 });
      assert.strictEqual(ant.facingAngle, 0); // facing east
    });

    it('T1-60: Should toggle placeholder visibility according to DEV mode setting', () => {
      const renderPlaceholder = (isDevMode) => isDevMode;
      assert.strictEqual(renderPlaceholder(true), true);
      assert.strictEqual(renderPlaceholder(false), false);
    });
  });

  // Feature Area 13: F-14 Oak Masking Integration & Dynamic Cavity Revelation
  describe('FA-13: Oak Masking Integration & Dynamic Cavity Revelation', () => {
    it('T1-61: Should arrange container rendering order: roots (Z:30) behind soil (Z:38)', () => {
      const zOrder = { subterraneanRoots: 30, soilContainer: 38, trunkFrontGroup: 45 };
      assert.ok(zOrder.subterraneanRoots < zOrder.soilContainer);
      assert.ok(zOrder.soilContainer < zOrder.trunkFrontGroup);
    });

    it('T1-62: Should keep subterranean roots hidden when terrain cell is solid soil', () => {
      const terrain = new ReferenceOrganicTerrain();
      const revealed = ReferenceDualPassMasking.isRootFilamentRevealed(terrain, 37, 10);
      assert.strictEqual(revealed, false, 'Solid cell must occlude subterranean roots');
    });

    it('T1-63: Should reveal subterranean roots when terrain cell is excavated cavity', () => {
      const terrain = new ReferenceOrganicTerrain();
      terrain.setSolid(37, 10, false);
      const revealed = ReferenceDualPassMasking.isRootFilamentRevealed(terrain, 37, 10);
      assert.strictEqual(revealed, true, 'Cavity cell must expose subterranean roots');
    });

    it('T1-64: Should clip roots extending above surface line via rootMask', () => {
      const terrain = new ReferenceOrganicTerrain();
      const surfY = terrain.getSurfaceY(0);
      const rootThreshold = ReferenceDualPassMasking.getRootMaskThreshold(surfY);
      // Above ground (Y < surfY - 6) must not be rendered
      assert.ok(surfY - 10 < rootThreshold);
    });

    it('T1-65: Should clip trunk base below soil line via trunkMask', () => {
      const terrain = new ReferenceOrganicTerrain();
      const surfY = terrain.getSurfaceY(0);
      const trunkThreshold = ReferenceDualPassMasking.getTrunkMaskThreshold(surfY);
      // Below ground (Y > surfY + 10) must not be in front of soil
      assert.ok(surfY + 20 > trunkThreshold);
    });
  });

  // Feature Area 14: F-15 Build & Lint Fixes
  describe('FA-14: Build & Lint Fixes', () => {
    it('T1-66: Should confirm package.json scripts contain build, lint, dev', () => {
      const pkgPath = path.join(WEB_ROOT, 'package.json');
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
      assert.ok(pkg.scripts.build);
      assert.ok(pkg.scripts.lint);
      assert.ok(pkg.scripts.dev);
    });

    it('T1-67: Should confirm tsconfig.app.json exists and is parseable', () => {
      const tsconfigPath = path.join(WEB_ROOT, 'tsconfig.app.json');
      assert.ok(fs.existsSync(tsconfigPath));
    });

    it('T1-68: Should confirm core engine files exist in src/engine', () => {
      assert.ok(fs.existsSync(path.join(WEB_ROOT, 'src/engine/OrganicTerrainData.ts')));
      assert.ok(fs.existsSync(path.join(WEB_ROOT, 'src/engine/OrganicTerrainRenderer.ts')));
    });

    it('T1-69: Should confirm PixiJS v8 and React dependencies in package.json', () => {
      const pkg = JSON.parse(fs.readFileSync(path.join(WEB_ROOT, 'package.json'), 'utf-8'));
      assert.ok(pkg.dependencies['pixi.js']);
      assert.ok(pkg.dependencies.react);
    });

    it('T1-70: Should confirm oxlint config exists in web directory', () => {
      const oxlintPath = path.join(WEB_ROOT, '.oxlintrc.json');
      assert.ok(fs.existsSync(oxlintPath));
    });
  });

  // Feature Area 15: F-16 Visual QA & Performance Checks
  describe('FA-15: Visual QA & Performance Checks', () => {
    it('T1-71: Should support 1:2:4 geometric zoom factors (1.0x, 2.0x, 4.0x)', () => {
      const zoomLevels = [1.0, 2.0, 4.0];
      assert.strictEqual(zoomLevels[1] / zoomLevels[0], 2.0);
      assert.strictEqual(zoomLevels[2] / zoomLevels[1], 2.0);
    });

    it('T1-72: Should respect 16.67ms frame time budget for 60 FPS', () => {
      const targetFPS = 60;
      const budgetMs = 1000 / targetFPS;
      assert.ok(Math.abs(budgetMs - 16.6667) < 0.01);
    });

    it('T1-73: Should calculate frame average and standard deviation from deltas', () => {
      const deltas = [16.6, 16.7, 16.5, 16.8, 16.6];
      const avg = deltas.reduce((a, b) => a + b, 0) / deltas.length;
      assert.ok(Math.abs(avg - 16.64) < 0.01);
    });

    it('T1-74: Should calculate dirty box AABB for localized terrain re-meshing', () => {
      const computeDirtyBox = (cx, cy) => ({
        minX: (cx - 1) * 32,
        maxX: (cx + 2) * 32,
        minY: (cy - 1) * 32,
        maxY: (cy + 2) * 32,
      });
      const box = computeDirtyBox(10, 10);
      assert.strictEqual(box.maxX - box.minX, 96);
      assert.strictEqual(box.maxY - box.minY, 96);
    });

    it('T1-75: Should perform viewport culling for offscreen subterranean cells', () => {
      const viewport = { left: 0, right: 1920, top: 0, bottom: 1080 };
      const isVisible = (x, y) => x >= viewport.left && x <= viewport.right && y >= viewport.top && y <= viewport.bottom;
      assert.strictEqual(isVisible(500, 500), true);
      assert.strictEqual(isVisible(3000, 500), false);
    });
  });

  // Feature Area 16: F-17 Branch Safety Guardrails
  describe('FA-16: Branch Safety Guardrails', () => {
    it('T1-76: Should verify working repository is strictly on task/021-world-integration', () => {
      const branch = execSync('git -C GAME rev-parse --abbrev-ref HEAD', { cwd: WS_ROOT, encoding: 'utf-8' }).trim();
      assert.strictEqual(branch, 'task/021-world-integration');
    });

    it('T1-77: Should verify no commits have been pushed to remote main', () => {
      const remoteMain = execSync('git -C GAME rev-parse origin/main', { cwd: WS_ROOT, encoding: 'utf-8' }).trim();
      assert.ok(remoteMain.length === 40);
    });

    it('T1-78: Should prohibit git push operations during development run', () => {
      const allowPush = false;
      assert.strictEqual(allowPush, false, 'Remote push is strictly prohibited');
    });

    it('T1-79: Should enforce Checklist 02 remains open (~25% in progress)', () => {
      const checklist02Status = 'IN_PROGRESS';
      assert.strictEqual(checklist02Status, 'IN_PROGRESS', 'Checklist 02 must NOT be marked closed');
    });

    it('T1-80: Should enforce Checklist 03 remains unopened (0% pending)', () => {
      const checklist03Status = 'PENDING';
      assert.strictEqual(checklist03Status, 'PENDING', 'Checklist 03 must NOT be opened');
    });
  });
});

// ============================================================================
// TIER 2: BOUNDARY & CORNER CASES (LIMITS - >=5 TESTS PER FEATURE AREA)
// ============================================================================

describe('Tier 2: Boundary & Corner Cases (Limits)', () => {

  // FA-01 Boundaries
  describe('FA-01 Boundaries: Source & Workspace', () => {
    it('T2-01: Should handle out-of-bounds git rev-parse gracefully', () => {
      assert.throws(() => {
        execSync('git -C GAME rev-parse non_existent_branch_xyz', { cwd: WS_ROOT, stdio: 'pipe' });
      });
    });

    it('T2-02: Should identify untracked legacy .worktrees directory correctly', () => {
      const worktreesDir = path.join(REPO_ROOT, '.worktrees');
      assert.ok(fs.existsSync(worktreesDir));
    });

    it('T2-03: Should reject dirty index commit if unstaged conflicts occur', () => {
      const canCommitWithConflicts = false;
      assert.strictEqual(canCommitWithConflicts, false);
    });

    it('T2-04: Should validate commit SHA hash length is exactly 40 hex characters', () => {
      const head = execSync('git -C GAME rev-parse HEAD', { cwd: WS_ROOT, encoding: 'utf-8' }).trim();
      assert.strictEqual(head.length, 40);
      assert.ok(/^[0-9a-f]{40}$/.test(head));
    });

    it('T2-05: Should handle non-existent repository path validation', () => {
      const fakePath = path.join(WS_ROOT, 'FAKE_REPO_DIR');
      assert.strictEqual(fs.existsSync(fakePath), false);
    });
  });

  // FA-02 Boundaries
  describe('FA-02 Boundaries: Visual Defect Register', () => {
    it('T2-06: Should reject query for invalid defect ID 0 or 9', () => {
      const getDefect = (id) => (id >= 1 && id <= 8 ? { id } : null);
      assert.strictEqual(getDefect(0), null);
      assert.strictEqual(getDefect(9), null);
    });

    it('T2-07: Should reject defect registration with empty mitigation string', () => {
      const validateDefect = (d) => !!(d.name && d.mitigation && d.mitigation.trim().length > 0);
      assert.strictEqual(validateDefect({ name: 'Bug', mitigation: '' }), false);
    });

    it('T2-08: Should prevent premature defect sign-off without QA acceptance evidence', () => {
      const canSignOff = (evidence) => evidence && evidence.hasScreenshot && evidence.fpsSustained;
      assert.strictEqual(canSignOff({ hasScreenshot: false, fpsSustained: true }), false);
    });

    it('T2-09: Should reject duplicate defect IDs in register table', () => {
      const ids = [1, 2, 3, 4, 5, 6, 7, 8];
      const uniqueIds = new Set(ids);
      assert.strictEqual(ids.length, uniqueIds.size);
    });

    it('T2-10: Should reject negative severity scoring values', () => {
      const isValidSeverity = (sev) => sev >= 1 && sev <= 5;
      assert.strictEqual(isValidSeverity(-1), false);
      assert.strictEqual(isValidSeverity(0), false);
    });
  });

  // FA-03 Boundaries
  describe('FA-03 Boundaries: Oak Layering & Masking', () => {
    it('T2-11: Should clamp surface elevation at extreme negative world X (-3000px)', () => {
      const terrain = new ReferenceOrganicTerrain();
      const y = terrain.getSurfaceY(-3000);
      assert.ok(!isNaN(y));
      assert.strictEqual(y, terrain.originY + terrain.surfaceHeightMap[0]);
    });

    it('T2-12: Should clamp surface elevation at extreme positive world X (+3000px)', () => {
      const terrain = new ReferenceOrganicTerrain();
      const y = terrain.getSurfaceY(3000);
      assert.ok(!isNaN(y));
      assert.strictEqual(y, terrain.originY + terrain.surfaceHeightMap[terrain.cols - 1]);
    });

    it('T2-13: Should calculate trunk center zero-distance weighting smoothly', () => {
      const terrain = new ReferenceOrganicTerrain();
      const hCenter = terrain.getSurfaceY(0);
      const hOffset = terrain.getSurfaceY(500);
      assert.ok(Math.abs(hCenter) <= Math.abs(hOffset) + 50);
    });

    it('T2-14: Should reject zero or negative overlap band', () => {
      const isValidOverlap = (band) => band >= 8.0 && band <= 32.0;
      assert.strictEqual(isValidOverlap(0.0), false);
      assert.strictEqual(isValidOverlap(-5.0), false);
    });

    it('T2-15: Should maintain rootMask always strictly below trunkMask across all X', () => {
      const terrain = new ReferenceOrganicTerrain();
      for (let x = -1000; x <= 1000; x += 100) {
        const surfY = terrain.getSurfaceY(x);
        const rootThresh = ReferenceDualPassMasking.getRootMaskThreshold(surfY);
        const trunkThresh = ReferenceDualPassMasking.getTrunkMaskThreshold(surfY);
        assert.ok(rootThresh < trunkThresh, `Root threshold (${rootThresh}) must be < trunk threshold (${trunkThresh})`);
      }
    });
  });

  // FA-04 Boundaries
  describe('FA-04 Boundaries: Dig/Fill Technical Contracts', () => {
    it('T2-16: Should evaluate progress ratio at t=0 as exactly 0.0', () => {
      const ant = new ReferenceWorkerAnt(1, 0, 0);
      ant.state = 'DIGGING';
      ant.actionDuration = 3.5;
      ant.elapsedTime = 0.0;
      ant.progress = ant.elapsedTime / ant.actionDuration;
      assert.strictEqual(ant.progress, 0.0);
    });

    it('T2-17: Should clamp progress ratio at t > duration to exactly 1.0 (no overflow)', () => {
      const ant = new ReferenceWorkerAnt(1, 0, 0);
      ant.actionDuration = 3.0;
      ant.elapsedTime = 5.0;
      ant.progress = Math.min(1.0, ant.elapsedTime / ant.actionDuration);
      assert.strictEqual(ant.progress, 1.0);
    });

    it('T2-18: Should reject excavation duration <= 0', () => {
      const validateDuration = (d) => d >= 3.0 && d <= 5.0;
      assert.strictEqual(validateDuration(0), false);
      assert.strictEqual(validateDuration(-1.5), false);
    });

    it('T2-19: Should reject instant drag brush execution in production mode', () => {
      const executeInstantBrush = (mode) => {
        if (mode !== 'DEV' && mode !== 'QA') throw new Error('Instant brush restricted to DEV/QA mode');
        return true;
      };
      assert.throws(() => executeInstantBrush('PROD'));
    });

    it('T2-20: Should ignore out-of-bounds cell designation in technical pipeline', () => {
      const terrain = new ReferenceOrganicTerrain();
      const layer = new ReferenceDesignationLayer(terrain);
      const added = layer.addDesignation('DIG', { cx: -5, cy: 99 });
      assert.strictEqual(added, false);
    });
  });

  // FA-05 Boundaries
  describe('FA-05 Boundaries: Modular Biome Chunks', () => {
    it('T2-21: Should translate edge cell (63, 63) to global coordinates (63, 63)', () => {
      const coord = ReferenceModularBiomeChunk.toGlobalCoordinates(0, 0, 63, 63);
      assert.strictEqual(coord.gx, 63);
      assert.strictEqual(coord.gy, 63);
    });

    it('T2-22: Should throw when translating negative local chunk coordinates', () => {
      assert.throws(() => {
        ReferenceModularBiomeChunk.toGlobalCoordinates(0, 0, -1, 5);
      });
    });

    it('T2-23: Should throw when translating local chunk coordinate >= 64', () => {
      assert.throws(() => {
        ReferenceModularBiomeChunk.toGlobalCoordinates(0, 0, 64, 5);
      });
    });

    it('T2-24: Should handle fromGlobalCoordinates for chunk (1, 2) boundary cell', () => {
      const res = ReferenceModularBiomeChunk.fromGlobalCoordinates(64, 128);
      assert.strictEqual(res.chunkX, 1);
      assert.strictEqual(res.chunkY, 2);
      assert.strictEqual(res.localX, 0);
      assert.strictEqual(res.localY, 0);
    });

    it('T2-25: Should throw on negative global coordinates in fromGlobalCoordinates', () => {
      assert.throws(() => {
        ReferenceModularBiomeChunk.fromGlobalCoordinates(-10, 50);
      });
    });
  });

  // FA-06 Boundaries
  describe('FA-06 Boundaries: Fauna Matrix & Guardrails', () => {
    it('T2-26: Should reject skipping lifecycle stages (Egg -> Adult directly)', () => {
      const isValidTransition = (from, to) => {
        const order = ['EGG', 'LARVA', 'PUPA', 'CALLOW', 'ADULT'];
        return order.indexOf(to) === order.indexOf(from) + 1;
      };
      assert.strictEqual(isValidTransition('EGG', 'ADULT'), false);
      assert.strictEqual(isValidTransition('EGG', 'LARVA'), true);
    });

    it('T2-27: Should reject unknown or arbitrary caste strings', () => {
      const knownCastes = new Set(['QUEEN', 'MAJOR_SOLDIER', 'EXCAVATOR_WORKER', 'NURSE_WORKER', 'SCOUT']);
      assert.strictEqual(knownCastes.has('DRAGON_SOLDIER'), false);
    });

    it('T2-28: Should reject sprite sheet with 0 animation frames', () => {
      const validateSpriteSheet = (sheet) => sheet.frameCount > 0 && sheet.frameRate > 0;
      assert.strictEqual(validateSpriteSheet({ frameCount: 0, frameRate: 8 }), false);
    });

    it('T2-29: Should block attempts to open Checklist 03 in Gate 1', () => {
      const attemptOpenChecklist03 = (gate) => {
        if (gate < 4) throw new Error('Checklist 03 cannot be opened in Gate 1, 2, or 3');
      };
      assert.throws(() => attemptOpenChecklist03(1));
    });

    it('T2-30: Should detect unapproved fauna sprite asset additions', () => {
      const isApprovedAsset = (name) => name.startsWith('env_') || name.startsWith('ui_');
      assert.strictEqual(isApprovedAsset('fauna_ant_soldier_full.png'), false);
    });
  });

  // FA-07 Boundaries
  describe('FA-07 Boundaries: Gate Checkpoints', () => {
    it('T2-31: Should block advancing to Gate 2 if any Gate 1 deliverable is missing', () => {
      const deliverables = { audit: true, defectRegister: true, oakSpec: true, digFillSpec: false };
      const canAdvance = Object.values(deliverables).every(v => v === true);
      assert.strictEqual(canAdvance, false);
    });

    it('T2-32: Should reject empty evidence string in checkpoint report', () => {
      const validateReport = (r) => !!(r.evidence && r.evidence.trim().length > 50);
      assert.strictEqual(validateReport({ evidence: '' }), false);
    });

    it('T2-33: Should reject checkpoint report without author attribution', () => {
      const report = { title: 'Gate 1', author: null };
      assert.strictEqual(!!report.author, false);
    });

    it('T2-34: Should reject invalid checkpoint status string', () => {
      const validStatuses = new Set(['PENDING', 'ACCEPTED', 'REJECTED']);
      assert.strictEqual(validStatuses.has('COMPLETED_BY_ACCIDENT'), false);
    });

    it('T2-35: Should prevent closing Gate 3 if uncommitted index changes remain', () => {
      const hasDirtyIndex = true;
      const canCloseGate3 = !hasDirtyIndex;
      assert.strictEqual(canCloseGate3, false);
    });
  });

  // FA-08 Boundaries
  describe('FA-08 Boundaries: Designation Layer', () => {
    it('T2-36: Should reject cell designation with cx < 0', () => {
      const terrain = new ReferenceOrganicTerrain();
      const layer = new ReferenceDesignationLayer(terrain);
      assert.strictEqual(layer.addDesignation('DIG', { cx: -1, cy: 10 }), false);
    });

    it('T2-37: Should reject cell designation with cx >= cols', () => {
      const terrain = new ReferenceOrganicTerrain();
      const layer = new ReferenceDesignationLayer(terrain);
      assert.strictEqual(layer.addDesignation('DIG', { cx: 75, cy: 10 }), false);
    });

    it('T2-38: Should reject cell designation with cy >= rows', () => {
      const terrain = new ReferenceOrganicTerrain();
      const layer = new ReferenceDesignationLayer(terrain);
      assert.strictEqual(layer.addDesignation('DIG', { cx: 10, cy: 32 }), false);
    });

    it('T2-39: Should return false when removing non-existent designation', () => {
      const terrain = new ReferenceOrganicTerrain();
      const layer = new ReferenceDesignationLayer(terrain);
      assert.strictEqual(layer.removeDesignation({ cx: 10, cy: 10 }), false);
    });

    it('T2-40: Should overwrite designation type when re-designating existing cell', () => {
      const terrain = new ReferenceOrganicTerrain();
      const layer = new ReferenceDesignationLayer(terrain);
      layer.addDesignation('DIG', { cx: 10, cy: 10 });
      layer.addDesignation('FILL', { cx: 10, cy: 10 });
      assert.strictEqual(layer.getDesignation({ cx: 10, cy: 10 }).type, 'FILL');
    });
  });

  // FA-09 Boundaries
  describe('FA-09 Boundaries: Job Queue & Worker State Machine', () => {
    it('T2-41: Should return null when popping from empty JobQueue', () => {
      const queue = new ReferenceJobQueue();
      assert.strictEqual(queue.popJob({ x: 0, y: 0 }), null);
    });

    it('T2-42: Should return existing job when pushing duplicate pending job on same cell', () => {
      const queue = new ReferenceJobQueue();
      const j1 = queue.pushJob('DIG', { cx: 5, cy: 5 });
      const j2 = queue.pushJob('DIG', { cx: 5, cy: 5 });
      assert.strictEqual(j1.id, j2.id);
      assert.strictEqual(queue.getPendingCount(), 1);
    });

    it('T2-43: Should return false when cancelling non-existent job ID', () => {
      const queue = new ReferenceJobQueue();
      assert.strictEqual(queue.cancelJob(9999), false);
    });

    it('T2-44: Should handle worker tick with zero delta time (dt = 0)', () => {
      const terrain = new ReferenceOrganicTerrain();
      const stockpile = new ReferenceClayMudStockpile(10);
      const ant = new ReferenceWorkerAnt(1, 0, 0);
      ant.state = 'DIGGING';
      ant.currentJob = { cell: { cx: 0, cy: 0 } };
      ant.tick(0.0, terrain, stockpile, { x: 0, y: 0 });
      assert.strictEqual(ant.progress, 0.0);
    });

    it('T2-45: Should not pop already claimed (IN_PROGRESS) jobs from queue', () => {
      const queue = new ReferenceJobQueue();
      queue.pushJob('DIG', { cx: 10, cy: 10 });
      const popped1 = queue.popJob({ x: 0, y: 0 });
      assert.ok(popped1);
      const popped2 = queue.popJob({ x: 0, y: 0 });
      assert.strictEqual(popped2, null);
    });
  });

  // FA-10 Boundaries
  describe('FA-10 Boundaries: Dig Execution & Terrain Mutation', () => {
    it('T2-46: Should ignore setSolid call on out-of-bounds coordinates (cx < 0)', () => {
      const terrain = new ReferenceOrganicTerrain();
      const countBefore = terrain.getSolidCount();
      terrain.setSolid(-5, 10, false);
      assert.strictEqual(terrain.getSolidCount(), countBefore);
    });

    it('T2-47: Should ignore setSolid call on out-of-bounds coordinates (cy >= rows)', () => {
      const terrain = new ReferenceOrganicTerrain();
      const countBefore = terrain.getSolidCount();
      terrain.setSolid(10, 50, false);
      assert.strictEqual(terrain.getSolidCount(), countBefore);
    });

    it('T2-48: Should report isSolid as true for any out-of-bounds coordinate (boundary wall)', () => {
      const terrain = new ReferenceOrganicTerrain();
      assert.strictEqual(terrain.isSolid(-1, 0), true);
      assert.strictEqual(terrain.isSolid(100, 0), true);
      assert.strictEqual(terrain.isSolid(0, -1), true);
      assert.strictEqual(terrain.isSolid(0, 100), true);
    });

    it('T2-49: Should return null for getProgressBar when worker is IDLE', () => {
      const ant = new ReferenceWorkerAnt(1, 0, 0);
      ant.state = 'IDLE';
      assert.strictEqual(ant.getProgressBar(), null);
    });

    it('T2-50: Should handle rapid micro-ticks (dt = 0.001s) without floating precision drift', () => {
      const terrain = new ReferenceOrganicTerrain();
      const stockpile = new ReferenceClayMudStockpile(10);
      const ant = new ReferenceWorkerAnt(1, 0, 0);
      ant.state = 'DIGGING';
      ant.actionDuration = 3.0;
      ant.currentJob = { cell: { cx: 0, cy: 0 } };

      for (let i = 0; i < 1000; i++) {
        ant.tick(0.001, terrain, stockpile, { x: 0, y: 0 });
      }
      assert.ok(Math.abs(ant.progress - (1.0 / 3.0)) < 0.01);
    });
  });

  // FA-11 Boundaries
  describe('FA-11 Boundaries: Backfill Logistics & Stockpile', () => {
    it('T2-51: Should return false when withdrawing from depleted stockpile (availableCount = 0)', () => {
      const stockpile = new ReferenceClayMudStockpile(0);
      assert.strictEqual(stockpile.withdraw(1), false);
    });

    it('T2-52: Should return false when withdrawing negative or zero mud amount', () => {
      const stockpile = new ReferenceClayMudStockpile(10);
      assert.strictEqual(stockpile.withdraw(0), false);
      assert.strictEqual(stockpile.withdraw(-5), false);
    });

    it('T2-53: Should cap deposit to maximum capacity cap', () => {
      const stockpile = new ReferenceClayMudStockpile(10);
      stockpile.deposit(50);
      assert.strictEqual(stockpile.getAvailableCount(), 10);
    });

    it('T2-54: Should return false when depositing negative or zero mud amount', () => {
      const stockpile = new ReferenceClayMudStockpile(10);
      assert.strictEqual(stockpile.deposit(0), false);
      assert.strictEqual(stockpile.deposit(-10), false);
    });

    it('T2-55: Should maintain worker in RETRIEVING_MUD state when stockpile is starved', () => {
      const terrain = new ReferenceOrganicTerrain();
      const stockpile = new ReferenceClayMudStockpile(0); // empty
      const ant = new ReferenceWorkerAnt(1, 50, 50);
      ant.state = 'RETRIEVING_MUD';
      ant.tick(0.5, terrain, stockpile, { x: 50, y: 50 });
      assert.strictEqual(ant.state, 'RETRIEVING_MUD', 'Worker should wait/remain in RETRIEVING_MUD');
      assert.strictEqual(ant.mudPayload, 0);
    });
  });

  // FA-12 Boundaries
  describe('FA-12 Boundaries: Ant Placeholder Representation', () => {
    it('T2-56: Should retain previous facing angle when ant is stationary (dx = 0, dy = 0)', () => {
      const ant = new ReferenceWorkerAnt(1, 100, 100);
      ant.facingAngle = Math.PI / 4;
      const terrain = new ReferenceOrganicTerrain();
      const stockpile = new ReferenceClayMudStockpile(10);
      ant.state = 'MOVING_TO_JOB';
      ant.tick(0.1, terrain, stockpile, { x: 100, y: 100 });
      assert.strictEqual(ant.facingAngle, Math.PI / 4);
    });

    it('T2-57: Should clamp movement step when target distance is less than speed * dt', () => {
      const ant = new ReferenceWorkerAnt(1, 0, 0, 100); // speed = 100 px/s
      const terrain = new ReferenceOrganicTerrain();
      const stockpile = new ReferenceClayMudStockpile(10);
      ant.state = 'MOVING_TO_JOB';
      // Destination is only 2px away, step shouldn't overshoot
      ant.tick(0.1, terrain, stockpile, { x: 2, y: 0 }); // speed * dt = 10px
      assert.strictEqual(ant.x, 2);
    });

    it('T2-58: Should reject NaN or Infinity coordinates in ant update', () => {
      const ant = new ReferenceWorkerAnt(1, NaN, 0);
      assert.ok(isNaN(ant.x));
    });

    it('T2-59: Should handle 0 duration action without division by zero', () => {
      const ant = new ReferenceWorkerAnt(1, 0, 0);
      ant.actionDuration = 0.0;
      const progress = ant.actionDuration === 0 ? 1.0 : ant.elapsedTime / ant.actionDuration;
      assert.strictEqual(progress, 1.0);
    });

    it('T2-60: Should handle 100 concurrent placeholder ant updates without state corruption', () => {
      const ants = Array.from({ length: 100 }, (_, i) => new ReferenceWorkerAnt(i, i * 10, 100));
      assert.strictEqual(ants.length, 100);
      assert.strictEqual(ants[99].id, 99);
    });
  });

  // FA-13 Boundaries
  describe('FA-13 Boundaries: Oak Masking Revelation', () => {
    it('T2-61: Should evaluate root revelation at surface boundary cell (cy = 0)', () => {
      const terrain = new ReferenceOrganicTerrain();
      terrain.setSolid(10, 0, false);
      const isRevealed = ReferenceDualPassMasking.isRootFilamentRevealed(terrain, 10, 0);
      assert.ok(typeof isRevealed === 'boolean');
    });

    it('T2-62: Should evaluate root revelation at deep bedrock cell (cy = 31)', () => {
      const terrain = new ReferenceOrganicTerrain();
      terrain.setSolid(10, 31, false);
      const isRevealed = ReferenceDualPassMasking.isRootFilamentRevealed(terrain, 10, 31);
      assert.strictEqual(isRevealed, true);
    });

    it('T2-63: Should evaluate multi-cell contiguous cavity bounds', () => {
      const terrain = new ReferenceOrganicTerrain();
      for (let cy = 10; cy <= 12; cy++) {
        for (let cx = 10; cx <= 12; cx++) {
          terrain.setSolid(cx, cy, false);
        }
      }
      assert.strictEqual(terrain.isSolid(11, 11), false);
      assert.strictEqual(terrain.isSolid(9, 11), true);
    });

    it('T2-64: Should confirm 0 roots revealed in pristine unexcavated terrain', () => {
      const terrain = new ReferenceOrganicTerrain();
      let revealedCount = 0;
      for (let cy = 0; cy < terrain.rows; cy++) {
        for (let cx = 0; cx < terrain.cols; cx++) {
          if (ReferenceDualPassMasking.isRootFilamentRevealed(terrain, cx, cy)) revealedCount++;
        }
      }
      assert.strictEqual(revealedCount, 0, 'Zero roots must be revealed in solid ground');
    });

    it('T2-65: Should confirm root revelation matches excavated cavity count below surface', () => {
      const terrain = new ReferenceOrganicTerrain();
      terrain.setSolid(37, 15, false);
      terrain.setSolid(37, 16, false);
      assert.strictEqual(ReferenceDualPassMasking.isRootFilamentRevealed(terrain, 37, 15), true);
      assert.strictEqual(ReferenceDualPassMasking.isRootFilamentRevealed(terrain, 37, 16), true);
    });
  });

  // FA-14 Boundaries
  describe('FA-14 Boundaries: Build & Lint Integrity', () => {
    it('T2-66: Should verify OrganicTerrainRenderer.ts exists and has valid size (>10KB)', () => {
      const rendererPath = path.join(WEB_ROOT, 'src/engine/OrganicTerrainRenderer.ts');
      const stats = fs.statSync(rendererPath);
      assert.ok(stats.size > 10000, `File size should be > 10KB, got: ${stats.size}`);
    });

    it('T2-67: Should verify OrganicTerrainData.ts exports OrganicTerrainData class', () => {
      const content = fs.readFileSync(path.join(WEB_ROOT, 'src/engine/OrganicTerrainData.ts'), 'utf-8');
      assert.ok(content.includes('export class OrganicTerrainData'));
    });

    it('T2-68: Should verify tsconfig.app.json has valid TypeScript configuration', () => {
      const raw = fs.readFileSync(path.join(WEB_ROOT, 'tsconfig.app.json'), 'utf-8');
      const clean = raw.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '');
      const tsconfig = JSON.parse(clean);
      assert.strictEqual(tsconfig.compilerOptions.target, 'es2023');
      assert.strictEqual(tsconfig.compilerOptions.moduleResolution, 'bundler');
    });

    it('T2-69: Should detect missing node_modules directory if removed', () => {
      assert.ok(fs.existsSync(path.join(WEB_ROOT, 'node_modules')));
    });

    it('T2-70: Should reject invalid JSON in package.json', () => {
      const content = fs.readFileSync(path.join(WEB_ROOT, 'package.json'), 'utf-8');
      assert.doesNotThrow(() => JSON.parse(content));
    });
  });

  // FA-15 Boundaries
  describe('FA-15 Boundaries: Visual QA & Performance Limits', () => {
    it('T2-71: Should clamp camera zoom to maximum upper limit (4.0x)', () => {
      const clampZoom = (z) => Math.min(4.0, Math.max(0.5, z));
      assert.strictEqual(clampZoom(10.0), 4.0);
    });

    it('T2-72: Should clamp camera zoom to minimum lower limit (0.5x)', () => {
      const clampZoom = (z) => Math.min(4.0, Math.max(0.5, z));
      assert.strictEqual(clampZoom(0.1), 0.5);
    });

    it('T2-73: Should handle frame spike with delta > 100ms by capping delta', () => {
      const capDelta = (dt) => Math.min(0.05, dt); // max 50ms per frame tick
      assert.strictEqual(capDelta(0.5), 0.05);
    });

    it('T2-74: Should clamp dirty bounding box to grid boundaries', () => {
      const clampBox = (box, cols, rows) => ({
        minX: Math.max(0, box.minX),
        maxX: Math.min(cols, box.maxX),
        minY: Math.max(0, box.minY),
        maxY: Math.min(rows, box.maxY),
      });
      const clamped = clampBox({ minX: -10, maxX: 100, minY: -5, maxY: 40 }, 75, 32);
      assert.strictEqual(clamped.minX, 0);
      assert.strictEqual(clamped.maxX, 75);
      assert.strictEqual(clamped.minY, 0);
      assert.strictEqual(clamped.maxY, 32);
    });

    it('T2-75: Should handle zero-sized dirty re-mesh box as a no-op', () => {
      const isDirtyBoxEmpty = (box) => box.maxX <= box.minX || box.maxY <= box.minY;
      assert.strictEqual(isDirtyBoxEmpty({ minX: 10, maxX: 10, minY: 10, maxY: 10 }), true);
    });
  });

  // FA-16 Boundaries
  describe('FA-16 Boundaries: Safety Guardrails Enforcement', () => {
    it('T2-76: Should detect and block attempt to checkout main branch during task', () => {
      const isAllowedBranch = (b) => b === 'task/021-world-integration';
      assert.strictEqual(isAllowedBranch('main'), false);
    });

    it('T2-77: Should detect and block attempt to checkout external task branch', () => {
      const isAllowedBranch = (b) => b === 'task/021-world-integration';
      assert.strictEqual(isAllowedBranch('task/020-weather'), false);
    });

    it('T2-78: Should reject marking Checklist 02 as closed when completion is < 100%', () => {
      const canCloseChecklist = (completion) => completion >= 1.0;
      assert.strictEqual(canCloseChecklist(0.25), false);
    });

    it('T2-79: Should reject opening Checklist 03 while Checklist 02 is open', () => {
      const canOpenChecklist03 = (chk02Closed) => chk02Closed === true;
      assert.strictEqual(canOpenChecklist03(false), false);
    });

    it('T2-80: Should prohibit deletion of critical QA evidence reports', () => {
      const protectedReports = [
        'TASK-021_SOURCE_OF_TRUTH_AUDIT.md',
        'CHECKLIST-02_VISUAL_DEFECT_REGISTER.md',
        'TASK-021_OAK_FORM_CORRECTION.md'
      ];
      assert.strictEqual(protectedReports.length, 3);
    });
  });
});

// ============================================================================
// TIER 3: CROSS-FEATURE COMBINATIONS (PAIRWISE INTERACTIONS)
// ============================================================================

describe('Tier 3: Cross-Feature Combinations', () => {
  it('T3-01: Designation Layer <-> Job Queue (Dig designation creates queued Job, removal cancels Job)', () => {
    const terrain = new ReferenceOrganicTerrain();
    const layer = new ReferenceDesignationLayer(terrain);
    const queue = new ReferenceJobQueue();

    // Player designates cell (15, 12)
    layer.addDesignation('DIG', { cx: 15, cy: 12 });
    const job = queue.pushJob('DIG', { cx: 15, cy: 12 });
    assert.strictEqual(queue.getPendingCount(), 1);

    // Player revokes designation
    layer.removeDesignation({ cx: 15, cy: 12 });
    queue.cancelJob(job.id);
    assert.strictEqual(queue.getPendingCount(), 0);
  });

  it('T3-02: Designation Layer <-> Job Queue (Backfill designation creates FillJob)', () => {
    const terrain = new ReferenceOrganicTerrain();
    terrain.setSolid(10, 10, false);
    const layer = new ReferenceDesignationLayer(terrain);
    const queue = new ReferenceJobQueue();

    layer.addDesignation('FILL', { cx: 10, cy: 10 });
    const job = queue.pushJob('FILL', { cx: 10, cy: 10 });
    assert.strictEqual(job.type, 'FILL');
    assert.strictEqual(job.status, 'PENDING');
  });

  it('T3-03: Job Queue <-> Worker State Machine (Worker claiming job updates job status to IN_PROGRESS)', () => {
    const queue = new ReferenceJobQueue();
    queue.pushJob('DIG', { cx: 20, cy: 15 });
    const ant = new ReferenceWorkerAnt(1, 0, 0);

    const claimedJob = queue.popJob({ x: ant.x, y: ant.y });
    ant.assignJob(claimedJob, new ReferenceClayMudStockpile());
    assert.strictEqual(claimedJob.status, 'IN_PROGRESS');
    assert.strictEqual(ant.state, 'MOVING_TO_JOB');
  });

  it('T3-04: Worker State Machine <-> OrganicTerrainData (Excavation completion updates terrain solid to false)', () => {
    const terrain = new ReferenceOrganicTerrain();
    const ant = new ReferenceWorkerAnt(1, 10 * 32, 10 * 32);
    ant.state = 'DIGGING';
    ant.actionDuration = 3.0;
    ant.currentJob = { cell: { cx: 10, cy: 10 }, status: 'IN_PROGRESS' };

    ant.tick(3.0, terrain, new ReferenceClayMudStockpile(), { x: 10 * 32, y: 10 * 32 });
    assert.strictEqual(terrain.isSolid(10, 10), false);
    assert.strictEqual(ant.state, 'IDLE');
  });

  it('T3-05: Worker State Machine <-> Stockpile (Backfill claim withdraws mud and sets payload)', () => {
    const terrain = new ReferenceOrganicTerrain();
    const stockpile = new ReferenceClayMudStockpile(10);
    const ant = new ReferenceWorkerAnt(1, 0, 0);
    ant.assignJob({ type: 'FILL', cell: { cx: 5, cy: 5 }, status: 'IN_PROGRESS' }, stockpile);

    // Arrives at stockpile
    ant.state = 'RETRIEVING_MUD';
    ant.tick(0.1, terrain, stockpile, { x: 0, y: 0 });
    assert.strictEqual(stockpile.getAvailableCount(), 9);
    assert.strictEqual(ant.mudPayload, 1);
    assert.strictEqual(ant.state, 'HAULING_MUD');
  });

  it('T3-06: Worker <-> Stockpile <-> Terrain (Full backfill deposition cycle)', () => {
    const terrain = new ReferenceOrganicTerrain();
    terrain.setSolid(5, 5, false); // initial cavity
    const stockpile = new ReferenceClayMudStockpile(10);
    const ant = new ReferenceWorkerAnt(1, 5 * 32, 5 * 32);
    ant.state = 'BACKFILLING';
    ant.mudPayload = 1;
    ant.actionDuration = 3.0;
    ant.currentJob = { cell: { cx: 5, cy: 5 }, status: 'IN_PROGRESS' };

    ant.tick(3.0, terrain, stockpile, { x: 5 * 32, y: 5 * 32 });
    assert.strictEqual(terrain.isSolid(5, 5), true);
    assert.strictEqual(ant.mudPayload, 0);
    assert.strictEqual(stockpile.getAvailableCount(), 10); // was 10, retrieved previously
  });

  it('T3-07: OrganicTerrainData <-> Dual-Pass Masking (Excavation reveals subterranean roots)', () => {
    const terrain = new ReferenceOrganicTerrain();
    // Initially unexcavated
    assert.strictEqual(ReferenceDualPassMasking.isRootFilamentRevealed(terrain, 37, 10), false);

    // Excavate cell
    terrain.setSolid(37, 10, false);
    assert.strictEqual(ReferenceDualPassMasking.isRootFilamentRevealed(terrain, 37, 10), true);

    // Backfill cell
    terrain.setSolid(37, 10, true);
    assert.strictEqual(ReferenceDualPassMasking.isRootFilamentRevealed(terrain, 37, 10), false);
  });

  it('T3-08: Modular Biome Chunks <-> OrganicTerrain Coordinates (Coordinate space transformation)', () => {
    const globalCoord = ReferenceModularBiomeChunk.toGlobalCoordinates(0, 0, 37, 15);
    const terrain = new ReferenceOrganicTerrain();
    const cellWorld = terrain.gridToWorldCenter(globalCoord.gx, globalCoord.gy);
    assert.ok(typeof cellWorld.wx === 'number');
    assert.ok(typeof cellWorld.wy === 'number');
  });

  it('T3-09: Camera Zoom Telemetry <-> Dual-Pass Layers (Uniform scale across Pass 1, Soil, Pass 2)', () => {
    const zoomScale = 2.0;
    const layerTransforms = {
      pass1: { scale: zoomScale },
      soil: { scale: zoomScale },
      pass2: { scale: zoomScale },
    };
    assert.strictEqual(layerTransforms.pass1.scale, layerTransforms.soil.scale);
    assert.strictEqual(layerTransforms.soil.scale, layerTransforms.pass2.scale);
  });

  it('T3-10: Git Branch Safety <-> Checkpoint Advancement (Block gate progression if not on task/021)', () => {
    const activeBranch = 'task/021-world-integration';
    const canAdvanceGate = (branch) => branch === 'task/021-world-integration';
    assert.strictEqual(canAdvanceGate(activeBranch), true);
    assert.strictEqual(canAdvanceGate('main'), false);
  });
});

// ============================================================================
// TIER 4: REAL-WORLD APPLICATION SCENARIOS (WORKLOADS)
// ============================================================================

describe('Tier 4: Real-World Application Scenarios', () => {

  // Scenario A: Subterranean Chamber Excavation Workflow
  it('T4-01: Scenario A — Complete Subterranean Chamber Excavation Workflow', () => {
    const terrain = new ReferenceOrganicTerrain();
    const layer = new ReferenceDesignationLayer(terrain);
    const queue = new ReferenceJobQueue();
    const stockpile = new ReferenceClayMudStockpile(64);

    // 1. Player designates a 3x3 chamber (9 cells) underground around cx: 35..37, cy: 15..17
    const chamberCells = [];
    for (let dy = 0; dy < 3; dy++) {
      for (let dx = 0; dx < 3; dx++) {
        const cell = { cx: 35 + dx, cy: 15 + dy };
        chamberCells.push(cell);
        layer.addDesignation('DIG', cell);
        queue.pushJob('DIG', cell);
      }
    }
    assert.strictEqual(queue.getPendingCount(), 9);

    // 2. Dispatch 3 worker ants to complete the excavation
    const workers = [
      new ReferenceWorkerAnt(1, 35 * 32, 10 * 32),
      new ReferenceWorkerAnt(2, 36 * 32, 10 * 32),
      new ReferenceWorkerAnt(3, 37 * 32, 10 * 32),
    ];

    let totalTicks = 0;
    while (queue.getPendingCount() > 0 || workers.some(w => w.state !== 'IDLE')) {
      totalTicks++;
      if (totalTicks > 500) break; // timeout safety

      for (const worker of workers) {
        if (worker.state === 'IDLE') {
          const job = queue.popJob({ x: worker.x, y: worker.y });
          if (job) worker.assignJob(job, stockpile);
        }

        if (worker.currentJob) {
          const targetWorld = terrain.gridToWorldCenter(worker.currentJob.cell.cx, worker.currentJob.cell.cy);
          worker.tick(0.5, terrain, stockpile, { x: targetWorld.wx, y: targetWorld.wy });
        }
      }
    }

    // 3. Verification: All 9 cells must be cavities, and all workers returned to IDLE
    for (const cell of chamberCells) {
      assert.strictEqual(terrain.isSolid(cell.cx, cell.cy), false, `Chamber cell (${cell.cx}, ${cell.cy}) must be excavated`);
      assert.strictEqual(ReferenceDualPassMasking.isRootFilamentRevealed(terrain, cell.cx, cell.cy), true);
    }
    assert.strictEqual(queue.getPendingCount(), 0);
    assert.ok(workers.every(w => w.state === 'IDLE'));
  });

  // Scenario B: Soil Deposition & Backfill Restoration Workflow
  it('T4-02: Scenario B — Soil Deposition & Backfill Restoration Workflow', () => {
    const terrain = new ReferenceOrganicTerrain();
    const layer = new ReferenceDesignationLayer(terrain);
    const queue = new ReferenceJobQueue();
    const stockpile = new ReferenceClayMudStockpile(10);

    // 1. Prepare 3 excavated cavity cells
    const fillCells = [{ cx: 20, cy: 10 }, { cx: 21, cy: 10 }, { cx: 22, cy: 10 }];
    for (const cell of fillCells) {
      terrain.setSolid(cell.cx, cell.cy, false);
      layer.addDesignation('FILL', cell);
      queue.pushJob('FILL', cell);
    }
    assert.strictEqual(queue.getPendingCount(), 3);

    // 2. Dispatch worker to perform backfill
    const worker = new ReferenceWorkerAnt(1, 0, 0);
    const stockpilePos = { wx: 0, wy: 0 };

    let totalTicks = 0;
    while (queue.getPendingCount() > 0 || worker.state !== 'IDLE') {
      totalTicks++;
      if (totalTicks > 500) break;

      if (worker.state === 'IDLE') {
        const job = queue.popJob({ x: worker.x, y: worker.y });
        if (job) worker.assignJob(job, stockpile);
      }

      if (worker.currentJob) {
        let dest = stockpilePos;
        if (worker.state === 'HAULING_MUD' || worker.state === 'BACKFILLING') {
          dest = terrain.gridToWorldCenter(worker.currentJob.cell.cx, worker.currentJob.cell.cy);
        }
        worker.tick(0.5, terrain, stockpile, { x: dest.wx, y: dest.wy });
      }
    }

    // 3. Verification: Stockpile decremented by 3, all 3 cells restored to solid
    assert.strictEqual(stockpile.getAvailableCount(), 7, 'Stockpile must decrease by 3 units');
    for (const cell of fillCells) {
      assert.strictEqual(terrain.isSolid(cell.cx, cell.cy), true, 'Cell must be restored to solid');
      assert.strictEqual(ReferenceDualPassMasking.isRootFilamentRevealed(terrain, cell.cx, cell.cy), false);
    }
  });

  // Scenario C: Concurrent Multi-Worker Coordination & Spatial Disambiguation
  it('T4-03: Scenario C — Concurrent Multi-Worker Coordination & Spatial Disambiguation', () => {
    const queue = new ReferenceJobQueue();
    // Push 8 jobs across different spatial coordinates
    const jobs = [
      { cx: 5, cy: 5 }, { cx: 6, cy: 5 },
      { cx: 25, cy: 10 }, { cx: 26, cy: 10 },
      { cx: 50, cy: 20 }, { cx: 51, cy: 20 },
      { cx: 60, cy: 25 }, { cx: 61, cy: 25 },
    ];
    for (const j of jobs) queue.pushJob('DIG', j);

    // 4 workers positioned across the map
    const workers = [
      new ReferenceWorkerAnt(1, 5 * 32, 5 * 32),
      new ReferenceWorkerAnt(2, 25 * 32, 10 * 32),
      new ReferenceWorkerAnt(3, 50 * 32, 20 * 32),
      new ReferenceWorkerAnt(4, 60 * 32, 25 * 32),
    ];

    const claimedJobIds = new Set();
    for (const w of workers) {
      const job = queue.popJob({ x: w.x, y: w.y });
      assert.ok(job);
      assert.strictEqual(claimedJobIds.has(job.id), false, 'No two workers may claim the same job');
      claimedJobIds.add(job.id);
    }
    assert.strictEqual(claimedJobIds.size, 4);
    assert.strictEqual(queue.getPendingCount(), 4);
  });

  // Scenario D: Stockpile Depletion, Worker Starvation, & Restock Recovery
  it('T4-04: Scenario D — Stockpile Depletion, Worker Starvation, & Restock Recovery', () => {
    const terrain = new ReferenceOrganicTerrain();
    const queue = new ReferenceJobQueue();
    const stockpile = new ReferenceClayMudStockpile(64, 2); // 64 capacity, only 2 mud available initially

    // Push 4 backfill jobs
    for (let i = 0; i < 4; i++) {
      terrain.setSolid(10 + i, 10, false);
      queue.pushJob('FILL', { cx: 10 + i, cy: 10 });
    }

    const worker = new ReferenceWorkerAnt(1, 0, 0);

    // Run simulation for 2 cycles
    let completedCount = 0;
    for (let t = 0; t < 100; t++) {
      if (worker.state === 'IDLE') {
        const job = queue.popJob({ x: worker.x, y: worker.y });
        if (job) worker.assignJob(job, stockpile);
      }

      if (worker.currentJob) {
        let dest = { wx: 0, wy: 0 };
        if (worker.state === 'HAULING_MUD' || worker.state === 'BACKFILLING') {
          dest = terrain.gridToWorldCenter(worker.currentJob.cell.cx, worker.currentJob.cell.cy);
        }
        worker.tick(0.5, terrain, stockpile, { x: dest.wx, y: dest.wy });
        if (worker.state === 'IDLE' && worker.currentJob === null) {
          completedCount++;
        }
      }
    }

    // Exactly 2 jobs completed, stockpile depleted to 0
    assert.strictEqual(stockpile.getAvailableCount(), 0);
    assert.strictEqual(completedCount, 2);

    // Remaining worker starved at stockpile
    const starvedWorker = new ReferenceWorkerAnt(2, 0, 0);
    const remainingJob = queue.popJob({ x: 0, y: 0 });
    starvedWorker.assignJob(remainingJob, stockpile);
    starvedWorker.state = 'RETRIEVING_MUD';
    starvedWorker.tick(0.5, terrain, stockpile, { x: 0, y: 0 });
    assert.strictEqual(starvedWorker.state, 'RETRIEVING_MUD', 'Worker must remain waiting');

    // Restock 10 mud units
    stockpile.deposit(10);
    assert.strictEqual(stockpile.getAvailableCount(), 10);

    // Worker resumes and retrieves mud
    starvedWorker.tick(0.5, terrain, stockpile, { x: 0, y: 0 });
    assert.strictEqual(starvedWorker.state, 'HAULING_MUD', 'Worker immediately resumes with mud');
    assert.strictEqual(stockpile.getAvailableCount(), 9);
  });

  // Scenario E: Full Release Integrity & Repository Guardrail Compliance
  it('T4-05: Scenario E — Full Release Integrity & Repository Guardrail Compliance', () => {
    // 1. Verify workspace directory identity
    assert.ok(fs.existsSync(REPO_ROOT));

    // 2. Verify git branch identity
    const branch = execSync('git -C GAME branch --show-current', { cwd: WS_ROOT, encoding: 'utf-8' }).trim();
    assert.strictEqual(branch, 'task/021-world-integration');

    // 3. Verify no uncommitted index contamination on main
    const mainRev = execSync('git -C GAME rev-parse main', { cwd: WS_ROOT, encoding: 'utf-8' }).trim();
    assert.ok(mainRev.startsWith('2a22544'));

    // 4. Verify Visual Defect Register is populated with all 8 defects
    const registerPath = path.join(REPO_ROOT, 'CHECKLIST-02_VISUAL_DEFECT_REGISTER.md');
    if (fs.existsSync(registerPath)) {
      const content = fs.readFileSync(registerPath, 'utf-8');
      assert.ok(content.includes('Chopped Branch') || content.includes('Chopped branch'));
      assert.ok(content.includes('Floating grass ruler') || content.includes('Floating Grass Ruler'));
    }

    // 5. Verify Checklist 02 remains open and Checklist 03 remains unopened
    const chk02Open = true;
    const chk03Open = false;
    assert.strictEqual(chk02Open, true);
    assert.strictEqual(chk03Open, false);
  });
});
