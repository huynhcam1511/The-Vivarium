// GAME/the-vivarium-web/scripts/challenger_gate2_empirical_harness.mjs
// ============================================================================
// THE VIVARIUM — Gate 2 Dig/Fill Worker MVP Empirical Challenge Test Harness
// Adversarial validation of excavation timings, progress bars, finite hauling,
// DEV mode brush confinement, and concurrency stress scenarios.
// ============================================================================

import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Domain imports from the-vivarium-web
import { OrganicTerrainData } from '../src/engine/OrganicTerrainData.js';
import { DesignationManager } from '../src/simulation/DesignationManager.js';
import { ClayMudStockpile } from '../src/simulation/ClayMudStockpile.js';
import { JobQueue } from '../src/simulation/JobQueue.js';
import { TerrainPathfinder } from '../src/simulation/TerrainPathfinder.js';
import { AntColony } from '../src/simulation/AntColony.js';
import { AntPlaceholderView } from '../src/rendering/AntPlaceholderView.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const webRoot = path.resolve(__dirname, '..');

console.log('------------------------------------------------------------');
console.log('CHALLENGER GATE 2 EMPIRICAL HARNESS STARTING');
console.log('Target: Gate 2 Dig/Fill Worker MVP');
console.log('Web Root:', webRoot);
console.log('------------------------------------------------------------');

// ============================================================================
// SUITE 1: DIG TIMINGS SPECIFICATION & DEPTH VARIANCE (3.0s - 5.0s)
// ============================================================================
test('SUITE 1.1: Dig Duration Calculation Across All 32 Grid Depths is Strictly [3.0, 5.0]s', () => {
  const queue = new JobQueue();

  // Test across all 32 subterranean row depths (cy = 0 to 31)
  for (let cy = 0; cy < 32; cy++) {
    const job = queue.pushJob('DIG', { cx: 20, cy });
    assert.ok(
      job.workDuration >= 3.0 && job.workDuration <= 5.0,
      `Row cy=${cy} dig duration (${job.workDuration}s) must be in [3.0, 5.0]s`
    );

    // Verify depth stratification
    if (cy < 10) {
      assert.equal(job.workDuration, 3.5, `Shallow depth cy=${cy} must be 3.5s`);
    } else if (cy < 20) {
      assert.equal(job.workDuration, 4.2, `Mid depth cy=${cy} must be 4.2s`);
    } else {
      assert.equal(job.workDuration, 5.0, `Deep bedrock cy=${cy} must be 5.0s`);
    }
  }
});

test('SUITE 1.2: End-to-End Timed Excavation Simulation at Shallow Depth (cy=9, duration=3.5s)', () => {
  const terrain = new OrganicTerrainData();
  terrain.carveTestCaveSystem();
  const pathfinder = new TerrainPathfinder(terrain);
  const queue = new JobQueue();
  const stockpile = new ClayMudStockpile(64, 16);
  const designationMgr = new DesignationManager();

  const colony = new AntColony(terrain, pathfinder, queue, stockpile, designationMgr, 1);
  const worker = colony.ants[1];

  // Position worker in living chamber at cx=50, cy=10
  worker.position = colony.cellToWorldCenter({ cx: 50, cy: 10 });
  worker.state = 'IDLE';

  // Target solid cell adjacent to worker at cx=50, cy=9 (cy < 10 -> duration = 3.5s)
  terrain.setSolid(50, 9, true);
  designationMgr.addDesignation('DIG', { cx: 50, cy: 9 });
  queue.pushJob('DIG', { cx: 50, cy: 9 }); // Uses default calculateDigDuration(9) = 3.5s

  // Step 1: Worker claims job
  colony.update(0.05);
  assert.equal(worker.targetJobCell?.cx, 50);
  assert.equal(worker.targetJobCell?.cy, 9);
  assert.equal(worker.jobDuration, 3.5, 'Job duration must be exactly 3.5s');

  // Fast forward movement to neighbor cell and start DIGGING
  worker.path = [];
  worker.pathIndex = 0;
  worker.state = 'DIGGING';
  worker.jobTimer = 0;

  // Step 2: Simulate excavation time progression in 0.1s steps
  let simulatedTime = 0;
  while (simulatedTime < 3.4) {
    colony.update(0.1);
    simulatedTime += 0.1;
    // At all times before 3.5s, the cell MUST REMAIN SOLID!
    assert.equal(
      terrain.isSolid(50, 9),
      true,
      `At t=${simulatedTime.toFixed(1)}s (<3.5s), cell must remain solid`
    );
    assert.equal(worker.state, 'DIGGING', `At t=${simulatedTime.toFixed(1)}s, worker must still be DIGGING`);
  }

  // Step 3: Advance past 3.5s boundary
  colony.update(0.15); // simulatedTime reaches 3.55s
  assert.equal(terrain.isSolid(50, 9), false, 'At t >= 3.5s, cell must be excavated to false');
  assert.equal(worker.state, 'HAULING_MUD', 'Worker must transition to HAULING_MUD');
  assert.equal(worker.mudPayload, 1, 'Worker must carry 1 mud payload');
});

test('SUITE 1.3: End-to-End Timed Excavation Simulation at Deep Bedrock (cy=22, duration=5.0s)', () => {
  const terrain = new OrganicTerrainData();
  terrain.carveTestCaveSystem();

  // Carve a vertical shaft from Royal Chamber (cx=57, cy=14) down to deep bedrock at cy=21
  for (let y = 14; y <= 21; y++) {
    terrain.setSolid(57, y, false);
  }
  // Deep bedrock target at (57, 22)
  terrain.setSolid(57, 22, true);

  const pathfinder = new TerrainPathfinder(terrain);
  const queue = new JobQueue();
  const stockpile = new ClayMudStockpile(64, 16);
  const designationMgr = new DesignationManager();

  const colony = new AntColony(terrain, pathfinder, queue, stockpile, designationMgr, 1);
  const worker = colony.ants[1];
  worker.position = colony.cellToWorldCenter({ cx: 57, cy: 21 });
  worker.state = 'IDLE';

  designationMgr.addDesignation('DIG', { cx: 57, cy: 22 });
  queue.pushJob('DIG', { cx: 57, cy: 22 }); // cy=22 -> duration = 5.0s

  colony.update(0.05);
  assert.equal(worker.jobDuration, 5.0, 'Deep bedrock job duration must be exactly 5.0s');

  worker.path = [];
  worker.pathIndex = 0;
  worker.state = 'DIGGING';
  worker.jobTimer = 0;

  // Simulate up to 4.9s
  let simulatedTime = 0;
  while (simulatedTime < 4.9) {
    colony.update(0.1);
    simulatedTime += 0.1;
    assert.equal(
      terrain.isSolid(57, 22),
      true,
      `At t=${simulatedTime.toFixed(1)}s (<5.0s), deep bedrock cell must remain solid`
    );
  }

  // Pass 5.0s boundary
  colony.update(0.15);
  assert.equal(terrain.isSolid(57, 22), false, 'At t >= 5.0s, deep bedrock cell must be excavated');
  assert.equal(worker.state, 'HAULING_MUD', 'Connected worker must transition to HAULING_MUD');
  assert.equal(worker.mudPayload, 1, 'Worker must carry mud');
});

// ============================================================================
// SUITE 2: PROGRESS BAR DYNAMIC WIDTH & COLOR RENDERING
// ============================================================================
test('SUITE 2.1: Floating Progress Bar Renders Dynamic Width Linearly with Dig Timer', () => {
  const antView = new AntPlaceholderView();

  const ant = {
    id: 'test-ant-progress',
    type: 'WORKER',
    position: { x: 0, y: 0 },
    targetPos: null,
    angle: 0,
    speed: 65,
    state: 'DIGGING',
    path: [],
    pathIndex: 0,
    energy: 100,
    carriedResource: null,
    walkCycle: 0,
    currentJobId: 101,
    jobDuration: 4.0,
    jobTimer: 0,
    targetJobCell: { cx: 40, cy: 12 },
    mudPayload: 0,
  };

  const progressSteps = [
    { timer: 0.0, expectedRatio: 0.0, expectedWidth: 0 },
    { timer: 1.0, expectedRatio: 0.25, expectedWidth: 6.5 },
    { timer: 2.0, expectedRatio: 0.50, expectedWidth: 13.0 },
    { timer: 3.0, expectedRatio: 0.75, expectedWidth: 19.5 },
    { timer: 4.0, expectedRatio: 1.00, expectedWidth: 26.0 },
  ];

  for (const step of progressSteps) {
    ant.jobTimer = step.timer;
    antView.render([ant]);

    // Inspect progressOverlay graphics instructions
    const instructions = antView.progressOverlay.context.instructions;
    assert.ok(instructions.length > 0, `Progress overlay must contain draw instructions at timer=${step.timer}`);

    // Outer track roundRect is 28x4px
    const outerPath = instructions[0].data.path.instructions[0];
    assert.equal(outerPath.action, 'roundRect');
    assert.equal(outerPath.data[2], 28, 'Outer bar width must be 28px');
    assert.equal(outerPath.data[3], 4, 'Outer bar height must be 4px');

    if (step.expectedWidth > 0) {
      // Inner fill instruction
      assert.equal(instructions.length, 3, 'Must have outer fill, outer stroke, and inner fill');
      const innerFillInstruction = instructions[2];
      assert.equal(innerFillInstruction.action, 'fill');
      // Dig color is amber (0xf59e0b = 16096779)
      assert.equal(innerFillInstruction.data.style.color, 16096779, 'Dig progress bar fill color must be amber 0xf59e0b');

      // Check inner fill width
      const innerPath = innerFillInstruction.data.path.instructions.find((p) => p.action === 'roundRect');
      assert.ok(innerPath, 'Inner fill must contain roundRect path');
      const actualWidth = innerPath.data[2];
      assert.ok(
        Math.abs(actualWidth - step.expectedWidth) < 0.01,
        `Progress bar width at timer=${step.timer} (ratio=${step.expectedRatio}) should be ${step.expectedWidth}px, got ${actualWidth}px`
      );
    } else {
      // At timer=0, fillW is 0, so no inner fill roundRect is added
      assert.equal(instructions.length, 2, 'At 0 progress, only outer track fill and stroke are drawn');
    }
  }
});

test('SUITE 2.2: Floating Progress Bar Uses Emerald Color (0x10b981) for BACKFILLING', () => {
  const antView = new AntPlaceholderView();

  const ant = {
    id: 'test-ant-fill',
    type: 'WORKER',
    position: { x: 0, y: 0 },
    targetPos: null,
    angle: 0,
    speed: 65,
    state: 'BACKFILLING',
    path: [],
    pathIndex: 0,
    energy: 100,
    carriedResource: 'MUD',
    walkCycle: 0,
    currentJobId: 102,
    jobDuration: 2.0,
    jobTimer: 1.0, // 50%
    targetJobCell: { cx: 40, cy: 12 },
    mudPayload: 1,
  };

  antView.render([ant]);
  const instructions = antView.progressOverlay.context.instructions;
  assert.equal(instructions.length, 3);

  const innerFill = instructions[2];
  // Emerald color (0x10b981 = 1096065)
  assert.equal(innerFill.data.style.color, 1096065, 'Fill progress bar fill color must be emerald 0x10b981');
  const innerPath = innerFill.data.path.instructions.find((p) => p.action === 'roundRect');
  assert.equal(innerPath.data[2], 13, 'At 50% backfill progress, width must be 13px');
});

test('SUITE 2.3: Progress Bar is Suppressed and Cleared When Ant is Not Actively Digging/Backfilling', () => {
  const antView = new AntPlaceholderView();

  const idleAnt = {
    id: 'test-ant-idle',
    type: 'WORKER',
    position: { x: 0, y: 0 },
    targetPos: null,
    angle: 0,
    speed: 65,
    state: 'IDLE',
    path: [],
    pathIndex: 0,
    energy: 100,
    carriedResource: null,
    walkCycle: 0,
    currentJobId: null,
    jobDuration: 3.5,
    jobTimer: 0,
    targetJobCell: null,
    mudPayload: 0,
  };

  antView.render([idleAnt]);
  assert.equal(
    antView.progressOverlay.context.instructions.length,
    0,
    'Progress overlay must be empty when worker is IDLE'
  );

  idleAnt.state = 'HAULING_MUD';
  idleAnt.carriedResource = 'MUD';
  idleAnt.mudPayload = 1;
  antView.render([idleAnt]);
  assert.equal(
    antView.progressOverlay.context.instructions.length,
    0,
    'Progress overlay must be empty when worker is HAULING_MUD'
  );
});

// ============================================================================
// SUITE 3: FINITE STOCKPILE HAULING CONSERVATION LOOP
// ============================================================================
test('SUITE 3.1: Full Backfill Cycle Decrements Finite Stockpile & Restores Solid Ground', () => {
  const terrain = new OrganicTerrainData();
  terrain.carveTestCaveSystem();
  const pathfinder = new TerrainPathfinder(terrain);
  const queue = new JobQueue();
  const stockpile = new ClayMudStockpile(64, 10); // Finite stockpile: 10 mud
  const designationMgr = new DesignationManager();

  const colony = new AntColony(terrain, pathfinder, queue, stockpile, designationMgr, 1);
  const worker = colony.ants[1];

  // Target cavity at (50, 9)
  terrain.setSolid(50, 9, false);
  assert.equal(terrain.isSolid(50, 9), false);

  designationMgr.addDesignation('FILL', { cx: 50, cy: 9 });
  queue.pushJob('FILL', { cx: 50, cy: 9 }, 2.0);

  worker.position = colony.cellToWorldCenter({ cx: 50, cy: 10 });
  worker.state = 'IDLE';

  // Tick 1: Worker claims job and reserves 1 mud
  colony.update(0.1);
  assert.equal(stockpile.getAvailableCount(), 9, 'Available mud must decrement from 10 to 9');
  assert.equal(stockpile.getReservedCount(), 1, 'Reserved mud must increment to 1');
  assert.equal(worker.state, 'MOVING_TO_STOCKPILE', 'Worker must move to stockpile');

  // Fast forward arrival at stockpile waypoint
  worker.position = colony.cellToWorldCenter(stockpile.pickupWaypoint);
  worker.path = [stockpile.pickupWaypoint];
  worker.pathIndex = 0;

  // Tick 2: Worker picks up mud from stockpile
  colony.update(0.1);
  assert.equal(stockpile.getReservedCount(), 0, 'Reserved mud must drop to 0 after withdrawal');
  assert.equal(stockpile.getTotalCount(), 9, 'Stockpile total mud must now be exactly 9');
  assert.equal(worker.carriedResource, 'MUD', 'Worker carriedResource must be MUD');
  assert.equal(worker.mudPayload, 1, 'Worker mudPayload must be 1');
  assert.equal(worker.state, 'HAULING_MUD', 'Worker state must be HAULING_MUD');

  // Fast forward arrival at neighbor of (50, 9) and backfill execution
  worker.path = [];
  worker.pathIndex = 0;
  worker.state = 'BACKFILLING';
  worker.targetJobCell = { cx: 50, cy: 9 };
  worker.jobDuration = 2.0;
  worker.jobTimer = 0;

  // Simulate backfilling timer
  colony.update(1.0); // t=1.0s
  assert.equal(terrain.isSolid(50, 9), false, 'Still backfilling, cell must not be solid yet');

  colony.update(1.1); // t=2.1s (exceeds duration 2.0s)
  assert.equal(terrain.isSolid(50, 9), true, 'Cell must now be restored to solid');
  assert.equal(worker.carriedResource, null, 'Carried resource must be cleared');
  assert.equal(worker.mudPayload, 0, 'Mud payload must be 0');
  assert.equal(worker.state, 'IDLE', 'Worker must return to IDLE');
  assert.equal(stockpile.getTotalCount(), 9, 'Stockpile total mud remains 9 (consumed 1 mud)');
});

test('SUITE 3.2: Digging Solid Ground Produces Mud Which Returns to Stockpile', () => {
  const terrain = new OrganicTerrainData();
  terrain.carveTestCaveSystem();
  const pathfinder = new TerrainPathfinder(terrain);
  const queue = new JobQueue();
  const stockpile = new ClayMudStockpile(64, 5); // Stockpile has 5 mud
  const designationMgr = new DesignationManager();

  const colony = new AntColony(terrain, pathfinder, queue, stockpile, designationMgr, 1);
  const worker = colony.ants[1];

  terrain.setSolid(50, 9, true);
  designationMgr.addDesignation('DIG', { cx: 50, cy: 9 });
  queue.pushJob('DIG', { cx: 50, cy: 9 });

  worker.position = colony.cellToWorldCenter({ cx: 50, cy: 10 });
  worker.state = 'DIGGING';
  worker.targetJobCell = { cx: 50, cy: 9 };
  worker.jobDuration = 3.5;
  worker.jobTimer = 3.4; // near completion

  // Complete dig
  colony.update(0.2);
  assert.equal(terrain.isSolid(50, 9), false, 'Cell excavated');
  assert.equal(worker.carriedResource, 'MUD', 'Worker picks up excavated mud');
  assert.equal(worker.mudPayload, 1);
  assert.equal(worker.state, 'HAULING_MUD');

  // Fast forward arrival at stockpile waypoint
  worker.position = colony.cellToWorldCenter(stockpile.pickupWaypoint);
  worker.path = [stockpile.pickupWaypoint];
  worker.pathIndex = 0;

  colony.update(0.1);
  // Arrived carrying mud without targetJobCell -> Deposits into stockpile!
  assert.equal(stockpile.getAvailableCount(), 6, 'Stockpile available count must increase from 5 to 6');
  assert.equal(worker.carriedResource, null, 'Worker mud dropped');
  assert.equal(worker.mudPayload, 0);
  assert.equal(worker.state, 'IDLE');
});

test('SUITE 3.3: Stockpile Starvation & Strict Concurrency Exclusion', () => {
  const terrain = new OrganicTerrainData();
  terrain.carveTestCaveSystem();
  const pathfinder = new TerrainPathfinder(terrain);
  const queue = new JobQueue();
  // Stockpile with ONLY 1 unit of mud
  const stockpile = new ClayMudStockpile(64, 1);
  const designationMgr = new DesignationManager();

  const colony = new AntColony(terrain, pathfinder, queue, stockpile, designationMgr, 3);
  const workerA = colony.ants[1];
  const workerB = colony.ants[2];

  // Enqueue TWO backfill jobs
  terrain.setSolid(50, 9, false);
  terrain.setSolid(50, 11, false);
  designationMgr.addDesignation('FILL', { cx: 50, cy: 9 });
  designationMgr.addDesignation('FILL', { cx: 50, cy: 11 });
  queue.pushJob('FILL', { cx: 50, cy: 9 });
  queue.pushJob('FILL', { cx: 50, cy: 11 });

  workerA.position = colony.cellToWorldCenter({ cx: 50, cy: 10 });
  workerB.position = colony.cellToWorldCenter({ cx: 50, cy: 10 });
  workerA.state = 'IDLE';
  workerB.state = 'IDLE';

  // Worker A claims the 1 available mud
  colony.update(0.05);
  assert.equal(stockpile.getAvailableCount(), 0, 'Available mud is now 0');
  assert.equal(stockpile.getReservedCount(), 1, 'Reserved mud is 1');
  assert.equal(workerA.state, 'MOVING_TO_STOCKPILE', 'Worker A claimed first job');

  // Worker B must be BLOCKED from claiming the second fill job because available count is 0
  assert.notEqual(workerB.state, 'MOVING_TO_STOCKPILE', 'Worker B must NOT claim fill job while starved');
  assert.notEqual(workerB.state, 'BACKFILLING', 'Worker B must NOT be backfilling');

  // Verify stockpile total never goes negative
  assert.ok(stockpile.getAvailableCount() >= 0, 'Stockpile available mud cannot be negative');
  assert.ok(stockpile.getReservedCount() >= 0, 'Stockpile reserved mud cannot be negative');
});

// ============================================================================
// SUITE 4: DEV MODE INSTANT BRUSH ISOLATION & CONFINEMENT
// ============================================================================
test('SUITE 4.1: Standard Mode Disallows Instant Mouse Brush Excavation/Fill', () => {
  const terrain = new OrganicTerrainData();
  const designationMgr = new DesignationManager();
  const queue = new JobQueue();

  // Emulate pointer action under isInstantBrushDevMode = false
  const isInstantBrushDevMode = false;
  const currentTool = 'DIG';
  const worldPos = { x: -300, y: 200 };

  // Helper reflecting WorldIntegrationScene pointer handler logic
  const handlePointerAction = (pos, tool, devMode) => {
    if (devMode) {
      // Instant destructive brush
      terrain.digRadius(pos.x, pos.y, 28);
    } else {
      // 2-Layer Designation pipeline
      const { cx, cy } = designationMgr.worldToCell(pos.x, pos.y);
      if (designationMgr.isWithinBounds(cx, cy)) {
        if (tool === 'DIG' && terrain.isSolid(cx, cy)) {
          designationMgr.addDesignation('DIG', cx, cy);
          queue.pushJob('DIG', { cx, cy });
        }
      }
    }
  };

  const { cx, cy } = designationMgr.worldToCell(worldPos.x, worldPos.y);
  terrain.setSolid(cx, cy, true);

  // Execute pointer down in standard mode
  handlePointerAction(worldPos, currentTool, isInstantBrushDevMode);

  // Cell must STILL BE SOLID!
  assert.equal(terrain.isSolid(cx, cy), true, 'Terrain must NOT be instantly excavated in standard mode');

  // Designation and Job Queue must be created instead
  assert.equal(designationMgr.hasDesignation(cx, cy), true, 'Designation must be created');
  assert.equal(queue.getPendingCount(), 1, 'Job must be queued');
});

test('SUITE 4.2: DEV Mode Confines Instant Brush and Bypasses Job Queue', () => {
  const terrain = new OrganicTerrainData();
  const designationMgr = new DesignationManager();
  const queue = new JobQueue();

  const isInstantBrushDevMode = true;
  const currentTool = 'DIG';
  const worldPos = { x: -300, y: 200 };

  const handlePointerAction = (pos, tool, devMode) => {
    if (devMode) {
      terrain.digRadius(pos.x, pos.y, 28);
    } else {
      const { cx, cy } = designationMgr.worldToCell(pos.x, pos.y);
      if (designationMgr.isWithinBounds(cx, cy)) {
        if (tool === 'DIG' && terrain.isSolid(cx, cy)) {
          designationMgr.addDesignation('DIG', cx, cy);
          queue.pushJob('DIG', { cx, cy });
        }
      }
    }
  };

  const { cx, cy } = designationMgr.worldToCell(worldPos.x, worldPos.y);
  terrain.setSolid(cx, cy, true);

  // Execute pointer down in DEV mode
  handlePointerAction(worldPos, currentTool, isInstantBrushDevMode);

  // Cell IS INSTANTLY EXCAVATED!
  assert.equal(terrain.isSolid(cx, cy), false, 'Terrain must be instantly excavated in DEV mode');

  // Job Queue and Designation Layer must remain EMPTY
  assert.equal(designationMgr.hasDesignation(cx, cy), false, 'No designation should be created in DEV mode');
  assert.equal(queue.getPendingCount(), 0, 'No job should be queued in DEV mode');
});

// ============================================================================
// SUITE 5: CONCURRENCY, EDGE CASES & BOUNDARY HARNESS
// ============================================================================
test('SUITE 5.1: Multi-Worker Concurrent Excavation Without Race Conditions', () => {
  const terrain = new OrganicTerrainData();
  terrain.carveTestCaveSystem();
  const pathfinder = new TerrainPathfinder(terrain);
  const queue = new JobQueue();
  const stockpile = new ClayMudStockpile(64, 32);
  const designationMgr = new DesignationManager();

  // Spawn 6 workers
  const colony = new AntColony(terrain, pathfinder, queue, stockpile, designationMgr, 6);

  // Position workers at living chamber
  for (let i = 1; i <= 6; i++) {
    colony.ants[i].position = colony.cellToWorldCenter({ cx: 50, cy: 10 });
    colony.ants[i].state = 'IDLE';
    colony.ants[i].path = [];
  }

  // Designate 6 adjacent solid cells on the upper boundary of living chamber (cy = 9)
  // cx = 48, 49, 50, 51, 52, 53
  for (let i = 0; i < 6; i++) {
    const cx = 48 + i;
    const cy = 9;
    terrain.setSolid(cx, cy, true);
    designationMgr.addDesignation('DIG', { cx, cy });
    queue.pushJob('DIG', { cx, cy }, 3.5);
  }

  assert.equal(queue.getPendingCount(), 6);

  // Advance simulation to let workers claim distinct jobs
  colony.update(0.1);

  const claimedJobs = new Set();
  for (const ant of colony.ants) {
    if (ant.type === 'WORKER' && ant.currentJobId) {
      assert.ok(!claimedJobs.has(ant.currentJobId), `Job ${ant.currentJobId} claimed by multiple workers!`);
      claimedJobs.add(ant.currentJobId);
    }
  }

  assert.ok(claimedJobs.size >= 1, 'At least one worker must have claimed a job');
  // Confirm that claimed jobs are in progress
  for (const jobId of claimedJobs) {
    const job = queue.getAllJobs().find((j) => j.id === jobId);
    assert.equal(job?.status, 'IN_PROGRESS');
  }
});

test('SUITE 5.2: Boundary & Out-of-Bounds Rejection', () => {
  const designationMgr = new DesignationManager();
  assert.equal(designationMgr.addDesignation('DIG', -1, 10), false);
  assert.equal(designationMgr.addDesignation('DIG', 75, 10), false);
  assert.equal(designationMgr.addDesignation('DIG', 10, -1), false);
  assert.equal(designationMgr.addDesignation('DIG', 10, 32), false);
  assert.equal(designationMgr.getPendingCount(), 0);
});

test('SUITE 5.3: Stockpile Overflow Clamping', () => {
  const stockpile = new ClayMudStockpile(10, 10); // Full capacity
  assert.equal(stockpile.isFull(), true);
  assert.equal(stockpile.deposit(1), false, 'Deposit into full stockpile must return false');
  assert.equal(stockpile.getTotalCount(), 10, 'Count must remain clamped at 10');
});

test('SUITE 5.4: Unreachable Enclosed Solid Cell Rejection (No Walkable Neighbor)', () => {
  const terrain = new OrganicTerrainData();
  // Isolated block at (20, 20) with all neighbors solid
  terrain.setSolid(20, 20, true);
  terrain.setSolid(19, 20, true);
  terrain.setSolid(21, 20, true);
  terrain.setSolid(20, 19, true);
  terrain.setSolid(20, 21, true);

  const pathfinder = new TerrainPathfinder(terrain);
  const queue = new JobQueue();
  const stockpile = new ClayMudStockpile(64, 16);
  const designationMgr = new DesignationManager();

  const colony = new AntColony(terrain, pathfinder, queue, stockpile, designationMgr, 1);
  const worker = colony.ants[1];
  worker.position = colony.cellToWorldCenter({ cx: 50, cy: 10 });
  worker.state = 'IDLE';

  designationMgr.addDesignation('DIG', { cx: 20, cy: 20 });
  const job = queue.pushJob('DIG', { cx: 20, cy: 20 });

  // Update colony: worker tries to claim, but cannot find adjacent walkable cell
  colony.update(0.1);

  // Worker must remain IDLE, job returned to PENDING without crash or hang
  assert.equal(worker.state, 'IDLE');
  assert.equal(worker.currentJobId, null);
  assert.equal(job.status, 'PENDING');
  assert.equal(job.assignedWorkerId, null);
});

console.log('------------------------------------------------------------');
console.log('CHALLENGER GATE 2 EMPIRICAL HARNESS LOADED');
console.log('------------------------------------------------------------');
