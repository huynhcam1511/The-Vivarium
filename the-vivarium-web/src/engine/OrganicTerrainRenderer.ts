import { Container, Graphics, Texture, TilingSprite } from 'pixi.js';
import { OrganicTerrainData } from './OrganicTerrainData';

export class OrganicTerrainRenderer {
  readonly container: Container;
  readonly terrainData: OrganicTerrainData;

  // Visual layers inside terrain container
  private soilTilingLayer: TilingSprite | null = null;
  private soilTilingLayer2: TilingSprite | null = null;
  private maskGraphics: Graphics;
  private cavityBackgroundGraphics: Graphics;
  private rimContourGraphics: Graphics;
  private surfaceGrassRimGraphics: Graphics;
  private debugGridGraphics: Graphics;

  constructor(terrainData: OrganicTerrainData) {
    this.terrainData = terrainData;
    this.container = new Container();

    // 1. Cavity Background (Dark ambient earth with warm red/amber observation glow)
    this.cavityBackgroundGraphics = new Graphics();
    this.container.addChild(this.cavityBackgroundGraphics);

    // 2. Soil Texture Tiling Group (Masked by organic terrain mask)
    const soilContainer = new Container();
    this.container.addChild(soilContainer);

    this.maskGraphics = new Graphics();
    soilContainer.mask = this.maskGraphics;
    soilContainer.addChild(this.maskGraphics);

    // 3. Earthen Rim & Contact Shadows (Soft natural cutaway shading & loam border)
    this.rimContourGraphics = new Graphics();
    this.container.addChild(this.rimContourGraphics);

    // 4. Surface Grass Rim (Lush grass line on undulating horizon)
    this.surfaceGrassRimGraphics = new Graphics();
    this.container.addChild(this.surfaceGrassRimGraphics);

    // 5. Debug Grid Layer (Optional toggle)
    this.debugGridGraphics = new Graphics();
    this.container.addChild(this.debugGridGraphics);
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
      (this.maskGraphics.parent as Container).addChild(this.soilTilingLayer);
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
      (this.maskGraphics.parent as Container).addChild(this.soilTilingLayer2);
    }
  }

  /**
   * TASK-015 Polish:
   * 1. 8px High-Density Sub-Grid Marching Squares (Silky smooth contours, no 32px staircase).
   * 2. Natural soft cutaway shading: low contrast warm dark brown/umber instead of pipe strokes.
   * 3. Thickness & color modulation along cave perimeters.
   * 4. Multi-zone interior ambient lighting: Cozy reddish glow in living & royal chambers, deep dark in narrow shafts.
   */
  rebuildTerrainMesh(showDebugGrid: boolean = false): void {
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
    // Base subterranean dark earthen bedrock below surface profile
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

          // Base cavity fill with rich warm dark soil tone
          this.cavityBackgroundGraphics.rect(originX + c * cs, originY + r * cs, cs, cs);
          this.cavityBackgroundGraphics.fill({ color: 0x21130b, alpha: 0.96 });

          // Royal Queen Chamber (X ~ 640, Y ~ 460) has extra warm golden-amber royal glow
          const distToQueen = Math.hypot(wx - 640, wy - 460);
          if (distToQueen < 140) {
            this.cavityBackgroundGraphics.circle(wx, wy, cs * 1.5);
            this.cavityBackgroundGraphics.fill({ color: 0x6e240c, alpha: 0.28 });
            this.cavityBackgroundGraphics.circle(wx, wy, cs * 0.8);
            this.cavityBackgroundGraphics.fill({ color: 0x9e3810, alpha: 0.18 });
          } else {
            // General chamber observation red glow (660nm)
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
    const density: Float32Array = new Float32Array((subCols + 1) * (subRows + 1));

    for (let j = 0; j <= subRows; j++) {
      const wy = originY + j * step;
      for (let i = 0; i <= subCols; i++) {
        const wx = originX + i * step;
        density[j * (subCols + 1) + i] = data.getSmoothedDensity(wx, wy);
      }
    }

    this.maskGraphics.clear();
    const boundarySegments: { x1: number; y1: number; x2: number; y2: number }[] = [];

    // Marching Squares polygon generation
    for (let j = 0; j < subRows; j++) {
      const y0 = originY + j * step;
      const y1 = y0 + step;

      for (let i = 0; i < subCols; i++) {
        const x0 = originX + i * step;
        const x1 = x0 + step;

        const idx = j * (subCols + 1) + i;
        const dTL = density[idx];
        const dTR = density[idx + 1];
        const dBL = density[idx + (subCols + 1)];
        const dBR = density[idx + (subCols + 1) + 1];

        const bTL = dTL >= iso ? 1 : 0;
        const bTR = dTR >= iso ? 1 : 0;
        const bBR = dBR >= iso ? 1 : 0;
        const bBL = dBL >= iso ? 1 : 0;
        const caseIdx = (bTL << 3) | (bTR << 2) | (bBR << 1) | bBL;

        if (caseIdx === 0) continue;

        if (caseIdx === 15) {
          this.maskGraphics.rect(x0 - 0.2, y0 - 0.2, step + 0.4, step + 0.4);
          this.maskGraphics.fill({ color: 0xffffff });
          continue;
        }

        const lerp = (v0: number, v1: number) => {
          const denom = v1 - v0;
          if (Math.abs(denom) < 0.0001) return 0.5;
          return Math.max(0.0, Math.min(1.0, (iso - v0) / denom));
        };

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
            this.maskGraphics.fill({ color: 0xffffff });
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
            this.maskGraphics.fill({ color: 0xffffff });
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
          this.maskGraphics.fill({ color: 0xffffff });
        }
      }
    }

    // =========================================================================
    // 3. ORGANIC NATURAL CUTAWAY SHADING (Reduced contrast, soft warm umber)
    // =========================================================================
    // Game Director Requirement #3: Giảm độ dày & độ tương phản viền đen,
    // giống mặt cắt đất thật với bóng tiếp xúc mềm, không giống đường ống có viền.
    this.rimContourGraphics.clear();

    const caveSegments = boundarySegments.filter((seg) => {
      const midX = (seg.x1 + seg.x2) * 0.5;
      const midY = (seg.y1 + seg.y2) * 0.5;
      return midY >= data.getSurfaceY(midX) - 4;
    });

    // Layer 1: Soft Contact Ambient Occlusion Shadow into cave void (Wide & Diffuse, Low Opacity)
    for (const seg of caveSegments) {
      this.rimContourGraphics.moveTo(seg.x1, seg.y1);
      this.rimContourGraphics.lineTo(seg.x2, seg.y2);
    }
    this.rimContourGraphics.stroke({ color: 0x160c07, width: 5.5, alpha: 0.45, cap: 'round', join: 'round' });

    // Layer 2: Compact Humus / Damp Loam Cutaway Rim (Warm Dark Brown #2c1a11 instead of pitch black #000)
    for (const seg of caveSegments) {
      this.rimContourGraphics.moveTo(seg.x1, seg.y1);
      this.rimContourGraphics.lineTo(seg.x2, seg.y2);
    }
    this.rimContourGraphics.stroke({ color: 0x2e1a10, width: 2.8, alpha: 0.75, cap: 'round', join: 'round' });

    // Layer 3: Organic Modulated Mineral Edge (Warm peat highlight #4a2c1a, modulating in width)
    for (let s = 0; s < caveSegments.length; s++) {
      const seg = caveSegments[s];
      // Subtle organic stroke modulation along boundary
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

      // Smooth Marching Squares boundary segments in bright orange
      for (const seg of caveSegments) {
        this.debugGridGraphics.moveTo(seg.x1, seg.y1);
        this.debugGridGraphics.lineTo(seg.x2, seg.y2);
      }
      this.debugGridGraphics.stroke({ color: 0xf97316, width: 2.0, alpha: 0.95 });
    }
  }
}
