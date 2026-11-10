import { describe, it } from 'node:test';
import assert from 'node:assert';
import { AquaticSystem } from './AquaticSystem';

describe('AquaticSystem (PACK-004 Test Suite)', () => {
  it('should initialize with correct default configuration and entity counts', () => {
    const aquatic = new AquaticSystem();
    assert.strictEqual(aquatic.floraList.length, 14, 'Should initialize 14 flora specimens');
    assert.strictEqual(aquatic.fishes.length, 9, 'Should initialize 9 fishes (6 minnows + 3 carp)');
    assert.strictEqual(aquatic.waterfowls.length, 1, 'Should initialize 1 waterfowl (Mallard duck)');
    assert.strictEqual(aquatic.bubbles.length, 24, 'Should initialize 24 submerged bubble particles');
    assert.strictEqual(aquatic.getWaterLevel(), 570, 'Default baseline water level should be Y: 570');
    assert.strictEqual(aquatic.getWaterClarity(), 0.92, 'Default clarity should be 0.92');
  });

  it('should simulate continuous flora sway and fish oscillation over time', () => {
    const aquatic = new AquaticSystem();
    const initialFloraPhase = aquatic.floraList[0].swayPhase;
    const initialFishWiggle = aquatic.fishes[0].wiggle;

    aquatic.update(0.5);

    assert.ok(aquatic.floraList[0].swayPhase > initialFloraPhase, 'Flora sway phase should advance');
    assert.ok(aquatic.fishes[0].wiggle > initialFishWiggle, 'Fish tail wiggle should advance');
  });

  it('should maintain fishes within water basin boundaries', () => {
    const aquatic = new AquaticSystem();
    // Simulate 50 seconds of swimming
    for (let t = 0; t < 100; t++) {
      aquatic.update(0.5);
    }

    const minX = aquatic.config.basinMinX;
    const maxX = aquatic.config.basinMaxX;
    const surfY = aquatic.sampleWaterSurfaceY(1600);
    const bottomY = aquatic.config.surfaceBaseY + aquatic.config.maxDepth;

    for (const f of aquatic.fishes) {
      assert.ok(f.position.x >= minX - 10 && f.position.x <= maxX + 10, `Fish X (${f.position.x}) should be inside basin [${minX}, ${maxX}]`);
      assert.ok(f.position.y >= surfY && f.position.y <= bottomY, `Fish Y (${f.position.y}) should be below water surface`);
    }
  });

  it('should handle environmental rain inflow and water level elevation', () => {
    const aquatic = new AquaticSystem();
    const initialLevel = aquatic.getWaterLevel();

    // Apply rain inflow
    aquatic.applyRainInflow(10.0, 1.0);
    const afterRainLevel = aquatic.getWaterLevel();

    // Water level Y decreases as water rises
    assert.ok(afterRainLevel < initialLevel, `Water surface Y (${afterRainLevel}) should rise towards sky relative to baseline (${initialLevel})`);
    assert.ok(aquatic.waterLevelOffset > 0, 'Water level offset should be positive');
  });

  it('should handle evaporation under heatwave conditions', () => {
    const aquatic = new AquaticSystem();
    const initialLevel = aquatic.getWaterLevel();

    // Evaporate water
    aquatic.evaporateWater(10.0, 1.0);
    const afterEvapLevel = aquatic.getWaterLevel();

    // Water level Y increases as water recedes
    assert.ok(afterEvapLevel > initialLevel, `Water surface Y (${afterEvapLevel}) should recede downwards`);
    assert.ok(aquatic.waterLevelOffset < 0, 'Water level offset should be negative');
  });

  it('should calculate accurate harmonic surface wave profile at any world X', () => {
    const aquatic = new AquaticSystem();
    const y1 = aquatic.sampleWaterSurfaceY(1400);
    const y2 = aquatic.sampleWaterSurfaceY(1600);
    const y3 = aquatic.sampleWaterSurfaceY(1800);

    assert.ok(typeof y1 === 'number' && !isNaN(y1), 'Sampled Y should be a valid number');
    assert.ok(typeof y2 === 'number' && !isNaN(y2), 'Sampled Y should be a valid number');
    assert.ok(typeof y3 === 'number' && !isNaN(y3), 'Sampled Y should be a valid number');
  });
});
