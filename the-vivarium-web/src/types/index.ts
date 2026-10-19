export interface Vector2D {
  x: number;
  y: number;
}

export interface GridCoord {
  cx: number;
  cy: number;
}

export type ToolType = 'SELECT' | 'DIG' | 'FILL' | 'PLANT' | 'PHEROMONE';

export type TimeSpeed = 0 | 1 | 2 | 5;

export interface EcoResources {
  mud: number;
  wax: number;
  honey: number; // in grams
  nectar: number;
  seeds: number;
  antFood: number;
  antPopulation: number;
  beePopulation: number;
}

export interface EcoEnvironment {
  timeOfDay: number; // 0.0 to 1.0 (0.0 = midnight, 0.25 = sunrise, 0.5 = noon, 0.75 = sunset)
  temperature: number; // in °C
  humidity: number; // in %
  co2Ppm: number;
  weather: 'SUNNY' | 'OVERCAST' | 'GENTLE_BREEZE' | 'SPRING_MIST';
  biome: string;
}

export type AntState = 'IDLE' | 'WANDERING' | 'MOVING_TO_DIG' | 'DIGGING' | 'CARRYING_MUD' | 'ATTENDING_QUEEN';

export interface AntEntity {
  id: string;
  type: 'WORKER' | 'QUEEN' | 'SOLDIER';
  position: Vector2D;
  targetPos: Vector2D | null;
  angle: number;
  speed: number;
  state: AntState;
  path: GridCoord[];
  pathIndex: number;
  energy: number;
  carriedResource: 'MUD' | 'SEED' | null;
  walkCycle: number;
}

export type BeeState = 'IN_HIVE' | 'LEAVING_HIVE' | 'FLYING_TO_FLOWER' | 'HARVESTING_NECTAR' | 'RETURNING_TO_HIVE' | 'UNLOADING_HONEY';

export interface FlowerTarget {
  id: string;
  position: Vector2D;
  nectarAvailable: number;
  maxNectar: number;
  floralType: 'CLOVER' | 'DAISY' | 'BLUEBELL';
}

export interface BeeEntity {
  id: string;
  type: 'WORKER' | 'QUEEN';
  position: Vector2D;
  targetPos: Vector2D | null;
  angle: number;
  speed: number;
  state: BeeState;
  nectarLoad: number;
  maxNectarLoad: number;
  targetFlowerId: string | null;
  wingAngle: number;
  flightTimer: number;
}

export interface HoneycombCell {
  cx: number;
  cy: number;
  type: 'EMPTY' | 'HONEY' | 'BROOD' | 'QUEEN_CUP';
  honeyAmount: number; // 0 to 100%
  pollenAmount: number;
}

export interface FishEntity {
  id: string;
  position: Vector2D;
  velocity: Vector2D;
  targetPos: Vector2D;
  size: number;
  angle: number;
  wiggle: number;
}
