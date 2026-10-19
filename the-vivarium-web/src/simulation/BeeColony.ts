import type { BeeEntity, FlowerTarget, HoneycombCell, Vector2D } from '../types';

export class BeeColony {
  bees: BeeEntity[] = [];
  flowers: FlowerTarget[] = [];
  honeycomb: HoneycombCell[] = [];
  
  hivePosition: Vector2D = { x: 1000, y: 310 };
  totalHoneyStored: number = 240; // grams

  constructor(workerCount: number = 10) {
    this.initFlowers();
    this.initHoneycomb();
    this.initBees(workerCount);
  }

  private initFlowers(): void {
    // Wildflower meadow locations along the surface
    const flowerCoords: { x: number; y: number; type: 'CLOVER' | 'DAISY' | 'BLUEBELL' }[] = [
      { x: 280, y: 590, type: 'CLOVER' },
      { x: 380, y: 585, type: 'DAISY' },
      { x: 460, y: 595, type: 'BLUEBELL' },
      { x: 580, y: 590, type: 'CLOVER' },
      { x: 700, y: 585, type: 'DAISY' },
      { x: 820, y: 595, type: 'BLUEBELL' },
      { x: 920, y: 590, type: 'DAISY' },
      { x: 1040, y: 585, type: 'CLOVER' },
    ];

    this.flowers = flowerCoords.map((f, idx) => ({
      id: `flower-${idx}`,
      position: { x: f.x, y: f.y },
      nectarAvailable: 100,
      maxNectar: 100,
      floralType: f.type,
    }));
  }

  private initHoneycomb(): void {
    // Generate an organic cluster of hexagonal comb cells under the ancient branch
    const baseCx = 0;
    const baseCy = 0;
    for (let q = -4; q <= 4; q++) {
      for (let r = -3; r <= 3; r++) {
        if (Math.abs(q + r) <= 5) {
          const isFull = Math.random() > 0.4;
          this.honeycomb.push({
            cx: baseCx + q,
            cy: baseCy + r,
            type: isFull ? 'HONEY' : 'EMPTY',
            honeyAmount: isFull ? 80 + Math.random() * 20 : 0,
            pollenAmount: Math.random() > 0.6 ? 40 : 0,
          });
        }
      }
    }
  }

  private initBees(count: number): void {
    // Queen Bee stationed in central honeycomb vault
    this.bees.push({
      id: 'queen-bee-0',
      type: 'QUEEN',
      position: { x: this.hivePosition.x, y: this.hivePosition.y - 10 },
      targetPos: null,
      angle: 0,
      speed: 15,
      state: 'IN_HIVE',
      nectarLoad: 0,
      maxNectarLoad: 50,
      targetFlowerId: null,
      wingAngle: 0,
      flightTimer: 0,
    });

    // Forager Worker Bees
    for (let i = 0; i < count; i++) {
      const startInHive = i % 2 === 0;
      this.bees.push({
        id: `bee-worker-${i}`,
        type: 'WORKER',
        position: {
          x: this.hivePosition.x + (Math.random() - 0.5) * 40,
          y: this.hivePosition.y + (Math.random() - 0.5) * 40,
        },
        targetPos: null,
        angle: Math.random() * Math.PI * 2,
        speed: 95 + Math.random() * 30,
        state: startInHive ? 'IN_HIVE' : 'FLYING_TO_FLOWER',
        nectarLoad: 0,
        maxNectarLoad: 25,
        targetFlowerId: null,
        wingAngle: 0,
        flightTimer: Math.random() * 10,
      });
    }
  }

  update(delta: number, onHoneyHarvested?: (amount: number) => void): void {
    // Slowly regenerate nectar in flowers
    for (const f of this.flowers) {
      if (f.nectarAvailable < f.maxNectar) {
        f.nectarAvailable = Math.min(f.maxNectar, f.nectarAvailable + delta * 2.5);
      }
    }

    for (const bee of this.bees) {
      bee.flightTimer += delta;
      // High frequency wing flapping oscillation
      bee.wingAngle = Math.sin(bee.flightTimer * 45.0);

      if (bee.type === 'QUEEN') {
        // Queen moves gently within comb
        bee.position.x = this.hivePosition.x + Math.sin(bee.flightTimer * 0.8) * 12;
        bee.position.y = this.hivePosition.y - 10 + Math.cos(bee.flightTimer * 0.6) * 8;
        continue;
      }

      this.updateWorkerBee(bee, delta, onHoneyHarvested);
    }
  }

  private updateWorkerBee(
    bee: BeeEntity,
    delta: number,
    onHoneyHarvested?: (amount: number) => void
  ): void {
    switch (bee.state) {
      case 'IN_HIVE': {
        // Rest briefly, then choose a flower and depart
        if (Math.random() < delta * 0.5) {
          const availableFlowers = this.flowers.filter((f) => f.nectarAvailable > 20);
          if (availableFlowers.length > 0) {
            const target = availableFlowers[Math.floor(Math.random() * availableFlowers.length)];
            bee.targetFlowerId = target.id;
            bee.targetPos = {
              x: target.position.x + (Math.random() - 0.5) * 16,
              y: target.position.y - 12,
            };
            bee.state = 'FLYING_TO_FLOWER';
          }
        }
        break;
      }

      case 'FLYING_TO_FLOWER': {
        if (!bee.targetPos) {
          bee.state = 'IN_HIVE';
          return;
        }

        // Add natural sinusoidal bobbing to flight path
        const dx = bee.targetPos.x - bee.position.x;
        const dy = bee.targetPos.y - bee.position.y;
        const dist = Math.hypot(dx, dy);

        if (dist < 15) {
          bee.state = 'HARVESTING_NECTAR';
          bee.flightTimer = 0; // use as harvest timer
        } else {
          const baseAngle = Math.atan2(dy, dx);
          // Wave undulation
          const wave = Math.sin(bee.flightTimer * 6.0) * 0.35;
          const finalAngle = baseAngle + wave;

          bee.position.x += Math.cos(finalAngle) * bee.speed * delta;
          bee.position.y += Math.sin(finalAngle) * bee.speed * delta;
          bee.angle = baseAngle;
        }
        break;
      }

      case 'HARVESTING_NECTAR': {
        // Hover over flower dipping for nectar
        bee.position.y += Math.sin(bee.flightTimer * 8.0) * 0.3;
        if (bee.flightTimer > 2.0) {
          // Finished harvesting
          const flower = this.flowers.find((f) => f.id === bee.targetFlowerId);
          if (flower) {
            flower.nectarAvailable = Math.max(0, flower.nectarAvailable - 25);
          }
          bee.nectarLoad = bee.maxNectarLoad;
          bee.targetPos = {
            x: this.hivePosition.x + (Math.random() - 0.5) * 30,
            y: this.hivePosition.y + (Math.random() - 0.5) * 30,
          };
          bee.state = 'RETURNING_TO_HIVE';
        }
        break;
      }

      case 'RETURNING_TO_HIVE': {
        if (!bee.targetPos) {
          bee.state = 'IN_HIVE';
          return;
        }
        const dx = bee.targetPos.x - bee.position.x;
        const dy = bee.targetPos.y - bee.position.y;
        const dist = Math.hypot(dx, dy);

        if (dist < 18) {
          // Reached hive, unload nectar into honey
          this.totalHoneyStored += bee.nectarLoad;
          if (onHoneyHarvested) onHoneyHarvested(bee.nectarLoad);
          bee.nectarLoad = 0;
          bee.targetFlowerId = null;
          bee.targetPos = null;
          bee.state = 'IN_HIVE';
        } else {
          const baseAngle = Math.atan2(dy, dx);
          const wave = Math.sin(bee.flightTimer * 7.0) * 0.25;
          const finalAngle = baseAngle + wave;

          bee.position.x += Math.cos(finalAngle) * bee.speed * delta;
          bee.position.y += Math.sin(finalAngle) * bee.speed * delta;
          bee.angle = baseAngle;
        }
        break;
      }
    }
  }
}
