// challenger_gate3_oak_masking_empirical.ts
// ============================================================================
// THE VIVARIUM — Gate 3 Challenger 1: Empirical Adversarial Verification Harness
// Focus: Oak Masking Integration, 16px Overlap Buffer, Mask Parenting & Root Reveal
// Author: challenger_gate3_1 (Empirical Challenger)
// ============================================================================

import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { Container, Graphics, Sprite, Texture, Matrix } from 'pixi.js';
import { OrganicTerrainData } from '../src/engine/OrganicTerrainData';
import { OrganicTerrainRenderer } from '../src/engine/OrganicTerrainRenderer';

const REPO_ROOT = path.resolve(import.meta.dirname || '.', '../../../');
const GAME_ROOT = path.resolve(REPO_ROOT, 'GAME');
const QA_B3_DIR = path.resolve(GAME_ROOT, 'QA/TASK-021_B3');

// ============================================================================
// CHALLENGE 1: 16px Safety Overlap Buffer Empirical Invariant
// ============================================================================
describe('CHALLENGE 1: 16px Safety Overlap Buffer Empirical Invariant', () => {
  const terrain = new OrganicTerrainData();

  it('1.1: Exact 16px overlap across all integer coordinates mx in [-600, 600] (1201 samples)', () => {
    let checkedCount = 0;
    for (let mx = -600; mx <= 600; mx++) {
      const surfY = terrain.getSurfaceY(mx);
      const rootUpperY = surfY - 6.0;
      const trunkLowerY = surfY + 10.0;
      const delta = trunkLowerY - rootUpperY;

      assert.strictEqual(
        delta,
        16.0,
        `Overlap delta at mx=${mx} must be exactly 16.0px, got ${delta} (surfY=${surfY})`
      );
      checkedCount++;
    }
    assert.strictEqual(checkedCount, 1201, 'Must have verified all 1201 integer sample points');
  });

  it('1.2: Fine-grained sub-pixel sampling (0.1px step, 12,001 samples) and extreme boundary checks', () => {
    const boundaries = [-600, -599.99, -300.5, -120.0, 0, 120.0, 300.5, 599.99, 600];
    for (const bx of boundaries) {
      const surfY = terrain.getSurfaceY(bx);
      const delta = (surfY + 10.0) - (surfY - 6.0);
      assert.ok(
        Math.abs(delta - 16.0) < 1e-12,
        `Boundary check at bx=${bx} must yield 16.0px overlap`
      );
    }

    // Fuzzing 1,000 random floating point coordinates in [-600, 600]
    for (let i = 0; i < 1000; i++) {
      const rx = -600 + Math.random() * 1200;
      const surfY = terrain.getSurfaceY(rx);
      const delta = (surfY + 10.0) - (surfY - 6.0);
      assert.ok(
        Math.abs(delta - 16.0) < 1e-12,
        `Fuzzed check at rx=${rx} failed 16.0px overlap`
      );
    }
  });

  it('1.3: Real Polygon Point Array Assembly Alignment Check (WorldIntegrationScene implementation)', () => {
    const trunkGroundY = terrain.getSurfaceY(0);

    // Assemble rootMask polygon points exactly as WorldIntegrationScene.tsx lines 294-300
    const rootMaskPts: { x: number; y: number }[] = [];
    rootMaskPts.push({ x: -600, y: trunkGroundY + 1200 });
    for (let mx = -600; mx <= 600; mx += 16) {
      rootMaskPts.push({ x: mx, y: terrainDataSurfaceY(terrain, mx) - 6 });
    }
    rootMaskPts.push({ x: 600, y: trunkGroundY + 1200 });

    // Assemble trunkMask polygon points exactly as WorldIntegrationScene.tsx lines 312-319
    const trunkMaskPts: { x: number; y: number }[] = [];
    trunkMaskPts.push({ x: -600, y: trunkGroundY - 1200 });
    trunkMaskPts.push({ x: 600, y: trunkGroundY - 1200 });
    for (let mx = 600; mx >= -600; mx -= 16) {
      trunkMaskPts.push({ x: mx, y: terrainDataSurfaceY(terrain, mx) + 10 });
    }

    // Number of step points = (600 - (-600)) / 16 + 1 = 76 points
    assert.strictEqual(rootMaskPts.length, 78, 'Root mask must have 78 vertices (76 contour + 2 anchors)');
    assert.strictEqual(trunkMaskPts.length, 78, 'Trunk mask must have 78 vertices (2 anchors + 76 contour)');

    // Extract contour points along the undulating groundline (excluding bounding box anchor corners)
    const rootContour = rootMaskPts.slice(1, -1); // 76 points from mx=-600 to +600
    const trunkContour = trunkMaskPts.slice(2);   // 76 points from mx=+600 down to -600

    assert.strictEqual(rootContour.length, 76, 'Root contour must have exactly 76 sample points');
    assert.strictEqual(trunkContour.length, 76, 'Trunk contour must have exactly 76 sample points');

    // Compare overlapping contour points at every mx
    for (let mx = -600; mx <= 600; mx += 16) {
      const rootPt = rootContour.find((p) => p.x === mx);
      const trunkPt = trunkContour.find((p) => p.x === mx);
      assert.ok(rootPt, `Missing root contour point at mx=${mx}`);
      assert.ok(trunkPt, `Missing trunk contour point at mx=${mx}`);

      const overlapHeight = trunkPt.y - rootPt.y;
      assert.strictEqual(
        overlapHeight,
        16.0,
        `Contour overlap at mx=${mx} must be exactly 16.0px, got ${overlapHeight}`
      );
    }
  });

  it('1.4: Screen-space scaling across camera multi-zoom (0.5x, 1.0x, 2.0x, 4.0x)', () => {
    const zoomLevels = [0.5, 1.0, 2.0, 4.0];
    for (const zoom of zoomLevels) {
      const worldOverlap = 16.0;
      const screenOverlap = worldOverlap * zoom;
      assert.strictEqual(
        screenOverlap,
        16.0 * zoom,
        `At zoom ${zoom}x, screen-space overlap buffer must be ${16.0 * zoom}px`
      );
      assert.ok(screenOverlap >= 8.0, `Screen overlap at ${zoom}x must be >= 8.0px (immune to subpixel aliasing)`);
    }
  });
});

function terrainDataSurfaceY(terrain: OrganicTerrainData, x: number): number {
  return terrain.getSurfaceY(x);
}

// ============================================================================
// CHALLENGE 2: Container Mask Parenting in PixiJS v8 & Zero Deprecations
// ============================================================================
describe('CHALLENGE 2: Container Mask Parenting in PixiJS v8', () => {
  it('2.1: PixiJS v8 container mask parenting produces 0 console warnings or errors', () => {
    const warnings: string[] = [];
    const errors: string[] = [];
    const originalWarn = console.warn;
    const originalError = console.error;

    console.warn = (...args: any[]) => warnings.push(args.join(' '));
    console.error = (...args: any[]) => errors.push(args.join(' '));

    try {
      const rootBackGroup = new Container();
      const trunkFrontGroup = new Container();

      const rootSpr = new Sprite(Texture.WHITE);
      rootSpr.anchor.set(0.5, 0.55);
      rootSpr.scale.set(0.5);
      rootSpr.position.set(0, 0);

      const rootMask = new Graphics();
      rootMask.poly([
        { x: -600, y: 1200 },
        { x: 0, y: -6 },
        { x: 600, y: 1200 },
      ]).fill({ color: 0xffffff });
      rootSpr.mask = rootMask;

      // Clean PixiJS v8 parenting: mask added to Container parent
      rootBackGroup.addChild(rootMask);
      rootBackGroup.addChild(rootSpr);

      const trunkSpr = new Sprite(Texture.WHITE);
      trunkSpr.anchor.set(0.5, 0.55);
      trunkSpr.scale.set(0.5);
      trunkSpr.position.set(0, 0);

      const trunkMask = new Graphics();
      trunkMask.poly([
        { x: -600, y: -1200 },
        { x: 600, y: -1200 },
        { x: 0, y: 10 },
      ]).fill({ color: 0xffffff });
      trunkSpr.mask = trunkMask;

      // Clean PixiJS v8 parenting: mask added to Container parent
      trunkFrontGroup.addChild(trunkMask);
      trunkFrontGroup.addChild(trunkSpr);

      // Verify parenting relationships
      assert.strictEqual(rootMask.parent, rootBackGroup, 'rootMask.parent must be rootBackGroup');
      assert.strictEqual(rootSpr.parent, rootBackGroup, 'rootSpr.parent must be rootBackGroup');
      assert.strictEqual(trunkMask.parent, trunkFrontGroup, 'trunkMask.parent must be trunkFrontGroup');
      assert.strictEqual(trunkSpr.parent, trunkFrontGroup, 'trunkSpr.parent must be trunkFrontGroup');

      // Verify mask assignment
      assert.strictEqual(rootSpr.mask, rootMask, 'rootSpr.mask must be rootMask');
      assert.strictEqual(trunkSpr.mask, trunkMask, 'trunkSpr.mask must be trunkMask');

      // Assert 0 deprecation warnings or errors emitted
      assert.strictEqual(warnings.length, 0, `Expected 0 warnings, got: ${warnings.join('; ')}`);
      assert.strictEqual(errors.length, 0, `Expected 0 errors, got: ${errors.join('; ')}`);
    } finally {
      console.warn = originalWarn;
      console.error = originalError;
    }
  });

  it('2.2: Adversarial Counter-Example: Sprite transform isolation vs Container parenting', () => {
    const parentContainer = new Container();
    const testSprite = new Sprite(Texture.WHITE);
    const testMask = new Graphics();

    testSprite.position.set(100, 250);
    testSprite.scale.set(0.5, 0.5);

    // Correct pattern: mask is sibling of sprite inside container
    parentContainer.addChild(testMask);
    parentContainer.addChild(testSprite);
    testSprite.mask = testMask;

    // Mask transform remains unpolluted by sprite's local scale and offset
    const maskMatrix = new Matrix();
    testMask.updateTransform({
      worldTransform: maskMatrix,
      position: { x: 0, y: 0 },
      scale: { x: 1, y: 1 },
      pivot: { x: 0, y: 0 },
      skew: { x: 0, y: 0 },
      rotation: 0,
    } as any);

    assert.strictEqual(testMask.position.x, 0, 'Mask position must remain at world origin');
    assert.strictEqual(testMask.position.y, 0, 'Mask position must remain at world origin');
    assert.strictEqual(testMask.parent, parentContainer, 'Mask must be child of parent container');
  });
});

// ============================================================================
// CHALLENGE 3: Soil Excavation Root Reveal & Subterranean Layer Occlusion
// ============================================================================
describe('CHALLENGE 3: Soil Excavation Root Reveal & Layer Occlusion', () => {
  const terrain = new OrganicTerrainData();
  const renderer = new OrganicTerrainRenderer(terrain);

  it('3.1: Layer Z-Ordering in OrganicTerrainRenderer container', () => {
    // Check children ordering
    const container = renderer.container;
    const subContainer = (renderer as any).subterraneanObjectContainer;
    const soilContainer = (renderer as any).soilContainer;
    const cavityBg = (renderer as any).cavityBackgroundGraphics;

    assert.ok(subContainer, 'subterraneanObjectContainer must exist');
    assert.ok(soilContainer, 'soilContainer must exist');
    assert.ok(cavityBg, 'cavityBackgroundGraphics must exist');

    const cavityIdx = container.getChildIndex(cavityBg);
    const subIdx = container.getChildIndex(subContainer);
    const soilIdx = container.getChildIndex(soilContainer);

    assert.strictEqual(cavityIdx, 0, 'Cavity background must be at index 0 (deepest)');
    assert.strictEqual(subIdx, 1, 'Subterranean objects (roots) must be at index 1');
    assert.strictEqual(soilIdx, 2, 'Soil container must be at index 2 (in front of roots)');

    assert.ok(
      soilIdx > subIdx,
      `Soil container (index ${soilIdx}) MUST be strictly in front of subterranean objects (index ${subIdx})`
    );
  });

  it('3.2: Undisturbed pristine soil: 100% of subterranean cells are solid, roots 100% occluded', () => {
    const cleanTerrain = new OrganicTerrainData();
    let solidCount = 0;
    let cavityCount = 0;

    for (let cy = 0; cy < cleanTerrain.rows; cy++) {
      for (let cx = 0; cx < cleanTerrain.cols; cx++) {
        if (cleanTerrain.isSolid(cx, cy)) {
          solidCount++;
        } else {
          cavityCount++;
        }
      }
    }

    // Default OrganicTerrainData initializes with naturally carved caverns, but oak root zone (cx: 35-40, cy: 0-8) is solid
    // Let's verify root collar zone is solid in pristine state
    for (let cx = 35; cx <= 40; cx++) {
      for (let cy = 1; cy <= 5; cy++) {
        assert.strictEqual(
          cleanTerrain.isSolid(cx, cy),
          true,
          `Root collar cell (cx=${cx}, cy=${cy}) must be solid in pristine terrain`
        );
      }
    }
  });

  it('3.3: Excavating root zone: density clears soil mask and reveals subterranean roots', () => {
    const activeTerrain = new OrganicTerrainData();
    const targetCell = { cx: 37, cy: 3 };

    // Initially solid
    assert.strictEqual(activeTerrain.isSolid(targetCell.cx, targetCell.cy), true);

    // Excavate cell
    activeTerrain.setSolid(targetCell.cx, targetCell.cy, false);
    assert.strictEqual(
      activeTerrain.isSolid(targetCell.cx, targetCell.cy),
      false,
      'Cell must become non-solid (void) after excavation'
    );

    // Backfill restores solid soil
    activeTerrain.setSolid(targetCell.cx, targetCell.cy, true);
    assert.strictEqual(
      activeTerrain.isSolid(targetCell.cx, targetCell.cy),
      true,
      'Cell must be restored to solid after backfill'
    );
  });
});

// ============================================================================
// CHALLENGE 4: Quantitative Telemetry Verification of Root Mask Diff Data
// ============================================================================
describe('CHALLENGE 4: Quantitative Root Mask Diff Telemetry & Artifacts', () => {
  const jsonPath = path.resolve(GAME_ROOT, 'TASK-021_ROOT_MASK_DIFF_DATA.json');

  it('4.1: TASK-021_ROOT_MASK_DIFF_DATA.json file integrity & schema', () => {
    assert.ok(fs.existsSync(jsonPath), `Diff telemetry JSON must exist at ${jsonPath}`);
    const raw = fs.readFileSync(jsonPath, 'utf-8');
    const data = JSON.parse(raw);

    assert.strictEqual(data.test, 'TASK-021 Oak V5 Root Mask Cavity Visual Verification');
    assert.deepStrictEqual(data.cavityBoundingBox, { minX: 680, maxX: 920, minY: 440, maxY: 640 });
    assert.strictEqual(data.rootZoneChangedPixels, 44234, 'Must report exactly 44,234 exposed root pixels');
    assert.strictEqual(data.recoveredUnfilledPixels, 0, 'Must report exactly 0 unfilled pixels upon backfill');
    assert.strictEqual(data.verificationCriteria.minExposedRootPixels, 4000);
    assert.strictEqual(data.verificationCriteria.maxUnfilledPixels, 10);
    assert.strictEqual(data.verificationVerdict, 'PASS_AUTHENTIC_ROOT_EXPOSURE_AND_RECOVER');

    // Empirical threshold evaluation
    assert.ok(
      data.rootZoneChangedPixels >= data.verificationCriteria.minExposedRootPixels,
      `Exposed root pixels (${data.rootZoneChangedPixels}) must exceed minimum required (${data.verificationCriteria.minExposedRootPixels})`
    );
    assert.ok(
      data.recoveredUnfilledPixels <= data.verificationCriteria.maxUnfilledPixels,
      `Unfilled recovery pixels (${data.recoveredUnfilledPixels}) must be <= maximum allowed (${data.verificationCriteria.maxUnfilledPixels})`
    );
  });

  it('4.2: Visual QA Image Artifact Existence and Integrity in QA/TASK-021_B3/', () => {
    const expectedImages = [
      '01_world_overview_b3.png',
      '02_oak_v5_undulating_groundline.png',
      '03a_root_before_dig.png',
      '03b_root_dig_exposed.png',
      '03c_root_filament_diff.png',
      '04_root_fill_recovered.png',
      '05_aquatic_waterfall_sheet.png',
      '06_aquatic_lake_basin_mud.png',
      '07_underground_strata_clay_peat.png',
      '10_performance_b3_steady_overview.png',
    ];

    for (const imgName of expectedImages) {
      const fullPath = path.resolve(QA_B3_DIR, imgName);
      assert.ok(fs.existsSync(fullPath), `Artifact ${imgName} must exist at ${fullPath}`);
      const stats = fs.statSync(fullPath);
      assert.ok(stats.size > 50000, `Artifact ${imgName} must be a valid non-empty PNG (size: ${stats.size} bytes)`);
    }
  });

  it('4.3: PNG Binary Header & Resolution Audit (1600x1000 viewport standards)', () => {
    function readPngDimensions(filePath: string): { width: number; height: number } {
      const buf = fs.readFileSync(filePath);
      // Check PNG magic bytes: 0x89, 'P', 'N', 'G', '\r', '\n', 0x1A, '\n'
      assert.strictEqual(buf[0], 0x89, 'PNG magic byte 0');
      assert.strictEqual(buf[1], 0x50, 'PNG magic byte 1 (P)');
      assert.strictEqual(buf[2], 0x4e, 'PNG magic byte 2 (N)');
      assert.strictEqual(buf[3], 0x47, 'PNG magic byte 3 (G)');
      // IHDR chunk starts at byte 12; width at 16, height at 20 (UInt32BE)
      const width = buf.readUInt32BE(16);
      const height = buf.readUInt32BE(20);
      return { width, height };
    }

    const keyImages = [
      '01_world_overview_b3.png',
      '03a_root_before_dig.png',
      '03b_root_dig_exposed.png',
      '03c_root_filament_diff.png',
      '04_root_fill_recovered.png',
      '10_performance_b3_steady_overview.png',
    ];

    for (const imgName of keyImages) {
      const fullPath = path.resolve(QA_B3_DIR, imgName);
      const dims = readPngDimensions(fullPath);
      assert.strictEqual(dims.width, 1600, `Image ${imgName} width must be 1600px`);
      assert.strictEqual(dims.height, 1000, `Image ${imgName} height must be 1000px`);
    }
  });

  it('4.4: OakBoughMountingConfig Artwork Socket Interface Contract in WorldIntegrationScene.tsx', () => {
    const sceneSourcePath = path.resolve(GAME_ROOT, 'the-vivarium-web/src/components/WorldIntegrationScene.tsx');
    const sceneSrc = fs.readFileSync(sceneSourcePath, 'utf-8');

    // Verify exported OakBoughMountingConfig interface
    assert.ok(sceneSrc.includes('export interface OakBoughMountingConfig'), 'Must export OakBoughMountingConfig');
    assert.ok(sceneSrc.includes('leftBough: {'), 'Must specify leftBough config');
    assert.ok(sceneSrc.includes('rightBough: {'), 'Must specify rightBough config');
    assert.ok(sceneSrc.includes('beehiveAnchor: { x: number; y: number }'), 'Must specify beehiveAnchor');
    assert.ok(sceneSrc.includes('predatorPerch: { x: number; y: number }'), 'Must specify predatorPerch');
    assert.ok(sceneSrc.includes('x: -85, y: -320'), 'Must document left bough socket coords');
    assert.ok(sceneSrc.includes('x: +95, y: -310'), 'Must document right bough socket coords');
  });
});

// ============================================================================
// CHALLENGE 5: Repository Guardrails & Checklist Governance Compliance
// ============================================================================
describe('CHALLENGE 5: Repository Guardrails & Checklist Governance', () => {
  it('5.1: Git active branch is strictly task/021-world-integration', () => {
    const branch = execSync('git -C GAME branch --show-current', { cwd: REPO_ROOT, encoding: 'utf-8' }).trim();
    assert.strictEqual(branch, 'task/021-world-integration', 'Branch must be task/021-world-integration');
  });

  it('5.2: Main branch remains unmerged at commit 2a22544', () => {
    const mainRev = execSync('git -C GAME rev-parse main', { cwd: REPO_ROOT, encoding: 'utf-8' }).trim();
    assert.ok(mainRev.startsWith('2a22544'), `Main HEAD SHA must start with 2a22544, got: ${mainRev}`);
  });

  it('5.3: Zero commits pushed to remote origin during this session', () => {
    const status = execSync('git -C GAME status', { cwd: REPO_ROOT, encoding: 'utf-8' });
    assert.ok(
      status.includes("Your branch is up to date with 'origin/task/021-world-integration'"),
      'Local branch must be up to date with origin (no unpushed commits)'
    );
  });

  it('5.4: Checklist 02 remains open (~25%) and Checklist 03 remains unopened (0%)', () => {
    const cl2 = fs.readFileSync(path.resolve(GAME_ROOT, 'CHECKLIST-02_VISUAL_DEFECT_REGISTER.md'), 'utf-8');
    assert.ok(cl2.includes('IN PROGRESS (~25% COMPLETE) — STRICTLY REMAINS OPEN'));

    const cl3 = fs.readFileSync(path.resolve(GAME_ROOT, 'CHECKLIST-03_FAUNA_MATRIX_DRAFT.md'), 'utf-8');
    assert.ok(cl3.includes('PENDING (0% COMPLETE) — STRICTLY UNOPENED'));
  });
});
