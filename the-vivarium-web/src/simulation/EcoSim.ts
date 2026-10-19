import type { EcoEnvironment, EcoResources, FishEntity, TimeSpeed } from '../types';
import { AntColony } from './AntColony';
import { BeeColony } from './BeeColony';
import { SubterraneanGrid } from './SubterraneanGrid';

export class EcoSim {
  grid: SubterraneanGrid;
  antColony: AntColony;
  beeColony: BeeColony;
  fishes: FishEntity[] = [];

  timeSpeed: TimeSpeed = 1;

  resources: EcoResources = {
    mud: 64,
    wax: 32,
    honey: 380,
    nectar: 120,
    seeds: 45,
    antFood: 110,
    antPopulation: 13, // 1 queen + 12 workers
    beePopulation: 11, // 1 queen + 10 workers
  };

  environment: EcoEnvironment = {
    timeOfDay: 0.35, // Late morning
    temperature: 26.8,
    humidity: 68,
    co2Ppm: 512,
    weather: 'GENTLE_BREEZE',
    biome: 'Breeze Meadow & Temperate Forest',
  };

  constructor() {
    this.grid = new SubterraneanGrid(60, 36, 32, 640);
    this.antColony = new AntColony(this.grid, 12);
    this.beeColony = new BeeColony(10);
    this.initFishes(6);
  }

  private initFishes(count: number): void {
    // Lake bounding region: X: 1480 -> 1880, Y: 560 -> 630
    for (let i = 0; i < count; i++) {
      this.fishes.push({
        id: `fish-${i}`,
        position: {
          x: 1520 + Math.random() * 320,
          y: 570 + Math.random() * 50,
        },
        velocity: {
          x: (Math.random() - 0.5) * 30,
          y: (Math.random() - 0.5) * 10,
        },
        targetPos: {
          x: 1520 + Math.random() * 320,
          y: 570 + Math.random() * 50,
        },
        size: 14 + Math.random() * 8,
        angle: 0,
        wiggle: Math.random() * 10,
      });
    }
  }

  update(dt: number): void {
    if (this.timeSpeed === 0) return;
    const effectiveDt = dt * this.timeSpeed;

    // 1. Advance day/night cycle (full day = 240 seconds at 1x speed)
    this.environment.timeOfDay = (this.environment.timeOfDay + (effectiveDt / 240)) % 1.0;
    
    // Smooth temperature & humidity curve
    const sunFactor = Math.sin(this.environment.timeOfDay * Math.PI * 2 - Math.PI / 2) * 0.5 + 0.5;
    this.environment.temperature = 18.0 + sunFactor * 14.0; // 18°C night to 32°C noon
    this.environment.humidity = 85.0 - sunFactor * 30.0;   // 85% night to 55% noon

    // 2. Update Ants
    this.antColony.update(effectiveDt, () => {
      this.resources.mud += 1;
    });

    // 3. Update Bees
    this.beeColony.update(effectiveDt, (amount) => {
      this.resources.honey += amount;
      this.resources.wax += amount * 0.1;
    });

    // 4. Update Swimming Fauna
    this.updateFishes(effectiveDt);
  }

  private updateFishes(dt: number): void {
    const minX = 1500;
    const maxX = 1860;
    const minY = 565;
    const maxY = 625;

    for (const f of this.fishes) {
      f.wiggle += dt * 8.0;

      const dx = f.targetPos.x - f.position.x;
      const dy = f.targetPos.y - f.position.y;
      const dist = Math.hypot(dx, dy);

      if (dist < 15 || Math.random() < dt * 0.2) {
        f.targetPos = {
          x: minX + Math.random() * (maxX - minX),
          y: minY + Math.random() * (maxY - minY),
        };
      } else {
        const angle = Math.atan2(dy, dx);
        f.position.x += Math.cos(angle) * 28 * dt;
        f.position.y += Math.sin(angle) * 12 * dt;
        f.angle = angle;
      }
    }
  }
}
