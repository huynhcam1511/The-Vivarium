// src/simulation/DesignationManager.ts
// ============================================================================
// THE VIVARIUM — Player Designation Layer
// Coordinates aligned to OrganicTerrainData (75 cols x 32 rows, 32px, origin -1200, 0)
// ============================================================================

export type DesignationType = 'DIG' | 'FILL';
export type DesignationStatus = 'PENDING' | 'IN_PROGRESS';

export interface Designation {
  cx: number;
  cy: number;
  type: DesignationType;
  assignedWorkerId: string | null;
  status: DesignationStatus;
  createdAt: number;
}

export interface HighlightBox {
  x: number;
  y: number;
  width: number;
  height: number;
  strokeDash: [number, number];
}

export class DesignationManager {
  readonly cols: number;
  readonly rows: number;
  readonly cellSize: number;
  readonly originX: number;
  readonly originY: number;

  private designations: Map<string, Designation> = new Map();

  constructor(
    cols: number = 75,
    rows: number = 32,
    cellSize: number = 32,
    originX: number = -1200,
    originY: number = 0
  ) {
    this.cols = cols;
    this.rows = rows;
    this.cellSize = cellSize;
    this.originX = originX;
    this.originY = originY;
  }

  private coordKey(cx: number, cy: number): string {
    return `${cx},${cy}`;
  }

  isWithinBounds(cx: number, cy: number): boolean {
    return cx >= 0 && cx < this.cols && cy >= 0 && cy < this.rows;
  }

  private parseArgs(cellOrCx: { cx: number; cy: number } | number, optCy?: number): { cx: number; cy: number } {
    if (typeof cellOrCx === 'number') {
      return { cx: cellOrCx, cy: optCy ?? 0 };
    }
    return { cx: cellOrCx.cx, cy: cellOrCx.cy };
  }

  addDesignation(type: DesignationType, cellOrCx: { cx: number; cy: number } | number, optCy?: number): boolean {
    const { cx, cy } = this.parseArgs(cellOrCx, optCy);

    if (!this.isWithinBounds(cx, cy)) {
      return false;
    }

    const key = this.coordKey(cx, cy);
    const existing = this.designations.get(key);
    if (existing) {
      existing.type = type;
      existing.status = 'PENDING';
      existing.assignedWorkerId = null;
    } else {
      this.designations.set(key, {
        cx,
        cy,
        type,
        assignedWorkerId: null,
        status: 'PENDING',
        createdAt: performance.now(),
      });
    }
    return true;
  }

  removeDesignation(cellOrCx: { cx: number; cy: number } | number, optCy?: number): boolean {
    const { cx, cy } = this.parseArgs(cellOrCx, optCy);
    return this.designations.delete(this.coordKey(cx, cy));
  }

  hasDesignation(cellOrCx: { cx: number; cy: number } | number, optCy?: number): boolean {
    const { cx, cy } = this.parseArgs(cellOrCx, optCy);
    return this.designations.has(this.coordKey(cx, cy));
  }

  getDesignation(cellOrCx: { cx: number; cy: number } | number, optCy?: number): Designation | null {
    const { cx, cy } = this.parseArgs(cellOrCx, optCy);
    return this.designations.get(this.coordKey(cx, cy)) || null;
  }

  getAllDesignations(): Designation[] {
    return Array.from(this.designations.values());
  }

  getPendingDesignations(): Designation[] {
    return this.getAllDesignations().filter((d) => d.status === 'PENDING');
  }

  getPendingCount(): number {
    return this.getPendingDesignations().length;
  }

  assignWorker(cx: number, cy: number, workerId: string): void {
    const des = this.designations.get(this.coordKey(cx, cy));
    if (des) {
      des.assignedWorkerId = workerId;
      des.status = 'IN_PROGRESS';
    }
  }

  getHighlightBox(cellOrCx: { cx: number; cy: number } | number, optCy?: number): HighlightBox {
    const { cx, cy } = this.parseArgs(cellOrCx, optCy);
    return {
      x: this.originX + cx * this.cellSize,
      y: this.originY + cy * this.cellSize,
      width: this.cellSize,
      height: this.cellSize,
      strokeDash: [4, 4],
    };
  }

  worldToCell(worldX: number, worldY: number): { cx: number; cy: number } {
    return {
      cx: Math.floor((worldX - this.originX) / this.cellSize),
      cy: Math.floor((worldY - this.originY) / this.cellSize),
    };
  }

  cellToWorldCenter(cx: number, cy: number): { wx: number; wy: number } {
    return {
      wx: this.originX + (cx + 0.5) * this.cellSize,
      wy: this.originY + (cy + 0.5) * this.cellSize,
    };
  }

  clear(): void {
    this.designations.clear();
  }
}
