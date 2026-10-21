import React, { useEffect, useRef, useState } from 'react';
import { Application, Container, Sprite, Assets, Graphics } from 'pixi.js';
import { CameraController } from '../engine/CameraController';
import { OrganicTerrainData } from '../engine/OrganicTerrainData';
import { OrganicTerrainRenderer } from '../engine/OrganicTerrainRenderer';
import { AquaticSystem } from '../aquatic/AquaticSystem';
import { AquaticRenderer } from '../aquatic/AquaticRenderer';
import { WeatherSystem } from '../weather/WeatherSystem';
import { WeatherRenderer } from '../weather/WeatherRenderer';
import type { WeatherType } from '../weather/WeatherTypes';

export const WorldIntegrationScene: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<Application | null>(null);

  // Subsystems refs
  const weatherSystemRef = useRef<WeatherSystem>(new WeatherSystem('CLEAR_SUNNY'));
  const aquaticSystemRef = useRef<AquaticSystem>(
    new AquaticSystem({
      basinMinX: 520,
      basinMaxX: 1100,
      surfaceBaseY: 60,
      maxDepth: 180,
      waterfallX: 560,
      waterfallTopY: -160,
      waterfallBottomY: 60,
      waterfallWidth: 40,
    })
  );
  const terrainDataRef = useRef<OrganicTerrainData>(new OrganicTerrainData());
  const terrainRendererRef = useRef<OrganicTerrainRenderer | null>(null);
  const cameraRef = useRef<CameraController | null>(null);

  // Interactive Tools & Camera Preset State
  const [currentTool, setCurrentTool] = useState<'SELECT' | 'DIG' | 'FILL'>('SELECT');
  const [timeSpeed, setTimeSpeed] = useState<number>(1);
  const [selectedWeather, setSelectedWeather] = useState<WeatherType>('CLEAR_SUNNY');

  const currentToolRef = useRef(currentTool);
  currentToolRef.current = currentTool;
  const timeSpeedRef = useRef(timeSpeed);
  timeSpeedRef.current = timeSpeed;

  // Real-time Telemetry state for BEFORE/AFTER proof
  const [telemetry, setTelemetry] = useState<{
    weather: WeatherType;
    temperature: number;
    humidity: number;
    windSpeed: number;
    windAngle: number;
    soilMoisture: number;
    waterLevel: number;
    waterOffset: number;
    waterClarity: number;
    fps: number;
    cameraPos: string;
    cameraZoom: number;
    digQueueCount: number;
  }>({
    weather: 'CLEAR_SUNNY',
    temperature: 28.5,
    humidity: 45,
    windSpeed: 2.1,
    windAngle: 0.18,
    soilMoisture: 0.45,
    waterLevel: 60.0,
    waterOffset: 0.0,
    waterClarity: 0.92,
    fps: 60,
    cameraPos: 'X: 0, Y: 0',
    cameraZoom: 1.0,
    digQueueCount: 0,
  });

  useEffect(() => {
    let active = true;
    let pixiApp: Application | null = null;
    let animId: number;
    let lastTime = performance.now();
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
        backgroundColor: 0x080c12,
        resolution: window.devicePixelRatio || 1,
        autoDensity: true,
        antialias: true,
      });

      if (!active || !containerRef.current) {
        try { pixiApp.destroy(true, { children: true }); } catch {}
        return;
      }
      while (containerRef.current.firstChild) {
        containerRef.current.removeChild(containerRef.current.firstChild);
      }
      containerRef.current.appendChild(pixiApp.canvas);
      appRef.current = pixiApp;

      // Master World Stage Container
      const worldStage = new Container();
      pixiApp.stage.addChild(worldStage);

      // Camera Controller
      const camera = new CameraController(worldStage);
      cameraRef.current = camera;
      camera.setViewportSize(window.innerWidth, window.innerHeight);
      camera.jumpTo(0, 0, 0.95);

      // 1. SKY & DISTANT HORIZON LAYER (Behind everything)
      const weatherSystem = weatherSystemRef.current;
      const weatherRenderer = new WeatherRenderer(weatherSystem, 3200, 1600);
      weatherRenderer.container.position.set(-1600, -900);
      worldStage.addChild(weatherRenderer.container);

      // 2. SUBTERRANEAN ORGANIC TERRAIN & CAVE CAVITIES
      const terrainData = terrainDataRef.current;
      const terrainRenderer = new OrganicTerrainRenderer(terrainData);
      terrainRendererRef.current = terrainRenderer;
      worldStage.addChild(terrainRenderer.container);

      // Try load soil texture
      try {
        const soilTex = await Assets.load('/assets/terrain/terrain_soil_dark_loam_v2.png');
        if (soilTex) terrainRenderer.setSoilTexture(soilTex);
      } catch (e) {
        console.warn('Soil texture fallback:', e);
      }
      terrainRenderer.rebuildTerrainMesh(false);

      // 3. ANCIENT OAK DUAL-PASS SANDWICH ASSEMBLY (V5 & V2)
      // Pass 1: Roots placed BEHIND solid soil, inside the excavated cavity group
      // Pass 2: Trunk Buttress placed IN FRONT of solid soil
      const trunkGroundY = terrainData.getSurfaceY(0);

      // Root layer group placed right behind terrain mask
      const rootBackGroup = new Container();
      worldStage.addChildAt(rootBackGroup, worldStage.getChildIndex(terrainRenderer.container));

      // Trunk & Foliage front group placed in front of terrain
      const trunkFrontGroup = new Container();
      worldStage.addChild(trunkFrontGroup);

      try {
        const unifiedV5 = await Assets.load('/assets/qa_temp_v5/env_tree_ancient_unified_v5.png').catch(() => null);
        const rootsTex = await Assets.load('/assets/source/env_tree_root_deep_cluster_v2.png').catch(() => null);
        const trunkTex = await Assets.load('/assets/source/env_tree_ancient_trunk_base_v2.png').catch(() => null);
        const boughTex = await Assets.load('/assets/source/env_tree_bough_main_moss_v2.png').catch(() => null);
        const canopyTex = await Assets.load('/assets/source/env_foliage_canopy_clump_01_v2.png').catch(() => null);

        if (unifiedV5) {
          // === DUAL-PASS SANDWICH RENDERING WITH DYNAMIC MASKING (TASK-017 V5 SPEC) ===
          // Pass 1: Root Spr (Z: 30) - Clipped below groundline, hidden behind solid soil
          const rootSpr = new Sprite(unifiedV5);
          rootSpr.anchor.set(0.5, 0.55);
          rootSpr.scale.set(0.5);
          rootSpr.position.set(0, trunkGroundY);

          const rootMask = new Graphics();
          rootMask.rect(-600, trunkGroundY - 8, 1200, 1000).fill({ color: 0xffffff });
          rootSpr.mask = rootMask;
          rootSpr.addChild(rootMask);
          rootBackGroup.addChild(rootSpr);

          // Pass 2: Trunk Spr (Z: 45) - Clipped above groundline, placed in front of terrain
          const trunkSpr = new Sprite(unifiedV5);
          trunkSpr.anchor.set(0.5, 0.55);
          trunkSpr.scale.set(0.5);
          trunkSpr.position.set(0, trunkGroundY);

          const trunkMask = new Graphics();
          trunkMask.rect(-600, trunkGroundY - 950, 1200, 962).fill({ color: 0xffffff });
          trunkSpr.mask = trunkMask;
          trunkSpr.addChild(trunkMask);
          trunkFrontGroup.addChild(trunkSpr);
        } else {
          // Fallback to V2 4-layer assembly
          if (rootsTex) {
            const rootsSpr = new Sprite(rootsTex);
            rootsSpr.anchor.set(0.5, 0.0);
            rootsSpr.scale.set(0.5);
            rootsSpr.position.set(0, trunkGroundY - 4);
            rootBackGroup.addChild(rootsSpr);
          }
          if (trunkTex) {
            const trunkSpr = new Sprite(trunkTex);
            trunkSpr.anchor.set(0.5, 1.0);
            trunkSpr.scale.set(0.5);
            trunkSpr.position.set(0, trunkGroundY);
            trunkFrontGroup.addChild(trunkSpr);
          }
        }

        if (boughTex) {
          const boughSpr = new Sprite(boughTex);
          boughSpr.anchor.set(0.15, 0.65);
          boughSpr.scale.set(0.5);
          boughSpr.position.set(-10, trunkGroundY - 285);
          trunkFrontGroup.addChild(boughSpr);
        }

        if (canopyTex) {
          const canopySpr = new Sprite(canopyTex);
          canopySpr.anchor.set(0.5, 0.5);
          canopySpr.scale.set(0.5);
          canopySpr.position.set(80, trunkGroundY - 410);
          trunkFrontGroup.addChild(canopySpr);
        }
      } catch (e) {
        console.warn('Oak assets load fallback:', e);
      }

      // 4. SURFACE VEGETATION & RIPARIAN FLORA (Grasstrip, Tuft, Daisy, Clover)
      const vegetationContainer = new Container();
      worldStage.addChild(vegetationContainer);

      try {
        const grassStripTex = await Assets.load('/assets/environment/ground/env_terrain_surface_grass.png');
        const tuftTex = await Assets.load('/assets/environment/vegetation/env_grass_tuft_green.png');
        const cloverTex = await Assets.load('/assets/environment/vegetation/env_flower_clover_white.png');
        const daisyTex = await Assets.load('/assets/environment/vegetation/env_flower_daisy_golden.png');

        if (grassStripTex) {
          const stripWidth = 256;
          for (let sx = -900; sx <= 500; sx += stripWidth) {
            const sy = terrainData.getSurfaceY(sx + stripWidth * 0.5);
            const spr = new Sprite(grassStripTex);
            spr.anchor.set(0.5, 0.35);
            spr.scale.set(0.5);
            spr.position.set(sx + stripWidth * 0.5, sy);
            vegetationContainer.addChild(spr);
          }
        }

        // Decor tufts and flowers
        const decorPoints = [
          { x: -550, type: 'clover', scale: 0.5 },
          { x: -480, type: 'daisy', scale: 0.48 },
          { x: -350, type: 'tuft', scale: 0.52 },
          { x: -95, type: 'tuft', scale: 0.54 },
          { x: 105, type: 'daisy', scale: 0.48 },
          { x: 250, type: 'daisy', scale: 0.52 },
          { x: 420, type: 'clover', scale: 0.5 },
        ];
        decorPoints.forEach((pt) => {
          const py = terrainData.getSurfaceY(pt.x);
          let tex = null;
          if (pt.type === 'tuft') tex = tuftTex;
          else if (pt.type === 'clover') tex = cloverTex;
          else if (pt.type === 'daisy') tex = daisyTex;
          if (tex) {
            const spr = new Sprite(tex);
            spr.anchor.set(0.5, 0.95);
            spr.scale.set(pt.scale);
            spr.position.set(pt.x, py + 3);
            vegetationContainer.addChild(spr);
          }
        });
      } catch (e) {
        console.warn('Vegetation load fallback:', e);
      }

      // 5. AQUATIC BASIN & WATERFALL SUBSYSTEM
      const aquaticSystem = aquaticSystemRef.current;
      const aquaticRenderer = new AquaticRenderer(aquaticSystem);
      worldStage.addChild(aquaticRenderer.container);

      // Interactive Dig/Fill cursor preview indicator
      const previewIndicator = new Graphics();
      worldStage.addChild(previewIndicator);

      // Event Listeners for Camera Drag / Dig-Fill
      const handlePointerDown = (e: PointerEvent) => {
        if (e.button === 1 || e.button === 2) {
          camera.handleMouseDown(e.clientX, e.clientY, e.button);
        } else if (e.button === 0) {
          // World click for Dig / Fill
          const worldPos = camera.screenToWorld({ x: e.clientX, y: e.clientY });
          // Convert to terrain grid coord (origin at Y = 0)
          const cellX = Math.floor((worldPos.x + 960) / 32);
          const cellY = Math.floor((worldPos.y + 200) / 32);

          if (currentToolRef.current === 'DIG') {
            terrainData.setSolid(cellX, cellY, false);
            terrainRenderer.rebuildTerrainMesh(false);
          } else if (currentToolRef.current === 'FILL') {
            terrainData.setSolid(cellX, cellY, true);
            terrainRenderer.rebuildTerrainMesh(false);
          }
        }
      };

      const handlePointerMove = (e: PointerEvent) => {
        camera.handleMouseMove(e.clientX, e.clientY);

        // Smart Selection & Preview: update preview indicator
        previewIndicator.clear();
        if (currentToolRef.current === 'DIG' || currentToolRef.current === 'FILL') {
          const worldPos = camera.screenToWorld({ x: e.clientX, y: e.clientY });
          const cellX = Math.floor((worldPos.x + 960) / 32);
          const cellY = Math.floor((worldPos.y + 200) / 32);

          if (cellX >= 0 && cellX < terrainData.cols && cellY >= 0 && cellY < terrainData.rows) {
            const wx = cellX * 32 - 960;
            const wy = cellY * 32 - 200;
            const isDig = currentToolRef.current === 'DIG';

            previewIndicator.roundRect(wx + 1, wy + 1, 30, 30, 4);
            previewIndicator.stroke({
              color: isDig ? 0xffb703 : 0x06d6a0,
              width: 2.0,
              alpha: 0.9,
            });
            previewIndicator.roundRect(wx + 2, wy + 2, 28, 28, 3);
            previewIndicator.fill({
              color: isDig ? 0xffb703 : 0x06d6a0,
              alpha: 0.25,
            });
          }
        }
      };

      const handlePointerUp = () => {
        camera.handleMouseUp();
      };

      const handlePointerLeave = () => {
        previewIndicator.clear();
      };

      const handleWheel = (e: WheelEvent) => {
        e.preventDefault();
        camera.handleWheel(e.clientX, e.clientY, e.deltaY);
      };

      const container = containerRef.current;
      if (container) {
        container.addEventListener('pointerdown', handlePointerDown);
        window.addEventListener('pointermove', handlePointerMove);
        window.addEventListener('pointerup', handlePointerUp);
        container.addEventListener('pointerleave', handlePointerLeave);
        container.addEventListener('wheel', handleWheel, { passive: false });
        container.addEventListener('contextmenu', (e) => e.preventDefault());
      }

      // Main Loop
      const loop = (currentTime: number) => {
        const dt = Math.min(0.1, (currentTime - lastTime) / 1000);
        lastTime = currentTime;
        const effectiveDt = dt * timeSpeedRef.current;

        // 1. Tick Weather System
        weatherSystem.update(effectiveDt);

        // 2. CONNECT RUNTIME INTERFACES:
        // A. Weather -> Aquatic: Rain inflow elevates water, Heat evaporates
        const rainIntensity = weatherSystem.getRainIntensity();
        if (rainIntensity > 0.05) {
          aquaticSystem.applyRainInflow(rainIntensity * 12.0, effectiveDt);
        }
        const temp = weatherSystem.getTemperature();
        if (temp > 30.0) {
          const heatFactor = (temp - 30.0) * 0.4;
          aquaticSystem.evaporateWater(heatFactor * 8.0, effectiveDt);
        }

        // B. Weather -> Underground: Soil moisture coupling
        // Weather updates soilMoisture internally; we can read and sync
        const soilMoisture = weatherSystem.getSoilMoisture();

        // C. Weather -> Vegetation & Particles
        const wind = weatherSystem.getWind();
        vegetationContainer.children.forEach((child, i) => {
          child.rotation = Math.sin(currentTime * 0.003 + i) * 0.04 + (wind.speed * 0.008);
        });

        // 3. Update Renderers
        aquaticSystem.update(effectiveDt);
        aquaticRenderer.update(effectiveDt);
        weatherRenderer.update(effectiveDt);
        camera.update(effectiveDt);

        // 4. Update Telemetry (Using 0.8s moving window for accurate, stable FPS measurement)
        frameCount++;
        fpsTimer += dt;
        if (fpsTimer >= 0.8) {
          const st = weatherSystem.getWeatherState();
          const measuredFps = Math.min(60, Math.round(frameCount / fpsTimer));
          setTelemetry({
            weather: st.currentWeather,
            temperature: st.temperature,
            humidity: st.humidity,
            windSpeed: st.windSpeed,
            windAngle: st.windAngle,
            soilMoisture: soilMoisture,
            waterLevel: aquaticSystem.getWaterLevel(),
            waterOffset: aquaticSystem.waterLevelOffset,
            waterClarity: aquaticSystem.waterClarity,
            fps: measuredFps,
            cameraPos: `X: ${camera.x.toFixed(0)}, Y: ${camera.y.toFixed(0)}`,
            cameraZoom: camera.zoom,
            digQueueCount: terrainData.getExcavatedCount(),
          });
          frameCount = 0;
          fpsTimer = 0;
        }

        animId = requestAnimationFrame(loop);
      };

      animId = requestAnimationFrame(loop);
    };

    init();

    return () => {
      cancelAnimationFrame(animId);
      if (pixiApp) {
        try {
          pixiApp.destroy(true);
        } catch (e) {
          console.warn('Pixi destroy cleanup:', e);
        }
      }
    };
  }, []);

  const handleSetWeather = (type: WeatherType) => {
    setSelectedWeather(type);
    weatherSystemRef.current.setWeather(type, 2.5);
  };

  const handleJumpCamera = (preset: 'OVERVIEW' | 'LAKE' | 'WATERFALL' | 'TREE' | 'CAVE') => {
    if (!cameraRef.current) return;
    const cam = cameraRef.current;
    if (preset === 'OVERVIEW') cam.jumpTo(0, 0, 0.78);
    else if (preset === 'LAKE') cam.jumpTo(800, 100, 1.25);
    else if (preset === 'WATERFALL') cam.jumpTo(560, -60, 1.5);
    else if (preset === 'TREE') cam.jumpTo(0, -180, 1.2);
    else if (preset === 'CAVE') cam.jumpTo(-300, 220, 1.35);
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-neutral-950 font-sans select-none">
      {/* Top Telemetry Header */}
      <div className="fixed top-3 left-4 right-4 z-40 flex items-center justify-between p-3 rounded-2xl bg-neutral-900/90 backdrop-blur-md border border-white/10 shadow-2xl text-white text-xs">
        <div className="flex items-center gap-3">
          <span className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
          <h1 className="font-bold tracking-wide uppercase text-amber-300 text-sm">
            THE VIVARIUM — WORLD INTEGRATION SUITE (TASK-021 / GATE A.2)
          </h1>
          <span className="bg-emerald-950/80 text-emerald-300 px-2 py-0.5 rounded border border-emerald-700/50 font-mono text-[10px]">
            CANDIDATE BUILD ACTIVE
          </span>
        </div>

        {/* Global Live Metrics */}
        <div className="flex items-center gap-4 font-mono text-[11px]">
          <div>
            <span className="text-neutral-400 mr-1">Thời tiết:</span>
            <span className="font-bold text-cyan-300" data-testid="telemetry-weather">{telemetry.weather}</span>
          </div>
          <div>
            <span className="text-neutral-400 mr-1">Nhiệt độ:</span>
            <span className="font-bold text-rose-300" data-testid="telemetry-temperature">{telemetry.temperature.toFixed(1)}°C</span>
          </div>
          <div>
            <span className="text-neutral-400 mr-1">Ẩm đất:</span>
            <span className="font-bold text-amber-300" data-testid="telemetry-soil">{(telemetry.soilMoisture * 100).toFixed(0)}%</span>
          </div>
          <div>
            <span className="text-neutral-400 mr-1">Mực nước:</span>
            <span className="font-bold text-blue-300" data-testid="telemetry-water">
              {telemetry.waterLevel.toFixed(1)}px ({telemetry.waterOffset >= 0 ? `+${telemetry.waterOffset.toFixed(1)}` : telemetry.waterOffset.toFixed(1)})
            </span>
          </div>
          <div>
            <span className="text-neutral-400 mr-1">Gió:</span>
            <span className="font-bold text-teal-300" data-testid="telemetry-wind">{telemetry.windSpeed.toFixed(1)} m/s</span>
          </div>
          <div>
            <span className="text-neutral-400 mr-1">FPS:</span>
            <span className="font-bold text-emerald-400" data-testid="telemetry-fps">{telemetry.fps}</span>
          </div>
        </div>
      </div>

      {/* Main PixiJS Viewport */}
      <div ref={containerRef} className="absolute inset-0 cursor-crosshair active:cursor-grabbing" />

      {/* Left Control Panel: Weather & Environmental Triggers */}
      <div className="fixed top-20 left-4 z-40 flex flex-col gap-2 p-3 rounded-2xl bg-neutral-900/90 backdrop-blur-md border border-white/10 shadow-2xl text-white text-xs max-w-xs">
        <span className="font-bold text-amber-300 text-[11px] uppercase tracking-wider">
          🌦️ Điều Khiển Khí Quyển (Weather)
        </span>
        <div className="grid grid-cols-2 gap-1.5">
          {(['CLEAR_SUNNY', 'GENTLE_RAIN', 'STORMY_TEMPEST', 'HEATWAVE', 'AUTUMN_BREEZE', 'FOGGY_MIST'] as WeatherType[]).map((w) => (
            <button
              key={w}
              data-testid={`btn-weather-${w}`}
              onClick={() => handleSetWeather(w)}
              className={`px-2 py-1.5 rounded-lg border text-left text-[11px] font-medium transition ${
                selectedWeather === w
                  ? 'bg-emerald-600 border-emerald-400 text-white font-bold shadow'
                  : 'bg-white/5 border-white/5 hover:bg-white/10 text-neutral-300'
              }`}
            >
              {w === 'CLEAR_SUNNY' && '☀️ Nắng Ráo'}
              {w === 'GENTLE_RAIN' && '🌧️ Mưa Nhẹ'}
              {w === 'STORMY_TEMPEST' && '⛈️ Giông Bão'}
              {w === 'HEATWAVE' && '🔥 Nắng Gắt'}
              {w === 'AUTUMN_BREEZE' && '🍂 Gió Mùa Thu'}
              {w === 'FOGGY_MIST' && '🌫️ Sương Mù'}
            </button>
          ))}
        </div>

        <span className="font-bold text-cyan-300 text-[11px] uppercase tracking-wider mt-2 border-t border-white/10 pt-2">
          💧 Tác Động Nước Hồ & Đất
        </span>
        <div className="grid grid-cols-2 gap-1.5">
          <button
            data-testid="btn-action-rain-inflow"
            onClick={() => aquaticSystemRef.current.applyRainInflow(10.0, 1.0)}
            className="px-2 py-1.5 rounded-lg bg-cyan-600/30 hover:bg-cyan-600/50 border border-cyan-500/40 text-cyan-200 text-[10px] font-medium transition"
          >
            🌧️ Bơm Nước (+10px)
          </button>
          <button
            data-testid="btn-action-evaporate"
            onClick={() => aquaticSystemRef.current.evaporateWater(8.0, 1.0)}
            className="px-2 py-1.5 rounded-lg bg-amber-600/30 hover:bg-amber-600/50 border border-amber-500/40 text-amber-200 text-[10px] font-medium transition"
          >
            ☀️ Bốc Hơi (-8px)
          </button>
        </div>
      </div>

      {/* Bottom Floating Control Bar: Tools, Camera & Speed */}
      <div className="fixed bottom-4 left-4 right-4 z-40 flex items-center justify-between p-2 rounded-2xl bg-neutral-900/90 backdrop-blur-md border border-white/10 shadow-2xl text-white text-xs">
        {/* Tools: Dig / Fill */}
        <div className="flex items-center gap-2">
          <span className="text-neutral-400 text-[10px] font-mono ml-2">Công cụ:</span>
          <button
            data-testid="btn-tool-select"
            onClick={() => setCurrentTool('SELECT')}
            className={`px-3 py-1.5 rounded-xl font-medium transition ${
              currentTool === 'SELECT' ? 'bg-emerald-600 text-white font-bold' : 'bg-white/5 hover:bg-white/10 text-neutral-300'
            }`}
          >
            🔍 Di chuyển
          </button>
          <button
            data-testid="btn-tool-dig"
            onClick={() => setCurrentTool('DIG')}
            className={`px-3 py-1.5 rounded-xl font-medium transition ${
              currentTool === 'DIG' ? 'bg-amber-600 text-white font-bold' : 'bg-white/5 hover:bg-white/10 text-neutral-300'
            }`}
          >
            ⛏️ Đào hang (Dig)
          </button>
          <button
            data-testid="btn-tool-fill"
            onClick={() => setCurrentTool('FILL')}
            className={`px-3 py-1.5 rounded-xl font-medium transition ${
              currentTool === 'FILL' ? 'bg-amber-600 text-white font-bold' : 'bg-white/5 hover:bg-white/10 text-neutral-300'
            }`}
          >
            🧱 Lấp đất (Fill)
          </button>
        </div>

        {/* Camera Presets */}
        <div className="flex items-center gap-1.5">
          <span className="text-neutral-400 text-[10px] font-mono">Góc nhìn:</span>
          <button
            data-testid="btn-cam-overview"
            onClick={() => handleJumpCamera('OVERVIEW')}
            className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/15 text-neutral-300 hover:text-white"
          >
            Toàn cảnh (0.8x)
          </button>
          <button
            data-testid="btn-cam-tree"
            onClick={() => handleJumpCamera('TREE')}
            className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/15 text-neutral-300 hover:text-white"
          >
            Cây cổ thụ (1.2x)
          </button>
          <button
            data-testid="btn-cam-lake"
            onClick={() => handleJumpCamera('LAKE')}
            className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/15 text-cyan-300 hover:text-white"
          >
            Lòng hồ (1.25x)
          </button>
          <button
            data-testid="btn-cam-waterfall"
            onClick={() => handleJumpCamera('WATERFALL')}
            className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/15 text-cyan-300 hover:text-white"
          >
            Thác nước (1.5x)
          </button>
          <button
            data-testid="btn-cam-cave"
            onClick={() => handleJumpCamera('CAVE')}
            className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/15 text-amber-300 hover:text-white"
          >
            Hang ngầm (1.35x)
          </button>
        </div>

        {/* Simulation Speed */}
        <div className="flex items-center gap-1">
          <span className="text-neutral-400 text-[10px] font-mono mr-1">Tốc độ:</span>
          {[0, 1, 2, 5].map((s) => (
            <button
              key={s}
              onClick={() => setTimeSpeed(s)}
              className={`px-2 py-1 rounded-lg font-mono text-[11px] transition ${
                timeSpeed === s ? 'bg-amber-500 text-neutral-950 font-bold' : 'bg-white/5 hover:bg-white/10 text-neutral-300'
              }`}
            >
              {s === 0 ? 'Pause' : `${s}x`}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
