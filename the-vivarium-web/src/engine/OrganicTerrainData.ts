// OrganicTerrainData.ts
// Simulation Grid (32px cells) decoupled from Organic Display Geometry

export interface TerrainPoint {
  x: number;
  y: number;
}

export class OrganicTerrainData {
  readonly cols: number;
  readonly rows: number;
  readonly cellSize: number;
  readonly originX: number;
  readonly originY: number;

  // Grid occupancy: 1 = solid soil, 0 = excavated cavity
  private grid: Uint8Array;

  // Natural surface elevation profile: height offset at each column X
  readonly surfaceHeightMap: Float32Array;

  constructor(
    cols: number = 75, // 75 * 32 = 2400px width
    rows: number = 32, // 32 * 32 = 1024px depth
    cellSize: number = 32,
    originX: number = -1200,
    originY: number = 0 // Ground horizon baseline
  ) {
    this.cols = cols;
    this.rows = rows;
    this.cellSize = cellSize;
    this.originX = originX;
    this.originY = originY;

    this.grid = new Uint8Array(cols * rows);
    this.grid.fill(1); // Solid by default

    // Natural gently undulating surface profile
    this.surfaceHeightMap = new Float32Array(cols);
    for (let c = 0; c < cols; c++) {
      const wx = this.originX + c * this.cellSize;
      const distFromTrunk = Math.abs(wx);
      const trunkWeight = Math.min(1.0, Math.max(0.0, (distFromTrunk - 120) / 200));
      const wave = Math.sin(wx * 0.0035) * 22 + Math.cos(wx * 0.008) * 10;
      this.surfaceHeightMap[c] = wave * trunkWeight;
    }

    this.carveTestCaveSystem();
  }

  isSolid(cx: number, cy: number): boolean {
    if (cx < 0 || cx >= this.cols || cy < 0 || cy >= this.rows) return true;
    return this.grid[cy * this.cols + cx] === 1;
  }

  setSolid(cx: number, cy: number, solid: boolean): void {
    if (cx < 0 || cx >= this.cols || cy < 0 || cy >= this.rows) return;
    this.grid[cy * this.cols + cx] = solid ? 1 : 0;
  }

  getSolidCount(): number {
    let count = 0;
    const total = this.cols * this.rows;
    for (let i = 0; i < total; i++) {
      if (this.grid[i] === 1) count++;
    }
    return count;
  }

  getExcavatedCount(): number {
    let count = 0;
    const total = this.cols * this.rows;
    for (let i = 0; i < total; i++) {
      if (this.grid[i] === 0) count++;
    }
    return count;
  }

  // Get surface elevation Y at world X
  getSurfaceY(worldX: number): number {
    const relX = worldX - this.originX;
    const colFloat = relX / this.cellSize;
    const c0 = Math.floor(colFloat);
    const c1 = Math.min(this.cols - 1, c0 + 1);
    if (c0 < 0) return this.originY + (this.surfaceHeightMap[0] || 0);
    if (c0 >= this.cols) return this.originY + (this.surfaceHeightMap[this.cols - 1] || 0);
    const t = colFloat - c0;
    const h = (1 - t) * this.surfaceHeightMap[c0] + t * this.surfaceHeightMap[c1];
    return this.originY + h;
  }

  // Dig brush: carves out solid cells in circular/organic radius
  digRadius(worldX: number, worldY: number, radius: number): void {
    const centerC = Math.floor((worldX - this.originX) / this.cellSize);
    const centerR = Math.floor((worldY - this.originY) / this.cellSize);
    const cellRadius = Math.ceil(radius / this.cellSize);

    for (let dr = -cellRadius; dr <= cellRadius; dr++) {
      for (let dc = -cellRadius; dc <= cellRadius; dc++) {
        const c = centerC + dc;
        const r = centerR + dr;
        if (c >= 0 && c < this.cols && r >= 0 && r < this.rows) {
          const cellWX = this.originX + (c + 0.5) * this.cellSize;
          const cellWY = this.originY + (r + 0.5) * this.cellSize;
          const dist = Math.hypot(cellWX - worldX, cellWY - worldY);
          const noise = Math.sin(c * 3.7 + r * 2.1) * 0.15 + 1.0;
          if (dist <= radius * noise) {
            this.setSolid(c, r, false);
          }
        }
      }
    }
  }

  // Fill brush: restores solid soil in circular radius
  fillRadius(worldX: number, worldY: number, radius: number): void {
    const centerC = Math.floor((worldX - this.originX) / this.cellSize);
    const centerR = Math.floor((worldY - this.originY) / this.cellSize);
    const cellRadius = Math.ceil(radius / this.cellSize);

    for (let dr = -cellRadius; dr <= cellRadius; dr++) {
      for (let dc = -cellRadius; dc <= cellRadius; dc++) {
        const c = centerC + dc;
        const r = centerR + dr;
        if (c >= 0 && c < this.cols && r >= 0 && r < this.rows) {
          const cellWX = this.originX + (c + 0.5) * this.cellSize;
          const cellWY = this.originY + (r + 0.5) * this.cellSize;
          const dist = Math.hypot(cellWX - worldX, cellWY - worldY);
          if (dist <= radius) {
            this.setSolid(c, r, true);
          }
        }
      }
    }
  }

  /**
   * TASK-015: Thiết kế 3 không gian kết nối liên tục:
   * 1. Đường hầm vận chuyển hẹp (Narrow Transit Shafts - radius 20-24px ~ 40-48px height)
   * 2. Buồng sinh hoạt trung bình (Medium Living Chamber - radius ~55px, floor ~110px wide)
   * 3. Buồng kiến chúa rộng (Spacious Royal Queen Chamber - width ~220px, height ~130px, sàn phẳng cong)
   */
  private carveTestCaveSystem(): void {
    // -------------------------------------------------------------------------
    // 1. ĐƯỜNG HẦM VẬN CHUYỂN HẸP (Surface Entrance & Narrow Transit Tunnel)
    // Chiều cao ~40-48px: kiến 20px đi qua thoải mái với tỷ lệ sinh học chuẩn
    // -------------------------------------------------------------------------
    const surfaceEntryWaypoints: [number, number, number][] = [
      [280, 20, 20],   // Surface entrance (narrow mouth)
      [270, 70, 22],
      [250, 130, 22],  // Gentle curve left under oak root boundary
      [265, 190, 23],  // S-curve down
      [310, 240, 24],  // Turning towards living chamber
      [370, 280, 24],  // Connecting shaft
    ];

    for (let i = 0; i < surfaceEntryWaypoints.length - 1; i++) {
      const [x1, y1, r1] = surfaceEntryWaypoints[i];
      const [x2, y2, r2] = surfaceEntryWaypoints[i + 1];
      const steps = 16;
      for (let s = 0; s <= steps; s++) {
        const t = s / steps;
        this.digRadius(x1 + (x2 - x1) * t, y1 + (y2 - y1) * t, r1 + (r2 - r1) * t);
      }
    }

    // -------------------------------------------------------------------------
    // 2. BUỒNG SINH HOẠT TRUNG BÌNH (Medium Worker & Food Storage Chamber)
    // Tâm: X = 430, Y = 320. Kích thước ~120px × 80px, sàn cong tự nhiên
    // -------------------------------------------------------------------------
    const livingCenterX = 430;
    const livingCenterY = 320;
    for (let angle = 0; angle < Math.PI * 2; angle += 0.08) {
      // Bầu dục ngang tự nhiên: bán kính ngang 55px, bán kính dọc 38px
      const cosA = Math.cos(angle);
      const sinA = Math.sin(angle);
      const harmonic = Math.sin(angle * 3) * 6;
      const rx = (54 + harmonic);
      const ry = (38 + harmonic * 0.6);
      const maxDist = Math.hypot(cosA * rx, sinA * ry);
      for (let d = 0; d <= maxDist; d += 12) {
        this.digRadius(livingCenterX + cosA * d, livingCenterY + sinA * d, 18);
      }
    }

    // Đường hầm dốc hẹp nối Buồng Sinh Hoạt xuống Buồng Kiến Chúa
    const connectingTunnel: [number, number, number][] = [
      [470, 340, 22],
      [515, 380, 24],
      [550, 420, 25],
    ];
    for (let i = 0; i < connectingTunnel.length - 1; i++) {
      const [x1, y1, r1] = connectingTunnel[i];
      const [x2, y2, r2] = connectingTunnel[i + 1];
      const steps = 12;
      for (let s = 0; s <= steps; s++) {
        const t = s / steps;
        this.digRadius(x1 + (x2 - x1) * t, y1 + (y2 - y1) * t, r1 + (r2 - r1) * t);
      }
    }

    // -------------------------------------------------------------------------
    // 3. BUỒNG KIẾN CHÚA RỘNG (Spacious Royal Queen Chamber)
    // Tâm: X = 640, Y = 460. Kích thước lớn: ~220px ngang × 130px cao
    // Sàn lòng buồng phẳng uốn nhẹ để kiến chúa và kiến thợ đi lại thoải mái
    // -------------------------------------------------------------------------
    const queenCenterX = 640;
    const queenCenterY = 460;
    for (let angle = 0; angle < Math.PI * 2; angle += 0.06) {
      const cosA = Math.cos(angle);
      const sinA = Math.sin(angle);
      // Buồng vòm hoàng gia: vòm trần cao, sàn buồng thoai thoải rộng
      const floorFlattening = sinA > 0 ? 0.82 : 1.0;
      const rx = 100 + Math.cos(angle * 2) * 12;
      const ry = (68 + Math.sin(angle * 3) * 8) * floorFlattening;
      const maxDist = Math.hypot(cosA * rx, sinA * ry);
      for (let d = 0; d <= maxDist; d += 14) {
        this.digRadius(queenCenterX + cosA * d, queenCenterY + sinA * d, 22);
      }
    }

    // -------------------------------------------------------------------------
    // 4. HỆ THỐNG HẦM THOÁT KHÍ & BUỒNG ẤP TRỨNG PHÍA TÂY (West Nursery Chamber)
    // X = -360, Y = 280. Nối từ rễ cây phía tây
    // -------------------------------------------------------------------------
    const westWaypoints: [number, number, number][] = [
      [-180, 30, 20],
      [-210, 90, 21],
      [-260, 150, 22],
      [-320, 220, 23],
      [-360, 280, 26],
    ];
    for (let i = 0; i < westWaypoints.length - 1; i++) {
      const [x1, y1, r1] = westWaypoints[i];
      const [x2, y2, r2] = westWaypoints[i + 1];
      const steps = 14;
      for (let s = 0; s <= steps; s++) {
        const t = s / steps;
        this.digRadius(x1 + (x2 - x1) * t, y1 + (y2 - y1) * t, r1 + (r2 - r1) * t);
      }
    }
    // Buồng ấp trứng tròn ấm áp
    for (let angle = 0; angle < Math.PI * 2; angle += 0.08) {
      const rx = 52 + Math.sin(angle * 2) * 8;
      const ry = 40 + Math.cos(angle * 3) * 6;
      const maxDist = Math.hypot(Math.cos(angle) * rx, Math.sin(angle) * ry);
      for (let d = 0; d <= maxDist; d += 12) {
        this.digRadius(-360 + Math.cos(angle) * d, 280 + Math.sin(angle) * d, 18);
      }
    }
  }

  // Continuous scalar field f(x, y) with sub-cell bilinear & Gaussian interpolation
  getSmoothedDensity(wx: number, wy: number): number {
    const surfY = this.getSurfaceY(wx);
    if (wy < surfY) {
      const distAbove = surfY - wy;
      return Math.max(0.0, 1.0 - distAbove / 16.0);
    }

    // Continuous floating-point cell coordinates
    const floatC = (wx - this.originX) / this.cellSize - 0.5;
    const floatR = (wy - this.originY) / this.cellSize - 0.5;

    let sum = 0;
    let weightSum = 0;

    // Sample continuous Gaussian kernel around (floatC, floatR)
    const baseC = Math.round(floatC);
    const baseR = Math.round(floatR);

    for (let dr = -2; dr <= 2; dr++) {
      for (let dc = -2; dc <= 2; dc++) {
        const sc = baseC + dc;
        const sr = baseR + dr;
        const dX = sc - floatC;
        const dY = sr - floatR;
        const distSq = dX * dX + dY * dY;
        const w = Math.exp(-distSq / 1.6); // Continuous Gaussian weight
        weightSum += w;

        if (sc >= 0 && sc < this.cols && sr >= 0 && sr < this.rows) {
          sum += this.grid[sr * this.cols + sc] * w;
        } else if (sr < 0) {
          sum += 0; // Air above
        } else {
          sum += 1.0 * w; // Solid bedrock outside boundary
        }
      }
    }

    return weightSum > 0 ? sum / weightSum : 1.0;
  }
}
