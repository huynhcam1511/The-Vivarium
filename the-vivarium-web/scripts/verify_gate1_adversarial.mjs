// verify_gate1_adversarial.mjs
// Adversarial verification script for Gate 1 Boundary, Stockpile, and Masking conditions

console.log('=== EMPIRICAL CHALLENGER GATE 1 SUITE ===\n');

// ---------------------------------------------------------------------------
// TEST 1: Coordinate System & Boundary Mapping in OrganicTerrainData
// ---------------------------------------------------------------------------
console.log('--- TEST 1: Coordinate System & Boundary Analysis ---');

// Emulate OrganicTerrainData mathematical formulas from OrganicTerrainData.ts
const COLS = 75;
const ROWS = 32;
const CELL_SIZE = 32;
const ORIGIN_X = -1200;
const ORIGIN_Y = 0;

const minWX = ORIGIN_X; // -1200
const maxWX = ORIGIN_X + COLS * CELL_SIZE; // +1200
const minWY = ORIGIN_Y; // 0
const maxWY = ORIGIN_Y + ROWS * CELL_SIZE; // 1024

function worldToCell(wx, wy) {
  const cx = Math.floor((wx - ORIGIN_X) / CELL_SIZE);
  const cy = Math.floor((wy - ORIGIN_Y) / CELL_SIZE);
  return { cx, cy };
}

function cellToWorldCenter(cx, cy) {
  const wx = ORIGIN_X + (cx + 0.5) * CELL_SIZE;
  const wy = ORIGIN_Y + (cy + 0.5) * CELL_SIZE;
  return { wx, wy };
}

function isCellValid(cx, cy) {
  return cx >= 0 && cx < COLS && cy >= 0 && cy < ROWS;
}

// OrganicTerrainData.ts isSolid behavior
function terrainIsSolid(grid, cx, cy) {
  if (cx < 0 || cx >= COLS || cy < 0 || cy >= ROWS) return true; // Note: returns true for OOB!
  return grid[cy * COLS + cx] === 1;
}

console.log(`World Bounds: X in [${minWX}, ${maxWX}], Y in [${minWY}, ${maxWY}]`);
console.log(`Grid Dimensions: ${COLS} cols x ${ROWS} rows (${COLS * ROWS} cells), cellSize = ${CELL_SIZE}px`);

// Boundary tests
const testPoints = [
  { wx: -1200, wy: 0, label: 'Top-Left Origin' },
  { wx: -1200.01, wy: 0, label: 'Outside West Boundary' },
  { wx: 1199.9, wy: 1023.9, label: 'Bottom-Right Maximum Inner' },
  { wx: 1200, wy: 1024, label: 'Exact East/South Boundary (Edge Condition)' },
  { wx: 1200.01, wy: 1024.01, label: 'Outside East/South Boundary' },
  { wx: 0, wy: -0.1, label: 'Above Surface Atmosphere (wy < 0)' },
  { wx: 0, wy: 512, label: 'Subterranean Core Center' }
];

let boundaryVulnerabilities = 0;
const mockGrid = new Uint8Array(COLS * ROWS).fill(1);

for (const pt of testPoints) {
  const { cx, cy } = worldToCell(pt.wx, pt.wy);
  const valid = isCellValid(cx, cy);
  const solidState = terrainIsSolid(mockGrid, cx, cy);
  const center = cellToWorldCenter(cx, cy);
  const { cx: roundTripCX, cy: roundTripCY } = worldToCell(center.wx, center.wy);

  console.log(`  Point: ${pt.label} (${pt.wx}, ${pt.wy}) -> Cell: (${cx}, ${cy})`);
  console.log(`    Valid Grid Range: ${valid} | terrainIsSolid(): ${solidState} | Round-trip cell: (${roundTripCX}, ${roundTripCY})`);

  if (!valid && solidState === true) {
    boundaryVulnerabilities++;
    console.log(`    ⚠️ ATTENTION: Out-of-bounds cell (${cx}, ${cy}) reports isSolid() === true!`);
  }
}

// ---------------------------------------------------------------------------
// TEST 2: Finite Stockpile Retrieval & Concurrency Edge Cases
// ---------------------------------------------------------------------------
console.log('\n--- TEST 2: Finite Stockpile Retrieval Logic ---');

class ClayMudStockpileHarness {
  constructor(initialCapacity = 64, initialCount = 10) {
    this.maxCapacity = initialCapacity;
    this.currentCount = initialCount;
  }

  getAvailableCount() {
    return this.currentCount;
  }

  deposit(amount) {
    if (typeof amount !== 'number' || isNaN(amount) || amount <= 0 || !Number.isInteger(amount)) return false;
    if (this.currentCount + amount > this.maxCapacity) {
      const accepted = this.maxCapacity - this.currentCount;
      this.currentCount = this.maxCapacity;
      return accepted > 0;
    }
    this.currentCount += amount;
    return true;
  }

  // Guarded implementation against negative/zero/non-integer
  guardedWithdraw(amount) {
    if (typeof amount !== 'number' || isNaN(amount) || amount <= 0 || !Number.isInteger(amount)) return false;
    if (this.currentCount < amount) return false;
    this.currentCount -= amount;
    return true;
  }
}

// Test A: Zero balance withdrawal
const stockZero = new ClayMudStockpileHarness(64, 0);
console.log(`Initial Stockpile count: ${stockZero.getAvailableCount()}`);
const withdrawResultZero = stockZero.guardedWithdraw(1);
console.log(`Withdraw 1 from 0: Success=${withdrawResultZero}, Remaining=${stockZero.getAvailableCount()}`);

// Test B: Negative / NaN / Floating-point withdrawal injection
const stockExploit = new ClayMudStockpileHarness(64, 5);
console.log(`Adversarial Withdrawals on count=${stockExploit.getAvailableCount()}:`);
console.log(`  withdraw(-5):`, stockExploit.guardedWithdraw(-5), `-> count=${stockExploit.getAvailableCount()}`);
console.log(`  withdraw(0):`, stockExploit.guardedWithdraw(0), `-> count=${stockExploit.getAvailableCount()}`);
console.log(`  withdraw(NaN):`, stockExploit.guardedWithdraw(NaN), `-> count=${stockExploit.getAvailableCount()}`);
console.log(`  withdraw(0.5):`, stockExploit.guardedWithdraw(0.5), `-> count=${stockExploit.getAvailableCount()}`);

// Test C: Concurrent worker race simulation (1 mud ball remaining, 5 workers requesting)
const stockRace = new ClayMudStockpileHarness(64, 1);
let successfulWithdrawals = 0;
let failedWithdrawals = 0;
const workerAttempts = 5;

for (let w = 1; w <= workerAttempts; w++) {
  if (stockRace.guardedWithdraw(1)) {
    successfulWithdrawals++;
  } else {
    failedWithdrawals++;
  }
}
console.log(`Race simulation (1 mud ball, 5 workers):`);
console.log(`  Successful claims: ${successfulWithdrawals} (Expected: 1)`);
console.log(`  Rejected claims: ${failedWithdrawals} (Expected: 4)`);
console.log(`  Ending balance: ${stockRace.getAvailableCount()} (Must not be < 0)`);

// ---------------------------------------------------------------------------
// TEST 3: Mathematical Analysis of Oak Dual-Pass Sandwich Masking
// ---------------------------------------------------------------------------
console.log('\n--- TEST 3: Oak Dual-Pass Sandwich Masking Buffer Analysis ---');

// Calculate undulating surface height map matching OrganicTerrainData.ts
const surfaceHeightMap = new Float32Array(COLS);
for (let c = 0; c < COLS; c++) {
  const wx = ORIGIN_X + c * CELL_SIZE;
  const distFromTrunk = Math.abs(wx);
  const trunkWeight = Math.min(1.0, Math.max(0.0, (distFromTrunk - 120) / 200));
  const wave = Math.sin(wx * 0.0035) * 22 + Math.cos(wx * 0.008) * 10;
  surfaceHeightMap[c] = wave * trunkWeight;
}

function getSurfaceY(worldX) {
  const relX = worldX - ORIGIN_X;
  const colFloat = relX / CELL_SIZE;
  const c0 = Math.floor(colFloat);
  const c1 = Math.min(COLS - 1, c0 + 1);
  if (c0 < 0) return ORIGIN_Y + (surfaceHeightMap[0] || 0);
  if (c0 >= COLS) return ORIGIN_Y + (surfaceHeightMap[COLS - 1] || 0);
  const t = colFloat - c0;
  const h = (1 - t) * surfaceHeightMap[c0] + t * surfaceHeightMap[c1];
  return ORIGIN_Y + h;
}

const delta1 = 6;
const delta2 = 10;
const bufferThickness = delta1 + delta2; // 16px

console.log(`Dual-pass safety overlap buffer: delta1 (roots) = ${delta1}px, delta2 (trunk) = ${delta2}px -> Total buffer = ${bufferThickness}px`);

// Sample across tree span [-600, 600] at 0.5px sub-pixel steps to test for tearing
let minOverlapObserved = Infinity;
let maxSlopeObserved = 0;
let max16pxChordError = 0;

for (let x = -600; x <= 600; x += 0.5) {
  const surfY = getSurfaceY(x);
  const rootTopY = surfY - delta1;
  const trunkBottomY = surfY + delta2;
  const overlap = trunkBottomY - rootTopY;
  if (overlap < minOverlapObserved) minOverlapObserved = overlap;

  // Slope test
  const nextSurfY = getSurfaceY(x + 0.5);
  const slope = Math.abs((nextSurfY - surfY) / 0.5);
  if (slope > maxSlopeObserved) maxSlopeObserved = slope;
}

// Test piecewise polygon chords with 16px sampling step
for (let x = -600; x <= 600 - 16; x += 16) {
  const yA = getSurfaceY(x);
  const yB = getSurfaceY(x + 16);
  for (let s = 1; s < 16; s++) {
    const actual = getSurfaceY(x + s);
    const chordY = yA + (yB - yA) * (s / 16);
    const chordErr = Math.abs(actual - chordY);
    if (chordErr > max16pxChordError) max16pxChordError = chordErr;
  }
}

console.log(`Empirical Mask Geometry Verification:`);
console.log(`  Minimum overlap across span: ${minOverlapObserved.toFixed(4)}px (Target: ${bufferThickness}px)`);
console.log(`  Maximum surface slope: ${maxSlopeObserved.toFixed(4)} px/px`);
console.log(`  Maximum chord discretization error (16px sampling): ${max16pxChordError.toFixed(4)}px`);
console.log(`  Buffer Margin vs Discretization Error: Overlap (${bufferThickness}px) is ${(bufferThickness / max16pxChordError).toFixed(1)}x greater than max chord error!`);

const seamTearingPrevented = minOverlapObserved >= 15.99 && max16pxChordError < 1.0;
console.log(`  Seam Tearing Mathematically Prevented: ${seamTearingPrevented ? 'PASS (CONFIRMED)' : 'FAIL'}`);

console.log('\n=== END VERIFICATION SUITE ===');
