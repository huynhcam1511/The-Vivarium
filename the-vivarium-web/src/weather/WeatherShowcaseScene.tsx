import React, { useEffect, useRef, useState } from 'react';
import { Application, Container, Sprite, Assets } from 'pixi.js';
import { WeatherSystem } from './WeatherSystem';
import { WeatherRenderer } from './WeatherRenderer';
import { WeatherControlPanel } from './WeatherControlPanel';
import type { WeatherType } from './WeatherTypes';
import { OrganicTerrainData } from '../engine/OrganicTerrainData';
import { OrganicTerrainRenderer } from '../engine/OrganicTerrainRenderer';

export const WeatherShowcaseScene: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<Application | null>(null);

  const weatherSystemRef = useRef<WeatherSystem>(new WeatherSystem('CLEAR_SUNNY'));
  const weatherRendererRef = useRef<WeatherRenderer | null>(null);
  const terrainDataRef = useRef<OrganicTerrainData>(new OrganicTerrainData());
  const terrainRendererRef = useRef<OrganicTerrainRenderer | null>(null);

  const [weatherState, setWeatherState] = useState(() => weatherSystemRef.current.getWeatherState());
  const [soilMoisture, setSoilMoisture] = useState(() => weatherSystemRef.current.getSoilMoisture());
  const [timeSpeed, setTimeSpeed] = useState<number>(1);
  const [fps, setFps] = useState<number>(60);

  const timeSpeedRef = useRef(timeSpeed);
  timeSpeedRef.current = timeSpeed;

  const handleSelectWeather = (type: WeatherType) => {
    weatherSystemRef.current.setWeather(type, 3.0);
    setWeatherState(weatherSystemRef.current.getWeatherState());
  };

  useEffect(() => {
    let isMounted = true;
    let pixiApp: Application | null = null;
    let frameCount = 0;
    let fpsTimer = 0;

    const init = async () => {
      if (!containerRef.current) return;

      while (containerRef.current.firstChild) {
        containerRef.current.removeChild(containerRef.current.firstChild);
      }

      pixiApp = new Application();
      await pixiApp.init({
        resizeTo: window,
        backgroundColor: 0x0f172a,
        resolution: window.devicePixelRatio || 1,
        autoDensity: true,
        antialias: true,
      });

      if (!isMounted) {
        try {
          pixiApp.destroy(true, { children: true });
        } catch {
          // ignore cleanup error if not fully initialized
        }
        return;
      }

      containerRef.current.appendChild(pixiApp.canvas);
      appRef.current = pixiApp;

      const W = window.innerWidth;
      const H = window.innerHeight;

      // 1. World Root Container
      const worldContainer = new Container();
      pixiApp.stage.addChild(worldContainer);

      // Fit 1920x1440 world to screen viewport
      const scale = Math.min(W / 1920, H / 1200);
      worldContainer.scale.set(scale);
      worldContainer.x = (W - 1920 * scale) * 0.5;
      worldContainer.y = 0;

      // 2. Weather Renderer (Backdrop, Sky tint, Clouds, Mountains)
      const weatherRenderer = new WeatherRenderer(weatherSystemRef.current, 1920, 640);
      weatherRendererRef.current = weatherRenderer;
      worldContainer.addChild(weatherRenderer.container);

      // 3. Terrain System (Organic Loam & Caves)
      const terrainData = terrainDataRef.current;
      const terrainRenderer = new OrganicTerrainRenderer(terrainData);
      terrainRendererRef.current = terrainRenderer;
      worldContainer.addChild(terrainRenderer.container);

      // 4. Ancient Oak Assets
      try {
        const texTrunk = await Assets.load('/assets/source/env_tree_ancient_trunk_base_v2.png');
        const texBough = await Assets.load('/assets/source/env_tree_bough_main_moss_v2.png');
        const texFoliage = await Assets.load('/assets/source/env_foliage_canopy_clump_01_v2.png');
        const texRoots = await Assets.load('/assets/source/env_tree_root_deep_cluster_v2.png');
        const texSoil = await Assets.load('/assets/terrain/terrain_soil_dark_loam_v2.png');

        if (texSoil) {
          terrainRenderer.setSoilTexture(texSoil);
          terrainRenderer.rebuildTerrainMesh(false);
        }

        // Roots
        if (texRoots) {
          const roots = new Sprite(texRoots);
          roots.anchor.set(0.5, 0.0);
          roots.scale.set(0.65);
          roots.position.set(960, 640 - 10);
          worldContainer.addChild(roots);
        }

        // Trunk
        if (texTrunk) {
          const trunk = new Sprite(texTrunk);
          trunk.anchor.set(0.5, 1.0);
          trunk.scale.set(0.65);
          trunk.position.set(960, 640);
          worldContainer.addChild(trunk);
        }

        // Bough
        if (texBough) {
          const bough = new Sprite(texBough);
          bough.anchor.set(0.15, 0.65);
          bough.scale.set(0.65);
          bough.position.set(940, 640 - 360);
          worldContainer.addChild(bough);
        }

        // Foliage Canopy Clumps
        if (texFoliage) {
          const foliage1 = new Sprite(texFoliage);
          foliage1.anchor.set(0.5, 0.5);
          foliage1.scale.set(0.65);
          foliage1.position.set(1040, 640 - 520);
          worldContainer.addChild(foliage1);

          const foliage2 = new Sprite(texFoliage);
          foliage2.anchor.set(0.5, 0.5);
          foliage2.scale.set(0.55);
          foliage2.position.set(820, 640 - 470);
          foliage2.alpha = 0.9;
          worldContainer.addChild(foliage2);
        }
      } catch (err) {
        console.warn('WeatherShowcaseScene asset loading error:', err);
      }

      // Main Loop
      pixiApp.ticker.add((ticker) => {
        const deltaSeconds = ticker.deltaMS / 1000.0;
        const effectiveDt = deltaSeconds * timeSpeedRef.current;

        // Update Weather System
        weatherSystemRef.current.update(effectiveDt, 0.45);
        weatherRenderer.update(effectiveDt, 0.45);

        // Update UI state periodically
        frameCount++;
        fpsTimer += deltaSeconds;
        if (fpsTimer >= 0.25) {
          setFps(Math.round(frameCount / fpsTimer));
          frameCount = 0;
          fpsTimer = 0;
          setWeatherState(weatherSystemRef.current.getWeatherState());
          setSoilMoisture(weatherSystemRef.current.getSoilMoisture());
        }
      });
    };

    init();

    return () => {
      isMounted = false;
      if (pixiApp) {
        try {
          pixiApp.destroy(true, { children: true, texture: false });
        } catch {
          // ignore Pixi v8 cleanup timing error
        }
      }
    };
  }, []); // Run once on mount

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-neutral-950 font-sans select-none" data-testid="weather-suite-root">
      {/* Pixi Canvas */}
      <div ref={containerRef} className="absolute inset-0 z-0" />

      {/* Header Telemetry Pill */}
      <header className="fixed top-4 left-4 right-4 z-30 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-3 bg-neutral-900/90 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10 shadow-xl pointer-events-auto">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-teal-500 to-sky-700 flex items-center justify-center text-white font-black text-sm">
            🌦️
          </div>
          <div>
            <h1 className="text-xs font-black tracking-wider text-sky-100 uppercase" data-testid="header-title">
              THE VIVARIUM — WEATHER SUITE (PACK-005)
            </h1>
            <p className="text-[10px] text-sky-400/80 font-medium">
              Task-020 Atmospheric Simulation & Particle Ecosystem
            </p>
          </div>
        </div>

        {/* Time Speed & Performance */}
        <div className="flex items-center gap-3 bg-neutral-900/90 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-white/10 shadow-xl pointer-events-auto text-xs">
          <span className="font-mono text-emerald-400 font-bold" data-testid="telemetry-fps">{fps} FPS</span>
          <div className="w-px h-4 bg-white/15" />
          <div className="flex items-center gap-1">
            {[0, 1, 2, 5].map((speed) => (
              <button
                key={speed}
                onClick={() => setTimeSpeed(speed)}
                className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all ${
                  timeSpeed === speed
                    ? 'bg-sky-600 text-white shadow-md'
                    : 'bg-white/5 text-neutral-400 hover:text-white'
                }`}
              >
                {speed === 0 ? 'Tạm dừng' : `${speed}x`}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Weather Selector Panel */}
      <div className="fixed bottom-4 left-4 z-30" data-testid="weather-control-panel">
        <WeatherControlPanel
          currentWeather={weatherState.currentWeather}
          targetWeather={weatherState.targetWeather}
          transitionProgress={weatherState.transitionProgress}
          onSelectWeather={handleSelectWeather}
          temperature={weatherState.temperature}
          humidity={weatherState.humidity}
          windSpeed={weatherState.windSpeed}
          soilMoisture={soilMoisture}
        />
      </div>

      {/* Help info overlay */}
      <div className="fixed bottom-4 right-4 z-30 bg-neutral-900/90 backdrop-blur-md px-3.5 py-2.5 rounded-2xl border border-white/10 shadow-xl text-neutral-300 text-[11px] max-w-xs pointer-events-auto">
        <div className="font-bold text-sky-300 mb-1">Kiến trúc Tương thích PACK-005:</div>
        <ul className="list-disc list-inside space-y-0.5 text-[10px] text-neutral-400">
          <li>Hiệu ứng mưa nghiêng theo vector gió và splash mặt đất.</li>
          <li>Lá sồi rơi theo luồng gió động quanh tán cây cổ thụ V2.</li>
          <li>Độ ẩm đất ngầm đồng bộ trực tiếp với hệ hang ngầm TASK-018.</li>
          <li>Lưu lượng mưa cấp nước tự nhiên cho hồ thủy sinh TASK-019.</li>
        </ul>
      </div>
    </div>
  );
};
