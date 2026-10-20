import { Container, Graphics } from 'pixi.js';
import type { WeatherSystem } from './WeatherSystem';

interface RainDrop {
  x: number;
  y: number;
  speed: number;
  length: number;
  thickness: number;
  alpha: number;
}

interface FallingLeaf {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  vRot: number;
  size: number;
  color: number;
  alpha: number;
}

interface CloudLayer {
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
  alpha: number;
  color: number;
}

export class WeatherRenderer {
  public container: Container;

  private skyTintGraphics: Graphics;
  private distantMountainsGraphics: Graphics;
  private cloudGraphics: Graphics;
  private mistGraphics: Graphics;
  private leafGraphics: Graphics;
  private rainGraphics: Graphics;
  private lightningGraphics: Graphics;

  private weatherSystem: WeatherSystem;
  private rainDrops: RainDrop[] = [];
  private maxRainDrops: number = 750;

  private fallingLeaves: FallingLeaf[] = [];
  private maxLeaves: number = 60;

  private clouds: CloudLayer[] = [];

  private viewWidth: number = 1920;
  private viewHeight: number = 640; // Outworld sky height above Y=640

  constructor(weatherSystem: WeatherSystem, width: number = 1920, height: number = 640) {
    this.weatherSystem = weatherSystem;
    this.viewWidth = width;
    this.viewHeight = height;

    this.container = new Container();

    this.skyTintGraphics = new Graphics();
    this.distantMountainsGraphics = new Graphics();
    this.cloudGraphics = new Graphics();
    this.mistGraphics = new Graphics();
    this.leafGraphics = new Graphics();
    this.rainGraphics = new Graphics();
    this.lightningGraphics = new Graphics();

    // Layer stack ordering
    this.container.addChild(this.skyTintGraphics);
    this.container.addChild(this.distantMountainsGraphics);
    this.container.addChild(this.cloudGraphics);
    this.container.addChild(this.mistGraphics);
    this.container.addChild(this.leafGraphics);
    this.container.addChild(this.rainGraphics);
    this.container.addChild(this.lightningGraphics);

    this.initClouds();
    this.initRainPool();
    this.initLeavesPool();
  }

  private initClouds(): void {
    // 3 parallax cloud layers
    this.clouds = [
      { x: 100, y: 70, width: 450, height: 110, speed: 6.0, alpha: 0.35, color: 0xecf0f1 },
      { x: 650, y: 130, width: 550, height: 130, speed: 10.0, alpha: 0.45, color: 0xbdc3c7 },
      { x: 1300, y: 90, width: 600, height: 140, speed: 8.0, alpha: 0.40, color: 0xdfe6e9 },
      { x: 1750, y: 160, width: 480, height: 120, speed: 12.0, alpha: 0.50, color: 0xb2bec3 },
    ];
  }

  private initRainPool(): void {
    for (let i = 0; i < this.maxRainDrops; i++) {
      this.rainDrops.push({
        x: Math.random() * (this.viewWidth + 500) - 200,
        y: Math.random() * this.viewHeight,
        speed: 650 + Math.random() * 450,
        length: 14 + Math.random() * 18,
        thickness: 1.2 + Math.random() * 1.2,
        alpha: 0.4 + Math.random() * 0.5,
      });
    }
  }

  private initLeavesPool(): void {
    const leafColors = [0x2d6a4f, 0x40916c, 0xd4a373, 0xbc6c25, 0xdda15e];
    for (let i = 0; i < this.maxLeaves; i++) {
      this.fallingLeaves.push({
        x: 400 + Math.random() * 1100, // around oak canopy
        y: Math.random() * (this.viewHeight - 100),
        vx: (Math.random() - 0.2) * 40,
        vy: 20 + Math.random() * 45,
        rotation: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 4.0,
        size: 7 + Math.random() * 7,
        color: leafColors[Math.floor(Math.random() * leafColors.length)],
        alpha: 0.75 + Math.random() * 0.25,
      });
    }
  }

  public update(dt: number, timeOfDay: number = 0.5): void {
    const state = this.weatherSystem.getWeatherState();
    const wind = this.weatherSystem.getWind();

    // 1. Render Sky Tint & Day/Night Atmosphere
    this.renderSkyTint(state, timeOfDay);

    // 2. Distant mountain silhouette (ENV-SKY-MNTN-001)
    this.renderDistantMountains(state);

    // 3. Clouds (ENV-SKY-CLOUDS-001)
    this.renderClouds(dt, state, wind.speed);

    // 4. Mist & Fog
    this.renderMist(state);

    // 5. Swaying falling leaves (ENV-CANOPY-LEAF-FALL)
    this.renderFallingLeaves(dt, wind.speed, state.currentWeather);

    // 6. Precipitation (ENV-FX-RAIN-DROP-01)
    this.renderPrecipitation(dt, state, wind);

    // 7. Thunder / Lightning Flash
    this.renderLightning(state);
  }

  private renderSkyTint(state: ReturnType<WeatherSystem['getWeatherState']>, _timeOfDay: number): void {
    this.skyTintGraphics.clear();

    // Storm darkness tint
    const stormTintAlpha = state.cloudCoverage * 0.55;
    if (stormTintAlpha > 0.02) {
      // Dark slate grey overcast overlay
      const stormColor = state.currentWeather === 'STORMY_TEMPEST' ? 0x1a252f : 0x2c3e50;
      this.skyTintGraphics.rect(0, 0, this.viewWidth, this.viewHeight);
      this.skyTintGraphics.fill({ color: stormColor, alpha: stormTintAlpha });
    }

    // Heatwave warm haze
    if (state.currentWeather === 'HEATWAVE') {
      this.skyTintGraphics.rect(0, 0, this.viewWidth, this.viewHeight);
      this.skyTintGraphics.fill({ color: 0xffa500, alpha: 0.12 });
    }
  }

  private renderDistantMountains(state: ReturnType<WeatherSystem['getWeatherState']>): void {
    this.distantMountainsGraphics.clear();
    const groundY = this.viewHeight;

    // Distant mountain silhouette (LOD0-LOD1 soft ridge)
    // Fog opacity increases with humidity/cloud
    const alpha = Math.max(0.25, 0.65 - state.cloudCoverage * 0.35);

    // Far peak ridge
    this.distantMountainsGraphics.poly([
      { x: 0, y: groundY - 140 },
      { x: 260, y: groundY - 260 },
      { x: 520, y: groundY - 190 },
      { x: 820, y: groundY - 310 },
      { x: 1120, y: groundY - 210 },
      { x: 1480, y: groundY - 290 },
      { x: 1780, y: groundY - 180 },
      { x: this.viewWidth, y: groundY - 220 },
      { x: this.viewWidth, y: groundY },
      { x: 0, y: groundY },
    ]);
    this.distantMountainsGraphics.fill({ color: 0x4a6984, alpha: alpha * 0.5 });

    // Closer foothills
    this.distantMountainsGraphics.poly([
      { x: 0, y: groundY - 80 },
      { x: 380, y: groundY - 160 },
      { x: 740, y: groundY - 110 },
      { x: 1180, y: groundY - 170 },
      { x: 1560, y: groundY - 120 },
      { x: this.viewWidth, y: groundY - 90 },
      { x: this.viewWidth, y: groundY },
      { x: 0, y: groundY },
    ]);
    this.distantMountainsGraphics.fill({ color: 0x3d5a45, alpha: alpha * 0.7 });
  }

  private renderClouds(dt: number, state: ReturnType<WeatherSystem['getWeatherState']>, windSpeed: number): void {
    this.cloudGraphics.clear();
    if (state.cloudCoverage <= 0.05) return;

    for (const c of this.clouds) {
      c.x += (c.speed + windSpeed * 3.0) * dt;
      if (c.x > this.viewWidth + c.width) {
        c.x = -c.width - 50;
        c.y = 40 + Math.random() * (this.viewHeight * 0.35);
      }

      const activeAlpha = c.alpha * state.cloudCoverage;
      // Stylized billowy cloud clumps
      const cx = c.x;
      const cy = c.y;
      const w = c.width;
      const h = c.height;

      this.cloudGraphics.ellipse(cx, cy, w * 0.45, h * 0.4);
      this.cloudGraphics.ellipse(cx - w * 0.22, cy + 10, w * 0.3, h * 0.35);
      this.cloudGraphics.ellipse(cx + w * 0.22, cy + 5, w * 0.32, h * 0.35);
      this.cloudGraphics.fill({ color: c.color, alpha: activeAlpha });
    }
  }

  private renderMist(state: ReturnType<WeatherSystem['getWeatherState']>): void {
    this.mistGraphics.clear();
    const isMist = state.currentWeather === 'FOGGY_MIST' || state.humidity > 88;
    if (!isMist) return;

    const mistAlpha = state.currentWeather === 'FOGGY_MIST' ? 0.35 : 0.15;
    // Ground mist ribbon
    this.mistGraphics.roundRect(0, this.viewHeight - 110, this.viewWidth, 100, 20);
    this.mistGraphics.fill({ color: 0xecf0f1, alpha: mistAlpha });

    // Upper canopy mist ribbon
    this.mistGraphics.roundRect(400, 150, 1100, 80, 30);
    this.mistGraphics.fill({ color: 0xecf0f1, alpha: mistAlpha * 0.6 });
  }

  private renderFallingLeaves(dt: number, windSpeed: number, weather: string): void {
    this.leafGraphics.clear();
    const isAutumn = weather === 'AUTUMN_BREEZE' || weather === 'STORMY_TEMPEST';
    const activeLeaves = isAutumn ? this.fallingLeaves : this.fallingLeaves.slice(0, 12);

    for (const leaf of activeLeaves) {
      leaf.x += (leaf.vx + windSpeed * 12.0) * dt;
      leaf.y += leaf.vy * dt;
      leaf.rotation += leaf.vRot * dt;

      // Wrap around canopy area
      if (leaf.y > this.viewHeight || leaf.x > this.viewWidth + 50) {
        leaf.x = 450 + Math.random() * 800;
        leaf.y = 80 + Math.random() * 120;
      }

      // Draw stylized leaf petal
      this.leafGraphics.ellipse(leaf.x, leaf.y, leaf.size, leaf.size * 0.45);
      this.leafGraphics.fill({ color: leaf.color, alpha: leaf.alpha });
    }
  }

  private renderPrecipitation(dt: number, state: ReturnType<WeatherSystem['getWeatherState']>, wind: { speed: number; angle: number }): void {
    this.rainGraphics.clear();
    const intensity = state.rainIntensity;
    if (intensity <= 0.01) return;

    const activeCount = Math.floor(this.maxRainDrops * intensity);
    const slantX = Math.sin(wind.angle) * (wind.speed * 8.0);

    for (let i = 0; i < activeCount; i++) {
      const drop = this.rainDrops[i];
      drop.x += (slantX * 6.0) * dt;
      drop.y += drop.speed * dt;

      // Wrap around screen
      if (drop.y > this.viewHeight) {
        drop.y = -drop.length - Math.random() * 30;
        drop.x = Math.random() * (this.viewWidth + 400) - 150;
      }
      if (drop.x > this.viewWidth + 200) {
        drop.x = -50;
      } else if (drop.x < -150) {
        drop.x = this.viewWidth + 50;
      }

      // Draw sleek rainfall streak
      const startX = drop.x;
      const startY = drop.y;
      const endX = drop.x + slantX * 0.35;
      const endY = drop.y + drop.length;

      this.rainGraphics.moveTo(startX, startY);
      this.rainGraphics.lineTo(endX, endY);
      this.rainGraphics.stroke({
        color: state.currentWeather === 'STORMY_TEMPEST' ? 0xa8dadc : 0xcbe8f6,
        width: drop.thickness,
        alpha: drop.alpha,
      });

      // Ground splash if near ground
      if (drop.y >= this.viewHeight - 15) {
        this.rainGraphics.circle(endX, this.viewHeight - 4, 1.8);
        this.rainGraphics.fill({ color: 0xe0f2fe, alpha: drop.alpha * 0.8 });
      }
    }
  }

  private renderLightning(state: ReturnType<WeatherSystem['getWeatherState']>): void {
    this.lightningGraphics.clear();
    if (state.thunderFlashAlpha <= 0.01) return;

    // Full screen brilliant flash
    this.lightningGraphics.rect(0, 0, this.viewWidth, this.viewHeight);
    this.lightningGraphics.fill({ color: 0xffffff, alpha: state.thunderFlashAlpha * 0.75 });

    // Lightning bolt fork
    if (state.thunderFlashAlpha > 0.4) {
      const startX = 600 + Math.random() * 700;
      this.lightningGraphics.moveTo(startX, 0);
      let curX = startX;
      let curY = 0;
      for (let s = 0; s < 6; s++) {
        curX += (Math.random() - 0.5) * 80;
        curY += 70 + Math.random() * 50;
        this.lightningGraphics.lineTo(curX, curY);
      }
      this.lightningGraphics.stroke({ color: 0xffffff, width: 3.5, alpha: state.thunderFlashAlpha });
    }
  }
}
