import { Container, Graphics, Rectangle, Sprite, Texture, TilingSprite } from 'pixi.js';
import type { AquaticSystem } from './AquaticSystem';

export class AquaticRenderer {
  readonly container: Container;

  // Render Sub-layers
  private waterfallBackdropGraphics: Graphics;
  private waterfallStreamGraphics: Graphics;
  private waterfallAnimatedSprite: Sprite | null = null;
  private waterfallFrames: Texture[] = [];
  private waterfallFrameTimer: number = 0;
  private currentWaterfallFrame: number = 0;

  private lakeSedimentMudGraphics: Graphics;
  private lakeSedimentMudTiling: TilingSprite | null = null;
  private lakeSedimentMudMask: Graphics;

  private submergedFloraGraphics: Graphics;
  private deepWaterGraphics: Graphics;
  private midWaterGraphics: Graphics;
  private bubblesGraphics: Graphics;
  private fishesGraphics: Graphics;
  private surfaceWaterGraphics: Graphics;
  private surfaceFloraGraphics: Graphics;
  private surfaceFloraSpriteContainer: Container;
  private waterfowlGraphics: Graphics;
  private foamParticlesGraphics: Graphics;

  // Real PACK-004 Textures
  private bluebellTex: Texture | null = null;
  private mossTex: Texture | null = null;
  private fernTex: Texture | null = null;

  private sim: AquaticSystem;
  private lakeBasinRendered: boolean = false;
  private cachedBasinHash: string = '';

  public invalidateLakeBasin(): void {
    this.lakeBasinRendered = false;
    this.cachedBasinHash = '';
  }

  constructor(sim: AquaticSystem) {
    this.sim = sim;
    this.container = new Container();

    this.waterfallBackdropGraphics = new Graphics();
    this.waterfallStreamGraphics = new Graphics();

    this.lakeSedimentMudGraphics = new Graphics();
    this.lakeSedimentMudMask = new Graphics();

    this.submergedFloraGraphics = new Graphics();
    this.deepWaterGraphics = new Graphics();
    this.midWaterGraphics = new Graphics();
    this.bubblesGraphics = new Graphics();
    this.fishesGraphics = new Graphics();
    this.surfaceWaterGraphics = new Graphics();
    this.surfaceFloraGraphics = new Graphics();
    this.surfaceFloraSpriteContainer = new Container();
    this.waterfowlGraphics = new Graphics();
    this.foamParticlesGraphics = new Graphics();

    // Layer stack order
    this.container.addChild(this.waterfallBackdropGraphics);
    this.container.addChild(this.lakeSedimentMudGraphics);
    this.container.addChild(this.lakeSedimentMudMask);
    this.container.addChild(this.deepWaterGraphics);
    this.container.addChild(this.submergedFloraGraphics);
    this.container.addChild(this.midWaterGraphics);
    this.container.addChild(this.fishesGraphics);
    this.container.addChild(this.bubblesGraphics);
    this.container.addChild(this.waterfallStreamGraphics);
    this.container.addChild(this.surfaceWaterGraphics);
    this.container.addChild(this.surfaceFloraGraphics);
    this.container.addChild(this.surfaceFloraSpriteContainer);
    this.container.addChild(this.waterfowlGraphics);
    this.container.addChild(this.foamParticlesGraphics);
  }

  // PACK-004 Texture Integration
  public setAquaticTextures(textures: {
    mudTex?: Texture;
    waterfallStreamTex?: Texture;
    bluebellTex?: Texture;
    mossTex?: Texture;
    fernTex?: Texture;
  }): void {
    if (textures.mudTex && !this.lakeSedimentMudTiling) {
      // mudTex bound to tiling
      this.lakeSedimentMudTiling = new TilingSprite({
        texture: textures.mudTex,
        width: 1400,
        height: 250,
      });
      this.lakeSedimentMudTiling.position.set(this.sim.config.basinMinX - 50, this.sim.config.surfaceBaseY);
      this.lakeSedimentMudTiling.tileScale.set(0.65, 0.65);
      this.lakeSedimentMudTiling.mask = this.lakeSedimentMudMask;
      this.container.addChildAt(this.lakeSedimentMudTiling, this.container.getChildIndex(this.lakeSedimentMudMask) + 1);
    }

    if (textures.waterfallStreamTex && !this.waterfallAnimatedSprite) {
      // waterfallStreamTex sliced
      // Slice vertical 6-frame sprite sheet (128x2640 -> 6 frames of 128x440)
      const baseTex = textures.waterfallStreamTex.source;
      const frameW = 128;
      const frameH = 440;
      this.waterfallFrames = [];
      for (let i = 0; i < 6; i++) {
        const frameTexture = new Texture({
          source: baseTex,
          frame: new Rectangle(0, i * frameH, frameW, frameH),
        });
        this.waterfallFrames.push(frameTexture);
      }

      this.waterfallAnimatedSprite = new Sprite(this.waterfallFrames[0]);
      this.waterfallAnimatedSprite.anchor.set(0.5, 0.0);
      const wfX = this.sim.config.waterfallX;
      const topY = this.sim.config.waterfallTopY;
      const botY = this.sim.sampleWaterSurfaceY(wfX);
      this.waterfallAnimatedSprite.position.set(wfX, topY);
      this.waterfallAnimatedSprite.width = this.sim.config.waterfallWidth * 1.5;
      this.waterfallAnimatedSprite.height = botY - topY + 10;
      this.waterfallAnimatedSprite.alpha = 0.88;
      this.container.addChildAt(this.waterfallAnimatedSprite, this.container.getChildIndex(this.waterfallStreamGraphics) + 1);
    }

    if (textures.bluebellTex) this.bluebellTex = textures.bluebellTex;
    if (textures.mossTex) this.mossTex = textures.mossTex;
    if (textures.fernTex) this.fernTex = textures.fernTex;

    // Build real sprites for flora list
    if (this.bluebellTex || this.mossTex || this.fernTex) {
      this.surfaceFloraSpriteContainer.removeChildren();
      for (const flora of this.sim.floraList) {
        if (flora.type === 'SUBMERGED_REED') continue;
        let tex: Texture | null = null;
        if (flora.type === 'BLUEBELL' && this.bluebellTex) tex = this.bluebellTex;
        else if (flora.type === 'MOSS_PATCH' && this.mossTex) tex = this.mossTex;
        else if (flora.type === 'FERN_CLUSTER' && this.fernTex) tex = this.fernTex;

        if (tex) {
          const spr = new Sprite(tex);
          spr.anchor.set(0.5, 0.95);
          spr.scale.set(flora.scale * 0.42);
          spr.position.set(flora.x, flora.y + 4);
          this.surfaceFloraSpriteContainer.addChild(spr);
        }
      }
    }
  }

  update(dt: number): void {
    this.renderWaterfall(dt);
    const currentBasinHash = `${this.sim.config.basinMinX}_${this.sim.config.basinMaxX}_${this.sim.config.surfaceBaseY}_${this.sim.config.maxDepth}`;
    if (!this.lakeBasinRendered || this.cachedBasinHash !== currentBasinHash) {
      this.renderLakeBasinAndSediment();
      this.lakeBasinRendered = true;
      this.cachedBasinHash = currentBasinHash;
    }
    this.renderSubmergedFlora();
    this.renderWaterColumns();
    this.renderBubbles();
    this.renderFishes();
    this.renderWaterSurface();
    this.renderSurfaceFlora(dt);
    this.renderWaterfowl();
    this.renderFoam();
  }

  // 1. RENDER PROCEDURAL WATERFALL STREAM & GORGE WITH ANIMATED SPRITE SHEET
  private renderWaterfall(dt: number = 0.016): void {
    const wfX = this.sim.config.waterfallX;
    const topY = this.sim.config.waterfallTopY;
    const botY = this.sim.sampleWaterSurfaceY(wfX);
    const width = this.sim.config.waterfallWidth;

    this.waterfallBackdropGraphics.clear();
    // Natural eroded wet gorge rock contour behind waterfall
    const gorgePts: { x: number; y: number }[] = [];
    const gSteps = 16;
    for (let s = 0; s <= gSteps; s++) {
      const t = s / gSteps;
      const y = topY - 10 + (botY - topY + 22) * t;
      const taper = Math.sin(t * Math.PI) * (width * 0.25);
      const x = wfX - width * 0.65 - taper + Math.sin(t * 8) * 3;
      gorgePts.push({ x, y });
    }
    for (let s = gSteps; s >= 0; s--) {
      const t = s / gSteps;
      const y = topY - 10 + (botY - topY + 22) * t;
      const taper = Math.sin(t * Math.PI) * (width * 0.25);
      const x = wfX + width * 0.65 + taper - Math.sin(t * 8) * 3;
      gorgePts.push({ x, y });
    }
    this.waterfallBackdropGraphics.poly(gorgePts);
    this.waterfallBackdropGraphics.fill({ color: 0x18222d, alpha: 0.88 });

    // Animate Real PACK-004 6-Frame Waterfall Sprite Sheet
    if (this.waterfallAnimatedSprite && this.waterfallFrames.length === 6) {
      this.waterfallStreamGraphics.clear();
      this.waterfallFrameTimer += dt;
      if (this.waterfallFrameTimer >= 0.09) {
        this.waterfallFrameTimer = 0;
        this.currentWaterfallFrame = (this.currentWaterfallFrame + 1) % 6;
        this.waterfallAnimatedSprite.texture = this.waterfallFrames[this.currentWaterfallFrame];
      }
      this.waterfallAnimatedSprite.height = botY - topY + 6;
      return;
    }

    // Procedural Fallback
    this.waterfallStreamGraphics.clear();
    const time = this.sim.timeElapsed;
    for (let i = 0; i < 4; i++) {
      const offsetX = (i - 1.5) * (width * 0.22);
      const waveOffset = Math.sin(time * 12 + i * 1.5) * 2.5;

      this.waterfallStreamGraphics.moveTo(wfX + offsetX, topY);
      this.waterfallStreamGraphics.bezierCurveTo(
        wfX + offsetX + waveOffset, topY + (botY - topY) * 0.35,
        wfX + offsetX - waveOffset, topY + (botY - topY) * 0.75,
        wfX + offsetX + waveOffset * 0.5, botY
      );
      this.waterfallStreamGraphics.stroke({
        color: i % 2 === 0 ? 0xbae6fd : 0xe0f2fe,
        width: 4 + (i % 2) * 2,
        alpha: 0.75 + Math.sin(time * 8 + i) * 0.15,
      });
    }

    const veilPts: { x: number; y: number }[] = [];
    const vSteps = 12;
    for (let s = 0; s <= vSteps; s++) {
      const t = s / vSteps;
      const y = topY + (botY - topY) * t;
      const flare = Math.sin(t * Math.PI * 0.8) * (width * 0.15);
      veilPts.push({ x: wfX - width * 0.42 - flare, y });
    }
    for (let s = vSteps; s >= 0; s--) {
      const t = s / vSteps;
      const y = topY + (botY - topY) * t;
      const flare = Math.sin(t * Math.PI * 0.8) * (width * 0.15);
      veilPts.push({ x: wfX + width * 0.42 + flare, y });
    }
    this.waterfallStreamGraphics.poly(veilPts);
    this.waterfallStreamGraphics.fill({ color: 0x2a6f97, alpha: 0.30 });
  }

  // 2. RENDER LAKE BASIN & SEDIMENT MUD LAYER
  private renderLakeBasinAndSediment(): void {
    const minX = this.sim.config.basinMinX;
    const maxX = this.sim.config.basinMaxX;
    const baseY = this.sim.config.surfaceBaseY;
    const maxDepth = this.sim.config.maxDepth;

    this.lakeSedimentMudGraphics.clear();
    this.lakeSedimentMudMask.clear();

    const sedimentPoints: { x: number; y: number }[] = [];
    sedimentPoints.push({ x: minX, y: baseY });

    const steps = 30;
    for (let s = 0; s <= steps; s++) {
      const t = s / steps;
      const x = minX + (maxX - minX) * t;
      const depthFactor = Math.sin(t * Math.PI);
      const y = baseY + 20 + depthFactor * (maxDepth - 20);
      sedimentPoints.push({ x, y });
    }
    sedimentPoints.push({ x: maxX, y: baseY });
    for (let s = steps; s >= 0; s--) {
      const t = s / steps;
      const x = minX + (maxX - minX) * t;
      const depthFactor = Math.sin(t * Math.PI);
      const y = baseY + 36 + depthFactor * (maxDepth - 6);
      sedimentPoints.push({ x, y });
    }

    // Mask for real mud texture or procedural base
    this.lakeSedimentMudMask.poly(sedimentPoints);
    this.lakeSedimentMudMask.fill({ color: 0xffffff });

    this.lakeSedimentMudGraphics.poly(sedimentPoints);
    this.lakeSedimentMudGraphics.fill({ color: 0x1f1610 });

    this.lakeSedimentMudGraphics.poly(sedimentPoints.slice(0, steps + 3));
    this.lakeSedimentMudGraphics.stroke({ color: 0x2e2017, width: 4, alpha: 0.9 });
  }

  // 3. RENDER SUBMERGED FLORA (BENTHIC VALLISNERIA / REEDS)
  private renderSubmergedFlora(): void {
    this.submergedFloraGraphics.clear();
    for (const flora of this.sim.floraList) {
      if (flora.type !== 'SUBMERGED_REED') continue;

      const sway = Math.sin(flora.swayPhase) * (18 * flora.swayAmplitude);
      const h = 75 * flora.scale;

      this.submergedFloraGraphics.moveTo(flora.x, flora.y);
      this.submergedFloraGraphics.bezierCurveTo(
        flora.x + sway * 0.4, flora.y - h * 0.4,
        flora.x + sway * 0.8, flora.y - h * 0.7,
        flora.x + sway, flora.y - h
      );
      this.submergedFloraGraphics.stroke({
        color: 0x1e5e4e,
        width: 5 * flora.scale,
        alpha: 0.85,
        cap: 'round',
      });

      this.submergedFloraGraphics.moveTo(flora.x + 4, flora.y);
      this.submergedFloraGraphics.bezierCurveTo(
        flora.x + 4 - sway * 0.3, flora.y - h * 0.35,
        flora.x + 4 - sway * 0.6, flora.y - h * 0.65,
        flora.x + 4 - sway * 0.8, flora.y - h * 0.85
      );
      this.submergedFloraGraphics.stroke({
        color: 0x2ec4b6,
        width: 3 * flora.scale,
        alpha: 0.75,
        cap: 'round',
      });
    }
  }

  // 4. RENDER DEEP & MID WATER GRADIENT COLUMNS
  private renderWaterColumns(): void {
    const minX = this.sim.config.basinMinX;
    const maxX = this.sim.config.basinMaxX;
    const maxDepth = this.sim.config.maxDepth;

    this.deepWaterGraphics.clear();
    const deepPoints: { x: number; y: number }[] = [];
    const steps = 30;

    for (let s = 0; s <= steps; s++) {
      const t = s / steps;
      const x = minX + (maxX - minX) * t;
      const surfY = this.sim.sampleWaterSurfaceY(x);
      deepPoints.push({ x, y: surfY });
    }

    for (let s = steps; s >= 0; s--) {
      const t = s / steps;
      const x = minX + (maxX - minX) * t;
      const depthFactor = Math.sin(t * Math.PI);
      const y = this.sim.config.surfaceBaseY + 20 + depthFactor * (maxDepth - 20);
      deepPoints.push({ x, y });
    }

    this.deepWaterGraphics.poly(deepPoints);
    this.deepWaterGraphics.fill({ color: 0x0f2a3f, alpha: 0.78 * this.sim.waterClarity });

    this.midWaterGraphics.clear();
    this.midWaterGraphics.poly(deepPoints);
    this.midWaterGraphics.fill({ color: 0x1b4965, alpha: 0.45 * this.sim.waterClarity });
  }

  // 5. RENDER SUBMERGED BUBBLES
  private renderBubbles(): void {
    this.bubblesGraphics.clear();
    for (const b of this.sim.bubbles) {
      this.bubblesGraphics.circle(b.x, b.y, b.radius);
      this.bubblesGraphics.fill({ color: 0xe0f2fe, alpha: b.alpha });
      this.bubblesGraphics.circle(b.x - b.radius * 0.3, b.y - b.radius * 0.3, b.radius * 0.35);
      this.bubblesGraphics.fill({ color: 0xffffff, alpha: b.alpha + 0.2 });
    }
  }

  // 6. RENDER HIGH-FIDELITY FISHES (MINNOWS & WILD CARP)
  private renderFishes(): void {
    this.fishesGraphics.clear();
    for (const f of this.sim.fishes) {
      const isCarp = f.species === 'CARP';
      const cosA = Math.cos(f.angle);
      const sinA = Math.sin(f.angle);

      const tailWiggle = Math.sin(f.wiggle) * (isCarp ? 6 : 4);
      const tailX = f.position.x - cosA * f.size - sinA * tailWiggle;
      const tailY = f.position.y - sinA * f.size + cosA * tailWiggle;

      this.fishesGraphics.ellipse(f.position.x, f.position.y, f.size * 0.55, f.size * (isCarp ? 0.38 : 0.22));
      this.fishesGraphics.fill({ color: f.color, alpha: 0.92 });

      this.fishesGraphics.poly([
        { x: tailX, y: tailY },
        { x: tailX - cosA * (f.size * 0.45) - sinA * 5, y: tailY - sinA * (f.size * 0.45) + cosA * 5 },
        { x: tailX - cosA * (f.size * 0.45) + sinA * 5, y: tailY - sinA * (f.size * 0.45) - cosA * 5 },
      ]);
      this.fishesGraphics.fill({ color: f.finColor, alpha: 0.85 });

      const finX = f.position.x - cosA * (f.size * 0.15);
      const finY = f.position.y - sinA * (f.size * 0.15);
      this.fishesGraphics.circle(finX, finY, f.size * 0.18);
      this.fishesGraphics.fill({ color: f.finColor, alpha: 0.7 });

      const eyeX = f.position.x + cosA * (f.size * 0.35);
      const eyeY = f.position.y + sinA * (f.size * 0.35);
      this.fishesGraphics.circle(eyeX, eyeY, f.size * 0.08);
      this.fishesGraphics.fill({ color: 0x0a1118, alpha: 1.0 });
      this.fishesGraphics.circle(eyeX - 0.5, eyeY - 0.5, f.size * 0.03);
      this.fishesGraphics.fill({ color: 0xffffff, alpha: 1.0 });
    }
  }

  // 7. RENDER ANIMATED WATER SURFACE & SUNLIGHT SHIMMER
  private renderWaterSurface(): void {
    const minX = this.sim.config.basinMinX;
    const maxX = this.sim.config.basinMaxX;

    this.surfaceWaterGraphics.clear();

    this.surfaceWaterGraphics.moveTo(minX, this.sim.sampleWaterSurfaceY(minX));
    for (let x = minX; x <= maxX; x += 8) {
      this.surfaceWaterGraphics.lineTo(x, this.sim.sampleWaterSurfaceY(x));
    }
    this.surfaceWaterGraphics.stroke({
      color: 0x2a6f97,
      width: 4,
      alpha: 0.95,
      cap: 'round',
      join: 'round',
    });

    this.surfaceWaterGraphics.moveTo(minX, this.sim.sampleWaterSurfaceY(minX) - 1.5);
    for (let x = minX; x <= maxX; x += 8) {
      this.surfaceWaterGraphics.lineTo(x, this.sim.sampleWaterSurfaceY(x) - 1.5);
    }
    this.surfaceWaterGraphics.stroke({
      color: 0x64dfdf,
      width: 1.8,
      alpha: 0.75,
      cap: 'round',
      join: 'round',
    });
  }

  // 8. RENDER SURFACE FLORA (BLUEBELLS, MOSS, FERNS)
  private renderSurfaceFlora(_dt: number): void {
    // If real sprite flora is loaded, procedural graphics is cleared
    if (this.surfaceFloraSpriteContainer.children.length > 0) {
      this.surfaceFloraGraphics.clear();
      // Apply gentle sway to real flora sprites
      this.surfaceFloraSpriteContainer.children.forEach((child, i) => {
        child.rotation = Math.sin(this.sim.timeElapsed * 1.8 + i * 0.7) * 0.05;
      });
      return;
    }

    // Procedural Fallback
    this.surfaceFloraGraphics.clear();
    for (const flora of this.sim.floraList) {
      if (flora.type === 'SUBMERGED_REED') continue;

      const sway = Math.sin(flora.swayPhase) * (12 * flora.swayAmplitude);

      if (flora.type === 'BLUEBELL') {
        this.surfaceFloraGraphics.moveTo(flora.x, flora.y);
        this.surfaceFloraGraphics.bezierCurveTo(
          flora.x + sway * 0.4, flora.y - 18 * flora.scale,
          flora.x + sway * 0.8, flora.y - 32 * flora.scale,
          flora.x + sway, flora.y - 42 * flora.scale
        );
        this.surfaceFloraGraphics.stroke({ color: 0x2d6a4f, width: 2.2 * flora.scale, alpha: 0.95 });

        const bellY = flora.y - 42 * flora.scale;
        const bellX = flora.x + sway;
        for (let b = 0; b < 3; b++) {
          const by = bellY + b * 7 * flora.scale;
          const bx = bellX + (b % 2 === 0 ? 5 : -5) * flora.scale;
          this.surfaceFloraGraphics.ellipse(bx, by, 4 * flora.scale, 6 * flora.scale);
          this.surfaceFloraGraphics.fill({ color: 0x4361ee, alpha: 0.95 });
          this.surfaceFloraGraphics.ellipse(bx, by + 2, 2.5 * flora.scale, 4 * flora.scale);
          this.surfaceFloraGraphics.fill({ color: 0x7209b7, alpha: 0.85 });
        }
      } else if (flora.type === 'MOSS_PATCH') {
        this.surfaceFloraGraphics.ellipse(flora.x, flora.y, 24 * flora.scale, 10 * flora.scale);
        this.surfaceFloraGraphics.fill({ color: 0x385e3b, alpha: 0.95 });
        this.surfaceFloraGraphics.ellipse(flora.x + 2, flora.y - 2, 20 * flora.scale, 8 * flora.scale);
        this.surfaceFloraGraphics.fill({ color: 0x588157, alpha: 0.9 });
        this.surfaceFloraGraphics.ellipse(flora.x + 4, flora.y - 4, 12 * flora.scale, 5 * flora.scale);
        this.surfaceFloraGraphics.fill({ color: 0x74a57f, alpha: 0.85 });
      } else if (flora.type === 'FERN_CLUSTER') {
        for (let f = -2; f <= 2; f++) {
          const frondAngle = f * 0.28;
          const frondLen = (36 + Math.abs(f) * -6) * flora.scale;
          const fx = flora.x + Math.sin(frondAngle) * frondLen + sway;
          const fy = flora.y - Math.cos(frondAngle) * frondLen;

          this.surfaceFloraGraphics.moveTo(flora.x, flora.y);
          this.surfaceFloraGraphics.quadraticCurveTo(
            flora.x + Math.sin(frondAngle) * (frondLen * 0.5),
            flora.y - Math.cos(frondAngle) * (frondLen * 0.5) - 6,
            fx, fy
          );
          this.surfaceFloraGraphics.stroke({ color: 0x2d6a4f, width: 2.2 * flora.scale, alpha: 0.92 });

          this.surfaceFloraGraphics.circle(fx, fy, 3.5 * flora.scale);
          this.surfaceFloraGraphics.fill({ color: 0x52b788, alpha: 0.9 });
        }
      }
    }
  }

  // 9. RENDER WATERFOWL (WILD MALLARD DUCK)
  private renderWaterfowl(): void {
    this.waterfowlGraphics.clear();
    for (const duck of this.sim.waterfowls) {
      const x = duck.x;
      const y = duck.currentY;
      const f = duck.facing;

      this.waterfowlGraphics.ellipse(x, y - 4, 16, 10);
      this.waterfowlGraphics.fill({ color: 0x4a2e1b, alpha: 0.95 });

      this.waterfowlGraphics.ellipse(x - f * 2, y - 6, 8, 4);
      this.waterfowlGraphics.fill({ color: 0x1d3557, alpha: 0.9 });

      const headX = x + f * 11;
      const headY = y - 11;
      this.waterfowlGraphics.circle(headX, headY, 6.5);
      this.waterfowlGraphics.fill({ color: 0x1e5e3a, alpha: 0.98 });

      this.waterfowlGraphics.poly([
        { x: headX + f * 4, y: headY },
        { x: headX + f * 10, y: headY + 1 },
        { x: headX + f * 4, y: headY + 3 },
      ]);
      this.waterfowlGraphics.fill({ color: 0xf4a261, alpha: 1.0 });

      this.waterfowlGraphics.circle(headX + f * 2, headY - 1.5, 1.2);
      this.waterfowlGraphics.fill({ color: 0x050505, alpha: 1.0 });

      this.waterfowlGraphics.rect(headX - 4, headY + 4, 8, 2);
      this.waterfowlGraphics.fill({ color: 0xf1faee, alpha: 0.9 });
    }
  }

  // 10. RENDER FOAM PARTICLES
  private renderFoam(): void {
    this.foamParticlesGraphics.clear();
    for (const p of this.sim.foamParticles) {
      this.foamParticlesGraphics.circle(p.x, p.y, p.radius);
      this.foamParticlesGraphics.fill({ color: 0xf0fdf4, alpha: (p.life / p.maxLife) * 0.9 });
    }
  }
}
