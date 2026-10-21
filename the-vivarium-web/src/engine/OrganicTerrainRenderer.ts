import { Container, Graphics, Texture, TilingSprite } from 'pixi.js';
import { OrganicTerrainData } from './OrganicTerrainData';

export class OrganicTerrainRenderer {
  readonly container: Container;
  readonly terrainData: OrganicTerrainData;

  // Visual layers inside terrain container
  private cavityBackgroundGraphics: Graphics;
  private subterraneanObjectContainer: Container;
  private soilContainer: Container;
  private soilTilingLayer: TilingSprite | null = null;
  private soilTilingLayer2: TilingSprite | null = null;
  private clayTilingLayer: TilingSprite | null = null;
  private peatTilingLayer: TilingSprite | null = null;
  private pebbleTilingLayer: TilingSprite | null = null;

  private maskGraphics: Graphics;
  private rimContourGraphics: Graphics;
  private surfaceGrassRimGraphics: Graphics;
  private debugGridGraphics: Graphics;

  // Cached Marching Squares Grid & Densities
  private cachedDensity: Float32Array | null = null;
  private isDensityInitialized: boolean = false;

  // Telemetry tracking for QA & Benchmark
  public rebuildCount: number = 0;
  public totalRebuildTimeMs: number = 0;
  public lastRebuildDurationMs: number = 0;
  public rebuildDurations: number[] = [];

  constructor(terrainData: OrganicTerrainData) {
    this.terrainData = terrainData;
    this.container = new Container();

    // 1. Cavity Background (Dark ambient earth with warm red/amber observation glow)
    this.cavityBackgroundGraphics = new Graphics();
    this.container.addChild(this.cavityBackgroundGraphics);

    // 2. Subterranean Objects & Roots (Index 1: In front of cavity, behind soil)
    this.subterraneanObjectContainer = new Container();
    this.container.addChild(this.subterraneanObjectContainer);

    // 3. Soil Texture Tiling Group (Masked by organic terrain mask)
    this.soilContainer = new Container();
    this.container.addChild(this.soilContainer);

    this.maskGraphics = new Graphics();
    this.soilContainer.mask = this.maskGraphics;
    this.soilContainer.addChild(this.maskGraphics);

    // 4. Earthen Rim & Contact Shadows (Soft natural cutaway shading & loam border)
    this.rimContourGraphics = new Graphics();
    this.container.addChild(this.rimContourGraphics);

    // 5. Surface Grass Rim (Lush grass line on undulating horizon)
    this.surfaceGrassRimGraphics = new Graphics();
    this.container.addChild(this.surfaceGrassRimGraphics);

    // 6. Debug Grid Layer (Optional toggle)
    this.debugGridGraphics = new Graphics();
    this.container.addChild(this.debugGridGraphics);
  }

  addSubterraneanLayer(layer: Container): void {
    this.subterraneanObjectContainer.addChild(layer);
  }

  get avgRebuildDurationMs(): number {
    return this.rebuildCount > 0 ? this.totalRebuildTimeMs / this.rebuildCount : 0;
  }

  get maxRebuildDurationMs(): number {
    return this.rebuildDurations.length > 0 ? Math.max(...this.rebuildDurations) : 0;
  }

  get totalRebuildCpuTimeMs(): number {
    return this.totalRebuildTimeMs;
  }

  resetRebuildMetrics(): void {
    this.rebuildCount = 0;
    this.totalRebuildTimeMs = 0;
    this.lastRebuildDurationMs = 0;
    this.rebuildDurations = [];
  }

  setSoilTexture(tex: Texture): void {
    if (!this.soilTilingLayer) {
      this.soilTilingLayer = new TilingSprite({
        texture: tex,
        width: 2600,
        height: 1200,
      });
      this.soilTilingLayer.anchor.set(0.5, 0.0);
      this.soilTilingLayer.position.set(0, -60);
      this.soilTilingLayer.tileScale.set(0.5, 0.5);
      this.soilContainer.addChild(this.soilTilingLayer);
    }

    if (!this.soilTilingLayer2) {
      this.soilTilingLayer2 = new TilingSprite({
        texture: tex,
        width: 2600,
        height: 1200,
      });
      this.soilTilingLayer2.anchor.set(0.5, 0.0);
      this.soilTilingLayer2.position.set(37, -23);
      this.soilTilingLayer2.tileScale.set(0.48, 0.48);
      this.soilTilingLayer2.alpha = 0.28;
      this.soilContainer.addChild(this.soilTilingLayer2);
    }
  }

  setUndergroundStrata(clayTex: Texture, peatTex: Texture, pebbleTex?: Texture, blendMaskTex?: Texture): void {
    if (!this.clayTilingLayer) {
      this.clayTilingLayer = new TilingSprite({
        texture: clayTex,
        width: 2400,
        height: 380,
      });
      this.clayTilingLayer.anchor.set(0.5, 0.0);
      this.clayTilingLayer.position.set(0, 160); // Clay strata below loam
      this.clayTilingLayer.tileScale.set(0.5, 0.5);
      this.clayTilingLayer.alpha = 0.52;
      this.soilContainer.addChild(this.clayTilingLayer);
    }

    if (!this.peatTilingLayer) {
      this.peatTilingLayer = new TilingSprite({
        texture: peatTex,
        width: 2400,
        height: 480,
      });
      this.peatTilingLayer.anchor.set(0.5, 0.0);
      this.peatTilingLayer.position.set(0, 440); // Deep bedrock peat strata
      this.peatTilingLayer.tileScale.set(0.5, 0.5);
      this.peatTilingLayer.alpha = 0.68;
      this.soilContainer.addChild(this.peatTilingLayer);
    }

    // Organic transition blend layer at clay/peat boundary (Y: 420 - 480)
    if (blendMaskTex) {
      const blendLayer = new TilingSprite({
        texture: blendMaskTex,
        width: 2400,
        height: 120,
      });
      blendLayer.anchor.set(0.5, 0.5);
      blendLayer.position.set(0, 445);
      blendLayer.tileScale.set(0.65, 0.65);
      blendLayer.alpha = 0.42;
      this.soilContainer.addChild(blendLayer);
    }

    if (pebbleTex && !this.pebbleTilingLayer) {
      this.pebbleTilingLayer = new TilingSprite({
        texture: pebbleTex,
        width: 2400,
        height: 500,
      });
      this.pebbleTilingLayer.anchor.set(0.5, 0.0);
      this.pebbleTilingLayer.position.set(12, 120);
      this.pebbleTilingLayer.tileScale.set(0.45, 0.45);
      this.pebbleTilingLayer.alpha = 0.32;
      this.soilContainer.addChild(this.pebbleTilingLayer);
    }
  }

  rebuildTerrainMesh(showDebugGrid: boolean = false, dirtyBox?: { minX: number; maxX: number; minY: number; maxY: number }): void {
    const t0 = performance.now();
    const data = this.terrainData;
    const originX = data.originX;
    const originY = data.originY;
    const cs = data.cellSize;
    const totalW = data.cols * cs;
    const totalH = data.rows * cs;
    const rightX = originX + totalW + 100;
    const leftX = originX - 100;
    const bottomY = originY + totalH + 100;

    // Sub-grid step for marching squares (8px = 1/4 cell for hand-painted fluid curvature)
    const step = 8;
    const subCols = Math.floor(totalW / step);
    const subRows = Math.floor(totalH / step);


    // =========================================================================
    // 1. CAVE INTERIOR BACKGROUND (Subterranean ambient earth & observation glow)
    // =========================================================================
    this.cavityBackgroundGraphics.clear();
    const bgPts: { x: number; y: number }[] = [];
    bgPts.push({ x: leftX, y: bottomY });
    bgPts.push({ x: leftX, y: data.getSurfaceY(originX) });
    for (let x = originX; x <= originX + totalW; x += 16) {
      bgPts.push({ x, y: data.getSurfaceY(x) });
    }
    bgPts.push({ x: rightX, y: data.getSurfaceY(rightX) });
    bgPts.push({ x: rightX, y: bottomY });
    this.cavityBackgroundGraphics.poly(bgPts);
    this.cavityBackgroundGraphics.fill({ color: 0x140c08 }); // Warm deep umber bedrock

    // Fill warm ambient illumination in excavated spaces
    for (let r = 0; r < data.rows; r++) {
      for (let c = 0; c < data.cols; c++) {
        if (!data.isSolid(c, r)) {
          const wx = originX + (c + 0.5) * cs;
          const wy = originY + (r + 0.5) * cs;

          this.cavityBackgroundGraphics.rect(originX + c * cs, originY + r * cs, cs, cs);
          this.cavityBackgroundGraphics.fill({ color: 0x21130b, alpha: 0.96 });

          const distToQueen = Math.hypot(wx - 640, wy - 460);
          if (distToQueen < 140) {
            this.cavityBackgroundGraphics.circle(wx, wy, cs * 1.5);
            this.cavityBackgroundGraphics.fill({ color: 0x6e240c, alpha: 0.28 });
            this.cavityBackgroundGraphics.circle(wx, wy, cs * 0.8);
            this.cavityBackgroundGraphics.fill({ color: 0x9e3810, alpha: 0.18 });
          } else {
            if ((c + r) % 2 === 0) {
              this.cavityBackgroundGraphics.circle(wx, wy, cs * 1.3);
              this.cavityBackgroundGraphics.fill({ color: 0x4a180b, alpha: 0.22 });
              this.cavityBackgroundGraphics.circle(wx, wy, cs * 0.7);
              this.cavityBackgroundGraphics.fill({ color: 0x7a250c, alpha: 0.12 });
            }
          }
        }
      }
    }

    // =========================================================================
    // 2. MARCHING SQUARES ISOSURFACE CONTOURING & SOIL MASK (8px High Resolution)
    // =========================================================================
    const iso = 0.5;
    const totalPoints = (subCols + 1) * (subRows + 1);
    if (!this.cachedDensity || this.cachedDensity.length !== totalPoints) {
      this.cachedDensity = new Float32Array(totalPoints);
      this.isDensityInitialized = false;
    }
    const density = this.cachedDensity;

    let updateMinI = 0;
    let updateMaxI = subCols;
    let updateMinJ = 0;
    let updateMaxJ = subRows;

    if (this.isDensityInitialized && dirtyBox) {
      const margin = cs * 2;
      updateMinI = Math.max(0, Math.floor((dirtyBox.minX - margin - originX) / step));
      updateMaxI = Math.min(subCols, Math.ceil((dirtyBox.maxX + margin - originX) / step));
      updateMinJ = Math.max(0, Math.floor((dirtyBox.minY - margin - originY) / step));
      updateMaxJ = Math.min(subRows, Math.ceil((dirtyBox.maxY + margin - originY) / step));
    }

    // Update only dirty vertices
    for (let j = updateMinJ; j <= updateMaxJ; j++) {
      const wy = originY + j * step;
      const rowOffset = j * (subCols + 1);
      for (let i = updateMinI; i <= updateMaxI; i++) {
        const wx = originX + i * step;
        density[rowOffset + i] = data.getSmoothedDensity(wx, wy);
      }
    }
    this.isDensityInitialized = true;

    this.maskGraphics.clear();
    const boundarySegments: { x1: number; y1: number; x2: number; y2: number }[] = [];

    const lerp = (v0: number, v1: number) => {
      const denom = v1 - v0;
      if (Math.abs(denom) < 0.0001) return 0.5;
      return Math.max(0.0, Math.min(1.0, (iso - v0) / denom));
    };

    // HIGH PERFORMANCE RUN-LENGTH ENCODED MARCHING SQUARES
    for (let j = 0; j < subRows; j++) {
      const y0 = originY + j * step;
      const y1 = y0 + step;
      const rowIdx = j * (subCols + 1);
      const nextRowIdx = rowIdx + (subCols + 1);

      let runStartX = -1;
      let runWidth = 0;

      for (let i = 0; i < subCols; i++) {
        const x0 = originX + i * step;
        const x1 = x0 + step;

        const dTL = density[rowIdx + i];
        const dTR = density[rowIdx + i + 1];
        const dBL = density[nextRowIdx + i];
        const dBR = density[nextRowIdx + i + 1];

        const bTL = dTL >= iso ? 1 : 0;
        const bTR = dTR >= iso ? 1 : 0;
        const bBR = dBR >= iso ? 1 : 0;
        const bBL = dBL >= iso ? 1 : 0;
        const caseIdx = (bTL << 3) | (bTR << 2) | (bBR << 1) | bBL;

        if (caseIdx === 15) {
          if (runStartX === -1) {
            runStartX = x0;
            runWidth = step;
          } else {
            runWidth += step;
          }
        } else {
          if (runStartX !== -1) {
            this.maskGraphics.rect(runStartX - 0.2, y0 - 0.2, runWidth + 0.4, step + 0.4);
            runStartX = -1;
            runWidth = 0;
          }

          if (caseIdx === 0) continue;

          const topX = x0 + step * lerp(dTL, dTR);
          const rightY = y0 + step * lerp(dTR, dBR);
          const bottomX = x0 + step * lerp(dBL, dBR);
          const leftY = y0 + step * lerp(dTL, dBL);

          let polyPts: { x: number; y: number }[] = [];

          switch (caseIdx) {
            case 1:
              polyPts = [{ x: x0, y: y1 }, { x: x0, y: leftY }, { x: bottomX, y: y1 }];
              boundarySegments.push({ x1: x0, y1: leftY, x2: bottomX, y2: y1 });
              break;
            case 2:
              polyPts = [{ x: x1, y: y1 }, { x: bottomX, y: y1 }, { x: x1, y: rightY }];
              boundarySegments.push({ x1: bottomX, y1: y1, x2: x1, y2: rightY });
              break;
            case 3:
              polyPts = [{ x: x0, y: y1 }, { x: x0, y: leftY }, { x: x1, y: rightY }, { x: x1, y: y1 }];
              boundarySegments.push({ x1: x0, y1: leftY, x2: x1, y2: rightY });
              break;
            case 4:
              polyPts = [{ x: x1, y: y0 }, { x: x1, y: rightY }, { x: topX, y: y0 }];
              boundarySegments.push({ x1: topX, y1: y0, x2: x1, y2: rightY });
              break;
            case 5:
              polyPts = [{ x: x0, y: y1 }, { x: x0, y: leftY }, { x: bottomX, y: y1 }];
              this.maskGraphics.poly(polyPts);
              polyPts = [{ x: x1, y: y0 }, { x: x1, y: rightY }, { x: topX, y: y0 }];
              boundarySegments.push({ x1: x0, y1: leftY, x2: bottomX, y2: y1 });
              boundarySegments.push({ x1: topX, y1: y0, x2: x1, y2: rightY });
              break;
            case 6:
              polyPts = [{ x: x1, y: y0 }, { x: topX, y: y0 }, { x: bottomX, y: y1 }, { x: x1, y: y1 }];
              boundarySegments.push({ x1: topX, y1: y0, x2: bottomX, y2: y1 });
              break;
            case 7:
              polyPts = [{ x: x1, y: y0 }, { x: topX, y: y0 }, { x: x0, y: leftY }, { x: x0, y: y1 }, { x: x1, y: y1 }];
              boundarySegments.push({ x1: topX, y1: y0, x2: x0, y2: leftY });
              break;
            case 8:
              polyPts = [{ x: x0, y: y0 }, { x: topX, y: y0 }, { x: x0, y: leftY }];
              boundarySegments.push({ x1: x0, y1: leftY, x2: topX, y2: y0 });
              break;
            case 9:
              polyPts = [{ x: x0, y: y0 }, { x: topX, y: y0 }, { x: bottomX, y: y1 }, { x: x0, y: y1 }];
              boundarySegments.push({ x1: topX, y1: y0, x2: bottomX, y2: y1 });
              break;
            case 10:
              polyPts = [{ x: x0, y: y0 }, { x: topX, y: y0 }, { x: x0, y: leftY }];
              this.maskGraphics.poly(polyPts);
              polyPts = [{ x: x1, y: y1 }, { x: bottomX, y: y1 }, { x: x1, y: rightY }];
              boundarySegments.push({ x1: x0, y1: leftY, x2: topX, y2: y0 });
              boundarySegments.push({ x1: bottomX, y1: y1, x2: x1, y2: rightY });
              break;
            case 11:
              polyPts = [{ x: x0, y: y0 }, { x: topX, y: y0 }, { x: x1, y: rightY }, { x: x1, y: y1 }, { x: x0, y: y1 }];
              boundarySegments.push({ x1: topX, y1: y0, x2: x1, y2: rightY });
              break;
            case 12:
              polyPts = [{ x: x0, y: y0 }, { x: x1, y: y0 }, { x: x1, y: rightY }, { x: x0, y: leftY }];
              boundarySegments.push({ x1: x0, y1: leftY, x2: x1, y2: rightY });
              break;
            case 13:
              polyPts = [{ x: x0, y: y0 }, { x: x1, y: y0 }, { x: x1, y: rightY }, { x: bottomX, y: y1 }, { x: x0, y: y1 }];
              boundarySegments.push({ x1: bottomX, y1: y1, x2: x1, y2: rightY });
              break;
            case 14:
              polyPts = [{ x: x0, y: y0 }, { x: x1, y: y0 }, { x: x1, y: y1 }, { x: bottomX, y: y1 }, { x: x0, y: leftY }];
              boundarySegments.push({ x1: x0, y1: leftY, x2: bottomX, y2: y1 });
              break;
          }

          if (polyPts.length > 0) {
            this.maskGraphics.poly(polyPts);
          }
        }
      }
      if (runStartX !== -1) {
        this.maskGraphics.rect(runStartX - 0.2, y0 - 0.2, runWidth + 0.4, step + 0.4);
      }
    }

    // SINGLE BATCHED FILL CALL FOR ENTIRE MESH MASK!
    this.maskGraphics.fill({ color: 0xffffff });

    // =========================================================================
    // 3. ORGANIC NATURAL CUTAWAY SHADING (Reduced contrast, soft warm umber)
    // =========================================================================
    this.rimContourGraphics.clear();

    const caveSegments = boundarySegments.filter((seg) => {
      const midX = (seg.x1 + seg.x2) * 0.5;
      const midY = (seg.y1 + seg.y2) * 0.5;
      return midY >= data.getSurfaceY(midX) - 4;
    });

    // Layer 1: Soft Contact Ambient Occlusion Shadow into cave void
    for (const seg of caveSegments) {
      this.rimContourGraphics.moveTo(seg.x1, seg.y1);
      this.rimContourGraphics.lineTo(seg.x2, seg.y2);
    }
    this.rimContourGraphics.stroke({ color: 0x160c07, width: 5.5, alpha: 0.45, cap: 'round', join: 'round' });

    // Layer 2: Compact Humus / Damp Loam Cutaway Rim
    for (const seg of caveSegments) {
      this.rimContourGraphics.moveTo(seg.x1, seg.y1);
      this.rimContourGraphics.lineTo(seg.x2, seg.y2);
    }
    this.rimContourGraphics.stroke({ color: 0x2e1a10, width: 2.8, alpha: 0.75, cap: 'round', join: 'round' });

    // Layer 3: Organic Modulated Mineral Edge
    for (let s = 0; s < caveSegments.length; s++) {
      const seg = caveSegments[s];
      if ((s + Math.floor(seg.x1 * 0.1)) % 3 !== 0) {
        this.rimContourGraphics.moveTo(seg.x1, seg.y1);
        this.rimContourGraphics.lineTo(seg.x2, seg.y2);
      }
    }
    this.rimContourGraphics.stroke({ color: 0x4a2d1d, width: 1.4, alpha: 0.65, cap: 'round', join: 'round' });

    // Subtle micro-pebbles and tiny earthen crumbs along perimeter
    let pebbleCounter = 0;
    for (const seg of caveSegments) {
      pebbleCounter++;
      if (pebbleCounter % 9 === 0) {
        const mx = (seg.x1 + seg.x2) * 0.5;
        const my = (seg.y1 + seg.y2) * 0.5;
        const rad = 1.2 + ((pebbleCounter * 7) % 10) * 0.08;
        this.rimContourGraphics.circle(mx, my, rad);
        this.rimContourGraphics.fill({ color: 0x593826, alpha: 0.60 });
      }
    }

    // =========================================================================
    // 4. SURFACE GRASS RIM (Lush natural rolling grass line)
    // =========================================================================
    this.surfaceGrassRimGraphics.clear();
    this.surfaceGrassRimGraphics.moveTo(leftX, data.getSurfaceY(leftX));
    for (let x = leftX; x <= rightX; x += 12) {
      this.surfaceGrassRimGraphics.lineTo(x, data.getSurfaceY(x));
    }
    this.surfaceGrassRimGraphics.stroke({ color: 0x1b4332, width: 5, alpha: 0.95, cap: 'round', join: 'round' });

    this.surfaceGrassRimGraphics.moveTo(leftX, data.getSurfaceY(leftX) - 1.5);
    for (let x = leftX; x <= rightX; x += 12) {
      this.surfaceGrassRimGraphics.lineTo(x, data.getSurfaceY(x) - 1.5);
    }
    this.surfaceGrassRimGraphics.stroke({ color: 0x40916c, width: 2.5, alpha: 0.9, cap: 'round', join: 'round' });

    // =========================================================================
    // 5. DEBUG VISUALIZATION LAYER
    // =========================================================================
    this.debugGridGraphics.clear();
    if (showDebugGrid) {
      for (let r = 0; r < data.rows; r++) {
        for (let c = 0; c < data.cols; c++) {
          const x = originX + c * cs;
          const y = originY + r * cs;
          if (data.isSolid(c, r)) {
            this.debugGridGraphics.rect(x + 1, y + 1, cs - 2, cs - 2);
            this.debugGridGraphics.fill({ color: 0x10b981, alpha: 0.15 });
          } else {
            this.debugGridGraphics.rect(x + 1, y + 1, cs - 2, cs - 2);
            this.debugGridGraphics.fill({ color: 0x38bdf8, alpha: 0.25 });
          }
        }
      }

      for (let r = 0; r <= data.rows; r++) {
        const y = originY + r * cs;
        this.debugGridGraphics.moveTo(originX, y);
        this.debugGridGraphics.lineTo(originX + totalW, y);
        this.debugGridGraphics.stroke({ color: 0xffffff, width: 1, alpha: 0.12 });
      }
      for (let c = 0; c <= data.cols; c++) {
        const x = originX + c * cs;
        this.debugGridGraphics.moveTo(x, originY);
        this.debugGridGraphics.lineTo(x, originY + totalH);
        this.debugGridGraphics.stroke({ color: 0xffffff, width: 1, alpha: 0.12 });
      }

      for (const seg of caveSegments) {
        this.debugGridGraphics.moveTo(seg.x1, seg.y1);
        this.debugGridGraphics.lineTo(seg.x2, seg.y2);
      }
      this.debugGridGraphics.stroke({ color: 0xf97316, width: 2.0, alpha: 0.95 });
    }

    const dt = performance.now() - t0;
    this.rebuildCount++;
    this.lastRebuildDurationMs = dt;
    this.totalRebuildTimeMs += dt;
    this.rebuildDurations.push(dt);
  }
}
