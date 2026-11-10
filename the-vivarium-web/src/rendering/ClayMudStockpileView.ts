// src/rendering/ClayMudStockpileView.ts
// ============================================================================
// THE VIVARIUM — PixiJS Representation of Physical Clay Mud Stockpile
// Renders earthen excavated chamber, stacked 3D mud balls, and inventory badge
// ============================================================================

import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { ClayMudStockpile } from '../simulation/ClayMudStockpile';

export class ClayMudStockpileView {
  readonly container: Container;
  private stockpile: ClayMudStockpile;
  private pitGraphics: Graphics;
  private mudBallsGraphics: Graphics;
  private hudBadgeGraphics: Graphics;
  private labelText: Text;

  constructor(stockpile: ClayMudStockpile) {
    this.stockpile = stockpile;
    this.container = new Container();
    this.container.position.set(stockpile.worldPos.x, stockpile.worldPos.y);

    this.pitGraphics = new Graphics();
    this.mudBallsGraphics = new Graphics();
    this.hudBadgeGraphics = new Graphics();

    const style = new TextStyle({
      fontFamily: 'monospace',
      fontSize: 10,
      fontWeight: 'bold',
      fill: 0xfbbf24,
      align: 'center',
    });
    this.labelText = new Text({ text: '', style });
    this.labelText.anchor.set(0.5, 0.5);
    this.labelText.position.set(0, -32);

    this.container.addChild(this.pitGraphics);
    this.container.addChild(this.mudBallsGraphics);
    this.container.addChild(this.hudBadgeGraphics);
    this.container.addChild(this.labelText);

    this.renderPit();
    this.update();
    this.stockpile.subscribe(() => this.update());
  }

  private renderPit(): void {
    this.pitGraphics.clear();
    // Earthen concave basin holding the clay balls
    this.pitGraphics.roundRect(-42, -18, 84, 38, 14);
    this.pitGraphics.fill({ color: 0x180e08, alpha: 0.75 });
    this.pitGraphics.stroke({ color: 0x3d2015, width: 2.0, alpha: 0.9 });

    // Root / timber retaining struts
    this.pitGraphics.moveTo(-38, 16);
    this.pitGraphics.lineTo(-30, 24);
    this.pitGraphics.moveTo(38, 16);
    this.pitGraphics.lineTo(30, 24);
    this.pitGraphics.stroke({ color: 0x5a351d, width: 2.5, cap: 'round' });
  }

  public update(): void {
    const totalCount = this.stockpile.getTotalCount();
    const available = this.stockpile.getAvailableCount();
    const capacity = this.stockpile.maxCapacity;

    // 1. Stacked Mud Balls rendering
    this.mudBallsGraphics.clear();
    const ballRadius = 4.0;
    const cols = 8;
    const spacingX = 8.5;
    const spacingY = 7.0;
    const startX = -((cols - 1) * spacingX) * 0.5;
    const startY = 12;

    for (let i = 0; i < totalCount; i++) {
      const row = Math.floor(i / cols);
      const col = i % cols;
      const x = startX + col * spacingX + (row % 2) * 4.0;
      const y = startY - row * spacingY;

      // Drop shadow
      this.mudBallsGraphics.circle(x, y + 1.2, ballRadius);
      this.mudBallsGraphics.fill({ color: 0x0c0704, alpha: 0.45 });

      // Sphere base
      this.mudBallsGraphics.circle(x, y, ballRadius);
      this.mudBallsGraphics.fill({ color: 0x824d28 });

      // Highlight crescent
      this.mudBallsGraphics.circle(x - 1.2, y - 1.2, ballRadius * 0.55);
      this.mudBallsGraphics.fill({ color: 0xb07346, alpha: 0.85 });
    }

    // 2. HUD Badge Pill
    this.hudBadgeGraphics.clear();
    this.hudBadgeGraphics.roundRect(-48, -40, 96, 16, 8);
    this.hudBadgeGraphics.fill({ color: 0x0f0906, alpha: 0.88 });
    this.hudBadgeGraphics.stroke({
      color: available > 0 ? 0xa76f45 : 0xef4444,
      width: 1.2,
      alpha: 0.9,
    });

    // Mud icon dot
    this.hudBadgeGraphics.circle(-38, -32, 3.5);
    this.hudBadgeGraphics.fill({ color: 0xc47b4d });

    this.labelText.text = `MUD: ${available}/${capacity}`;
    this.labelText.style.fill = available > 0 ? 0xfbbf24 : 0xef4444;
  }
}
