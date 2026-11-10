// scripts/challenger_gate2_2_boundary_stress.ts
// ============================================================================
// THE VIVARIUM — Gate 2 Adversarial Boundary, Concurrency & Stress Harness
// Roles: Critic / Specialist (challenger_gate2_2)
//
// Coverage:
// 1. Coordinate boundary injection:
//    - Out-of-bounds clicks at (-1201, -1), (1200, 1024)
//    - Direct cell coordinate boundaries (cx=75, cy=32), (cx=-1, cy=0)
//    - Extreme values (NaN, Infinity, ±100,000) and random boundary fuzzing
// 2. Stockpile depletion & worker starvation:
//    - 0 mud stockpile behavior
//    - Worker starvation loop defense (no infinite claiming loop, no phantom mud)
//    - Restock unstarvation recovery
// 3. Multiple concurrent workers & race conditions:
//    - N-workers competing for M < N mud reserves (zero double-spending)
//    - Single-job mutual exclusion under concurrent claims
//    - Strict Mud Conservation Law across multi-tick simulation
// 4. Stockpile boundary defense:
//    - Non-positive reservations/withdrawals/deposits, capacity overflow, clamp safety
// ============================================================================

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { DesignationManager } from '../src/simulation/DesignationManager';
import { ClayMudStockpile } from '../src/simulation/ClayMudStockpile';
import { JobQueue } from '../src/simulation/JobQueue';
import { TerrainPathfinder } from '../src/simulation/TerrainPathfinder';
import { OrganicTerrainData } from '../src/engine/OrganicTerrainData';
import { AntColony } from '../src/simulation/AntColony';

describe('CHALLENGE 1: Coordinate Boundary Injection & Out-of-Bounds Clicks', () => {
  it('test_oob_click_negative_1201_negative_1', () => {
    const mgr = new DesignationManager(75, 32, 32, -1200, 0);
    const terrain = new OrganicTerrainData(75, 32, 32, -1200, 0);

    // World coordinate: (-1201, -1)
    const cell = mgr.worldToCell(-1201, -1);
    assert.equal(cell.cx, -1, 'cx must be -1 for worldX = -1201');
    assert.equal(cell.cy, -1, 'cy must be -1 for worldY = -1');

    // Designation rejection
    assert.equal(mgr.isWithinBounds(cell.cx, cell.cy), false, '(-1, -1) must be out of bounds');
    assert.equal(mgr.addDesignation('DIG', cell), false, 'addDesignation DIG must return false');
    assert.equal(mgr.addDesignation('FILL', cell), false, 'addDesignation FILL must return false');
    assert.equal(mgr.removeDesignation(cell), false, 'removeDesignation must return false');
    assert.equal(mgr.hasDesignation(cell), false, 'hasDesignation must return false');
    assert.equal(mgr.getDesignation(cell), null, 'getDesignation must return null');
    assert.equal(mgr.getPendingCount(), 0, 'Pending count must remain 0');

    // Terrain bounds rejection
    assert.equal(terrain.isSolid(-1, -1), true, 'isSolid must safely default to true out of bounds');
    assert.doesNotThrow(() => {
      terrain.setSolid(-1, -1, false);
    }, 'setSolid(-1, -1) must not throw');
    assert.doesNotThrow(() => {
      terrain.digRadius(-1201, -1, 28);
    }, 'digRadius(-1201, -1) must not throw');
    assert.doesNotThrow(() => {
      terrain.fillRadius(-1201, -1, 28);
    }, 'fillRadius(-1201, -1) must not throw');
  });

  it('test_oob_click_1200_1024', () => {
    const mgr = new DesignationManager(75, 32, 32, -1200, 0);
    const terrain = new OrganicTerrainData(75, 32, 32, -1200, 0);

    // World coordinate: (1200, 1024)
    // 75 cols * 32 = 2400 width -> originX = -1200, maxX = +1200
    // 32 rows * 32 = 1024 depth -> originY = 0, maxY = 1024
    // (1200, 1024) is exactly on the outer boundary corner -> cell (75, 32)
    const cell = mgr.worldToCell(1200, 1024);
    assert.equal(cell.cx, 75, 'cx must be 75 (valid range is 0..74)');
    assert.equal(cell.cy, 32, 'cy must be 32 (valid range is 0..31)');

    assert.equal(mgr.isWithinBounds(cell.cx, cell.cy), false, '(75, 32) must be out of bounds');
    assert.equal(mgr.addDesignation('DIG', cell), false, 'addDesignation DIG must return false');
    assert.equal(mgr.addDesignation('FILL', cell), false, 'addDesignation FILL must return false');
    assert.equal(mgr.removeDesignation(cell), false, 'removeDesignation must return false');
    assert.equal(mgr.hasDesignation(cell), false, 'hasDesignation must return false');

    assert.equal(terrain.isSolid(75, 32), true, 'isSolid must safely default to true out of bounds');
    assert.doesNotThrow(() => {
      terrain.setSolid(75, 32, false);
    }, 'setSolid(75, 32) must not throw');
    assert.doesNotThrow(() => {
      terrain.digRadius(1200, 1024, 28);
    }, 'digRadius(1200, 1024) must not throw');
    assert.doesNotThrow(() => {
      terrain.fillRadius(1200, 1024, 28);
    }, 'fillRadius(1200, 1024) must not throw');
  });

  it('test_oob_explicit_cell_coords_75_32_and_negative_1_0', () => {
    const mgr = new DesignationManager(75, 32, 32, -1200, 0);
    const terrain = new OrganicTerrainData(75, 32, 32, -1200, 0);
    const pathfinder = new TerrainPathfinder(terrain);

    // Coordinate (cx=75, cy=32)
    assert.equal(mgr.isWithinBounds(75, 32), false);
    assert.equal(mgr.addDesignation('DIG', 75, 32), false);
    assert.equal(mgr.addDesignation('FILL', 75, 32), false);
    assert.equal(pathfinder.isWalkable(75, 32), false);
    assert.equal(pathfinder.findPath({ cx: 48, cy: 8 }, { cx: 75, cy: 32 }), null);
    assert.equal(pathfinder.findWalkableAdjacent({ cx: 75, cy: 32 }), null);

    // Coordinate (cx=-1, cy=0)
    assert.equal(mgr.isWithinBounds(-1, 0), false);
    assert.equal(mgr.addDesignation('DIG', -1, 0), false);
    assert.equal(mgr.addDesignation('FILL', -1, 0), false);
    assert.equal(pathfinder.isWalkable(-1, 0), false);
    assert.equal(pathfinder.findPath({ cx: -1, cy: 0 }, { cx: 48, cy: 8 }), null);
    assert.equal(pathfinder.findWalkableAdjacent({ cx: -1, cy: 0 }), null);
  });

  it('test_exact_boundary_edges_and_thresholds', () => {
    const mgr = new DesignationManager(75, 32, 32, -1200, 0);

    // Valid corner interiors
    assert.equal(mgr.isWithinBounds(0, 0), true, '(0, 0) top-left is valid');
    assert.equal(mgr.isWithinBounds(74, 0), true, '(74, 0) top-right is valid');
    assert.equal(mgr.isWithinBounds(0, 31), true, '(0, 31) bottom-left is valid');
    assert.equal(mgr.isWithinBounds(74, 31), true, '(74, 31) bottom-right is valid');

    // Off-by-one rejections
    assert.equal(mgr.isWithinBounds(-1, 0), false);
    assert.equal(mgr.isWithinBounds(0, -1), false);
    assert.equal(mgr.isWithinBounds(75, 0), false);
    assert.equal(mgr.isWithinBounds(0, 32), false);
    assert.equal(mgr.isWithinBounds(75, 31), false);
    assert.equal(mgr.isWithinBounds(74, 32), false);

    // Sub-pixel threshold mappings
    assert.equal(mgr.worldToCell(-1200.001, 10).cx, -1);
    assert.equal(mgr.worldToCell(-1200.0, 10).cx, 0);
    assert.equal(mgr.worldToCell(1199.999, 10).cx, 74);
    assert.equal(mgr.worldToCell(1200.0, 10).cx, 75);

    assert.equal(mgr.worldToCell(0, -0.001).cy, -1);
    assert.equal(mgr.worldToCell(0, 0.0).cy, 0);
    assert.equal(mgr.worldToCell(0, 1023.999).cy, 31);
    assert.equal(mgr.worldToCell(0, 1024.0).cy, 32);
  });

  it('test_adversarial_fuzzing_and_nan_infinity_resilience', () => {
    const mgr = new DesignationManager(75, 32, 32, -1200, 0);
    const terrain = new OrganicTerrainData(75, 32, 32, -1200, 0);

    // Extreme special values
    const extremeCoords = [
      { x: NaN, y: NaN },
      { x: Infinity, y: Infinity },
      { x: -Infinity, y: -Infinity },
      { x: 1e9, y: 1e9 },
      { x: -1e9, y: -1e9 },
    ];

    for (const pt of extremeCoords) {
      assert.doesNotThrow(() => {
        const c = mgr.worldToCell(pt.x, pt.y);
        assert.equal(mgr.isWithinBounds(c.cx, c.cy), false);
        assert.equal(mgr.addDesignation('DIG', c), false);
        assert.equal(mgr.addDesignation('FILL', c), false);
        terrain.digRadius(pt.x, pt.y, 28);
        terrain.fillRadius(pt.x, pt.y, 28);
      }, `Special coordinate (${pt.x}, ${pt.y}) must never crash the engine`);
    }

    // Fuzz 200 random out-of-bounds positions
    for (let i = 0; i < 200; i++) {
      const wx = (Math.random() < 0.5 ? -1 : 1) * (1201 + Math.random() * 50000);
      const wy = (Math.random() < 0.5 ? -1 : 1) * (1025 + Math.random() * 50000);
      const cell = mgr.worldToCell(wx, wy);
      assert.equal(mgr.isWithinBounds(cell.cx, cell.cy), false);
      assert.equal(mgr.addDesignation('DIG', cell), false);
    }
  });
});

describe('CHALLENGE 2: Stockpile Depletion & Worker Starvation', () => {
  it('test_stockpile_depletion_zero_mud_rejection', () => {
    const stockpile = new ClayMudStockpile(64, 0);
    assert.equal(stockpile.getAvailableCount(), 0);
    assert.equal(stockpile.getReservedCount(), 0);
    assert.equal(stockpile.getTotalCount(), 0);
    assert.equal(stockpile.isEmpty(), true);
    assert.equal(stockpile.isFull(), false);

    // Reservation when empty must fail
    assert.equal(stockpile.reserve(1), false);
    assert.equal(stockpile.getAvailableCount(), 0);
    assert.equal(stockpile.getReservedCount(), 0);

    // Direct withdrawal when empty must fail
    assert.equal(stockpile.withdraw(1), false);
    assert.equal(stockpile.getTotalCount(), 0);
  });

  it('test_worker_starvation_under_backfill_pressure', () => {
    const terrain = new OrganicTerrainData();
    terrain.carveTestCaveSystem();
    const pathfinder = new TerrainPathfinder(terrain);
    const jobQueue = new JobQueue();
    // Stockpile initialized with 0 mud
    const stockpile = new ClayMudStockpile(64, 0);
    const designationMgr = new DesignationManager();

    // 4 worker ants
    const colony = new AntColony(terrain, pathfinder, jobQueue, stockpile, designationMgr, 4);

    // Enqueue 4 backfill jobs in carved caverns
    const fillTargets = [
      { cx: 50, cy: 9 },
      { cx: 50, cy: 11 },
      { cx: 49, cy: 10 },
      { cx: 51, cy: 10 },
    ];

    for (const t of fillTargets) {
      terrain.setSolid(t.cx, t.cy, false); // ensure hollow
      designationMgr.addDesignation('FILL', t);
      jobQueue.pushJob('FILL', t, 1.0);
    }

    assert.equal(jobQueue.getPendingCount(), 4);
    assert.equal(stockpile.getAvailableCount(), 0);

    // Simulate 300 ticks (approx 30 seconds of game time)
    for (let frame = 0; frame < 300; frame++) {
      colony.update(0.1);
    }

    // Verify starvation defense:
    // 1. Stockpile mud remains exactly 0
    assert.equal(stockpile.getAvailableCount(), 0, 'Available mud must remain 0');
    assert.equal(stockpile.getReservedCount(), 0, 'Reserved mud must remain 0');
    assert.equal(stockpile.getTotalCount(), 0, 'Total mud must remain 0');

    // 2. Zero workers ever entered backfilling or hauling mud
    for (const ant of colony.ants) {
      if (ant.type === 'WORKER') {
        assert.equal(ant.carriedResource, null, 'No starved worker may carry mud');
        assert.equal(ant.mudPayload, 0, 'Mud payload must remain 0');
        assert.notEqual(ant.state, 'HAULING_MUD', 'Worker must not haul phantom mud');
        assert.notEqual(ant.state, 'BACKFILLING', 'Worker must not backfill without mud');
      }
    }

    // 3. Targets remain hollow (no phantom backfilling)
    for (const t of fillTargets) {
      assert.equal(terrain.isSolid(t.cx, t.cy), false, `Cell (${t.cx}, ${t.cy}) must remain hollow`);
    }

    // 4. Jobs remain intact in pending status
    assert.equal(jobQueue.getPendingCount(), 4, 'All 4 jobs must remain queued and pending');
  });

  it('test_stockpile_restock_recovery_after_starvation', () => {
    const terrain = new OrganicTerrainData();
    terrain.carveTestCaveSystem();
    const pathfinder = new TerrainPathfinder(terrain);
    const jobQueue = new JobQueue();
    const stockpile = new ClayMudStockpile(64, 0); // starts starved
    const designationMgr = new DesignationManager();

    const colony = new AntColony(terrain, pathfinder, jobQueue, stockpile, designationMgr, 3);
    const target = { cx: 50, cy: 9 };
    terrain.setSolid(target.cx, target.cy, false);
    designationMgr.addDesignation('FILL', target);
    jobQueue.pushJob('FILL', target, 0.5);

    // Tick while starved: no claim
    colony.update(0.1);
    assert.equal(stockpile.getReservedCount(), 0);
    assert.equal(jobQueue.getPendingCount(), 1);

    // Restock with exactly 1 mud!
    assert.equal(stockpile.deposit(1), true);
    assert.equal(stockpile.getAvailableCount(), 1);

    // Position worker 1 near living chamber
    const worker = colony.ants[1];
    worker.position = colony.cellToWorldCenter({ cx: 50, cy: 10 });
    worker.state = 'IDLE';

    // Tick: worker now claims the job and reserves the 1 mud
    colony.update(0.1);
    assert.equal(stockpile.getReservedCount(), 1);
    assert.equal(stockpile.getAvailableCount(), 0);
    assert.equal(worker.state, 'MOVING_TO_STOCKPILE');

    // Simulate arrival at stockpile
    worker.position = colony.cellToWorldCenter(stockpile.pickupWaypoint);
    worker.path = [stockpile.pickupWaypoint];
    worker.pathIndex = 0;
    colony.update(0.1);

    // Mud withdrawn
    assert.equal(stockpile.getReservedCount(), 0);
    assert.equal(stockpile.getTotalCount(), 0);
    assert.equal(worker.carriedResource, 'MUD');
    assert.equal(worker.mudPayload, 1);

    // Simulate arrival at target and completion
    worker.path = [];
    worker.pathIndex = 0;
    worker.state = 'BACKFILLING';
    worker.targetJobCell = target;
    worker.jobTimer = 0.6;
    colony.update(0.1);

    // Cell is restored, worker is idle, stockpile is 0
    assert.equal(terrain.isSolid(target.cx, target.cy), true);
    assert.equal(worker.carriedResource, null);
    assert.equal(worker.mudPayload, 0);
    assert.equal(worker.state, 'IDLE');
    assert.equal(stockpile.getTotalCount(), 0);
  });
});

describe('CHALLENGE 3: Concurrency, Multiple Workers & Race Conditions', () => {
  it('test_concurrent_worker_claims_limited_mud_zero_double_spending', () => {
    // 20 workers competing for only 3 mud units
    const queue = new JobQueue();
    const stockpile = new ClayMudStockpile(64, 3); // exactly 3 available

    // Enqueue 10 FILL jobs
    for (let i = 0; i < 10; i++) {
      queue.pushJob('FILL', { cx: 40 + i, cy: 10 });
    }
    assert.equal(queue.getPendingCount(), 10);

    // Simulate 20 workers in a single frame attempting to claim
    let claimedCount = 0;
    const workerAssignments: string[] = [];

    for (let w = 0; w < 20; w++) {
      const workerId = `worker-${w}`;
      const isFillAllowed = stockpile.getAvailableCount() > 0;

      const job = queue.claimNearestJob({ x: 0, y: 0 }, workerId, isFillAllowed);
      if (job) {
        if (stockpile.reserve(1)) {
          claimedCount++;
          workerAssignments.push(workerId);
        } else {
          // If reserve failed, rollback job
          job.status = 'PENDING';
          job.assignedWorkerId = null;
        }
      }
    }

    // Exactly 3 workers got mud and claimed jobs
    assert.equal(claimedCount, 3, 'Exactly 3 workers must claim the 3 available mud units');
    assert.equal(workerAssignments.length, 3);
    assert.equal(stockpile.getReservedCount(), 3, 'Reserved mud must equal 3');
    assert.equal(stockpile.getAvailableCount(), 0, 'Available mud must equal 0');
    assert.equal(stockpile.getTotalCount(), 3, 'Total stockpile mud must remain invariant at 3');

    // 7 jobs remain pending
    assert.equal(queue.getPendingCount(), 7, 'Remaining 7 jobs must stay pending');
  });

  it('test_job_mutual_exclusion_under_concurrent_queries', () => {
    const queue = new JobQueue();
    queue.pushJob('DIG', { cx: 25, cy: 15 });

    let successfulClaims = 0;
    let winningWorker: string | null = null;

    // 10 workers simultaneously attempt to claim the exact same single job
    for (let w = 0; w < 10; w++) {
      const job = queue.claimNearestJob({ x: -1200 + 25 * 32, y: 15 * 32 }, `worker-${w}`, true);
      if (job) {
        successfulClaims++;
        winningWorker = job.assignedWorkerId;
      }
    }

    assert.equal(successfulClaims, 1, 'Exactly one worker must succeed in claiming the job');
    assert.equal(winningWorker, 'worker-0', 'First claiming worker must own the job');
    assert.equal(queue.getPendingCount(), 0, 'Job must no longer be pending');
  });

  it('test_ant_colony_mud_conservation_stress_invariant', () => {
    const terrain = new OrganicTerrainData();
    terrain.carveTestCaveSystem();
    const pathfinder = new TerrainPathfinder(terrain);
    const jobQueue = new JobQueue();
    const initialMud = 10;
    const stockpile = new ClayMudStockpile(64, initialMud);
    const designationMgr = new DesignationManager();

    // 8 workers
    const colony = new AntColony(terrain, pathfinder, jobQueue, stockpile, designationMgr, 8);

    // Initial total count
    assert.equal(stockpile.getTotalCount(), initialMud);

    // Track baseline excavated vs solid cells in cave system
    const initialSolidCount = terrain.getSolidCount();

    // Run 200 random ticks with various worker states
    for (let frame = 0; frame < 200; frame++) {
      colony.update(0.1);

      // Invariant check:
      // Available + Reserved must never exceed maxCapacity
      assert.ok(stockpile.getTotalCount() <= 64, 'Stockpile mud must never exceed max capacity');
      assert.ok(stockpile.getAvailableCount() >= 0, 'Available mud cannot be negative');
      assert.ok(stockpile.getReservedCount() >= 0, 'Reserved mud cannot be negative');

      // Worker mud payload checks
      for (const ant of colony.ants) {
        if (ant.mudPayload !== undefined) {
          assert.ok(ant.mudPayload >= 0 && ant.mudPayload <= 1, 'Worker payload must be 0 or 1');
          if (ant.carriedResource === 'MUD') {
            assert.equal(ant.mudPayload, 1);
          } else {
            assert.equal(ant.mudPayload, 0);
          }
        }
      }
    }

    // Verify terrain solid count plus excavated soil is conserved
    const currentSolidCount = terrain.getSolidCount();
    const excavatedCount = terrain.getExcavatedCount();
    assert.equal(currentSolidCount + excavatedCount, 75 * 32, 'Total terrain cell count must be conserved');
    assert.ok(currentSolidCount <= initialSolidCount + initialMud, 'Soil can only increase by deposited mud');
  });
});

describe('CHALLENGE 4: Stockpile Edge Cases & Security', () => {
  it('test_non_positive_reservation_and_withdrawal_rejection', () => {
    const stockpile = new ClayMudStockpile(64, 16);
    assert.equal(stockpile.reserve(0), false);
    assert.equal(stockpile.reserve(-5), false);
    assert.equal(stockpile.withdraw(0), false);
    assert.equal(stockpile.withdraw(-10), false);
    assert.equal(stockpile.deposit(0), false);
    assert.equal(stockpile.deposit(-1), false);

    assert.equal(stockpile.getAvailableCount(), 16);
    assert.equal(stockpile.getReservedCount(), 0);
  });

  it('test_stockpile_capacity_overflow_rejection', () => {
    const stockpile = new ClayMudStockpile(10, 8);
    // 8 + 3 = 11 > 10 (overflow)
    assert.equal(stockpile.deposit(3), false);
    assert.equal(stockpile.getAvailableCount(), 8);

    // 8 + 2 = 10 (exact max)
    assert.equal(stockpile.deposit(2), true);
    assert.equal(stockpile.getAvailableCount(), 10);
    assert.equal(stockpile.isFull(), true);

    // Any deposit on full stockpile fails
    assert.equal(stockpile.deposit(1), false);
  });

  it('test_stockpile_unreserve_clamp_safety', () => {
    const stockpile = new ClayMudStockpile(20, 10);
    stockpile.reserve(3);
    assert.equal(stockpile.getReservedCount(), 3);
    assert.equal(stockpile.getAvailableCount(), 7);

    // Unreserve more than reserved: should clamp to 3
    stockpile.unreserve(100);
    assert.equal(stockpile.getReservedCount(), 0, 'Reserved count must not drop below 0');
    assert.equal(stockpile.getAvailableCount(), 10, 'Available count must be restored');

    // Unreserve when 0 reserved: no-op
    stockpile.unreserve(5);
    assert.equal(stockpile.getReservedCount(), 0);
    assert.equal(stockpile.getAvailableCount(), 10);
  });
});
