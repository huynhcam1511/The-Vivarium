// src/rendering/HoneydewSourceView.ts
// ============================================================================
// THE VIVARIUM — PixiJS Representation of Subterranean Aphid Honeydew Cache
// Renders glowing honeydew drop pool, root tendrils, and quantity badge
// ============================================================================

import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { HoneydewSource } from '../simulation/HoneydewSource';

export class HoneydewSourceView {
  readonly container: Container;
  private honeydewSource: HoneydewSource;
  private basinGraphics: Graphics;
  private dewDropsGraphics: Graphics;
  private labelText: Text;

  constructor(honeydewSource: HoneydewSource) {
    this.honeydewSource = honeydewSource;
    this.container = new Container();
    this.container.position.set(honeydewSource.worldPos.x, honeydewSource.worldPos.y);

    this.basinGraphics = new Graphics();
    this.dewDropsGraphics = new Graphics();

    const style = new TextStyle({
      fontFamily: 'monospace',
      fontSize: 10,
      fontWeight: 'bold',
      fill: 0xf59e0b,
      align: 'center',
    });
    this.labelText = new Text({ text: '', style });
    this.labelText.anchor.set(0.5, 0.5);
    this.labelText.position.set(0, -28);

    this.container.addChild(this.basinGraphics);
    this.container.addChild(this.dewDropsGraphics);
    this.container.addChild(this.labelText);

    this.renderBasin();
    this.update();
    this.honeydewSource.subscribe(() => this.update());
  }

  private renderBasin(): void {
    this.basinGraphics.clear();
    // Earthen root basin
    this.basinGraphics.roundRect(-28, -14, 56, 28, 10);
    this.basinGraphics.fill({ color: 0x1a1505, alpha: 0.8 });
    this.basinGraphics.stroke({ color: 0x78350f, width: 2.0, alpha: 0.9 });

    // Root brackets
    this.basinGraphics.moveTo(-24, 10);
    this.basinGraphics.lineTo(-18, 16);
    this.basinGraphics.moveTo(24, 10);
    this.basinGraphics.lineTo(18, 16);
    this.basinGraphics.stroke({ color: 0x92400e, width: 2.0, cap: 'round' });
  }

  public update(): void {
    const amount = this.honeydewSource.getAvailableCount();
    const capacity = this.honeydewSource.getMaxCapacity();
    this.dewDropsGraphics.clear();

    // Render glowing amber honey drops
    const fillRatio = Math.min(1.0, amount / capacity);
    if (amount > 0) {
      const dropRadius = 4 + fillRatio * 6;
      // Ambient glow
      this.dewDropsGraphics.circle(0, 0, dropRadius + 4);
      this.dewDropsGraphics.fill({ color: 0xf59e0b, alpha: 0.25 });

      // Core amber liquid
      this.dewDropsGraphics.circle(0, 0, dropRadius);
      this.dewDropsGraphics.fill({ color: 0xfbbf24, alpha: 0.85 });

      // Highlight shimmer
      this.dewDropsGraphics.circle(-dropRadius * 0.35, -dropRadius * 0.35, dropRadius * 0.35);
      this.dewDropsGraphics.fill({ color: 0xfef08a, alpha: 0.9 });
    }

    this.labelText.text = `🍯 Mật: ${amount}/${capacity}`;
  }
}
