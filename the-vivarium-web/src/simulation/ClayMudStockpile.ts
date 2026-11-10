// src/simulation/ClayMudStockpile.ts
// ============================================================================
// THE VIVARIUM — Subterranean Physical Clay Mud Stockpile
// Location: X=350, Y=240 (cx=48, cy=7), pickup waypoint cx=48, cy=8
// ============================================================================

export interface StockpileConfig {
  id: string;
  name: string;
  chamberBounds: { minCx: number; maxCx: number; minCy: number; maxCy: number };
  worldPos: { x: number; y: number };
  pickupWaypoint: { cx: number; cy: number; x: number; y: number };
  maxCapacity?: number;
  initialAvailable?: number;
}

export class ClayMudStockpile {
  readonly id: string;
  readonly name: string;
  readonly chamberBounds: { minCx: number; maxCx: number; minCy: number; maxCy: number };
  readonly worldPos: { x: number; y: number };
  readonly pickupWaypoint: { cx: number; cy: number; x: number; y: number };
  readonly maxCapacity: number;

  private availableMud: number;
  private reservedMud: number;
  private listeners: (() => void)[] = [];

  constructor(
    initialCapacityOrConfig: number | Partial<StockpileConfig> = 64,
    initialAvailable?: number,
    location?: { cx: number; cy: number }
  ) {
    if (typeof initialCapacityOrConfig === 'number') {
      this.maxCapacity = initialCapacityOrConfig;
      this.id = 'central-clay-stockpile';
      this.name = 'Central Clay Mud Reserve';
      const locCx = location?.cx ?? 48;
      const locCy = location?.cy ?? 7;
      this.chamberBounds = { minCx: locCx - 1, maxCx: locCx + 2, minCy: locCy, maxCy: locCy + 2 };
      this.worldPos = { x: -1200 + locCx * 32 + 16, y: locCy * 32 + 16 };
      this.pickupWaypoint = { cx: locCx, cy: locCy + 1, x: -1200 + locCx * 32 + 16, y: (locCy + 1) * 32 + 16 };
      this.availableMud = initialAvailable !== undefined ? Math.min(this.maxCapacity, initialAvailable) : Math.min(this.maxCapacity, 16);
      this.reservedMud = 0;
    } else {
      const cfg = initialCapacityOrConfig;
      this.id = cfg.id || 'central-clay-stockpile';
      this.name = cfg.name || 'Central Clay Mud Reserve';
      this.chamberBounds = cfg.chamberBounds || { minCx: 47, maxCx: 50, minCy: 7, maxCy: 9 };
      this.worldPos = cfg.worldPos || { x: 350, y: 240 };
      this.pickupWaypoint = cfg.pickupWaypoint || { cx: 48, cy: 8, x: 352, y: 256 };
      this.maxCapacity = cfg.maxCapacity ?? 64;
      this.availableMud = Math.min(this.maxCapacity, cfg.initialAvailable ?? 16);
      this.reservedMud = 0;
    }
  }

  getAvailableCount(): number {
    return this.availableMud;
  }

  getReservedCount(): number {
    return this.reservedMud;
  }

  getTotalCount(): number {
    return this.availableMud + this.reservedMud;
  }

  reserve(amount: number = 1): boolean {
    if (amount <= 0 || this.availableMud < amount) return false;
    this.availableMud -= amount;
    this.reservedMud += amount;
    this.notify();
    return true;
  }

  unreserve(amount: number = 1): void {
    if (amount <= 0) return;
    const clamped = Math.min(amount, this.reservedMud);
    this.reservedMud -= clamped;
    this.availableMud += clamped;
    this.notify();
  }

  withdraw(amount: number = 1): boolean {
    if (amount <= 0) return false;
    // Prefer withdrawing from reserved allocation
    if (this.reservedMud >= amount) {
      this.reservedMud -= amount;
      this.notify();
      return true;
    }
    // Fallback: withdraw directly from available pool
    if (this.availableMud >= amount) {
      this.availableMud -= amount;
      this.notify();
      return true;
    }
    return false;
  }

  deposit(amount: number = 1): boolean {
    if (amount <= 0) return false;
    const space = this.maxCapacity - (this.availableMud + this.reservedMud);
    if (space < amount) return false;
    this.availableMud += amount;
    this.notify();
    return true;
  }

  isFull(): boolean {
    return (this.availableMud + this.reservedMud) >= this.maxCapacity;
  }

  isEmpty(): boolean {
    return this.availableMud <= 0;
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
        console.error('Stockpile listener error:', err);
      }
    }
  }
}
