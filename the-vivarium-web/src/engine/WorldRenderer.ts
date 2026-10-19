import { Application, Container, Graphics, Sprite, Assets } from 'pixi.js';
import { CameraController } from './CameraController';
import { EcoSim } from '../simulation/EcoSim';
import type { ToolType } from '../types';

export class WorldRenderer {
  app: Application;
  sim: EcoSim;
  camera: CameraController;

  // Scene Layers
  public worldContainer: Container;
  public masterIllustrationSprite: Sprite | null = null;
  private skyLayer: Graphics;
  private treeAndCanopyLayer: Graphics;
  private lakeLayer: Graphics;
  private honeycombLayer: Graphics;
  private soilLayer: Graphics;
  private antTunnelLayer: Graphics;
  private entitiesLayer: Container;
  private antsGraphics: Graphics;
  private beesGraphics: Graphics;
  private fishesGraphics: Graphics;
  private lightingLayer: Graphics;
  private cursorIndicator: Graphics;

  currentTool: ToolType = 'SELECT';
  hoverCell: { cx: number; cy: number } | null = null;

  private isRunning: boolean = true;
  private timeElapsed: number = 0;

  constructor(app: Application, sim: EcoSim) {
    this.app = app;
    this.sim = sim;

    this.worldContainer = new Container();
    this.app.stage.addChild(this.worldContainer);

    this.camera = new CameraController(this.worldContainer);
    this.camera.setViewportSize(window.innerWidth, window.innerHeight);
    this.camera.updateTransform();

    // Initialize layers
    this.skyLayer = new Graphics();
    this.treeAndCanopyLayer = new Graphics();
    this.lakeLayer = new Graphics();
    this.honeycombLayer = new Graphics();
    this.soilLayer = new Graphics();
    this.antTunnelLayer = new Graphics();
    this.entitiesLayer = new Container();
    this.antsGraphics = new Graphics();
    this.beesGraphics = new Graphics();
    this.fishesGraphics = new Graphics();
    this.lightingLayer = new Graphics();
    this.cursorIndicator = new Graphics();

    this.entitiesLayer.addChild(this.fishesGraphics);
    this.entitiesLayer.addChild(this.antsGraphics);
    this.entitiesLayer.addChild(this.beesGraphics);

    this.worldContainer.addChild(this.skyLayer);
    this.worldContainer.addChild(this.treeAndCanopyLayer);
    this.worldContainer.addChild(this.lakeLayer);
    this.worldContainer.addChild(this.honeycombLayer);
    this.worldContainer.addChild(this.soilLayer);
    this.worldContainer.addChild(this.antTunnelLayer);
    this.worldContainer.addChild(this.entitiesLayer);
    this.worldContainer.addChild(this.lightingLayer);
    this.worldContainer.addChild(this.cursorIndicator);

    this.loadMasterArt();
    this.drawEnvironment();
    this.drawSubterraneanTunnels();
  }

  private async loadMasterArt(): Promise<void> {
    try {
      // 1. Clean Surface Canopy & Meadow (X: 0, Y: 0, W: 1920, H: 640)
      const canopyTexture = await Assets.load('/art/pure_surface_canopy.jpg');
      const canopySprite = new Sprite(canopyTexture);
      canopySprite.x = 0;
      canopySprite.y = 0;
      canopySprite.width = 1920;
      canopySprite.height = 640;
      this.worldContainer.addChildAt(canopySprite, 0);

      // 2. Clean Underground Formicarium (X: 0, Y: 640, W: 1920, H: 1050)
      const underTexture = await Assets.load('/art/pure_underground_formicarium.jpg');
      const underSprite = new Sprite(underTexture);
      underSprite.x = 0;
      underSprite.y = 640;
      underSprite.width = 1920;
      underSprite.height = 1050;
      this.worldContainer.addChildAt(underSprite, 1);

      this.masterIllustrationSprite = canopySprite;

      // Make procedural sky and soil layers transparent so pure master artwork shines seamlessly
      this.skyLayer.alpha = 0.0;
      this.soilLayer.alpha = 0.0;
      this.treeAndCanopyLayer.alpha = 0.0;
    } catch (e) {
      console.warn('Could not load master art texture:', e);
    }
  }

  // Draw ancient tree, meadow, flowers, and natural outworld elements
  drawEnvironment(): void {
    const W = 1920;
    const groundY = 640;

    // 1. Sky & Sun Atmosphere
    this.skyLayer.clear();
    // Sky gradient rectangle
    this.skyLayer.rect(0, 0, W, groundY);
    this.skyLayer.fill({ color: 0x8ecae6, alpha: 1.0 });

    // Distant soft hill silhouette
    this.skyLayer.poly([
      { x: 0, y: groundY - 60 },
      { x: 400, y: groundY - 140 },
      { x: 950, y: groundY - 80 },
      { x: 1400, y: groundY - 160 },
      { x: 1920, y: groundY - 90 },
      { x: 1920, y: groundY },
      { x: 0, y: groundY },
    ]);
    this.skyLayer.fill({ color: 0x588157, alpha: 0.65 });

    // 2. Lake Basin (X: 1460 -> 1900)
    this.lakeLayer.clear();
    this.lakeLayer.roundRect(1460, groundY - 80, 420, 100, 32);
    this.lakeLayer.fill({ color: 0x2a6f97, alpha: 0.85 });
    // Water surface glimmer line
    this.lakeLayer.moveTo(1480, groundY - 70);
    this.lakeLayer.lineTo(1860, groundY - 70);
    this.lakeLayer.stroke({ color: 0x89c2d9, width: 3, alpha: 0.75 });

    // 3. Ancient Mossy Oak Tree (Trunk X: 1100 -> 1380, branching across top)
    this.treeAndCanopyLayer.clear();
    // Massive Trunk
    this.treeAndCanopyLayer.poly([
      { x: 1180, y: groundY },
      { x: 1220, y: 350 },
      { x: 1140, y: 150 },
      { x: 1360, y: 110 },
      { x: 1460, y: 320 },
      { x: 1400, y: groundY },
    ]);
    this.treeAndCanopyLayer.fill({ color: 0x4a2e1b });

    // Massive Horizontal Bough for Honeycomb (Extends Left towards center: X 750 -> 1260, Y 240 -> 310)
    this.treeAndCanopyLayer.poly([
      { x: 740, y: 240 },
      { x: 1260, y: 220 },
      { x: 1280, y: 300 },
      { x: 780, y: 310 },
    ]);
    this.treeAndCanopyLayer.fill({ color: 0x3d2415 });

    // Moss clusters on bough
    this.treeAndCanopyLayer.roundRect(790, 230, 420, 18, 9);
    this.treeAndCanopyLayer.fill({ color: 0x588157, alpha: 0.9 });

    // Lush Canopy Leaf Tufts
    const leafClusters = [
      { x: 740, y: 160, r: 120 },
      { x: 920, y: 120, r: 140 },
      { x: 1120, y: 90, r: 160 },
      { x: 1320, y: 80, r: 150 },
      { x: 1540, y: 130, r: 130 },
      { x: 1680, y: 190, r: 110 },
    ];
    for (const c of leafClusters) {
      this.treeAndCanopyLayer.circle(c.x, c.y, c.r);
      this.treeAndCanopyLayer.fill({ color: 0x2d6a4f, alpha: 0.95 });
      this.treeAndCanopyLayer.circle(c.x + 15, c.y - 12, c.r * 0.75);
      this.treeAndCanopyLayer.fill({ color: 0x40916c, alpha: 0.85 });
    }

    // 4. Meadow Ground Turf & Wildflowers
    // Lush top grass strip
    this.treeAndCanopyLayer.rect(0, groundY - 14, 1460, 14);
    this.treeAndCanopyLayer.fill({ color: 0x38b000 });

    // Individual detailed flowers
    for (const f of this.sim.beeColony.flowers) {
      // Stem
      this.treeAndCanopyLayer.moveTo(f.position.x, f.position.y);
      this.treeAndCanopyLayer.lineTo(f.position.x, groundY);
      this.treeAndCanopyLayer.stroke({ color: 0x2d6a4f, width: 2.5 });

      if (f.floralType === 'DAISY') {
        // Daisy white petals + golden center
        for (let a = 0; a < Math.PI * 2; a += Math.PI / 4) {
          const px = f.position.x + Math.cos(a) * 11;
          const py = f.position.y + Math.sin(a) * 11;
          this.treeAndCanopyLayer.circle(px, py, 4.5);
          this.treeAndCanopyLayer.fill({ color: 0xffffff });
        }
        this.treeAndCanopyLayer.circle(f.position.x, f.position.y, 6.5);
        this.treeAndCanopyLayer.fill({ color: 0xffb703 });
      } else if (f.floralType === 'BLUEBELL') {
        // Bellflower lavender
        this.treeAndCanopyLayer.circle(f.position.x, f.position.y, 8);
        this.treeAndCanopyLayer.fill({ color: 0x7209b7 });
      } else {
        // Clover white/pink pom-pom
        this.treeAndCanopyLayer.circle(f.position.x, f.position.y, 7.5);
        this.treeAndCanopyLayer.fill({ color: 0xffe5ec });
        this.treeAndCanopyLayer.circle(f.position.x, f.position.y - 2, 5.5);
        this.treeAndCanopyLayer.fill({ color: 0xf72585, alpha: 0.4 });
      }
    }

    // 5. Honeycomb Cells under ancient bough
    this.drawHoneycombCells();
  }

  private drawHoneycombCells(): void {
    this.honeycombLayer.clear();
    const originX = this.sim.beeColony.hivePosition.x;
    const originY = this.sim.beeColony.hivePosition.y;
    const hexR = 20;

    for (const cell of this.sim.beeColony.honeycomb) {
      // Hex to cartesian
      const hx = originX + hexR * Math.sqrt(3) * (cell.cx + cell.cy / 2);
      const hy = originY + hexR * (3 / 2) * cell.cy;

      // Hexagon shape
      const pts: { x: number; y: number }[] = [];
      for (let i = 0; i < 6; i++) {
        const rad = (Math.PI / 3) * i + Math.PI / 6;
        pts.push({
          x: hx + hexR * Math.cos(rad),
          y: hy + hexR * Math.sin(rad),
        });
      }

      this.honeycombLayer.poly(pts);
      // Honey wax fill with amber glow
      if (cell.type === 'HONEY') {
        this.honeycombLayer.fill({ color: 0xffb703, alpha: 0.95 });
        this.honeycombLayer.poly(pts);
        this.honeycombLayer.stroke({ color: 0xfb8500, width: 2.5 });
        // Gloss highlight
        this.honeycombLayer.circle(hx - 4, hy - 4, 4);
        this.honeycombLayer.fill({ color: 0xffffff, alpha: 0.5 });
      } else {
        this.honeycombLayer.fill({ color: 0x2b1c10, alpha: 0.85 });
        this.honeycombLayer.poly(pts);
        this.honeycombLayer.stroke({ color: 0x936639, width: 2 });
      }
    }
  }

  // Subterranean: Render solid rich loam, then naturally carved cavities
  drawSubterraneanTunnels(): void {
    const W = 1920;
    const H = 1792;
    const groundY = 640;
    const grid = this.sim.grid;

    this.soilLayer.clear();
    // Continuous rich earth cross-section (dark chocolate loam)
    this.soilLayer.rect(0, groundY, W, H - groundY);
    this.soilLayer.fill({ color: 0x25160e });

    // Subtle strata depth bands
    for (let sy = groundY + 80; sy < H; sy += 160) {
      this.soilLayer.rect(0, sy, W, 40);
      this.soilLayer.fill({ color: 0x1d1109, alpha: 0.45 });
    }

    // Now carve excavated cells using warm red observation formicarium glow
    this.antTunnelLayer.clear();
    const halfCell = grid.cellSize * 0.5;

    for (let cy = 0; cy < grid.rows; cy++) {
      for (let cx = 0; cx < grid.cols; cx++) {
        const wx = cx * grid.cellSize;
        const wy = grid.originY + cy * grid.cellSize;

        if (!grid.isSolid(cx, cy)) {
          // Warm amber subterranean excavated cavity with soft lantern glow
          this.antTunnelLayer.roundRect(wx - 2, wy - 2, grid.cellSize + 4, grid.cellSize + 4, 10);
          this.antTunnelLayer.fill({ color: 0x3d1a0c, alpha: 0.35 });

          // Lantern ambient warmth
          this.antTunnelLayer.circle(wx + halfCell, wy + halfCell, halfCell * 0.85);
          this.antTunnelLayer.fill({ color: 0xffaa00, alpha: 0.15 });
        } else if (grid.hasDigOrder(cx, cy)) {
          // Shovel dig order highlighted outline
          this.antTunnelLayer.roundRect(wx + 2, wy + 2, grid.cellSize - 4, grid.cellSize - 4, 6);
          this.antTunnelLayer.stroke({ color: 0xffd166, width: 2.5, alpha: 0.95 });
        }
      }
    }
  }

  update(delta: number): void {
    if (!this.isRunning) return;
    this.timeElapsed += delta;

    // 1. Update Camera
    this.camera.update(delta);

    // 2. Animate Lake Water Glint & Fish
    this.lakeLayer.alpha = 0.95 + Math.sin(this.timeElapsed * 2.5) * 0.05;
    this.renderFishes();

    // 3. Render Worker & Queen Ants
    this.renderAnts();

    // 4. Render Worker & Queen Bees
    this.renderBees();

    // 5. Update Day/Night Dynamic Lighting
    this.renderLighting();

    // 6. Interactive Tool Cursor Indicator
    this.renderCursorIndicator();
  }

  private renderFishes(): void {
    this.fishesGraphics.clear();
    for (const f of this.sim.fishes) {
      // Sleek swimming fish body
      this.fishesGraphics.circle(f.position.x, f.position.y, f.size * 0.4);
      this.fishesGraphics.fill({ color: 0xf3722c, alpha: 0.85 });
      // Wiggling tail
      const tailX = f.position.x - Math.cos(f.angle) * f.size;
      const tailY = f.position.y - Math.sin(f.angle) * f.size + Math.sin(f.wiggle) * 4;
      this.fishesGraphics.moveTo(f.position.x, f.position.y);
      this.fishesGraphics.lineTo(tailX, tailY);
      this.fishesGraphics.stroke({ color: 0xf9c74f, width: 3 });
    }
  }

  private renderAnts(): void {
    this.antsGraphics.clear();
    for (const ant of this.sim.antColony.ants) {
      const isQueen = ant.type === 'QUEEN';
      const scale = isQueen ? 2.4 : 1.0;

      const px = ant.position.x;
      const py = ant.position.y;
      const ang = ant.angle;

      // Soft drop shadow
      this.antsGraphics.circle(px, py + 2, 6 * scale);
      this.antsGraphics.fill({ color: 0x000000, alpha: 0.35 });

      // Shiny chitin gaster (abdomen)
      const gasterX = px - Math.cos(ang) * (9 * scale);
      const gasterY = py - Math.sin(ang) * (9 * scale);
      this.antsGraphics.circle(gasterX, gasterY, 6 * scale);
      this.antsGraphics.fill({ color: isQueen ? 0x8b2500 : 0x1f110c });
      // Amber highlight stripe
      this.antsGraphics.circle(gasterX, gasterY, 3 * scale);
      this.antsGraphics.fill({ color: isQueen ? 0xd05a3f : 0x4a2818, alpha: 0.6 });

      // Thorax (midsection)
      this.antsGraphics.circle(px, py, 4 * scale);
      this.antsGraphics.fill({ color: 0x2e1910 });

      // Head + Mandibles
      const headX = px + Math.cos(ang) * (8 * scale);
      const headY = py + Math.sin(ang) * (8 * scale);
      this.antsGraphics.circle(headX, headY, 4.5 * scale);
      this.antsGraphics.fill({ color: 0x3d2015 });

      // 6 Articulated Legs
      for (let leg = -1; leg <= 1; leg++) {
        const legOffset = leg * 3.5 * scale;
        const legWiggle = Math.sin(ant.walkCycle + leg * 1.5) * 4 * scale;
        // Left Leg
        const lx0 = px + Math.cos(ang) * legOffset;
        const ly0 = py + Math.sin(ang) * legOffset;
        const lx1 = lx0 + Math.cos(ang - Math.PI / 2) * (10 * scale) + Math.cos(ang) * legWiggle;
        const ly1 = ly0 + Math.sin(ang - Math.PI / 2) * (10 * scale) + Math.sin(ang) * legWiggle;
        this.antsGraphics.moveTo(lx0, ly0);
        this.antsGraphics.lineTo(lx1, ly1);
        this.antsGraphics.stroke({ color: 0x8b4513, width: 1.5 * scale });

        // Right Leg
        const rx1 = lx0 + Math.cos(ang + Math.PI / 2) * (10 * scale) - Math.cos(ang) * legWiggle;
        const ry1 = ly0 + Math.sin(ang + Math.PI / 2) * (10 * scale) - Math.sin(ang) * legWiggle;
        this.antsGraphics.moveTo(lx0, ly0);
        this.antsGraphics.lineTo(rx1, ry1);
        this.antsGraphics.stroke({ color: 0x8b4513, width: 1.5 * scale });
      }

      // Antennae twitching
      const antWiggle = Math.sin(ant.walkCycle * 2.5) * 0.4;
      const antL = {
        x: headX + Math.cos(ang - 0.45 + antWiggle) * (10 * scale),
        y: headY + Math.sin(ang - 0.45 + antWiggle) * (10 * scale),
      };
      const antR = {
        x: headX + Math.cos(ang + 0.45 - antWiggle) * (10 * scale),
        y: headY + Math.sin(ang + 0.45 - antWiggle) * (10 * scale),
      };
      this.antsGraphics.moveTo(headX, headY);
      this.antsGraphics.lineTo(antL.x, antL.y);
      this.antsGraphics.stroke({ color: 0xffa500, width: 1.5 * scale });
      this.antsGraphics.moveTo(headX, headY);
      this.antsGraphics.lineTo(antR.x, antR.y);
      this.antsGraphics.stroke({ color: 0xffa500, width: 1.5 * scale });

      // Carried mud ball
      if (ant.carriedResource === 'MUD') {
        const ballX = headX + Math.cos(ang) * (8 * scale);
        const ballY = headY + Math.sin(ang) * (8 * scale);
        this.antsGraphics.circle(ballX, ballY, 4.5 * scale);
        this.antsGraphics.fill({ color: 0xc47b4d });
      }
    }
  }

  private renderBees(): void {
    this.beesGraphics.clear();
    for (const bee of this.sim.beeColony.bees) {
      const isQueen = bee.type === 'QUEEN';
      const scale = isQueen ? 1.8 : 1.0;
      const px = bee.position.x;
      const py = bee.position.y;

      // Soft shadow under bee
      this.beesGraphics.circle(px, py + 8 * scale, 5 * scale);
      this.beesGraphics.fill({ color: 0x000000, alpha: 0.25 });

      // Striped Bee Abdomen
      this.beesGraphics.roundRect(px - 9 * scale, py - 6 * scale, 18 * scale, 12 * scale, 6 * scale);
      this.beesGraphics.fill({ color: 0xfb8500 }); // Golden honey
      // Black stripes
      this.beesGraphics.rect(px - 4 * scale, py - 6 * scale, 3 * scale, 12 * scale);
      this.beesGraphics.fill({ color: 0x023047 });
      this.beesGraphics.rect(px + 2 * scale, py - 6 * scale, 3 * scale, 12 * scale);
      this.beesGraphics.fill({ color: 0x023047 });

      // Translucent Shimmering Wings
      const wingW = 10 * scale;
      const wingH = 14 * scale;
      const wingFlap = bee.wingAngle * 0.4;
      this.beesGraphics.ellipse(px - 2, py - 8 * scale + wingFlap, wingW, wingH * 0.6);
      this.beesGraphics.fill({ color: 0xffffff, alpha: 0.65 });

      // Bright Yellow Pollen Basket
      if (bee.nectarLoad > 0) {
        this.beesGraphics.circle(px, py + 5 * scale, 3.5 * scale);
        this.beesGraphics.fill({ color: 0xffea00 });
      }
    }
  }

  private renderLighting(): void {
    this.lightingLayer.clear();
    const timeOfDay = this.sim.environment.timeOfDay;
    // Calculate darkness (noon = 0.0, night = 0.65)
    const sunFactor = Math.sin(timeOfDay * Math.PI * 2 - Math.PI / 2) * 0.5 + 0.5;
    const darkness = (1.0 - sunFactor) * 0.65;

    if (darkness > 0.05) {
      // Midnight blue ambient overlay on the entire outworld
      this.lightingLayer.rect(0, 0, 1920, 640);
      this.lightingLayer.fill({ color: 0x03071e, alpha: darkness });
    }
  }

  private renderCursorIndicator(): void {
    this.cursorIndicator.clear();
    if (!this.hoverCell) return;

    const wx = this.hoverCell.cx * this.sim.grid.cellSize;
    const wy = this.sim.grid.originY + this.hoverCell.cy * this.sim.grid.cellSize;
    const size = this.sim.grid.cellSize;

    if (this.currentTool === 'DIG') {
      this.cursorIndicator.roundRect(wx, wy, size, size, 4);
      this.cursorIndicator.stroke({ color: 0xffb703, width: 2.5 });
    } else if (this.currentTool === 'FILL') {
      this.cursorIndicator.roundRect(wx, wy, size, size, 4);
      this.cursorIndicator.stroke({ color: 0x936639, width: 2.5 });
    }
  }

  handlePointerClick(screenX: number, screenY: number): void {
    const worldPos = this.camera.screenToWorld({ x: screenX, y: screenY });
    const cell = this.sim.grid.worldToCell(worldPos);

    if (this.currentTool === 'DIG') {
      this.sim.grid.queueDig(cell.cx, cell.cy);
      this.drawSubterraneanTunnels();
    } else if (this.currentTool === 'FILL') {
      this.sim.grid.setSolid(cell.cx, cell.cy, true);
      this.drawSubterraneanTunnels();
    }
  }

  handlePointerMove(screenX: number, screenY: number): void {
    const worldPos = this.camera.screenToWorld({ x: screenX, y: screenY });
    const cell = this.sim.grid.worldToCell(worldPos);
    if (cell.cx >= 0 && cell.cx < this.sim.grid.cols && cell.cy >= 0 && cell.cy < this.sim.grid.rows) {
      this.hoverCell = cell;
    } else {
      this.hoverCell = null;
    }
  }
}
