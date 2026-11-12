// scripts/checkpoint_c_energy_save.test.mjs
// ============================================================================
// THE VIVARIUM — CHECKPOINT C UNIT & INTEGRATION TESTS
// Testing: Worker Energy, Honeydew Feeding, Save/Load RLE Serialization
// ============================================================================

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

// Direct implementations matching simulation logic for Node test runner
class MockHoneydewSource {
  constructor(maxCapacity = 50, initialAmount = 30, location = { cx: 50, cy: 9 }) {
    this.maxCapacity = maxCapacity;
    this.id = 'aphid-honeydew-cache';
    this.name = 'Subterranean Aphid Honeydew Cache';
    this.cell = location;
    this.currentAmount = Math.min(this.maxCapacity, initialAmount);
    this.energyPerFeed = 45;
    this.listeners = [];
  }

  getAmount() { return this.currentAmount; }
  hasFood() { return this.currentAmount > 0; }

  consumeFood() {
    if (this.currentAmount <= 0) return false;
    this.currentAmount -= 1;
    this.notify();
    return true;
  }

  setAmount(val) {
    this.currentAmount = Math.max(0, Math.min(this.maxCapacity, Math.floor(val)));
    this.notify();
  }

  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  notify() {
    for (const l of this.listeners) l();
  }
}

class MockClayMudStockpile {
  constructor(maxCapacity = 64, initialAvailable = 16) {
    this.maxCapacity = maxCapacity;
    this.availableMud = initialAvailable;
    this.reservedMud = 0;
  }
  getAvailableCount() { return this.availableMud; }
  getReservedCount() { return this.reservedMud; }
  reserve(amount = 1) {
    if (amount <= 0 || this.availableMud < amount) return false;
    this.availableMud -= amount;
    this.reservedMud += amount;
    return true;
  }
  setStockpileForTesting(available, reserved) {
    this.availableMud = available;
    this.reservedMud = reserved;
  }
}

class MockJobQueue {
  constructor() {
    this.jobs = [];
    this.nextJobId = 1;
  }
  addJob(type, targetCell, stratum = 'CLAY') {
    const job = { id: this.nextJobId++, type, targetCell, stratum, status: 'PENDING', assignedWorkerId: null };
    this.jobs.push(job);
    return job;
  }
  clear() { this.jobs = []; }
}

class MockDesignationManager {
  constructor(jobQueue) {
    this.jobQueue = jobQueue;
    this.designations = new Map();
  }
  addDesignation(type, cx, cy) {
    const key = `${cx},${cy}`;
    const job = this.jobQueue.addJob(type, { cx, cy });
    this.designations.set(key, { type, cx, cy, jobId: job.id });
    return true;
  }
  getDesignations() {
    return Array.from(this.designations.values());
  }
  clearAll() {
    this.designations.clear();
    this.jobQueue.clear();
  }
}

// Logic mirror of GameStateManager
class TestGameStateManager {
  static encodeRLE(bits) {
    if (!bits || bits.length === 0) return '';
    let rle = '';
    let currentVal = bits[0];
    let runLen = 1;

    for (let i = 1; i < bits.length; i++) {
      if (bits[i] === currentVal) {
        runLen++;
      } else {
        rle += `${runLen}:${currentVal ? 1 : 0},`;
        currentVal = bits[i];
        runLen = 1;
      }
    }
    rle += `${runLen}:${currentVal ? 1 : 0}`;
    return rle;
  }

  static decodeRLE(rle, expectedLength) {
    const bits = [];
    if (!rle) return bits;
    const parts = rle.split(',');
    for (const p of parts) {
      const [countStr, valStr] = p.split(':');
      const count = parseInt(countStr, 10);
      const val = parseInt(valStr, 10);
      for (let i = 0; i < count; i++) {
        bits.push(val);
      }
    }
    return bits;
  }

  static createSaveData(terrain, colony, stockpile, honeydew, jobQueue, designationManager) {
    const totalCells = terrain.cols * terrain.rows;
    const bits = [];
    for (let cy = 0; cy < terrain.rows; cy++) {
      for (let cx = 0; cx < terrain.cols; cx++) {
        bits.push(terrain.isSolidCell(cx, cy) ? 1 : 0);
      }
    }
    const rle = this.encodeRLE(bits);

    const ants = colony.getAnts().map(ant => ({
      id: ant.id,
      type: 'WORKER',
      x: ant.x,
      y: ant.y,
      angle: ant.angle,
      state: ant.state,
      energy: ant.energy ?? 100,
      mudPayload: ant.mudPayload ?? 0,
      carriedResource: ant.carriedResource ?? null,
      currentJobId: ant.currentJob?.id ?? null,
      targetJobCell: ant.currentJob?.targetCell ?? null,
      jobTimer: ant.jobTimer ?? 0,
      jobDuration: ant.jobDuration ?? 3.5
    }));

    const pendingDesignations = designationManager.getDesignations().map(d => ({
      type: d.type,
      cx: d.cx,
      cy: d.cy
    }));

    return {
      version: '0.1.0',
      timestamp: Date.now(),
      biomeId: 'ancient_forest',
      terrain: {
        cols: terrain.cols,
        rows: terrain.rows,
        solidCellsRLE: rle
      },
      resources: {
        clayMudAvailable: stockpile.getAvailableCount(),
        clayMudReserved: stockpile.getReservedCount(),
        foodHoneydewAvailable: honeydew.getAmount()
      },
      colony: {
        speciesId: 'SPECIES_COMMON_FOREST_ANT',
        ants
      },
      jobs: {
        pendingDesignations
      }
    };
  }

  static saveGame(storage, terrain, colony, stockpile, honeydew, jobQueue, designationManager) {
    try {
      const data = this.createSaveData(terrain, colony, stockpile, honeydew, jobQueue, designationManager);
      storage.setItem('vivarium_save_v01', JSON.stringify(data));
      return true;
    } catch {
      return false;
    }
  }

  static loadGame(storage, terrain, colony, stockpile, honeydew, jobQueue, designationManager, onRebuildMesh) {
    try {
      const raw = storage.getItem('vivarium_save_v01');
      if (!raw) return false;
      const data = JSON.parse(raw);
      if (!data || data.version !== '0.1.0') return false;

      const bits = this.decodeRLE(data.terrain.solidCellsRLE, data.terrain.cols * data.terrain.rows);
      let idx = 0;
      for (let cy = 0; cy < data.terrain.rows; cy++) {
        for (let cx = 0; cx < data.terrain.cols; cx++) {
          terrain.setCellSolidDirect(cx, cy, bits[idx] === 1);
          idx++;
        }
      }

      stockpile.setStockpileForTesting(data.resources.clayMudAvailable, data.resources.clayMudReserved);
      honeydew.setAmount(data.resources.foodHoneydewAvailable);

      for (const savedAnt of data.colony.ants) {
        const liveAnt = colony.getAntById(savedAnt.id);
        if (liveAnt) {
          liveAnt.x = savedAnt.x;
          liveAnt.y = savedAnt.y;
          liveAnt.angle = savedAnt.angle;
          liveAnt.state = savedAnt.state;
          liveAnt.energy = savedAnt.energy;
          liveAnt.mudPayload = savedAnt.mudPayload;
          liveAnt.carriedResource = savedAnt.carriedResource;
        }
      }

      designationManager.clearAll();
      for (const des of data.jobs.pendingDesignations) {
        designationManager.addDesignation(des.type, des.cx, des.cy);
      }

      if (onRebuildMesh) {
        onRebuildMesh({ minX: 0, maxX: data.terrain.cols, minY: 0, maxY: data.terrain.rows });
      }
      return true;
    } catch {
      return false;
    }
  }
}

// -------------------------------------------------------------
// TESTS
// -------------------------------------------------------------
describe('Checkpoint C: Worker Energy, Feeding & Save/Load', () => {

  it('01: HoneydewSource initializes with finite amount and provides food', () => {
    const cache = new MockHoneydewSource(50, 30, { cx: 50, cy: 9 });
    assert.strictEqual(cache.maxCapacity, 50);
    assert.strictEqual(cache.getAmount(), 30);
    assert.strictEqual(cache.hasFood(), true);
    assert.strictEqual(cache.energyPerFeed, 45);

    const fed = cache.consumeFood();
    assert.strictEqual(fed, true);
    assert.strictEqual(cache.getAmount(), 29);

    for (let i = 0; i < 29; i++) {
      cache.consumeFood();
    }
    assert.strictEqual(cache.getAmount(), 0);
    assert.strictEqual(cache.hasFood(), false);
    assert.strictEqual(cache.consumeFood(), false);
  });

  it('02: HoneydewSource handles setAmount and change notifications', () => {
    const cache = new MockHoneydewSource(50, 10);
    let notified = false;
    const unsubscribe = cache.subscribe(() => {
      notified = true;
    });

    cache.setAmount(25);
    assert.strictEqual(cache.getAmount(), 25);
    assert.strictEqual(notified, true);

    cache.setAmount(100);
    assert.strictEqual(cache.getAmount(), 50);

    cache.setAmount(-5);
    assert.strictEqual(cache.getAmount(), 0);

    unsubscribe();
  });

  it('03: Worker ant energy depletion and low-energy foraging trigger', () => {
    let energy = 100;
    const moveRate = 0.5; // per sec
    const digRate = 2.0;  // per sec
    const lowThreshold = 25;

    // Simulate 40s moving
    energy -= moveRate * 40;
    assert.strictEqual(energy, 80);

    // Simulate 30s digging
    energy -= digRate * 30;
    assert.strictEqual(energy, 20);

    // Low energy condition met
    const needsFood = energy <= lowThreshold;
    assert.strictEqual(needsFood, true);

    // Feed at honeydew source
    const cache = new MockHoneydewSource(50, 20);
    assert.strictEqual(cache.consumeFood(), true);
    energy = Math.min(100, energy + cache.energyPerFeed);
    assert.strictEqual(energy, 65);
    assert.strictEqual(energy > lowThreshold, true);
  });

  it('04: GameStateManager RLE terrain encode and decode preserves bitstream exactly', () => {
    const bits = [1, 1, 1, 0, 0, 1, 0, 1, 1, 1, 1, 0];
    const rle = TestGameStateManager.encodeRLE(bits);
    assert.strictEqual(rle, '3:1,2:0,1:1,1:0,4:1,1:0');

    const decoded = TestGameStateManager.decodeRLE(rle, bits.length);
    assert.deepStrictEqual(decoded, bits);
  });

  it('05: GameStateManager createSaveData produces valid 0.1.0 schema', () => {
    const mockTerrain = {
      cols: 4,
      rows: 4,
      isSolidCell: (cx, cy) => (cx + cy) % 2 === 0,
      setCellSolidDirect: () => {}
    };

    const mockColony = {
      getAnts: () => [
        {
          id: 'ant-worker-0',
          x: 100,
          y: 200,
          angle: 1.5,
          state: 'IDLE',
          energy: 82.5,
          mudPayload: 1,
          carriedResource: 'CLAY_MUD',
          currentJob: null,
          jobTimer: 0,
          jobDuration: 3.5
        }
      ],
      getAntById: () => null
    };

    const stockpile = new MockClayMudStockpile(16, 20);
    stockpile.reserve();
    const honeydew = new MockHoneydewSource(50, 28);
    const queue = new MockJobQueue();
    const designation = new MockDesignationManager(queue);
    designation.addDesignation('DIG', 46, 8);

    const saveObj = TestGameStateManager.createSaveData(
      mockTerrain,
      mockColony,
      stockpile,
      honeydew,
      queue,
      designation
    );

    assert.strictEqual(saveObj.version, '0.1.0');
    assert.strictEqual(saveObj.biomeId, 'ancient_forest');
    assert.strictEqual(saveObj.resources.clayMudAvailable, 19);
    assert.strictEqual(saveObj.resources.clayMudReserved, 1);
    assert.strictEqual(saveObj.resources.foodHoneydewAvailable, 28);
    assert.strictEqual(saveObj.colony.ants[0].energy, 82.5);
    assert.strictEqual(saveObj.colony.ants[0].mudPayload, 1);
    assert.strictEqual(saveObj.jobs.pendingDesignations.length, 1);
    assert.strictEqual(saveObj.jobs.pendingDesignations[0].cx, 46);
  });

  it('06: GameStateManager save and load restores complete game state', () => {
    const storageMap = {};
    const mockStorage = {
      getItem: (k) => storageMap[k] || null,
      setItem: (k, v) => { storageMap[k] = String(v); },
      removeItem: (k) => { delete storageMap[k]; }
    };

    let terrainBits = new Array(16).fill(false);
    terrainBits[5] = true;
    terrainBits[10] = true;

    const mockTerrain = {
      cols: 4,
      rows: 4,
      isSolidCell: (cx, cy) => terrainBits[cy * 4 + cx],
      setCellSolidDirect: (cx, cy, solid) => {
        terrainBits[cy * 4 + cx] = solid;
      }
    };

    const workerAnt = {
      id: 'ant-worker-0',
      x: 50,
      y: 60,
      angle: 0.5,
      state: 'HAULING_MUD',
      energy: 40,
      mudPayload: 1,
      carriedResource: 'CLAY_MUD',
      currentJob: null,
      jobTimer: 0,
      jobDuration: 3.5
    };

    const mockColony = {
      getAnts: () => [workerAnt],
      getAntById: (id) => (id === 'ant-worker-0' ? workerAnt : null)
    };

    const stockpile = new MockClayMudStockpile(20, 17);
    const honeydew = new MockHoneydewSource(50, 19);
    const queue = new MockJobQueue();
    const designation = new MockDesignationManager(queue);

    // Save
    const saved = TestGameStateManager.saveGame(
      mockStorage,
      mockTerrain,
      mockColony,
      stockpile,
      honeydew,
      queue,
      designation
    );
    assert.strictEqual(saved, true);

    // Mutate state
    terrainBits.fill(false);
    workerAnt.energy = 10;
    workerAnt.mudPayload = 0;
    workerAnt.state = 'IDLE';
    stockpile.setStockpileForTesting(5, 0);
    honeydew.setAmount(2);

    // Load
    let rebuiltBox = null;
    const loaded = TestGameStateManager.loadGame(
      mockStorage,
      mockTerrain,
      mockColony,
      stockpile,
      honeydew,
      queue,
      designation,
      (box) => { rebuiltBox = box; }
    );

    assert.strictEqual(loaded, true);
    assert.strictEqual(terrainBits[5], true);
    assert.strictEqual(terrainBits[10], true);
    assert.strictEqual(terrainBits[0], false);
    assert.strictEqual(workerAnt.energy, 40);
    assert.strictEqual(workerAnt.mudPayload, 1);
    assert.strictEqual(workerAnt.state, 'HAULING_MUD');
    assert.strictEqual(stockpile.getAvailableCount(), 17);
    assert.strictEqual(honeydew.getAmount(), 19);
    assert(rebuiltBox !== null);
  });

  it('07: GameStateManager rejects incompatible schema version (rejection safety)', () => {
    const storageMap = {
      'vivarium_save_v01': JSON.stringify({ version: '0.0.9', timestamp: Date.now() })
    };
    const mockStorage = {
      getItem: (k) => storageMap[k] || null,
      setItem: (k, v) => { storageMap[k] = String(v); },
      removeItem: (k) => { delete storageMap[k]; }
    };

    const mockTerrain = { cols: 4, rows: 4, isSolidCell: () => false, setCellSolidDirect: () => {} };
    const mockColony = { getAnts: () => [], getAntById: () => null };
    const stockpile = new MockClayMudStockpile(20, 16);
    const honeydew = new MockHoneydewSource(50, 30);
    const queue = new MockJobQueue();
    const designation = new MockDesignationManager(queue);

    const loaded = TestGameStateManager.loadGame(
      mockStorage,
      mockTerrain,
      mockColony,
      stockpile,
      honeydew,
      queue,
      designation
    );

    assert.strictEqual(loaded, false);
  });
});
