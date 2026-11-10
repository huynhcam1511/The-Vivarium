import type {
  AquaticBasinConfig,
  AquaticFaunaFish,
  AquaticFaunaWaterfowl,
  AquaticFloraSpec,
  BubbleParticle,
  IAquaticEnvironment,
  WaterfallFoamParticle,
} from './AquaticTypes';

export class AquaticSystem implements IAquaticEnvironment {
  readonly config: AquaticBasinConfig;

  // Dynamic Physical & Chemical Properties
  waterLevelOffset: number = 0.0; // Dynamic deviation in pixels (-30 to +30 px)
  waterClarity: number = 0.92;    // 0.0 (turbid) to 1.0 (crystal clear)
  waterTemperature: number = 21.5;// in Celsius
  waterDissolvedOxygen: number = 8.4; // mg/L
  evaporationRate: number = 0.05; // base evaporation

  // Flora Population
  floraList: AquaticFloraSpec[] = [];

  // Fauna Population
  fishes: AquaticFaunaFish[] = [];
  waterfowls: AquaticFaunaWaterfowl[] = [];

  // Aquatic Micro-Particle Pools
  bubbles: BubbleParticle[] = [];
  foamParticles: WaterfallFoamParticle[] = [];

  // Internal Clocks & Wave state
  timeElapsed: number = 0;
  surfaceWavePhase: number = 0;

  constructor(customConfig?: Partial<AquaticBasinConfig>) {
    this.config = {
      basinMinX: 1350,
      basinMaxX: 1980,
      surfaceBaseY: 570,
      maxDepth: 180, // lake bottom reaches Y: 750
      waterfallX: 1390,
      waterfallTopY: 330,
      waterfallBottomY: 570,
      waterfallWidth: 44,
      ...customConfig,
    };

    this.initFlora();
    this.initFauna();
    this.initBubbles(24);
  }

  private initFlora(): void {
    // 1. Riparian Bluebells (Moist shaded bank & waterfall edge)
    this.floraList.push(
      {
        id: 'flora-bluebell-01',
        name: 'Bluebell Cluster West',
        x: 1340,
        y: 566,
        type: 'BLUEBELL',
        scale: 1.0,
        swayPhase: 0.2,
        swaySpeed: 2.4,
        swayAmplitude: 0.12,
      },
      {
        id: 'flora-bluebell-02',
        name: 'Bluebell Cluster Mid-East',
        x: 1960,
        y: 564,
        type: 'BLUEBELL',
        scale: 0.9,
        swayPhase: 1.5,
        swaySpeed: 2.1,
        swayAmplitude: 0.10,
      }
    );

    // 2. Velvet Moss Patches (Bark of wet rocks & moist soil rim)
    this.floraList.push(
      {
        id: 'flora-moss-01',
        name: 'Waterfall Rock Velvet Moss',
        x: 1370,
        y: 440,
        type: 'MOSS_PATCH',
        scale: 1.2,
        swayPhase: 0.0,
        swaySpeed: 0.0,
        swayAmplitude: 0.0,
      },
      {
        id: 'flora-moss-02',
        name: 'Riparian Rim Velvet Moss',
        x: 1420,
        y: 572,
        type: 'MOSS_PATCH',
        scale: 1.0,
        swayPhase: 0.0,
        swaySpeed: 0.0,
        swayAmplitude: 0.0,
      },
      {
        id: 'flora-moss-03',
        name: 'East Shore Velvet Moss',
        x: 1940,
        y: 570,
        type: 'MOSS_PATCH',
        scale: 1.1,
        swayPhase: 0.0,
        swaySpeed: 0.0,
        swayAmplitude: 0.0,
      }
    );

    // 3. Fern Clusters (Wet woodland ferns along the waterfall gorge)
    this.floraList.push(
      {
        id: 'flora-fern-01',
        name: 'Gorge Wet Fern Cluster',
        x: 1335,
        y: 510,
        type: 'FERN_CLUSTER',
        scale: 1.1,
        swayPhase: 0.6,
        swaySpeed: 1.4,
        swayAmplitude: 0.08,
      },
      {
        id: 'flora-fern-02',
        name: 'Lake Bank Overhanging Fern',
        x: 1975,
        y: 555,
        type: 'FERN_CLUSTER',
        scale: 0.95,
        swayPhase: 2.1,
        swaySpeed: 1.6,
        swayAmplitude: 0.07,
      }
    );

    // 4. Submerged Aquatic Reeds & Vallisneria (Anchored in lake bottom sediment)
    for (let i = 0; i < 7; i++) {
      const rx = 1460 + i * 75 + (i % 2) * 20;
      this.floraList.push({
        id: `flora-submerged-${i}`,
        name: `Benthic Vallisneria ${i}`,
        x: rx,
        y: 710 + (i % 3) * 12,
        type: 'SUBMERGED_REED',
        scale: 0.85 + (i % 3) * 0.15,
        swayPhase: i * 0.8,
        swaySpeed: 1.8,
        swayAmplitude: 0.15,
      });
    }
  }

  private initFauna(): void {
    // 1. Minnows (fast, agile schooling fish, upper/mid water column)
    for (let i = 0; i < 6; i++) {
      this.fishes.push({
        id: `fish-minnow-${i}`,
        species: 'MINNOW',
        position: {
          x: 1470 + Math.random() * 420,
          y: 590 + Math.random() * 60,
        },
        velocity: { x: (Math.random() - 0.5) * 45, y: (Math.random() - 0.5) * 15 },
        targetPos: { x: 1470 + Math.random() * 420, y: 590 + Math.random() * 60 },
        size: 11 + Math.random() * 5,
        angle: 0,
        wiggle: Math.random() * 10,
        wiggleSpeed: 9 + Math.random() * 4,
        depthPreference: 0.25, // shallow / mid
        color: 0x2ec4b6,       // vivid turquoise aquatic minnow
        finColor: 0x89c2d9,
      });
    }

    // 2. Carp (plump, contemplative benthic foragers near mud bottom)
    for (let i = 0; i < 3; i++) {
      this.fishes.push({
        id: `fish-carp-${i}`,
        species: 'CARP',
        position: {
          x: 1510 + Math.random() * 360,
          y: 660 + Math.random() * 50,
        },
        velocity: { x: (Math.random() - 0.5) * 20, y: (Math.random() - 0.5) * 8 },
        targetPos: { x: 1510 + Math.random() * 360, y: 660 + Math.random() * 50 },
        size: 24 + Math.random() * 6,
        angle: 0,
        wiggle: Math.random() * 10,
        wiggleSpeed: 5 + Math.random() * 2,
        depthPreference: 0.8, // benthic sediment feeder
        color: 0xf3722c,      // golden amber wild carp
        finColor: 0xf9c74f,
      });
    }

    // 3. Waterfowl (Mallard duck drifting on surface)
    this.waterfowls.push({
      id: 'waterfowl-mallard-01',
      species: 'MALLARD',
      x: 1680,
      baseY: this.config.surfaceBaseY,
      currentY: this.config.surfaceBaseY,
      targetX: 1820,
      facing: 1,
      swimSpeed: 18,
      bobPhase: 0,
      isDipping: false,
      dipTimer: 4.0,
    });
  }

  private initBubbles(count: number): void {
    for (let i = 0; i < count; i++) {
      this.bubbles.push(this.spawnBubble(true));
    }
  }

  private spawnBubble(randomInitialY: boolean = false): BubbleParticle {
    const minX = this.config.basinMinX + 80;
    const maxX = this.config.basinMaxX - 80;
    const startY = this.config.surfaceBaseY + this.config.maxDepth - 20;
    const curY = randomInitialY
      ? this.config.surfaceBaseY + 15 + Math.random() * (this.config.maxDepth - 35)
      : startY;

    return {
      x: minX + Math.random() * (maxX - minX),
      y: curY,
      startY: startY,
      radius: 1.5 + Math.random() * 2.5,
      vy: -(12 + Math.random() * 22),
      driftPhase: Math.random() * Math.PI * 2,
      alpha: 0.35 + Math.random() * 0.45,
    };
  }

  update(dt: number): void {
    this.timeElapsed += dt;
    this.surfaceWavePhase += dt * 2.2;

    // Passive evaporation & equilibrium
    if (this.waterLevelOffset > 0) {
      this.waterLevelOffset = Math.max(0, this.waterLevelOffset - dt * 0.15);
    } else if (this.waterLevelOffset < 0) {
      this.waterLevelOffset = Math.min(0, this.waterLevelOffset + dt * 0.10);
    }

    // 1. Update Flora Sway
    for (const flora of this.floraList) {
      flora.swayPhase += dt * flora.swaySpeed;
    }

    // 2. Update Fish Navigation & Boid-like wandering
    this.updateFishes(dt);

    // 3. Update Waterfowls (Duck swimming & dipping)
    this.updateWaterfowl(dt);

    // 4. Update Submerged Bubbles
    this.updateBubbles(dt);

    // 5. Update Waterfall Impact Foam Particles
    this.updateFoam(dt);
  }

  private updateFishes(dt: number): void {
    const surfY = this.sampleWaterSurfaceY(1600);
    const bottomY = this.config.surfaceBaseY + this.config.maxDepth - 15;
    const minX = this.config.basinMinX + 70;
    const maxX = this.config.basinMaxX - 60;

    for (const f of this.fishes) {
      f.wiggle += dt * f.wiggleSpeed;

      const dx = f.targetPos.x - f.position.x;
      const dy = f.targetPos.y - f.position.y;
      const dist = Math.hypot(dx, dy);

      if (dist < 20 || Math.random() < dt * 0.25) {
        // Pick new swim destination matching depth preference
        const targetDepth = surfY + 25 + f.depthPreference * (bottomY - surfY - 40);
        f.targetPos = {
          x: minX + Math.random() * (maxX - minX),
          y: targetDepth + (Math.random() - 0.5) * 35,
        };
      } else {
        const angle = Math.atan2(dy, dx);
        const speed = f.species === 'MINNOW' ? 36 : 22;
        f.position.x += Math.cos(angle) * speed * dt;
        f.position.y += Math.sin(angle) * (speed * 0.45) * dt;
        f.angle = angle;
      }

      // Constrain within water boundary
      f.position.x = Math.max(minX, Math.min(maxX, f.position.x));
      f.position.y = Math.max(surfY + 12, Math.min(bottomY - 8, f.position.y));
    }
  }

  private updateWaterfowl(dt: number): void {
    for (const duck of this.waterfowls) {
      duck.bobPhase += dt * 3.0;

      // Follow water surface wave exactly
      const currentSurface = this.sampleWaterSurfaceY(duck.x);
      duck.currentY = currentSurface + Math.sin(duck.bobPhase) * 2.0;

      // Handle duck dipping behavior (foraging aquatic weed)
      duck.dipTimer -= dt;
      if (duck.dipTimer <= 0) {
        duck.isDipping = !duck.isDipping;
        duck.dipTimer = duck.isDipping ? 2.5 : 4.0 + Math.random() * 5.0;
      }

      if (!duck.isDipping) {
        const dx = duck.targetX - duck.x;
        if (Math.abs(dx) < 10) {
          duck.targetX = 1480 + Math.random() * 420;
          duck.facing = duck.targetX > duck.x ? 1 : -1;
        } else {
          duck.x += duck.facing * duck.swimSpeed * dt;
        }
      }
    }
  }

  private updateBubbles(dt: number): void {
    const surfY = this.sampleWaterSurfaceY(1600);
    for (let i = 0; i < this.bubbles.length; i++) {
      const b = this.bubbles[i];
      b.y += b.vy * dt;
      b.driftPhase += dt * 3.0;
      b.x += Math.sin(b.driftPhase) * 0.4;

      // Pop when reaching surface
      if (b.y <= surfY + 4) {
        this.bubbles[i] = this.spawnBubble(false);
      }
    }
  }

  private updateFoam(dt: number): void {
    // Generate new foam particles at waterfall impact pool
    const impactX = this.config.waterfallX + (Math.random() - 0.5) * this.config.waterfallWidth;
    const impactY = this.sampleWaterSurfaceY(impactX);

    if (this.foamParticles.length < 45 && Math.random() < 0.65) {
      this.foamParticles.push({
        x: impactX,
        y: impactY + (Math.random() - 0.5) * 6,
        vx: 15 + Math.random() * 35, // wash rightwards into lake body
        vy: (Math.random() - 0.5) * 12,
        radius: 2 + Math.random() * 3.5,
        life: 0,
        maxLife: 0.8 + Math.random() * 1.2,
      });
    }

    // Update existing foam
    for (let i = this.foamParticles.length - 1; i >= 0; i--) {
      const p = this.foamParticles[i];
      p.life += dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.94; // hydrodynamic drag

      if (p.life >= p.maxLife) {
        this.foamParticles.splice(i, 1);
      }
    }
  }

  // Sample real-time water surface Y coordinate at any world X (accounting for waves & level)
  sampleWaterSurfaceY(worldX: number): number {
    const effectiveBase = this.config.surfaceBaseY - this.waterLevelOffset;
    const wave = Math.sin((worldX * 0.02) + this.surfaceWavePhase) * 2.8 +
                 Math.cos((worldX * 0.045) - this.surfaceWavePhase * 0.8) * 1.4;
    return effectiveBase + wave;
  }

  // Interface implementations
  getWaterLevel(): number {
    return this.config.surfaceBaseY - this.waterLevelOffset;
  }

  getWaterClarity(): number {
    return this.waterClarity;
  }

  getFloraCount(): number {
    return this.floraList.length;
  }

  getFishCount(): number {
    return this.fishes.length;
  }

  getSedimentMoisture(): number {
    // High constant moisture for subterranean cave boundary adjacent to lake
    return Math.min(1.0, 0.85 + (this.waterLevelOffset / 60));
  }

  applyRainInflow(inflowRate: number, dt: number): void {
    // Precipitation raises lake water level smoothly (up to +25px cap)
    this.waterLevelOffset = Math.min(25.0, this.waterLevelOffset + inflowRate * dt * 1.2);
    // Agitated inflow slightly reduces clarity temporarily
    this.waterClarity = Math.max(0.75, this.waterClarity - inflowRate * dt * 0.04);
  }

  evaporateWater(heatRate: number, dt: number): void {
    // Arid / sunny evaporation lowers water level (down to -20px cap)
    this.waterLevelOffset = Math.max(-20.0, this.waterLevelOffset - heatRate * dt * 0.8);
  }
}
