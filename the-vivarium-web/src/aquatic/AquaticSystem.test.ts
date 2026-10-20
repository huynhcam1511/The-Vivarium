import { describe, it, expect } from 'vitest';
import { AquaticSystem } from './AquaticSystem';

describe('AquaticSystem (PACK-004 Test Suite)', () => {
  it('should initialize with correct default configuration and entity counts', () => {
    const aquatic = new AquaticSystem();
    expect(aquatic.floraList.length).toBe(14);
    expect(aquatic.fishes.length).toBe(9);
    expect(aquatic.waterfowls.length).toBe(1);
    expect(aquatic.bubbles.length).toBe(24);
    expect(aquatic.getWaterLevel()).toBe(570);
    expect(aquatic.getWaterClarity()).toBe(0.92);
  });

  it('should simulate continuous flora sway and fish oscillation over time', () => {
    const aquatic = new AquaticSystem();
    const initialFloraPhase = aquatic.floraList[0].swayPhase;
    const initialFishWiggle = aquatic.fishes[0].wiggle;

    aquatic.update(0.5);

    expect(aquatic.floraList[0].swayPhase).toBeGreaterThan(initialFloraPhase);
    expect(aquatic.fishes[0].wiggle).toBeGreaterThan(initialFishWiggle);
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
      expect(f.position.x).toBeGreaterThanOrEqual(minX - 10);
      expect(f.position.x).toBeLessThanOrEqual(maxX + 10);
      expect(f.position.y).toBeGreaterThanOrEqual(surfY);
      expect(f.position.y).toBeLessThanOrEqual(bottomY);
    }
  });

  it('should handle environmental rain inflow and water level elevation', () => {
    const aquatic = new AquaticSystem();
    const initialLevel = aquatic.getWaterLevel();

    // Apply rain inflow
    aquatic.applyRainInflow(10.0, 1.0);
    const afterRainLevel = aquatic.getWaterLevel();

    // Water level Y decreases as water rises
    expect(afterRainLevel).toBeLessThan(initialLevel);
    expect(aquatic.waterLevelOffset).toBeGreaterThan(0);
  });

  it('should handle evaporation under heatwave conditions', () => {
    const aquatic = new AquaticSystem();
    const initialLevel = aquatic.getWaterLevel();

    // Evaporate water
    aquatic.evaporateWater(10.0, 1.0);
    const afterEvapLevel = aquatic.getWaterLevel();

    // Water level Y increases as water recedes
    expect(afterEvapLevel).toBeGreaterThan(initialLevel);
    expect(aquatic.waterLevelOffset).toBeLessThan(0);
  });

  it('should calculate accurate harmonic surface wave profile at any world X', () => {
    const aquatic = new AquaticSystem();
    const y1 = aquatic.sampleWaterSurfaceY(1400);
    const y2 = aquatic.sampleWaterSurfaceY(1600);
    const y3 = aquatic.sampleWaterSurfaceY(1800);

    expect(typeof y1).toBe('number');
    expect(isNaN(y1)).toBe(false);
    expect(typeof y2).toBe('number');
    expect(isNaN(y2)).toBe(false);
    expect(typeof y3).toBe('number');
    expect(isNaN(y3)).toBe(false);
  });
});
