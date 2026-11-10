// src/rendering/AntPlaceholderView.ts
// ============================================================================
// THE VIVARIUM — Procedural DEV Ant Placeholder & Floating Progress Bar
// Non-final fauna visual representation (Strictly adhering to art guardrail)
// ============================================================================

import { Container, Graphics } from 'pixi.js';
import type { AntEntity } from '../types';

export class AntPlaceholderView {
  readonly antContainer: Container;
  readonly progressOverlay: Graphics;
  private antGraphicsMap: Map<string, Graphics> = new Map();

  constructor() {
    this.antContainer = new Container();
    this.progressOverlay = new Graphics();
  }

  render(ants: AntEntity[]): void {
    this.progressOverlay.clear();

    const activeIds = new Set<string>();

    for (const ant of ants) {
      activeIds.add(ant.id);
      let gfx = this.antGraphicsMap.get(ant.id);
      if (!gfx) {
        gfx = new Graphics();
        this.antContainer.addChild(gfx);
        this.antGraphicsMap.set(ant.id, gfx);
      }

      this.renderAnt(gfx, ant);

      // Render Floating Progress Bar if Digging or Backfilling
      if ((ant.state === 'DIGGING' || ant.state === 'BACKFILLING') && ant.targetJobCell) {
        const duration = ant.jobDuration ?? (ant.state === 'DIGGING' ? 3.5 : 2.0);
        const progress = Math.min(1.0, Math.max(0.0, (ant.jobTimer ?? 0) / duration));
        this.renderProgressBar(ant.targetJobCell, progress, ant.state === 'DIGGING');
      }
    }

    // Cleanup ants that no longer exist
    for (const [id, gfx] of this.antGraphicsMap.entries()) {
      if (!activeIds.has(id)) {
        this.antContainer.removeChild(gfx);
        gfx.destroy();
        this.antGraphicsMap.delete(id);
      }
    }
  }

  private renderAnt(gfx: Graphics, ant: AntEntity): void {
    gfx.clear();
    gfx.position.set(ant.position.x, ant.position.y);
    gfx.rotation = ant.angle;

    const isQueen = ant.type === 'QUEEN';
    const scale = isQueen ? 1.6 : 1.0;
    const isMoving = ant.path.length > 0 && ant.pathIndex < ant.path.length;
    const walk = ant.walkCycle;

    // --- 1. Tripod Legs (6 jointed legs) ---
    const legPhaseA = Math.sin(walk * 1.5) * 4.0;
    const legPhaseB = Math.sin(walk * 1.5 + Math.PI) * 4.0;
    const legColor = 0x221208;

    // Left 1, Right 2, Left 3 (Group A)
    // Left 1 (Front Left)
    gfx.moveTo(-2 * scale, -2 * scale);
    gfx.lineTo(4 * scale + (isMoving ? legPhaseA : 0), -10 * scale);
    gfx.stroke({ color: legColor, width: 1.5 * scale, cap: 'round' });

    // Right 2 (Middle Right)
    gfx.moveTo(0, 2 * scale);
    gfx.lineTo(0 + (isMoving ? legPhaseA : 0), 11 * scale);
    gfx.stroke({ color: legColor, width: 1.5 * scale, cap: 'round' });

    // Left 3 (Hind Left)
    gfx.moveTo(-6 * scale, -2 * scale);
    gfx.lineTo(-12 * scale + (isMoving ? legPhaseA : 0), -10 * scale);
    gfx.stroke({ color: legColor, width: 1.5 * scale, cap: 'round' });

    // Right 1, Left 2, Right 3 (Group B)
    // Right 1 (Front Right)
    gfx.moveTo(-2 * scale, 2 * scale);
    gfx.lineTo(4 * scale + (isMoving ? legPhaseB : 0), 10 * scale);
    gfx.stroke({ color: legColor, width: 1.5 * scale, cap: 'round' });

    // Left 2 (Middle Left)
    gfx.moveTo(0, -2 * scale);
    gfx.lineTo(0 + (isMoving ? legPhaseB : 0), -11 * scale);
    gfx.stroke({ color: legColor, width: 1.5 * scale, cap: 'round' });

    // Right 3 (Hind Right)
    gfx.moveTo(-6 * scale, 2 * scale);
    gfx.lineTo(-12 * scale + (isMoving ? legPhaseB : 0), 10 * scale);
    gfx.stroke({ color: legColor, width: 1.5 * scale, cap: 'round' });

    // --- 2. Gaster (Abdomen) ---
    gfx.ellipse(-10 * scale, 0, 7 * scale, 4.5 * scale);
    gfx.fill({ color: isQueen ? 0x4a1d0f : 0x24140b });
    gfx.stroke({ color: 0x140a05, width: 1.0 });

    // Chitin segmentation bands
    gfx.moveTo(-8 * scale, -4 * scale);
    gfx.lineTo(-8 * scale, 4 * scale);
    gfx.moveTo(-11 * scale, -4.2 * scale);
    gfx.lineTo(-11 * scale, 4.2 * scale);
    gfx.moveTo(-14 * scale, -3.2 * scale);
    gfx.lineTo(-14 * scale, 3.2 * scale);
    gfx.stroke({ color: 0x3d2012, width: 1.0 * scale });

    // --- 3. Petiole (Waist Node) ---
    gfx.circle(-4 * scale, 0, 1.8 * scale);
    gfx.fill({ color: 0x1b0e07 });

    // --- 4. Thorax (Mesosoma) ---
    gfx.ellipse(0, 0, 4.5 * scale, 3.2 * scale);
    gfx.fill({ color: isQueen ? 0x3d1a0e : 0x2b170d });
    gfx.stroke({ color: 0x140a05, width: 1.0 });

    // --- 5. Head ---
    const headX = 6 * scale;
    gfx.circle(headX, 0, 3.5 * scale);
    gfx.fill({ color: isQueen ? 0x4a1d0f : 0x2b170d });
    gfx.stroke({ color: 0x140a05, width: 1.0 });

    // Eyes
    gfx.circle(headX + 1.2 * scale, -2.2 * scale, 0.8 * scale);
    gfx.circle(headX + 1.2 * scale, 2.2 * scale, 0.8 * scale);
    gfx.fill({ color: 0x050302 });

    // --- 6. Antennae ---
    const antWobble = Math.sin(walk * 2.0) * 0.15;
    gfx.moveTo(headX + 2.5 * scale, -1.5 * scale);
    gfx.lineTo(headX + 8 * scale, -5 * scale + antWobble);
    gfx.moveTo(headX + 2.5 * scale, 1.5 * scale);
    gfx.lineTo(headX + 8 * scale, 5 * scale - antWobble);
    gfx.stroke({ color: 0x3d2012, width: 1.0 * scale, cap: 'round' });

    // --- 7. Mandibles ---
    const mandibleWobble = (ant.state === 'DIGGING' || ant.state === 'BACKFILLING')
      ? Math.sin(walk * 8.0) * 1.0
      : 0;
    gfx.moveTo(headX + 3.0 * scale, -1.2 * scale);
    gfx.lineTo(headX + 5.5 * scale, -0.6 * scale + mandibleWobble);
    gfx.moveTo(headX + 3.0 * scale, 1.2 * scale);
    gfx.lineTo(headX + 5.5 * scale, 0.6 * scale - mandibleWobble);
    gfx.stroke({ color: 0x150b06, width: 1.2 * scale });

    // --- 8. Carried Mud Ball (if HAULING_MUD / carriedResource === 'MUD') ---
    if (ant.carriedResource === 'MUD' || (ant.mudPayload && ant.mudPayload > 0)) {
      const ballX = headX + 7.5 * scale;
      const ballR = 4.0;
      // Drop shadow
      gfx.circle(ballX, 1.0, ballR);
      gfx.fill({ color: 0x0a0503, alpha: 0.4 });
      // Main mud sphere
      gfx.circle(ballX, 0, ballR);
      gfx.fill({ color: 0xc47b4d });
      // Shading crescent
      gfx.circle(ballX - 1.0, -1.0, ballR * 0.55);
      gfx.fill({ color: 0xdf9b6d, alpha: 0.85 });
    }
  }

  private renderProgressBar(
    targetCell: { cx: number; cy: number },
    progress: number,
    isDig: boolean,
    originX: number = -1200,
    originY: number = 0,
    cellSize: number = 32
  ): void {
    const wx = originX + targetCell.cx * cellSize + cellSize * 0.5;
    const wy = originY + targetCell.cy * cellSize - 8;

    const barW = 28;
    const barH = 4;
    const fillW = Math.max(0, Math.min(26, 26 * progress));

    // Outer Track
    this.progressOverlay.roundRect(wx - barW * 0.5, wy - barH * 0.5, barW, barH, 2);
    this.progressOverlay.fill({ color: 0x1f110a, alpha: 0.85 });
    this.progressOverlay.stroke({ color: isDig ? 0x3a2215 : 0x1b3b2b, width: 1.0 });

    // Active Fill
    if (fillW > 0) {
      this.progressOverlay.roundRect(wx - barW * 0.5 + 1, wy - 1, fillW, 2, 1);
      this.progressOverlay.fill({ color: isDig ? 0xf59e0b : 0x10b981 });
    }
  }

  clear(): void {
    this.progressOverlay.clear();
    for (const gfx of this.antGraphicsMap.values()) {
      gfx.clear();
    }
  }
}
