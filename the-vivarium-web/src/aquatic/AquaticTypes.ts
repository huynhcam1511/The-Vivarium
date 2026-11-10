export type AquaticWaterBodyType = 'LAKE' | 'WATERFALL' | 'BROOK' | 'POND';

export interface AquaticFloraSpec {
  id: string;
  name: string;
  x: number;
  y: number;
  type: 'BLUEBELL' | 'MOSS_PATCH' | 'FERN_CLUSTER' | 'SUBMERGED_REED';
  scale: number;
  swayPhase: number;
  swaySpeed: number;
  swayAmplitude: number;
}

export interface AquaticFaunaFish {
  id: string;
  species: 'MINNOW' | 'CARP';
  position: { x: number; y: number };
  velocity: { x: number; y: number };
  targetPos: { x: number; y: number };
  size: number;
  angle: number;
  wiggle: number;
  wiggleSpeed: number;
  depthPreference: number; // 0.0 (near surface) to 1.0 (near bottom sediment)
  color: number;
  finColor: number;
}

export interface AquaticFaunaWaterfowl {
  id: string;
  species: 'MALLARD';
  x: number;
  baseY: number;
  currentY: number;
  targetX: number;
  facing: 1 | -1;
  swimSpeed: number;
  bobPhase: number;
  isDipping: boolean;
  dipTimer: number;
}

export interface BubbleParticle {
  x: number;
  y: number;
  startY: number;
  radius: number;
  vy: number;
  driftPhase: number;
  alpha: number;
}

export interface WaterfallFoamParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  life: number;
  maxLife: number;
}

export interface AquaticBasinConfig {
  basinMinX: number;
  basinMaxX: number;
  surfaceBaseY: number;
  maxDepth: number;
  waterfallX: number;
  waterfallTopY: number;
  waterfallBottomY: number;
  waterfallWidth: number;
}

export interface IAquaticEnvironment {
  getWaterLevel(): number;
  getWaterClarity(): number;
  getFloraCount(): number;
  getFishCount(): number;
  getSedimentMoisture(): number;
  applyRainInflow(inflowRate: number, dt: number): void;
  evaporateWater(heatRate: number, dt: number): void;
  sampleWaterSurfaceY(worldX: number): number;
}
