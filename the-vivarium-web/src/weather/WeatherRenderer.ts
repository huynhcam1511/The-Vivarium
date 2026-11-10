import { Container, Graphics, Sprite, Texture, TilingSprite } from 'pixi.js';
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

  private skyBaseGraphics: Graphics;
  private skyTintGraphics: Graphics;
  private distantMountainsGraphics: Graphics;
  private cloudGraphics: Graphics;
  private mistGraphics: Graphics;
  private leafGraphics: Graphics;
  private rainGraphics: Graphics;
  private lightningGraphics: Graphics;

  // Real PACK-005 Asset Layers
  private mountainTilingSprite: TilingSprite | null = null;
  private cloudsTilingSprite: TilingSprite | null = null;
  private mistTilingSprite: TilingSprite | null = null;
  private leafSpriteContainer: Container;
  private leafSprites: Sprite[] = [];

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

    this.skyBaseGraphics = new Graphics();
    this.skyTintGraphics = new Graphics();
    this.distantMountainsGraphics = new Graphics();
    this.cloudGraphics = new Graphics();
    this.mistGraphics = new Graphics();
    this.leafGraphics = new Graphics();
    this.leafSpriteContainer = new Container();
    this.rainGraphics = new Graphics();
    this.lightningGraphics = new Graphics();

    // Layer stack ordering
    this.container.addChild(this.skyBaseGraphics);
    this.container.addChild(this.skyTintGraphics);
    this.container.addChild(this.distantMountainsGraphics);
    this.container.addChild(this.cloudGraphics);
    this.container.addChild(this.mistGraphics);
    this.container.addChild(this.leafGraphics);
    this.container.addChild(this.leafSpriteContainer);
    this.container.addChild(this.rainGraphics);
    this.container.addChild(this.lightningGraphics);

    this.initClouds();
    this.initRainPool();
    this.initLeavesPool();
  }

  // PACK-005: Set Real Weather Textures
  public setWeatherTextures(textures: {
    mountainTex?: Texture;
    cloudsTex?: Texture;
    fogMistTex?: Texture;
    leafFallTex?: Texture;
    rainDropTex?: Texture;
  }): void {
    if (textures.mountainTex && !this.mountainTilingSprite) {
      this.mountainTilingSprite = new TilingSprite({
        texture: textures.mountainTex,
        width: 2200,
        height: 380,
      });
      this.mountainTilingSprite.anchor.set(0.0, 1.0);
      this.mountainTilingSprite.position.set(-200, this.viewHeight + 40);
      this.mountainTilingSprite.tileScale.set(0.65, 0.65);
      this.mountainTilingSprite.alpha = 0.85;
      this.container.addChildAt(this.mountainTilingSprite, this.container.getChildIndex(this.distantMountainsGraphics) + 1);
    }

    if (textures.cloudsTex && !this.cloudsTilingSprite) {
      this.cloudsTilingSprite = new TilingSprite({
        texture: textures.cloudsTex,
        width: 2200,
        height: 280,
      });
      this.cloudsTilingSprite.position.set(-200, 20);
      this.cloudsTilingSprite.tileScale.set(0.7, 0.7);
      this.cloudsTilingSprite.alpha = 0.55;
      this.container.addChildAt(this.cloudsTilingSprite, this.container.getChildIndex(this.cloudGraphics) + 1);
    }

    if (textures.fogMistTex && !this.mistTilingSprite) {
      this.mistTilingSprite = new TilingSprite({
        texture: textures.fogMistTex,
        width: 2200,
        height: 250,
      });
      this.mistTilingSprite.position.set(-200, this.viewHeight - 380);
      this.mistTilingSprite.tileScale.set(0.8, 0.8);
      this.mistTilingSprite.alpha = 0.0;
      this.container.addChildAt(this.mistTilingSprite, this.container.getChildIndex(this.mistGraphics) + 1);
    }

    if (textures.leafFallTex && this.leafSprites.length === 0) {
      for (let i = 0; i < 24; i++) {
        const spr = new Sprite(textures.leafFallTex);
        spr.anchor.set(0.5);
        spr.scale.set(0.06 + Math.random() * 0.04);
        spr.alpha = 0.85;
        this.leafSpriteContainer.addChild(spr);
        this.leafSprites.push(spr);
      }
    }

    if (textures.rainDropTex) {
      // rainDropTex cached for atlas precipitation
    }
  }

  private initClouds(): void {
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
        x: 400 + Math.random() * 1100,
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

    this.renderSkyBase(state, timeOfDay);
    this.renderSkyTint(state, timeOfDay);
    this.renderDistantMountains(state);
    this.renderClouds(dt, state, wind.speed);
    this.renderMist(dt, state, wind.speed);
    this.renderFallingLeaves(dt, wind.speed, state.currentWeather);
    this.renderPrecipitation(dt, state, wind);
    this.renderLightning(state);
  }

  private renderSkyBase(state: ReturnType<WeatherSystem['getWeatherState']>, _timeOfDay: number): void {
    this.skyBaseGraphics.clear();
    // Hand-painted vibrant sky atmospheric base
    let topColor = 0x3a86c8;
    let botColor = 0x8ecae6;

    if (state.currentWeather === 'STORMY_TEMPEST') {
      topColor = 0x1b2838;
      botColor = 0x3d5a80;
    } else if (state.currentWeather === 'HEATWAVE') {
      topColor = 0xe07a5f;
      botColor = 0xf4a261;
    } else if (state.currentWeather === 'AUTUMN_BREEZE') {
      topColor = 0x457b9d;
      botColor = 0xa8dadc;
    } else if (state.currentWeather === 'FOGGY_MIST') {
      topColor = 0x6c757d;
      botColor = 0xadb5bd;
    }

    const steps = 16;
    const h = this.viewHeight;
    const stepH = h / steps;
    for (let s = 0; s < steps; s++) {
      const t = s / steps;
      const r = Math.round(((topColor >> 16) & 0xff) * (1 - t) + ((botColor >> 16) & 0xff) * t);
      const g = Math.round(((topColor >> 8) & 0xff) * (1 - t) + ((botColor >> 8) & 0xff) * t);
      const b = Math.round((topColor & 0xff) * (1 - t) + (botColor & 0xff) * t);
      const col = (r << 16) | (g << 8) | b;
      this.skyBaseGraphics.rect(-200, s * stepH, this.viewWidth + 400, stepH + 1);
      this.skyBaseGraphics.fill({ color: col });
    }
  }

  private renderSkyTint(state: ReturnType<WeatherSystem['getWeatherState']>, _timeOfDay: number): void {
    this.skyTintGraphics.clear();

    const stormTintAlpha = state.cloudCoverage * 0.55;
    if (stormTintAlpha > 0.02) {
      const stormColor = state.currentWeather === 'STORMY_TEMPEST' ? 0x1a252f : 0x2c3e50;
      this.skyTintGraphics.rect(0, 0, this.viewWidth, this.viewHeight);
      this.skyTintGraphics.fill({ color: stormColor, alpha: stormTintAlpha });
    }

    if (state.currentWeather === 'HEATWAVE') {
      this.skyTintGraphics.rect(0, 0, this.viewWidth, this.viewHeight);
      this.skyTintGraphics.fill({ color: 0xffa500, alpha: 0.12 });
    }
  }

  private renderDistantMountains(state: ReturnType<WeatherSystem['getWeatherState']>): void {
    if (this.mountainTilingSprite) {
      this.distantMountainsGraphics.clear();
      // Mountain horizon tint modulation with weather
      const cloudFactor = state.cloudCoverage;
      this.mountainTilingSprite.alpha = Math.max(0.35, 0.88 - cloudFactor * 0.35);
      return;
    }

    this.distantMountainsGraphics.clear();
    const groundY = this.viewHeight;
    const alpha = Math.max(0.25, 0.65 - state.cloudCoverage * 0.35);

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
    if (this.cloudsTilingSprite) {
      this.cloudGraphics.clear();
      // Smooth continuous parallax cloud drift
      this.cloudsTilingSprite.tilePosition.x += (12.0 + windSpeed * 8.0) * dt;
      this.cloudsTilingSprite.alpha = Math.max(0.1, state.cloudCoverage * 0.75);
      return;
    }

    this.cloudGraphics.clear();
    if (state.cloudCoverage <= 0.05) return;

    for (const c of this.clouds) {
      c.x += (c.speed + windSpeed * 3.0) * dt;
      if (c.x > this.viewWidth + c.width) {
        c.x = -c.width - 50;
        c.y = 40 + Math.random() * (this.viewHeight * 0.35);
      }

      const activeAlpha = c.alpha * state.cloudCoverage;
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

  private renderMist(dt: number, state: ReturnType<WeatherSystem['getWeatherState']>, windSpeed: number): void {
    const isMist = state.currentWeather === 'FOGGY_MIST' || state.humidity > 88;
    const targetMistAlpha = isMist ? (state.currentWeather === 'FOGGY_MIST' ? 0.65 : 0.28) : 0.0;

    if (this.mistTilingSprite) {
      this.mistGraphics.clear();
      if (targetMistAlpha > 0.01 || this.mistTilingSprite.alpha > 0.01) {
        this.mistTilingSprite.visible = true;
        this.mistTilingSprite.tilePosition.x += (6.0 + windSpeed * 4.0) * dt;
        this.mistTilingSprite.alpha += (targetMistAlpha - this.mistTilingSprite.alpha) * Math.min(1.0, dt * 2.0);
      } else {
        this.mistTilingSprite.visible = false;
      }
      return;
    }

    this.mistGraphics.clear();
    if (!isMist) return;

    const mistAlpha = state.currentWeather === 'FOGGY_MIST' ? 0.35 : 0.15;
    this.mistGraphics.roundRect(0, this.viewHeight - 110, this.viewWidth, 100, 20);
    this.mistGraphics.fill({ color: 0xecf0f1, alpha: mistAlpha });

    this.mistGraphics.roundRect(400, 150, 1100, 80, 30);
    this.mistGraphics.fill({ color: 0xecf0f1, alpha: mistAlpha * 0.6 });
  }

  private renderFallingLeaves(dt: number, windSpeed: number, weather: string): void {
    const isAutumn = weather === 'AUTUMN_BREEZE' || weather === 'STORMY_TEMPEST';

    // If PACK-005 real leaf sprite atlas is available
    if (this.leafSprites.length > 0) {
      this.leafGraphics.clear();
      const count = isAutumn ? this.leafSprites.length : Math.floor(this.leafSprites.length * 0.4);

      for (let i = 0; i < this.leafSprites.length; i++) {
        const spr = this.leafSprites[i];
        if (i >= count) {
          spr.visible = false;
          continue;
        }
        spr.visible = true;
        const leafData = this.fallingLeaves[i % this.fallingLeaves.length];
        leafData.x += (leafData.vx + windSpeed * 14.0) * dt;
        leafData.y += leafData.vy * dt;
        leafData.rotation += leafData.vRot * dt;

        if (leafData.y > this.viewHeight || leafData.x > this.viewWidth + 50) {
          leafData.x = 350 + Math.random() * 900;
          leafData.y = 60 + Math.random() * 120;
        }

        spr.position.set(leafData.x, leafData.y);
        spr.rotation = leafData.rotation;
      }
      return;
    }

    // Procedural fallback
    this.leafGraphics.clear();
    const activeLeaves = isAutumn ? this.fallingLeaves : this.fallingLeaves.slice(0, 12);

    for (const leaf of activeLeaves) {
      leaf.x += (leaf.vx + windSpeed * 12.0) * dt;
      leaf.y += leaf.vy * dt;
      leaf.rotation += leaf.vRot * dt;

      if (leaf.y > this.viewHeight || leaf.x > this.viewWidth + 50) {
        leaf.x = 450 + Math.random() * 800;
        leaf.y = 80 + Math.random() * 120;
      }

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

      if (drop.y > this.viewHeight) {
        drop.y = -drop.length - Math.random() * 30;
        drop.x = Math.random() * (this.viewWidth + 400) - 150;
      }
      if (drop.x > this.viewWidth + 200) {
        drop.x = -50;
      } else if (drop.x < -150) {
        drop.x = this.viewWidth + 50;
      }

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

      if (drop.y >= this.viewHeight - 15) {
        this.rainGraphics.circle(endX, this.viewHeight - 4, 1.8);
        this.rainGraphics.fill({ color: 0xe0f2fe, alpha: drop.alpha * 0.8 });
      }
    }
  }

  private renderLightning(state: ReturnType<WeatherSystem['getWeatherState']>): void {
    this.lightningGraphics.clear();
    if (state.thunderFlashAlpha <= 0.01) return;

    this.lightningGraphics.rect(0, 0, this.viewWidth, this.viewHeight);
    this.lightningGraphics.fill({ color: 0xffffff, alpha: state.thunderFlashAlpha * 0.75 });

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
