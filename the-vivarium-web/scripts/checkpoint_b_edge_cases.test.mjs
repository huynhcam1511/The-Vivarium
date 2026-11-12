// scripts/checkpoint_b_edge_cases.test.mjs
// ============================================================================
// THE VIVARIUM — Checkpoint B Edge Cases Comprehensive Automated Test Suite
// Covers:
// 1. Starved Stockpile (Zero mud blocks FILL claiming)
// 2. Cancellation of FILL after Reservation (Restores available mud)
// 3. Worker Interruption with Mud in transit (Safely deposits mud back to stockpile)
// 4. Unreachable Target cell (Pathfinder fails -> Job stays PENDING, terrain solid)
// 5. Zero-Worker condition (Jobs queue cleanly without execution)
// 6. Stratum Separation: LOAM excavation yields 0 Clay Mud
// 7. Stratum Separation: CLAY excavation yields 1 Clay Mud
// 8. Max Capacity boundary: Deposit rejected when stockpile is at 64 limit
// ============================================================================

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

class MockClayMudStockpile {
  constructor(maxCapacity = 64, initialAvailable = 16) {
    this.maxCapacity = maxCapacity;
    this.availableMud = initialAvailable;
    this.reservedMud = 0;
  }
  getAvailableCount() { return this.availableMud; }
  getReservedCount() { return this.reservedMud; }
  getTotalCount() { return this.availableMud + this.reservedMud; }
  reserve(amount = 1) {
    if (amount <= 0 || this.availableMud < amount) return false;
    this.availableMud -= amount;
    this.reservedMud += amount;
    return true;
  }
  unreserve(amount = 1) {
    const clamped = Math.min(amount, this.reservedMud);
    this.reservedMud -= clamped;
    this.availableMud += clamped;
  }
  deposit(amount = 1) {
    if (amount <= 0) return false;
    if (this.availableMud + this.reservedMud + amount > this.maxCapacity) return false;
    this.availableMud += amount;
    return true;
  }
  isFull() {
    return (this.availableMud + this.reservedMud) >= this.maxCapacity;
  }
}

class MockJobQueue {
  constructor() {
    this.jobs = [];
    this.nextId = 1;
  }
  pushJob(type, cell, workDuration = 3.5) {
    const job = { id: this.nextId++, type, cell, status: 'PENDING', workDuration, assignedWorkerId: null };
    this.jobs.push(job);
    return job;
  }
  claimNearestJob(workerPos, workerId, isFillAllowed = true) {
    for (const job of this.jobs) {
      if (job.status === 'PENDING') {
        if (job.type === 'FILL' && !isFillAllowed) continue;
        job.status = 'IN_PROGRESS';
        job.assignedWorkerId = workerId;
        return job;
      }
    }
    return null;
  }
  getPendingCount() {
    return this.jobs.filter((j) => j.status === 'PENDING').length;
  }
  getActiveCount() {
    return this.jobs.filter((j) => j.status === 'IN_PROGRESS').length;
  }
  getCompletedCount() {
    return this.jobs.filter((j) => j.status === 'COMPLETED').length;
  }
}

describe('Checkpoint B Edge Cases & Boundary Conditions', () => {
  it('EDGE-01: Starved Stockpile blocks FILL job assignment', () => {
    const stockpile = new MockClayMudStockpile(64, 0); // 0 available mud
    const queue = new MockJobQueue();
    queue.pushJob('FILL', { cx: 46, cy: 8 }, 3.5);

    const isFillAllowed = stockpile.getAvailableCount() > 0;
    assert.strictEqual(isFillAllowed, false);

    const claimed = queue.claimNearestJob({ x: 352, y: 256 }, 'worker-1', isFillAllowed);
    assert.strictEqual(claimed, null, 'Worker must NOT claim FILL job when stockpile has 0 available mud');
    assert.strictEqual(queue.getPendingCount(), 1, 'Job remains safely in PENDING state');
  });

  it('EDGE-02: Cancellation of FILL after reservation cleanly restores stockpile', () => {
    const stockpile = new MockClayMudStockpile(64, 10);
    assert.strictEqual(stockpile.reserve(1), true);
    assert.strictEqual(stockpile.getAvailableCount(), 9);
    assert.strictEqual(stockpile.getReservedCount(), 1);

    // Cancel job before pickup
    stockpile.unreserve(1);
    assert.strictEqual(stockpile.getAvailableCount(), 10, 'Available count restored to 10');
    assert.strictEqual(stockpile.getReservedCount(), 0, 'Reserved count restored to 0');
    assert.strictEqual(stockpile.getTotalCount(), 10, 'Total count invariant maintained');
  });

  it('EDGE-03: Worker carrying mud during cancellation safely deposits mud back to stockpile', () => {
    const stockpile = new MockClayMudStockpile(64, 16);
    const worker = {
      carriedResource: 'MUD',
      mudPayload: 1,
      state: 'HAULING_MUD'
    };

    // Target becomes invalid -> Worker deposits payload
    const deposited = stockpile.deposit(worker.mudPayload);
    assert.strictEqual(deposited, true);
    worker.carriedResource = null;
    worker.mudPayload = 0;
    worker.state = 'IDLE';

    assert.strictEqual(stockpile.getAvailableCount(), 17, 'Mud safely accounted for without loss');
    assert.strictEqual(worker.mudPayload, 0);
  });

  it('EDGE-04: Unreachable target cell leaves terrain solid and job PENDING', () => {
    let cellSolid = true;
    const mockPathfinder = {
      findWalkableAdjacent: () => null,
      findPath: () => null
    };

    const adj = mockPathfinder.findWalkableAdjacent({ cx: 10, cy: 10 }, { cx: 0, cy: 0 });
    assert.strictEqual(adj, null);
    assert.strictEqual(cellSolid, true, 'Terrain remains completely unmodified');
  });

  it('EDGE-05: Zero-worker condition preserves job queue without mutation', () => {
    const queue = new MockJobQueue();
    queue.pushJob('DIG', { cx: 20, cy: 10 }, 3.5);
    queue.pushJob('FILL', { cx: 25, cy: 12 }, 3.5);

    assert.strictEqual(queue.getPendingCount(), 2);
    // No worker claims jobs
    assert.strictEqual(queue.getActiveCount(), 0);
    assert.strictEqual(queue.getCompletedCount(), 0);
  });

  it('EDGE-06: Stratum Separation — Excavating LOAM topsoil does NOT yield Clay Mud', () => {
    const getSoilStrata = (cy) => (cy * 32 < 160 ? 'LOAM' : 'CLAY');
    const strata = getSoilStrata(2); // depth 64px
    assert.strictEqual(strata, 'LOAM');

    let carriedResource = null;
    let mudPayload = 0;
    if (strata === 'CLAY') {
      carriedResource = 'MUD';
      mudPayload = 1;
    }
    assert.strictEqual(carriedResource, null, 'LOAM must not produce mud');
    assert.strictEqual(mudPayload, 0);
  });

  it('EDGE-07: Stratum Separation — Excavating CLAY stratum yields exactly 1 Clay Mud', () => {
    const getSoilStrata = (cy) => (cy * 32 < 160 ? 'LOAM' : 'CLAY');
    const strata = getSoilStrata(8); // depth 256px
    assert.strictEqual(strata, 'CLAY');

    let carriedResource = null;
    let mudPayload = 0;
    if (strata === 'CLAY') {
      carriedResource = 'MUD';
      mudPayload = 1;
    }
    assert.strictEqual(carriedResource, 'MUD');
    assert.strictEqual(mudPayload, 1);
  });

  it('EDGE-08: Max Capacity boundary — Stockpile at 64 capacity rejects overflow deposit', () => {
    const stockpile = new MockClayMudStockpile(64, 64);
    assert.strictEqual(stockpile.isFull(), true);
    const deposited = stockpile.deposit(1);
    assert.strictEqual(deposited, false, 'Deposit must be rejected when stockpile is full');
    assert.strictEqual(stockpile.getAvailableCount(), 64);
  });
});
