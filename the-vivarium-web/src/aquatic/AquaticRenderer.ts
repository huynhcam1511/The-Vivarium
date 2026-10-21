import { Container, Graphics } from 'pixi.js';
import type { AquaticSystem } from './AquaticSystem';

export class AquaticRenderer {
  readonly container: Container;

  // Render Sub-layers
  private waterfallBackdropGraphics: Graphics;
  private waterfallStreamGraphics: Graphics;
  private lakeSedimentMudGraphics: Graphics;
  private submergedFloraGraphics: Graphics;
  private deepWaterGraphics: Graphics;
  private midWaterGraphics: Graphics;
  private bubblesGraphics: Graphics;
  private fishesGraphics: Graphics;
  private surfaceWaterGraphics: Graphics;
  private surfaceFloraGraphics: Graphics;
  private waterfowlGraphics: Graphics;
  private foamParticlesGraphics: Graphics;

  private sim: AquaticSystem;

  constructor(sim: AquaticSystem) {
    this.sim = sim;
    this.container = new Container();

    this.waterfallBackdropGraphics = new Graphics();
    this.waterfallStreamGraphics = new Graphics();
    this.lakeSedimentMudGraphics = new Graphics();
    this.submergedFloraGraphics = new Graphics();
    this.deepWaterGraphics = new Graphics();
    this.midWaterGraphics = new Graphics();
    this.bubblesGraphics = new Graphics();
    this.fishesGraphics = new Graphics();
    this.surfaceWaterGraphics = new Graphics();
    this.surfaceFloraGraphics = new Graphics();
    this.waterfowlGraphics = new Graphics();
    this.foamParticlesGraphics = new Graphics();

    // Layer stack order
    this.container.addChild(this.waterfallBackdropGraphics);
    this.container.addChild(this.lakeSedimentMudGraphics);
    this.container.addChild(this.deepWaterGraphics);
    this.container.addChild(this.submergedFloraGraphics);
    this.container.addChild(this.midWaterGraphics);
    this.container.addChild(this.fishesGraphics);
    this.container.addChild(this.bubblesGraphics);
    this.container.addChild(this.waterfallStreamGraphics);
    this.container.addChild(this.surfaceWaterGraphics);
    this.container.addChild(this.surfaceFloraGraphics);
    this.container.addChild(this.waterfowlGraphics);
    this.container.addChild(this.foamParticlesGraphics);
  }

  update(_dt: number): void {
    this.renderWaterfall();
    this.renderLakeBasinAndSediment();
    this.renderSubmergedFlora();
    this.renderWaterColumns();
    this.renderBubbles();
    this.renderFishes();
    this.renderWaterSurface();
    this.renderSurfaceFlora();
    this.renderWaterfowl();
    this.renderFoam();
  }

  // 1. RENDER PROCEDURAL WATERFALL STREAM & GORGE
  private renderWaterfall(): void {
    const wfX = this.sim.config.waterfallX;
    const topY = this.sim.config.waterfallTopY;
    const botY = this.sim.sampleWaterSurfaceY(wfX);
    const width = this.sim.config.waterfallWidth;

    this.waterfallBackdropGraphics.clear();
    // Natural eroded wet gorge rock contour behind waterfall (soft organic taper instead of rigid box)
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

    this.waterfallStreamGraphics.clear();
    // Cascading water body with animated turbulent flow lines
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
        color: i % 2 === 0 ? 0xbae6fd : 0xe0f2fe, // Waterfall Foam palette
        width: 4 + (i % 2) * 2,
        alpha: 0.75 + Math.sin(time * 8 + i) * 0.15,
      });
    }

    // Sheer outer mist & water veil with soft tapering drape
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

    // Natural bowl-shaped basin polygon for deep sediment
    const sedimentPoints: { x: number; y: number }[] = [];
    sedimentPoints.push({ x: minX, y: baseY });

    // Bowl contour down to bottom
    const steps = 30;
    for (let s = 0; s <= steps; s++) {
      const t = s / steps;
      const x = minX + (maxX - minX) * t;
      // Parabolic bowl curve
      const depthFactor = Math.sin(t * Math.PI);
      const y = baseY + 20 + depthFactor * (maxDepth - 20);
      sedimentPoints.push({ x, y });
    }
    sedimentPoints.push({ x: maxX, y: baseY });
    // Smooth natural subterranean sediment bedrock curve that merges gently with surrounding earth
    for (let s = steps; s >= 0; s--) {
      const t = s / steps;
      const x = minX + (maxX - minX) * t;
      const depthFactor = Math.sin(t * Math.PI);
      const y = baseY + 36 + depthFactor * (maxDepth - 6);
      sedimentPoints.push({ x, y });
    }

    this.lakeSedimentMudGraphics.poly(sedimentPoints);
    this.lakeSedimentMudGraphics.fill({ color: 0x1f1610 }); // Rich organic lake bottom mud

    // Micro sediment silt rim
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
        color: 0x1e5e4e, // Deep aquatic flora palette
        width: 5 * flora.scale,
        alpha: 0.85,
        cap: 'round',
      });

      // Accent highlight frond
      this.submergedFloraGraphics.moveTo(flora.x + 4, flora.y);
      this.submergedFloraGraphics.bezierCurveTo(
        flora.x + 4 - sway * 0.3, flora.y - h * 0.35,
        flora.x + 4 - sway * 0.6, flora.y - h * 0.65,
        flora.x + 4 - sway * 0.8, flora.y - h * 0.85
      );
      this.submergedFloraGraphics.stroke({
        color: 0x2ec4b6, // Light aquatic turquoise
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

    // Deep water body polygon
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

    // Lake Abyss & Deep Water color palette
    this.deepWaterGraphics.poly(deepPoints);
    this.deepWaterGraphics.fill({ color: 0x0f2a3f, alpha: 0.78 * this.sim.waterClarity });

    // Mid water light absorption layer
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

      // Tail oscillation
      const tailWiggle = Math.sin(f.wiggle) * (isCarp ? 6 : 4);
      const tailX = f.position.x - cosA * f.size - sinA * tailWiggle;
      const tailY = f.position.y - sinA * f.size + cosA * tailWiggle;

      // Fish Torso / Body (Oval)
      this.fishesGraphics.ellipse(f.position.x, f.position.y, f.size * 0.55, f.size * (isCarp ? 0.38 : 0.22));
      this.fishesGraphics.fill({ color: f.color, alpha: 0.92 });

      // Caudal Fin (Tail fin)
      this.fishesGraphics.poly([
        { x: tailX, y: tailY },
        { x: tailX - cosA * (f.size * 0.45) - sinA * 5, y: tailY - sinA * (f.size * 0.45) + cosA * 5 },
        { x: tailX - cosA * (f.size * 0.45) + sinA * 5, y: tailY - sinA * (f.size * 0.45) - cosA * 5 },
      ]);
      this.fishesGraphics.fill({ color: f.finColor, alpha: 0.85 });

      // Pectoral Fin
      const finX = f.position.x - cosA * (f.size * 0.15);
      const finY = f.position.y - sinA * (f.size * 0.15);
      this.fishesGraphics.circle(finX, finY, f.size * 0.18);
      this.fishesGraphics.fill({ color: f.finColor, alpha: 0.7 });

      // Fish Eye
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

    // Primary Clear Surface line
    this.surfaceWaterGraphics.moveTo(minX, this.sim.sampleWaterSurfaceY(minX));
    for (let x = minX; x <= maxX; x += 8) {
      this.surfaceWaterGraphics.lineTo(x, this.sim.sampleWaterSurfaceY(x));
    }
    this.surfaceWaterGraphics.stroke({
      color: 0x2a6f97, // Clear Surface palette
      width: 4,
      alpha: 0.95,
      cap: 'round',
      join: 'round',
    });

    // Sun Shimmer Highlight Line (Glistening top sheen)
    this.surfaceWaterGraphics.moveTo(minX, this.sim.sampleWaterSurfaceY(minX) - 1.5);
    for (let x = minX; x <= maxX; x += 8) {
      this.surfaceWaterGraphics.lineTo(x, this.sim.sampleWaterSurfaceY(x) - 1.5);
    }
    this.surfaceWaterGraphics.stroke({
      color: 0x89c2d9, // Sun Shimmer Line palette
      width: 2.2,
      alpha: 0.85,
      cap: 'round',
      join: 'round',
    });
  }

  // 8. RENDER SURFACE FLORA (BLUEBELLS, MOSS, FERNS)
  private renderSurfaceFlora(): void {
    this.surfaceFloraGraphics.clear();
    for (const flora of this.sim.floraList) {
      if (flora.type === 'SUBMERGED_REED') continue;

      const sway = Math.sin(flora.swayPhase) * (12 * flora.swayAmplitude);

      if (flora.type === 'BLUEBELL') {
        // Stem
        this.surfaceFloraGraphics.moveTo(flora.x, flora.y);
        this.surfaceFloraGraphics.bezierCurveTo(
          flora.x + sway * 0.4, flora.y - 18 * flora.scale,
          flora.x + sway * 0.8, flora.y - 32 * flora.scale,
          flora.x + sway, flora.y - 42 * flora.scale
        );
        this.surfaceFloraGraphics.stroke({ color: 0x2d6a4f, width: 2.2 * flora.scale, alpha: 0.95 });

        // Hanging Bell Blossom Clusters (Cobalt/Violet Bluebells)
        const bellY = flora.y - 42 * flora.scale;
        const bellX = flora.x + sway;
        for (let b = 0; b < 3; b++) {
          const by = bellY + b * 7 * flora.scale;
          const bx = bellX + (b % 2 === 0 ? 5 : -5) * flora.scale;
          this.surfaceFloraGraphics.ellipse(bx, by, 4 * flora.scale, 6 * flora.scale);
          this.surfaceFloraGraphics.fill({ color: 0x4361ee, alpha: 0.95 }); // Elegant bluebell
          this.surfaceFloraGraphics.ellipse(bx, by + 2, 2.5 * flora.scale, 4 * flora.scale);
          this.surfaceFloraGraphics.fill({ color: 0x7209b7, alpha: 0.85 }); // Violet shadow
        }
      } else if (flora.type === 'MOSS_PATCH') {
        // Velvet Moss cushion
        this.surfaceFloraGraphics.ellipse(flora.x, flora.y, 24 * flora.scale, 10 * flora.scale);
        this.surfaceFloraGraphics.fill({ color: 0x385e3b, alpha: 0.95 }); // Shadow velvet
        this.surfaceFloraGraphics.ellipse(flora.x + 2, flora.y - 2, 20 * flora.scale, 8 * flora.scale);
        this.surfaceFloraGraphics.fill({ color: 0x588157, alpha: 0.9 });  // Moss base
        this.surfaceFloraGraphics.ellipse(flora.x + 4, flora.y - 4, 12 * flora.scale, 5 * flora.scale);
        this.surfaceFloraGraphics.fill({ color: 0x74a57f, alpha: 0.85 }); // Highlight velvet
      } else if (flora.type === 'FERN_CLUSTER') {
        // Woodland moist fern cluster with arching fronds
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

          // Fern pinnules (leaflets)
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

      // Duck Body
      this.waterfowlGraphics.ellipse(x, y - 4, 16, 10);
      this.waterfowlGraphics.fill({ color: 0x4a2e1b, alpha: 0.95 }); // Rich brown plumage

      // Wing Sheen (Speculum iridescent blue)
      this.waterfowlGraphics.ellipse(x - f * 2, y - 6, 8, 4);
      this.waterfowlGraphics.fill({ color: 0x1d3557, alpha: 0.9 });

      if (duck.isDipping) {
        // Dipping tail-up foraging posture
        this.waterfowlGraphics.poly([
          { x: x - f * 12, y: y },
          { x: x - f * 16, y: y - 12 },
          { x: x - f * 8, y: y - 8 },
        ]);
        this.waterfowlGraphics.fill({ color: 0xffffff, alpha: 0.9 }); // White tail feather flash
      } else {
        // Head & Iridescent Emerald Neck
        const headX = x + f * 12;
        const headY = y - 14;
        this.waterfowlGraphics.circle(headX, headY, 6.5);
        this.waterfowlGraphics.fill({ color: 0x1b4332, alpha: 0.98 }); // Emerald drake head

        // White neck collar ring
        this.waterfowlGraphics.rect(headX - 4, headY + 4, 8, 2);
        this.waterfowlGraphics.fill({ color: 0xffffff, alpha: 0.95 });

        // Yellow Bill
        this.waterfowlGraphics.poly([
          { x: headX + f * 4, y: headY - 1 },
          { x: headX + f * 11, y: headY + 1 },
          { x: headX + f * 4, y: headY + 3 },
        ]);
        this.waterfowlGraphics.fill({ color: 0xffb703, alpha: 1.0 });

        // Duck Eye
        this.waterfowlGraphics.circle(headX + f * 2, headY - 1, 1.2);
        this.waterfowlGraphics.fill({ color: 0x000000, alpha: 1.0 });
      }

      // Water Ripple Ring under duck waterline
      this.waterfowlGraphics.ellipse(x, y + 1, 20, 3);
      this.waterfowlGraphics.stroke({ color: 0xbae6fd, width: 1.5, alpha: 0.65 });
    }
  }

  // 10. RENDER WATERFALL IMPACT FOAM & SPRAY
  private renderFoam(): void {
    this.foamParticlesGraphics.clear();
    for (const p of this.sim.foamParticles) {
      const progress = p.life / p.maxLife;
      const alpha = (1.0 - progress) * 0.85;

      this.foamParticlesGraphics.circle(p.x, p.y, p.radius * (1.0 + progress * 0.5));
      this.foamParticlesGraphics.fill({ color: 0xe0f2fe, alpha: alpha });
      this.foamParticlesGraphics.circle(p.x - 0.5, p.y - 0.5, p.radius * 0.4);
      this.foamParticlesGraphics.fill({ color: 0xffffff, alpha: alpha + 0.1 });
    }
  }
}
