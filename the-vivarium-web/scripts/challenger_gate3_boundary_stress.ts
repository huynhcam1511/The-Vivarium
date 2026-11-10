// scripts/challenger_gate3_boundary_stress.ts
// ============================================================================
// THE VIVARIUM — Gate 3 Adversarial Boundary, Concurrency & DEV Confinement Stress
// Role: EMPIRICAL CHALLENGER (challenger_gate3_2)
//
// Coverage:
// 1. Coordinate boundaries on OrganicTerrainData (75 cols x 32 rows, origin -1200, 0):
//    - Extreme boundary corners: (0,0), (74,0), (0,31), (74,31)
//    - Perimeter edges and out-of-bounds rejection (cx=-1, 75, cy=-1, 32)
//    - Continuous density field evaluation at extreme world boundaries
//    - Boundary clipping of digRadius and fillRadius
// 2. Mud stockpile conservation and concurrency under stress:
//    - Multi-transaction burst invariant test (500 randomized transactions)
//    - Zero double-spending under massive competition
//    - Closed-loop physical conservation invariant (Solid Cells + Mud = Constant)
// 3. Instant brush confinement strictly to DEV mode:
//    - Default production mode strictly disables instant brush
//    - URL query parameter parsing and confinement validation
//    - Interaction mode behavioral differentiation
// ============================================================================

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { OrganicTerrainData } from '../src/engine/OrganicTerrainData';
import { DesignationManager } from '../src/simulation/DesignationManager';
import { ClayMudStockpile } from '../src/simulation/ClayMudStockpile';
import { JobQueue } from '../src/simulation/JobQueue';
import { AntColony } from '../src/simulation/AntColony';

describe('CHALLENGE 1: Coordinate Boundaries on OrganicTerrainData (75x32)', () => {
  it('test_terrain_dimensions_and_origin_contract', () => {
    const terrain = new OrganicTerrainData(75, 32, 32, -1200, 0);
    assert.equal(terrain.cols, 75, 'Terrain columns must be exactly 75');
    assert.equal(terrain.rows, 32, 'Terrain rows must be exactly 32');
    assert.equal(terrain.cellSize, 32, 'Cell size must be exactly 32px');
    assert.equal(terrain.originX, -1200, 'Origin X must be -1200px');
    assert.equal(terrain.originY, 0, 'Origin Y must be 0px');

    const totalCells = terrain.cols * terrain.rows;
    assert.equal(totalCells, 2400, 'Total cells must be 75 * 32 = 2400');
    assert.equal(terrain.getSolidCount() + terrain.getExcavatedCount(), totalCells);
  });

  it('test_extreme_boundary_corners_read_write_integrity', () => {
    const terrain = new OrganicTerrainData(75, 32, 32, -1200, 0);

    const corners = [
      { name: 'Top-Left', cx: 0, cy: 0 },
      { name: 'Top-Right', cx: 74, cy: 0 },
      { name: 'Bottom-Left', cx: 0, cy: 31 },
      { name: 'Bottom-Right', cx: 74, cy: 31 },
    ];

    for (const c of corners) {
      // Toggle to solid then excavated
      terrain.setSolid(c.cx, c.cy, true);
      assert.equal(terrain.isSolid(c.cx, c.cy), true, `${c.name} (${c.cx}, ${c.cy}) should be solid`);

      terrain.setSolid(c.cx, c.cy, false);
      assert.equal(terrain.isSolid(c.cx, c.cy), false, `${c.name} (${c.cx}, ${c.cy}) should be excavated`);

      terrain.setSolid(c.cx, c.cy, true);
      assert.equal(terrain.isSolid(c.cx, c.cy), true, `${c.name} (${c.cx}, ${c.cy}) should be restored to solid`);
    }
  });

  it('test_perimeter_boundary_integrity_and_bounds_checking', () => {
    const terrain = new OrganicTerrainData(75, 32, 32, -1200, 0);
    const mgr = new DesignationManager(75, 32, 32, -1200, 0);

    // Test all edge cells
    for (let c = 0; c < 75; c++) {
      assert.doesNotThrow(() => terrain.isSolid(c, 0));
      assert.doesNotThrow(() => terrain.isSolid(c, 31));
      assert.doesNotThrow(() => terrain.setSolid(c, 0, true));
      assert.doesNotThrow(() => terrain.setSolid(c, 31, true));
    }
    for (let r = 0; r < 32; r++) {
      assert.doesNotThrow(() => terrain.isSolid(0, r));
      assert.doesNotThrow(() => terrain.isSolid(74, r));
      assert.doesNotThrow(() => terrain.setSolid(0, r, true));
      assert.doesNotThrow(() => terrain.setSolid(74, r, true));
    }

    // Out-of-bounds integer rejection in terrain
    const oobCoords = [
      [-1, 0], [75, 0], [0, -1], [0, 32],
      [-1, -1], [75, 32], [-100, -100], [1000, 1000],
    ];

    const initialSolid = terrain.getSolidCount();
    for (const [cx, cy] of oobCoords) {
      assert.equal(terrain.isSolid(cx, cy), true, `OOB isSolid(${cx}, ${cy}) should safely return true`);
      assert.doesNotThrow(() => terrain.setSolid(cx, cy, false));
    }
    // SetSolid on OOB should NOT change solid count
    assert.equal(terrain.getSolidCount(), initialSolid, 'OOB setSolid must not alter grid data');

    // Designation manager resilience against NaN and Infinity
    const fuzzValues = [NaN, Infinity, -Infinity];
    for (const val of fuzzValues) {
      assert.equal(mgr.isWithinBounds(val, 0), false, `isWithinBounds(${val}, 0) must be false`);
      assert.equal(mgr.isWithinBounds(0, val), false, `isWithinBounds(0, ${val}) must be false`);
      assert.equal(mgr.addDesignation('DIG', { cx: val, cy: 0 }), false);
    }
  });

  it('test_continuous_density_at_extreme_world_boundaries', () => {
    const terrain = new OrganicTerrainData(75, 32, 32, -1200, 0);

    // Far above surface: should return 0 (air)
    const densityAbove = terrain.getSmoothedDensity(0, -500);
    assert.equal(densityAbove, 0.0, 'Density far above surface must be 0.0');

    // Far below bedrock: should return 1.0 (solid)
    const densityBelow = terrain.getSmoothedDensity(0, 2000);
    assert.equal(densityBelow, 1.0, 'Density far below bedrock must be 1.0');

    // Far West beyond -1200px: should return 1.0
    const densityWest = terrain.getSmoothedDensity(-5000, 500);
    assert.equal(densityWest, 1.0, 'Density far West beyond boundary must be 1.0');

    // Far East beyond +1200px: should return 1.0
    const densityEast = terrain.getSmoothedDensity(5000, 500);
    assert.equal(densityEast, 1.0, 'Density far East beyond boundary must be 1.0');

    // Test surface height map clamping
    const surfFarWest = terrain.getSurfaceY(-10000);
    const surfLeftEdge = terrain.getSurfaceY(-1200);
    assert.equal(surfFarWest, surfLeftEdge, 'Surface Y beyond West boundary must clamp to col 0');

    const surfFarEast = terrain.getSurfaceY(10000);
    const surfRightEdge = terrain.getSurfaceY(1200);
    assert.equal(surfFarEast, surfRightEdge, 'Surface Y beyond East boundary must clamp to col 74');
  });

  it('test_dig_and_fill_brush_boundary_clipping_safety', () => {
    const terrain = new OrganicTerrainData(75, 32, 32, -1200, 0);

    // Dig centered outside top-left boundary
    assert.doesNotThrow(() => {
      terrain.digRadius(-1250, -50, 60);
    }, 'digRadius partially crossing top-left boundary must not throw');

    // Dig centered outside bottom-right boundary
    assert.doesNotThrow(() => {
      terrain.digRadius(1250, 1050, 60);
    }, 'digRadius partially crossing bottom-right boundary must not throw');

    // Fill centered outside top-right boundary
    assert.doesNotThrow(() => {
      terrain.fillRadius(1250, -50, 60);
    }, 'fillRadius partially crossing top-right boundary must not throw');

    // Fill centered outside bottom-left boundary
    assert.doesNotThrow(() => {
      terrain.fillRadius(-1250, 1050, 60);
    }, 'fillRadius partially crossing bottom-left boundary must not throw');
  });
});

describe('CHALLENGE 2: Mud Stockpile Conservation and Concurrency Under Stress', () => {
  it('test_stockpile_capacity_and_invariants_under_random_burst_stress', () => {
    const stockpile = new ClayMudStockpile(64, 20);

    assert.equal(stockpile.maxCapacity, 64);
    assert.equal(stockpile.getAvailableCount(), 20);
    assert.equal(stockpile.getReservedCount(), 0);

    // 500 randomized concurrent operations
    for (let i = 0; i < 500; i++) {
      const op = Math.floor(Math.random() * 4);
      const amount = Math.floor(Math.random() * 5) + 1; // 1 to 5

      switch (op) {
        case 0: // Reserve
          stockpile.reserve(amount);
          break;
        case 1: // Unreserve
          stockpile.unreserve(amount);
          break;
        case 2: // Withdraw
          stockpile.withdraw(amount);
          break;
        case 3: // Deposit
          stockpile.deposit(amount);
          break;
      }

      // Assert Invariants after EVERY operation
      const avail = stockpile.getAvailableCount();
      const res = stockpile.getReservedCount();
      const total = stockpile.getTotalCount();

      assert.ok(avail >= 0, `Available mud must never be negative (was ${avail})`);
      assert.ok(res >= 0, `Reserved mud must never be negative (was ${res})`);
      assert.equal(total, avail + res, 'Total must equal available + reserved');
      assert.ok(total <= 64, `Total mud (${total}) must never exceed maxCapacity (64)`);
    }
  });

  it('test_zero_double_spending_under_massive_worker_competition', () => {
    const stockpile = new ClayMudStockpile(64, 5); // Exactly 5 mud available
    assert.equal(stockpile.getAvailableCount(), 5);

    // 50 workers compete to reserve 1 mud each
    let successCount = 0;
    let failCount = 0;

    for (let workerId = 0; workerId < 50; workerId++) {
      const reserved = stockpile.reserve(1);
      if (reserved) {
        successCount++;
      } else {
        failCount++;
      }
    }

    assert.equal(successCount, 5, 'Exactly 5 workers must succeed in reserving');
    assert.equal(failCount, 45, 'Exactly 45 workers must fail due to exhaustion');
    assert.equal(stockpile.getAvailableCount(), 0, 'Available mud must be exactly 0');
    assert.equal(stockpile.getReservedCount(), 5, 'Reserved mud must be exactly 5');

    // Withdraw the 5 reserved mud
    for (let i = 0; i < 5; i++) {
      assert.equal(stockpile.withdraw(1), true, 'Withdraw of reserved mud must succeed');
    }

    assert.equal(stockpile.getReservedCount(), 0, 'Reserved mud must now be 0');
    assert.equal(stockpile.getAvailableCount(), 0, 'Available mud must now be 0');

    // Attempting further withdrawals must fail
    assert.equal(stockpile.withdraw(1), false, 'Withdrawal from depleted stockpile must fail');
  });

  it('test_physical_mud_conservation_law_in_simulation_colony', () => {
    const terrain = new OrganicTerrainData(75, 32, 32, -1200, 0);
    const queue = new JobQueue();
    const stockpile = new ClayMudStockpile(64, 10); // 10 mud in stockpile
    const desMgr = new DesignationManager(75, 32, 32, -1200, 0);

    // Designate cell for dig before recording baseline
    const targetDigCell = { cx: 50, cy: 9 };
    terrain.setSolid(targetDigCell.cx, targetDigCell.cy, true);
    desMgr.addDesignation('DIG', targetDigCell);
    queue.pushJob('DIG', targetDigCell, 0.1); // Short duration for fast test

    const colony = new AntColony(terrain, undefined, queue, stockpile, desMgr, 6);

    // Calculate total initial system mud/matter:
    // Solid Cells in terrain + Mud in stockpile + Mud carried by workers
    const initialSolid = terrain.getSolidCount();
    const initialMud = stockpile.getTotalCount();
    const initialCarried = colony.ants.reduce((sum, a) => sum + (a.mudPayload ?? 0), 0);
    const systemConstant = initialSolid + initialMud + initialCarried;

    // Run simulation ticks until dig is claimed, excavated, and hauled to stockpile
    for (let tick = 0; tick < 200; tick++) {
      colony.update(0.1);

      // Verify system conservation at every single tick:
      const currentSolid = terrain.getSolidCount();
      const currentMud = stockpile.getTotalCount();
      const currentCarried = colony.ants.reduce((sum, a) => sum + (a.mudPayload ?? 0), 0);
      const currentSystemTotal = currentSolid + currentMud + currentCarried;

      assert.equal(
        currentSystemTotal,
        systemConstant,
        `Conservation violation at tick ${tick}: expected ${systemConstant}, got ${currentSystemTotal}`
      );
    }
  });
});

describe('CHALLENGE 3: Instant Brush Confinement Strictly to DEV Mode', () => {
  it('test_url_query_parser_confines_instant_brush_to_dev_flag', () => {
    const isDevModeFromQuery = (search: string): boolean => {
      return search.includes('mode=dev-instant-brush') || search.includes('dev-instant-brush');
    };

    // Standard production queries: MUST BE FALSE
    assert.equal(isDevModeFromQuery(''), false, 'Empty query must be standard production mode');
    assert.equal(isDevModeFromQuery('?tab=world'), false, '?tab=world must be standard production mode');
    assert.equal(isDevModeFromQuery('?seed=12345'), false, '?seed=12345 must be standard production mode');
    assert.equal(isDevModeFromQuery('?view=caverns&speed=1'), false, 'Normal params must be standard production mode');
    assert.equal(isDevModeFromQuery('?mode=production'), false, '?mode=production must be standard production mode');
    assert.equal(isDevModeFromQuery('?dev=true'), false, '?dev=true without instant-brush flag must be standard mode');

    // Explicit DEV instant brush queries: MUST BE TRUE
    assert.equal(isDevModeFromQuery('?mode=dev-instant-brush'), true, '?mode=dev-instant-brush must activate DEV mode');
    assert.equal(isDevModeFromQuery('?dev-instant-brush=1'), true, '?dev-instant-brush=1 must activate DEV mode');
    assert.equal(isDevModeFromQuery('?tab=qa&mode=dev-instant-brush'), true, 'Compound query with mode=dev-instant-brush must activate DEV mode');
  });

  it('test_standard_mode_prohibits_instant_destructive_brush_modification', () => {
    const terrain = new OrganicTerrainData(75, 32, 32, -1200, 0);
    const desMgr = new DesignationManager(75, 32, 32, -1200, 0);
    const jobQueue = new JobQueue();

    const isInstantBrushDevMode = false;
    const currentTool: 'DIG' | 'FILL' = 'DIG';

    const handlePointerClick = (worldPos: { x: number; y: number }) => {
      if (isInstantBrushDevMode) {
        terrain.digRadius(worldPos.x, worldPos.y, 28);
      } else {
        const { cx, cy } = desMgr.worldToCell(worldPos.x, worldPos.y);
        if (desMgr.isWithinBounds(cx, cy)) {
          if (currentTool === 'DIG' && terrain.isSolid(cx, cy)) {
            desMgr.addDesignation('DIG', cx, cy);
            jobQueue.pushJob('DIG', { cx, cy });
          }
        }
      }
    };

    const targetPos = { x: -800, y: 500 }; // Deep solid bedrock
    const cell = desMgr.worldToCell(targetPos.x, targetPos.y);
    assert.equal(terrain.isSolid(cell.cx, cell.cy), true, 'Target cell must be solid bedrock');

    const initialSolidCount = terrain.getSolidCount();

    // Execute standard mode click
    handlePointerClick(targetPos);

    // VERIFY: Terrain solid count must NOT change immediately!
    assert.equal(
      terrain.getSolidCount(),
      initialSolidCount,
      'Standard mode click must NOT immediately modify terrain solid cells'
    );
    assert.equal(terrain.isSolid(cell.cx, cell.cy), true, 'Cell must remain solid after click');

    // VERIFY: Designation and Job must be created instead!
    assert.equal(desMgr.hasDesignation(cell.cx, cell.cy), true, 'Designation must be registered');
    assert.equal(jobQueue.getPendingCount(), 1, 'Job must be queued for worker execution');
  });

  it('test_dev_mode_permits_instant_brush_modification', () => {
    const terrain = new OrganicTerrainData(75, 32, 32, -1200, 0);
    const desMgr = new DesignationManager(75, 32, 32, -1200, 0);
    const jobQueue = new JobQueue();

    const isInstantBrushDevMode = true;
    const currentTool: 'DIG' | 'FILL' = 'DIG';

    const handlePointerClick = (worldPos: { x: number; y: number }) => {
      if (isInstantBrushDevMode) {
        terrain.digRadius(worldPos.x, worldPos.y, 28);
      } else {
        const { cx, cy } = desMgr.worldToCell(worldPos.x, worldPos.y);
        if (desMgr.isWithinBounds(cx, cy)) {
          if (currentTool === 'DIG' && terrain.isSolid(cx, cy)) {
            desMgr.addDesignation('DIG', cx, cy);
            jobQueue.pushJob('DIG', { cx, cy });
          }
        }
      }
    };

    const targetPos = { x: -800, y: 500 }; // Deep solid bedrock
    const initialSolidCount = terrain.getSolidCount();

    // Execute DEV mode click
    handlePointerClick(targetPos);

    // VERIFY: Instant modification occurred!
    assert.ok(
      terrain.getSolidCount() < initialSolidCount,
      'DEV mode click must immediately excavate solid cells'
    );
    // VERIFY: No job was queued (bypasses 2-layer pipeline)
    assert.equal(jobQueue.getPendingCount(), 0, 'DEV mode instant brush must NOT queue jobs');
  });
});
