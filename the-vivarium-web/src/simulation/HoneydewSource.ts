// src/simulation/HoneydewSource.ts
// ============================================================================
// THE VIVARIUM — Subterranean Aphid Honeydew Feeding Source
// Manages finite food reserves for worker ants in Ancient Forest
// ============================================================================

import type { GridCoord, Vector2D } from '../types';

export interface HoneydewSourceConfig {
  id: string;
  name: string;
  cell: GridCoord;
  worldPos: Vector2D;
  maxCapacity?: number;
  initialAmount?: number;
  energyPerFeed?: number;
}

export class HoneydewSource {
  readonly id: string;
  readonly name: string;
  readonly cell: GridCoord;
  readonly worldPos: Vector2D;
  readonly maxCapacity: number;
  readonly energyPerFeed: number;

  private currentAmount: number;
  private listeners: (() => void)[] = [];

  constructor(
    initialCapacityOrConfig: number | Partial<HoneydewSourceConfig> = 50,
    initialAmount: number = 30,
    location?: GridCoord
  ) {
    if (typeof initialCapacityOrConfig === 'number') {
      this.maxCapacity = initialCapacityOrConfig;
      this.id = 'aphid-honeydew-cache';
      this.name = 'Subterranean Aphid Honeydew Cache';
      this.cell = location ?? { cx: 50, cy: 9 }; // In Living Chamber / Root Area
      this.worldPos = {
        x: -1200 + this.cell.cx * 32 + 16,
        y: this.cell.cy * 32 + 16,
      };
      this.currentAmount = Math.min(this.maxCapacity, initialAmount);
      this.energyPerFeed = 45;
    } else {
      const cfg = initialCapacityOrConfig;
      this.id = cfg.id || 'aphid-honeydew-cache';
      this.name = cfg.name || 'Subterranean Aphid Honeydew Cache';
      this.cell = cfg.cell || { cx: 50, cy: 9 };
      this.worldPos = cfg.worldPos || {
        x: -1200 + this.cell.cx * 32 + 16,
        y: this.cell.cy * 32 + 16,
      };
      this.maxCapacity = cfg.maxCapacity ?? 50;
      this.currentAmount = Math.min(this.maxCapacity, cfg.initialAmount ?? initialAmount);
      this.energyPerFeed = cfg.energyPerFeed ?? 45;
    }
  }

  getAvailableCount(): number {
    return this.currentAmount;
  }

  getMaxCapacity(): number {
    return this.maxCapacity;
  }

  isEmpty(): boolean {
    return this.currentAmount <= 0;
  }

  consume(amount: number = 1): number {
    if (amount <= 0 || this.currentAmount <= 0) return 0;
    const taken = Math.min(this.currentAmount, amount);
    this.currentAmount -= taken;
    this.notify();
    return taken;
  }

  replenish(amount: number = 1): void {
    if (amount <= 0) return;
    this.currentAmount = Math.min(this.maxCapacity, this.currentAmount + amount);
    this.notify();
  }

  setAmount(amount: number): void {
    this.currentAmount = Math.max(0, Math.min(this.maxCapacity, Math.floor(amount)));
    this.notify();
  }

  getAmount(): number {
    return this.currentAmount;
  }

  hasFood(): boolean {
    return this.currentAmount > 0;
  }

  consumeFood(): boolean {
    return this.consume(1) > 0;
  }

  subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify(): void {
    for (const listener of this.listeners) {
      try {
        listener();
      } catch (err) {
        console.error('Honeydew listener error:', err);
      }
    }
  }
}
