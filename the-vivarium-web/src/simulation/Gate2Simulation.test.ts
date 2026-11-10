// src/simulation/Gate2Simulation.test.ts
// ============================================================================
// THE VIVARIUM — Gate 2 Dig/Fill Worker MVP Comprehensive Unit Test Suite
// Covers DesignationManager, ClayMudStockpile, JobQueue, TerrainPathfinder, AntColony
// ============================================================================

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { DesignationManager } from './DesignationManager';
import { ClayMudStockpile } from './ClayMudStockpile';
import { JobQueue } from './JobQueue';
import { TerrainPathfinder } from './TerrainPathfinder';
import { OrganicTerrainData } from '../engine/OrganicTerrainData';
import { AntColony } from './AntColony';

describe('Gate 2: DesignationManager Specification & Boundary Testing', () => {
  it('test_designation_manager_add_within_bounds_succeeds', () => {
    const mgr = new DesignationManager(75, 32, 32, -1200, 0);
    const added = mgr.addDesignation('DIG', { cx: 20, cy: 15 });
    assert.equal(added, true);
    assert.equal(mgr.hasDesignation({ cx: 20, cy: 15 }), true);
    assert.equal(mgr.getPendingCount(), 1);

    const des = mgr.getDesignation({ cx: 20, cy: 15 });
    assert.ok(des);
    assert.equal(des.type, 'DIG');
    assert.equal(des.status, 'PENDING');
    assert.equal(des.assignedWorkerId, null);
  });

  it('test_designation_manager_add_out_of_bounds_returns_false', () => {
    const mgr = new DesignationManager(75, 32, 32, -1200, 0);
    assert.equal(mgr.addDesignation('DIG', { cx: -1, cy: 10 }), false);
    assert.equal(mgr.addDesignation('DIG', { cx: 75, cy: 10 }), false);
    assert.equal(mgr.addDesignation('DIG', { cx: 10, cy: -1 }), false);
    assert.equal(mgr.addDesignation('DIG', { cx: 10, cy: 32 }), false);
    assert.equal(mgr.getPendingCount(), 0);
  });

  it('test_designation_manager_overwrite_existing_cell_updates_type_and_resets_status', () => {
    const mgr = new DesignationManager();
    mgr.addDesignation('DIG', { cx: 10, cy: 10 });
    mgr.assignWorker(10, 10, 'worker-1');
    assert.equal(mgr.getDesignation({ cx: 10, cy: 10 })?.status, 'IN_PROGRESS');

    // Overwrite with FILL
    const overwrote = mgr.addDesignation('FILL', { cx: 10, cy: 10 });
    assert.equal(overwrote, true);
    const des = mgr.getDesignation({ cx: 10, cy: 10 });
    assert.equal(des?.type, 'FILL');
    assert.equal(des?.status, 'PENDING');
    assert.equal(des?.assignedWorkerId, null);
  });

  it('test_designation_manager_remove_existing_and_non_existent', () => {
    const mgr = new DesignationManager();
    mgr.addDesignation('DIG', { cx: 5, cy: 5 });
    assert.equal(mgr.removeDesignation({ cx: 5, cy: 5 }), true);
    assert.equal(mgr.hasDesignation({ cx: 5, cy: 5 }), false);
    assert.equal(mgr.removeDesignation({ cx: 5, cy: 5 }), false);
  });

  it('test_designation_manager_highlight_box_geometry_and_stroke_dash', () => {
    const mgr = new DesignationManager(75, 32, 32, -1200, 0);
    const box = mgr.getHighlightBox({ cx: 10, cy: 5 });
    assert.equal(box.x, -1200 + 10 * 32);
    assert.equal(box.y, 5 * 32);
    assert.equal(box.width, 32);
    assert.equal(box.height, 32);
    assert.deepEqual(box.strokeDash, [4, 4]);
  });

  it('test_designation_manager_world_to_cell_and_cell_to_world_conversions', () => {
    const mgr = new DesignationManager(75, 32, 32, -1200, 0);
    const cell = mgr.worldToCell(-1200 + 16, 16);
    assert.equal(cell.cx, 0);
    assert.equal(cell.cy, 0);

    const center = mgr.cellToWorldCenter(10, 5);
    assert.equal(center.wx, -1200 + 10 * 32 + 16);
    assert.equal(center.wy, 5 * 32 + 16);
  });
});

describe('Gate 2: ClayMudStockpile Finite Inventory & Concurrency', () => {
  it('test_stockpile_initial_capacity_and_available', () => {
    const stockpile = new ClayMudStockpile(64, 16);
    assert.equal(stockpile.maxCapacity, 64);
    assert.equal(stockpile.getAvailableCount(), 16);
    assert.equal(stockpile.getReservedCount(), 0);
    assert.equal(stockpile.getTotalCount(), 16);
    assert.equal(stockpile.isFull(), false);
    assert.equal(stockpile.isEmpty(), false);
  });

  it('test_stockpile_reserve_success_and_insufficient_stock_failure', () => {
    const stockpile = new ClayMudStockpile(10, 2);
    assert.equal(stockpile.reserve(1), true);
    assert.equal(stockpile.getAvailableCount(), 1);
    assert.equal(stockpile.getReservedCount(), 1);

    assert.equal(stockpile.reserve(1), true);
    assert.equal(stockpile.getAvailableCount(), 0);
    assert.equal(stockpile.getReservedCount(), 2);

    // Starvation attempt
    assert.equal(stockpile.reserve(1), false);
    assert.equal(stockpile.getAvailableCount(), 0);
    assert.equal(stockpile.getReservedCount(), 2);
  });

  it('test_stockpile_unreserve_returns_stock_to_available', () => {
    const stockpile = new ClayMudStockpile(10, 2);
    stockpile.reserve(2);
    assert.equal(stockpile.getAvailableCount(), 0);
    assert.equal(stockpile.getReservedCount(), 2);

    stockpile.unreserve(1);
    assert.equal(stockpile.getAvailableCount(), 1);
    assert.equal(stockpile.getReservedCount(), 1);
  });

  it('test_stockpile_withdraw_from_reserved_and_available', () => {
    const stockpile = new ClayMudStockpile(10, 5);
    stockpile.reserve(2);
    // Withdraw should consume reserved first
    assert.equal(stockpile.withdraw(1), true);
    assert.equal(stockpile.getReservedCount(), 1);
    assert.equal(stockpile.getAvailableCount(), 3);

    assert.equal(stockpile.withdraw(1), true);
    assert.equal(stockpile.getReservedCount(), 0);

    // Fallback: withdraw from available
    assert.equal(stockpile.withdraw(1), true);
    assert.equal(stockpile.getAvailableCount(), 2);
  });

  it('test_stockpile_deposit_increments_available_and_respects_max_capacity', () => {
    const stockpile = new ClayMudStockpile(5, 4);
    assert.equal(stockpile.deposit(1), true);
    assert.equal(stockpile.getAvailableCount(), 5);
    assert.equal(stockpile.isFull(), true);

    // Overflow attempt
    assert.equal(stockpile.deposit(1), false);
    assert.equal(stockpile.getAvailableCount(), 5);
  });

  it('test_stockpile_subscribe_notifies_listeners_on_mutations', () => {
    const stockpile = new ClayMudStockpile(10, 5);
    let notifyCount = 0;
    const unsubscribe = stockpile.subscribe(() => {
      notifyCount++;
    });

    stockpile.reserve(1);
    stockpile.withdraw(1);
    stockpile.deposit(1);
    assert.equal(notifyCount, 3);

    unsubscribe();
    stockpile.deposit(1);
    assert.equal(notifyCount, 3);
  });
});

describe('Gate 2: JobQueue Order Management & Mutual Exclusion', () => {
  it('test_job_queue_push_deduplicates_by_cell', () => {
    const queue = new JobQueue();
    const job1 = queue.pushJob('DIG', { cx: 12, cy: 8 });
    const job2 = queue.pushJob('DIG', { cx: 12, cy: 8 });
    assert.equal(job1.id, job2.id);
    assert.equal(queue.getPendingCount(), 1);
  });

  it('test_job_queue_pop_selects_closest_job_to_worker', () => {
    const queue = new JobQueue();
    queue.pushJob('DIG', { cx: 10, cy: 10 });
    queue.pushJob('DIG', { cx: 20, cy: 20 });

    const popped = queue.popJob({ x: 9 * 32, y: 9 * 32 });
    assert.ok(popped);
    assert.equal(popped.cell.cx, 10);
    assert.equal(popped.status, 'IN_PROGRESS');
  });

  it('test_job_queue_claim_nearest_skips_fill_jobs_when_starved', () => {
    const queue = new JobQueue();
    queue.pushJob('FILL', { cx: 10, cy: 10 });

    // When isFillAllowed is false, cannot claim FILL job
    const claimedStarved = queue.claimNearestJob({ x: 0, y: 0 }, 'worker-1', false);
    assert.equal(claimedStarved, null);

    // When isFillAllowed is true, claim succeeds
    const claimed = queue.claimNearestJob({ x: 0, y: 0 }, 'worker-1', true);
    assert.ok(claimed);
    assert.equal(claimed.type, 'FILL');
    assert.equal(claimed.status, 'IN_PROGRESS');
    assert.equal(claimed.assignedWorkerId, 'worker-1');
  });

  it('test_job_queue_cancel_job_by_id_and_cell', () => {
    const queue = new JobQueue();
    const j1 = queue.pushJob('DIG', { cx: 10, cy: 10 });
    queue.pushJob('DIG', { cx: 20, cy: 20 });

    assert.equal(queue.cancelJob(j1.id), true);
    assert.equal(j1.status, 'CANCELLED');

    assert.equal(queue.cancelJobByCell(20, 20), true);
    assert.equal(queue.getPendingCount(), 0);
  });
});

describe('Gate 2: TerrainPathfinder 4-Directional A* on Organic Terrain', () => {
  it('test_pathfinder_walkable_cells_on_organic_terrain', () => {
    const terrain = new OrganicTerrainData();
    terrain.carveTestCaveSystem();
    const pathfinder = new TerrainPathfinder(terrain);

    // Central living chamber (cx=50, cy=10) is carved cavity
    assert.equal(pathfinder.isWalkable(50, 10), true);

    // Deep unexcavated bedrock is solid
    assert.equal(pathfinder.isWalkable(10, 30), false);
  });

  it('test_pathfinder_finds_orthogonal_4dir_path_between_caverns', () => {
    const terrain = new OrganicTerrainData();
    terrain.carveTestCaveSystem();
    const pathfinder = new TerrainPathfinder(terrain);

    // Surface shaft entry (cx=46, cy=1) to living chamber (cx=50, cy=10)
    const path = pathfinder.findPath({ cx: 46, cy: 1 }, { cx: 50, cy: 10 });
    assert.ok(path);
    assert.ok(path.length > 1);
    assert.deepEqual(path[0], { cx: 46, cy: 1 });
    assert.deepEqual(path[path.length - 1], { cx: 50, cy: 10 });

    // Verify all steps are cardinal (distance = 1)
    for (let i = 0; i < path.length - 1; i++) {
      const dx = Math.abs(path[i + 1].cx - path[i].cx);
      const dy = Math.abs(path[i + 1].cy - path[i].cy);
      assert.equal(dx + dy, 1, `Step ${i} to ${i + 1} must be cardinal`);
    }
  });

  it('test_pathfinder_returns_null_when_target_is_solid', () => {
    const terrain = new OrganicTerrainData();
    const pathfinder = new TerrainPathfinder(terrain);
    // Whole terrain starts solid
    const path = pathfinder.findPath({ cx: 10, cy: 10 }, { cx: 20, cy: 20 });
    assert.equal(path, null);
  });

  it('test_pathfinder_find_walkable_adjacent_returns_neighbor', () => {
    const terrain = new OrganicTerrainData();
    terrain.setSolid(15, 10, false); // only 15,10 is hollow
    const pathfinder = new TerrainPathfinder(terrain);

    // Solid target at (15, 11) should find walkable neighbor at (15, 10)
    const adj = pathfinder.findWalkableAdjacent({ cx: 15, cy: 11 });
    assert.ok(adj);
    assert.deepEqual(adj, { cx: 15, cy: 10 });
  });
});

describe('Gate 2: AntColony Worker State Machine Simulation Loops', () => {
  it('test_ant_colony_initializes_with_queen_and_workers', () => {
    const terrain = new OrganicTerrainData();
    terrain.carveTestCaveSystem();
    const pathfinder = new TerrainPathfinder(terrain);
    const jobQueue = new JobQueue();
    const stockpile = new ClayMudStockpile(64, 16);
    const designationMgr = new DesignationManager();

    const colony = new AntColony(terrain, pathfinder, jobQueue, stockpile, designationMgr, 8);
    assert.equal(colony.ants.length, 9); // 1 Queen + 8 Workers
    assert.equal(colony.ants[0].type, 'QUEEN');
    assert.equal(colony.ants[1].type, 'WORKER');
  });

  it('test_ant_colony_executes_digging_loop_and_triggers_remesh_callback', () => {
    const terrain = new OrganicTerrainData();
    terrain.carveTestCaveSystem();
    const pathfinder = new TerrainPathfinder(terrain);
    const jobQueue = new JobQueue();
    const stockpile = new ClayMudStockpile(64, 16);
    const designationMgr = new DesignationManager();

    const colony = new AntColony(terrain, pathfinder, jobQueue, stockpile, designationMgr, 1);
    const worker = colony.ants[1];

    // Position worker at living chamber (cx=50, cy=10)
    const pos = colony.cellToWorldCenter({ cx: 50, cy: 10 });
    worker.position = { ...pos };
    worker.state = 'IDLE';

    // Designate solid cell right next to living chamber: cx=50, cy=9
    terrain.setSolid(50, 9, true);
    designationMgr.addDesignation('DIG', { cx: 50, cy: 9 });
    jobQueue.pushJob('DIG', { cx: 50, cy: 9 }, 0.5); // fast duration for unit test

    // Tick 1: worker claims job and transitions to MOVING_TO_JOB or DIGGING
    let remeshTriggered = false;
    colony.update(0.1, () => {
      remeshTriggered = true;
    });

    assert.ok(worker.state === 'MOVING_TO_JOB' || worker.state === 'DIGGING');
    assert.equal(worker.targetJobCell?.cx, 50);
    assert.equal(worker.targetJobCell?.cy, 9);

    // Fast-forward worker to DIGGING at destination
    worker.path = [];
    worker.pathIndex = 0;
    worker.state = 'DIGGING';
    worker.jobTimer = 0.6; // exceeds duration 0.5

    // Tick 2: completes dig, updates terrain to hollow, triggers remesh, picks up mud
    colony.update(0.1, () => {
      remeshTriggered = true;
    });

    assert.equal(terrain.isSolid(50, 9), false, 'Cell must be excavated to false');
    assert.equal(remeshTriggered, true, 'Remesh callback must be triggered');
    assert.equal(worker.carriedResource, 'MUD');
    assert.equal(worker.mudPayload, 1);
    assert.equal(worker.state, 'HAULING_MUD');
  });

  it('test_ant_colony_executes_backfill_loop_with_stockpile_withdrawal', () => {
    const terrain = new OrganicTerrainData();
    terrain.carveTestCaveSystem();
    const pathfinder = new TerrainPathfinder(terrain);
    const jobQueue = new JobQueue();
    const stockpile = new ClayMudStockpile(64, 16);
    const designationMgr = new DesignationManager();

    const colony = new AntColony(terrain, pathfinder, jobQueue, stockpile, designationMgr, 1);
    const worker = colony.ants[1];

    // Carve a void at (50, 9)
    terrain.setSolid(50, 9, false);

    // Designate backfill
    designationMgr.addDesignation('FILL', { cx: 50, cy: 9 });
    jobQueue.pushJob('FILL', { cx: 50, cy: 9 }, 0.5);

    // Position worker at living chamber
    worker.position = colony.cellToWorldCenter({ cx: 50, cy: 10 });
    worker.state = 'IDLE';

    // Tick: claims fill job and reserves mud from stockpile
    colony.update(0.1);
    assert.equal(stockpile.getReservedCount(), 1);
    assert.equal(worker.state, 'MOVING_TO_STOCKPILE');

    // Simulate arrival at stockpile waypoint
    worker.position = colony.cellToWorldCenter(stockpile.pickupWaypoint);
    worker.path = [stockpile.pickupWaypoint];
    worker.pathIndex = 0;
    colony.update(0.1);

    // Withdrew mud, hauling to backfill site
    assert.equal(worker.carriedResource, 'MUD');
    assert.equal(worker.mudPayload, 1);

    // Simulate arrival at backfill adjacent site and working
    worker.path = [];
    worker.pathIndex = 0;
    worker.state = 'BACKFILLING';
    worker.targetJobCell = { cx: 50, cy: 9 };
    worker.jobTimer = 0.6; // exceeds duration 0.5

    let remeshTriggered = false;
    colony.update(0.1, () => {
      remeshTriggered = true;
    });

    assert.equal(terrain.isSolid(50, 9), true, 'Cell must be backfilled to solid');
    assert.equal(remeshTriggered, true, 'Remesh callback must be triggered');
    assert.equal(worker.carriedResource, null);
    assert.equal(worker.mudPayload, 0);
    assert.equal(worker.state, 'IDLE');
  });
});
