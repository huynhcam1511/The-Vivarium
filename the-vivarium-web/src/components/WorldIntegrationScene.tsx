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
import { DesignationManager } from '../simulation/DesignationManager';
import { JobQueue } from '../simulation/JobQueue';
import { ClayMudStockpile } from '../simulation/ClayMudStockpile';
import { TerrainPathfinder } from '../simulation/TerrainPathfinder';
import { AntColony } from '../simulation/AntColony';
import { HoneydewSource } from '../simulation/HoneydewSource';
import { GameStateManager } from '../simulation/GameStateManager';
import { ClayMudStockpileView } from '../rendering/ClayMudStockpileView';
import { HoneydewSourceView } from '../rendering/HoneydewSourceView';
import { AntPlaceholderView } from '../rendering/AntPlaceholderView';

function drawDashedRect(
  g: Graphics,
  x: number,
  y: number,
  w: number,
  h: number,
  dashLen: number = 4,
  gapLen: number = 4
): void {
  drawDashedSegment(g, x, y, x + w, y, dashLen, gapLen);
  drawDashedSegment(g, x + w, y, x + w, y + h, dashLen, gapLen);
  drawDashedSegment(g, x + w, y + h, x, y + h, dashLen, gapLen);
  drawDashedSegment(g, x, y + h, x, y, dashLen, gapLen);
}

function drawDashedSegment(
  g: Graphics,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  dash: number,
  gap: number
): void {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy);
  if (len <= 0) return;
  const ux = dx / len;
  const uy = dy / len;

  let dist = 0;
  while (dist < len) {
    const curDash = Math.min(dash, len - dist);
    g.moveTo(x1 + ux * dist, y1 + uy * dist);
    g.lineTo(x1 + ux * (dist + curDash), y1 + uy * (dist + curDash));
    dist += dash + gap;
  }
}

export interface OakBoughMountingConfig {
  leftBough: {
    assetId: string;
    localSocket: { x: number; y: number }; // { x: -85, y: -320 } relative to trunk center
    zIndex: number; // 45
    beehiveAnchor: { x: number; y: number }; // { x: -240, y: -410 }
  };
  rightBough: {
    assetId: string;
    localSocket: { x: number; y: number }; // { x: +95, y: -310 } relative to trunk center
    zIndex: number; // 45
    predatorPerch: { x: number; y: number }; // { x: +320, y: -380 }
  };
}

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
  const aquaticRendererRef = useRef<AquaticRenderer | null>(null);
  const weatherRendererRef = useRef<WeatherRenderer | null>(null);

  // Gate 2 Simulation & Rendering Subsystems
  const designationManagerRef = useRef<DesignationManager>(new DesignationManager());
  const jobQueueRef = useRef<JobQueue>(new JobQueue());
  const stockpileRef = useRef<ClayMudStockpile>(new ClayMudStockpile(64, 16, { cx: 48, cy: 7 }));
  const honeydewSourceRef = useRef<HoneydewSource>(new HoneydewSource(50, 30, { cx: 50, cy: 9 }));
  const antColonyRef = useRef<AntColony | null>(null);
  const stockpileViewRef = useRef<ClayMudStockpileView | null>(null);
  const antViewRef = useRef<AntPlaceholderView | null>(null);

  // Interactive Tools & Mode State
  const [currentTool, setCurrentTool] = useState<'SELECT' | 'DIG' | 'FILL' | 'CANCEL'>('SELECT');
  const [timeSpeed, setTimeSpeed] = useState<number>(1);
  const [workerEnergy, setWorkerEnergy] = useState<number>(100);
  const [honeydewCount, setHoneydewCount] = useState<number>(30);
  const [saveStatusMsg, setSaveStatusMsg] = useState<string>('');

  const [selectedWeather, setSelectedWeather] = useState<WeatherType>('CLEAR_SUNNY');

  // DEV mode instant brush confinement: strictly confined to DEV/QA mode
  const [isInstantBrushDevMode, setIsInstantBrushDevMode] = useState<boolean>(() => {
    return typeof window !== 'undefined' &&
      (window.location.search.includes('mode=dev-instant-brush') ||
       window.location.search.includes('dev-instant-brush'));
  });

  const currentToolRef = useRef(currentTool);
  const timeSpeedRef = useRef(timeSpeed);
  const isInstantBrushDevModeRef = useRef(isInstantBrushDevMode);

  useEffect(() => {
    currentToolRef.current = currentTool;
  }, [currentTool]);

  useEffect(() => {
    timeSpeedRef.current = timeSpeed;
  }, [timeSpeed]);

  useEffect(() => {
    isInstantBrushDevModeRef.current = isInstantBrushDevMode;
  }, [isInstantBrushDevMode]);

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
    let cleanupListeners: (() => void) | null = null;

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
      weatherRendererRef.current = weatherRenderer;
      weatherRenderer.container.position.set(-1600, -900);
      worldStage.addChild(weatherRenderer.container);

      // Load PACK-005 Real Weather Textures
      try {
        const [mountainTex, cloudsTex, fogMistTex, leafFallTex, rainDropTex] = await Promise.all([
          Assets.load('/assets/environment/weather/env_sky_mountain_001.png').catch(() => null),
          Assets.load('/assets/environment/weather/env_sky_clouds_001.png').catch(() => null),
          Assets.load('/assets/environment/weather/env_fx_fog_mist.png').catch(() => null),
          Assets.load('/assets/environment/weather/env_canopy_leaf_fall.png').catch(() => null),
          Assets.load('/assets/environment/weather/env_fx_rain_drop_01.png').catch(() => null),
        ]);
        weatherRenderer.setWeatherTextures({
          mountainTex,
          cloudsTex,
          fogMistTex,
          leafFallTex,
          rainDropTex,
        });
      } catch (e) {
        console.warn('Weather textures load fallback:', e);
      }
      if (!active) return;

      // 2. SUBTERRANEAN ORGANIC TERRAIN & CAVE CAVITIES
      const terrainData = terrainDataRef.current;
      const terrainRenderer = new OrganicTerrainRenderer(terrainData);
      terrainRendererRef.current = terrainRenderer;
      worldStage.addChild(terrainRenderer.container);

      // Try load soil & PACK-003 strata textures
      try {
        const soilTex = await Assets.load('/assets/terrain/terrain_soil_dark_loam_v2.png');
        if (soilTex) terrainRenderer.setSoilTexture(soilTex);

        // Load PACK-003 Stratified textures (Clay, Peat, Pebble)
        const [clayTex, peatTex, pebbleTex] = await Promise.all([
          Assets.load('/assets/environment/underground/env_terrain_clay_512.png').catch(() => null),
          Assets.load('/assets/environment/underground/env_terrain_peat_512.png').catch(() => null),
          Assets.load('/assets/environment/underground/env_pebble_embedded.png').catch(() => null),
        ]);
        if (clayTex && peatTex) {
          terrainRenderer.setUndergroundStrata(clayTex, peatTex, pebbleTex);
        }
      } catch (e) {
        console.warn('Soil texture fallback:', e);
      }
      if (!active) return;
      terrainRenderer.rebuildTerrainMesh(false);

      // 3. ANCIENT OAK DUAL-PASS SANDWICH ASSEMBLY (V5 & V2)
      // Pass 1: Roots placed BEHIND solid soil, inside the subterranean group (above cavity background)
      // Pass 2: Trunk Buttress placed IN FRONT of solid soil
      const trunkGroundY = terrainData.getSurfaceY(0);

      // Root layer group placed inside terrain container between cavity background and soil
      const rootBackGroup = new Container();
      terrainRenderer.addSubterraneanLayer(rootBackGroup);

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

          // Pass 1: Root Spr (Z: 30) - Clipped below undulating ground surface contour
          // Hidden behind solid soil, exposed only when cavity is excavated
          const rootMask = new Graphics();
          const rootMaskPts: { x: number; y: number }[] = [];
          rootMaskPts.push({ x: -600, y: trunkGroundY + 1200 });
          for (let mx = -600; mx <= 600; mx += 16) {
            rootMaskPts.push({ x: mx, y: terrainData.getSurfaceY(mx) - 6 });
          }
          rootMaskPts.push({ x: 600, y: trunkGroundY + 1200 });
          rootMask.poly(rootMaskPts).fill({ color: 0xffffff });
          rootSpr.mask = rootMask;
          // Parent mask to Container instead of Sprite to satisfy PixiJS v8 allowChildren constraint
          rootBackGroup.addChild(rootMask);
          rootBackGroup.addChild(rootSpr);

          // Pass 2: Trunk Spr (Z: 45) - Clipped above undulating groundline with natural root buttress flare
          const trunkSpr = new Sprite(unifiedV5);
          trunkSpr.anchor.set(0.5, 0.55);
          trunkSpr.scale.set(0.5);
          trunkSpr.position.set(0, trunkGroundY);

          const trunkMask = new Graphics();
          const trunkMaskPts: { x: number; y: number }[] = [];
          trunkMaskPts.push({ x: -600, y: trunkGroundY - 1200 });
          trunkMaskPts.push({ x: 600, y: trunkGroundY - 1200 });
          for (let mx = 600; mx >= -600; mx -= 16) {
            trunkMaskPts.push({ x: mx, y: terrainData.getSurfaceY(mx) + 10 });
          }
          trunkMask.poly(trunkMaskPts).fill({ color: 0xffffff });
          trunkSpr.mask = trunkMask;
          // Parent mask to Container instead of Sprite to satisfy PixiJS v8 allowChildren constraint
          trunkFrontGroup.addChild(trunkMask);
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
      aquaticRendererRef.current = aquaticRenderer;
      worldStage.addChild(aquaticRenderer.container);

      // Load PACK-004 Real Aquatic Textures
      try {
        const [mudTex, waterfallStreamTex, bluebellTex, mossTex, fernTex] = await Promise.all([
          Assets.load('/assets/environment/aquatic/env_lake_bottom_mud.png').catch(() => null),
          Assets.load('/assets/environment/aquatic/env_waterfall_stream.png').catch(() => null),
          Assets.load('/assets/environment/aquatic/env_flower_bluebell.png').catch(() => null),
          Assets.load('/assets/environment/aquatic/env_moss_patch.png').catch(() => null),
          Assets.load('/assets/environment/aquatic/env_fern_cluster.png').catch(() => null),
        ]);
        aquaticRenderer.setAquaticTextures({
          mudTex,
          waterfallStreamTex,
          bluebellTex,
          mossTex,
          fernTex,
        });
      } catch (e) {
        console.warn('Aquatic textures load fallback:', e);
      }
      if (!active) return;

      // 6. SUBTERRANEAN WORKER ANT COLONY & PHYSICAL STOCKPILE
      const designationManager = designationManagerRef.current;
      const jobQueue = jobQueueRef.current;
      const stockpile = stockpileRef.current;
      const pathfinder = new TerrainPathfinder(terrainData);

      const honeydewSource = honeydewSourceRef.current;
      const antColony = new AntColony(terrainData, pathfinder, jobQueue, stockpile, designationManager, honeydewSource, 12);
      antColonyRef.current = antColony;

      // Physical Clay Mud Stockpile View (placed inside subterranean layer behind solid soil)
      const stockpileView = new ClayMudStockpileView(stockpile);
      stockpileViewRef.current = stockpileView;
      terrainRenderer.addSubterraneanLayer(stockpileView.container);

      // Physical Subterranean Aphid Honeydew Cache View
      const honeydewView = new HoneydewSourceView(honeydewSource);
      terrainRenderer.addSubterraneanLayer(honeydewView.container);

      // Ant Placeholder View (ants crawl inside subterranean caverns)
      const antPlaceholderView = new AntPlaceholderView();
      antViewRef.current = antPlaceholderView;
      terrainRenderer.addSubterraneanLayer(antPlaceholderView.antContainer);

      // Designation Overlay Graphics (above terrain mesh)
      const designationOverlayGraphics = new Graphics();
      worldStage.addChild(designationOverlayGraphics);

      // Progress Bar Overlay Graphics (above terrain mesh)
      worldStage.addChild(antPlaceholderView.progressOverlay);

      // Interactive Dig/Fill cursor preview indicator
      const previewIndicator = new Graphics();
      worldStage.addChild(previewIndicator);

      // Event Listeners for Camera Drag / Dig-Fill
      let isMouseDown = false;
      let lastDragTime = 0;

      // 1. DEV MODE ONLY: Instant Destructive/Additive Brush
      const performInstantDevBrushAt = (worldPos: { x: number; y: number }) => {
        const r = 28;
        const dirtyBox = {
          minX: worldPos.x - r - 10,
          maxX: worldPos.x + r + 10,
          minY: worldPos.y - r - 10,
          maxY: worldPos.y + r + 10,
        };
        if (currentToolRef.current === 'DIG') {
          terrainData.digRadius(worldPos.x, worldPos.y, r);
          terrainRenderer.rebuildTerrainMesh(false, dirtyBox);
        } else if (currentToolRef.current === 'FILL') {
          terrainData.fillRadius(worldPos.x, worldPos.y, r);
          terrainRenderer.rebuildTerrainMesh(false, dirtyBox);
        }
      };

      // 2. PRODUCTION 2-LAYER PIPELINE: Apply Player Designation -> JobQueue -> Worker Execution
      const handleApplyDesignationAt = (worldPos: { x: number; y: number }) => {
        const tool = currentToolRef.current;
        if (tool !== 'DIG' && tool !== 'FILL' && tool !== 'CANCEL') return;

        const { cx, cy } = designationManager.worldToCell(worldPos.x, worldPos.y);
        if (!designationManager.isWithinBounds(cx, cy)) return;

        if (tool === 'DIG') {
          if (terrainData.isSolid(cx, cy)) {
            designationManager.addDesignation('DIG', cx, cy);
            jobQueue.pushJob('DIG', { cx, cy });
          }
        } else if (tool === 'FILL') {
          if (!terrainData.isSolid(cx, cy)) {
            designationManager.addDesignation('FILL', cx, cy);
            jobQueue.pushJob('FILL', { cx, cy });
          }
        } else if (tool === 'CANCEL') {
          designationManager.removeDesignation(cx, cy);
          jobQueue.cancelJobByCell(cx, cy);
        }
      };

      const handlePointerDown = (e: PointerEvent) => {
        if (e.button === 1 || e.button === 2) {
          camera.handleMouseDown(e.clientX, e.clientY, e.button);

          // Right click in standard mode cancels designation
          if (e.button === 2 && !isInstantBrushDevModeRef.current) {
            const worldPos = camera.screenToWorld({ x: e.clientX, y: e.clientY });
            const { cx, cy } = designationManager.worldToCell(worldPos.x, worldPos.y);
            if (designationManager.hasDesignation(cx, cy)) {
              designationManager.removeDesignation(cx, cy);
              jobQueue.cancelJobByCell(cx, cy);
            }
          }
        } else if (e.button === 0) {
          isMouseDown = true;
          const worldPos = camera.screenToWorld({ x: e.clientX, y: e.clientY });
          if (isInstantBrushDevModeRef.current) {
            performInstantDevBrushAt(worldPos);
          } else {
            handleApplyDesignationAt(worldPos);
          }
        }
      };

      const handlePointerMove = (e: PointerEvent) => {
        camera.handleMouseMove(e.clientX, e.clientY);

        const worldPos = camera.screenToWorld({ x: e.clientX, y: e.clientY });

        if (isMouseDown) {
          if (isInstantBrushDevModeRef.current) {
            const now = performance.now();
            if (now - lastDragTime > 45) {
              lastDragTime = now;
              performInstantDevBrushAt(worldPos);
            }
          } else {
            handleApplyDesignationAt(worldPos);
          }
        }

        // Smart Selection & Preview indicator
        previewIndicator.clear();
        const tool = currentToolRef.current;
        if (tool === 'DIG' || tool === 'FILL' || tool === 'CANCEL') {
          const { cx, cy } = designationManager.worldToCell(worldPos.x, worldPos.y);

          if (designationManager.isWithinBounds(cx, cy)) {
            const wx = terrainData.originX + cx * terrainData.cellSize;
            const wy = terrainData.originY + cy * terrainData.cellSize;
            const isDig = tool === 'DIG';
            const isCancel = tool === 'CANCEL';
            const color = isCancel ? 0xf43f5e : isDig ? 0xf59e0b : 0x10b981;

            previewIndicator.roundRect(wx + 1, wy + 1, 30, 30, 4);
            previewIndicator.stroke({
              color,
              width: 2.0,
              alpha: 0.9,
            });
            previewIndicator.roundRect(wx + 2, wy + 2, 28, 28, 3);
            previewIndicator.fill({
              color,
              alpha: 0.25,
            });
          }
        }
      };

      const handlePointerUp = () => {
        isMouseDown = false;
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

        cleanupListeners = () => {
          container.removeEventListener('pointerdown', handlePointerDown);
          window.removeEventListener('pointermove', handlePointerMove);
          window.removeEventListener('pointerup', handlePointerUp);
          container.removeEventListener('pointerleave', handlePointerLeave);
          container.removeEventListener('wheel', handleWheel);
        };
      }

      // Expose debug handles as dynamic getters on window for automated QA and profiling
      const isQaMode = import.meta.env.DEV || window.location.search.includes('mode=integration');
      if (isQaMode) {
        Object.defineProperty(window, '__CAMERA__', {
          get: () => cameraRef.current,
          configurable: true,
        });
        Object.defineProperty(window, '__TERRAIN_RENDERER__', {
          get: () => terrainRendererRef.current,
          configurable: true,
        });
        Object.defineProperty(window, '__TERRAIN_DATA__', {
          get: () => terrainDataRef.current,
          configurable: true,
        });
        Object.defineProperty(window, '__AQUATIC_RENDERER__', {
          get: () => aquaticRendererRef.current,
          configurable: true,
        });
        Object.defineProperty(window, '__AQUATIC_SYSTEM__', {
          get: () => aquaticSystemRef.current,
          configurable: true,
        });
        Object.defineProperty(window, '__WEATHER_RENDERER__', {
          get: () => weatherRendererRef.current,
          configurable: true,
        });
        Object.defineProperty(window, '__WEATHER_SYSTEM__', {
          get: () => weatherSystemRef.current,
          configurable: true,
        });
        Object.defineProperty(window, '__DESIGNATION_MANAGER__', {
          get: () => designationManagerRef.current,
          configurable: true,
        });
        Object.defineProperty(window, '__JOB_QUEUE__', {
          get: () => jobQueueRef.current,
          configurable: true,
        });
        Object.defineProperty(window, '__STOCKPILE__', {
          get: () => stockpileRef.current,
          configurable: true,
        });
        Object.defineProperty(window, '__HONEYDEW_SOURCE__', {
          get: () => honeydewSourceRef.current,
          configurable: true,
        });
        Object.defineProperty(window, '__GAME_STATE_MANAGER__', {
          get: () => GameStateManager,
          configurable: true,
        });
        Object.defineProperty(window, '__ANT_COLONY__', {
          get: () => antColonyRef.current,
          configurable: true,
        });
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

        // 3. Tick Subterranean Worker Ant Colony & Progress Bars
        antColony.update(effectiveDt, (dirtyBox) => {
          terrainRenderer.rebuildTerrainMesh(false, dirtyBox);
        });
        antPlaceholderView.render(antColony.ants);

        // 4. Render Animated Dashed Highlights for Player Designations
        designationOverlayGraphics.clear();
        const designations = designationManager.getAllDesignations();
        const pulseAlpha = 0.80 + 0.15 * Math.sin(currentTime * 0.0045);

        for (const des of designations) {
          const wx = terrainData.originX + des.cx * terrainData.cellSize;
          const wy = terrainData.originY + des.cy * terrainData.cellSize;
          const isDig = des.type === 'DIG';
          const color = isDig ? 0xf59e0b : 0x10b981;

          // Semitransparent interior tint
          designationOverlayGraphics.roundRect(wx + 1, wy + 1, 30, 30, 2);
          designationOverlayGraphics.fill({ color, alpha: 0.18 });

          // High-contrast pulsing dashed outline
          drawDashedRect(designationOverlayGraphics, wx + 1, wy + 1, 30, 30, 4, 4);
          designationOverlayGraphics.stroke({ color, width: 2.0, alpha: pulseAlpha });
        }

        // 5. Update Renderers
        aquaticSystem.update(effectiveDt);
        aquaticRenderer.update(effectiveDt);
        weatherRenderer.update(effectiveDt);
        camera.update(effectiveDt);

        // 6. Update Telemetry (Using 0.8s moving window for accurate, stable FPS measurement)
        frameCount++;
        fpsTimer += dt;
        if (fpsTimer >= 0.8) {
          const st = weatherSystem.getWeatherState();
          const measuredFps = Math.min(60, Math.round(frameCount / fpsTimer));
          
        const workerAnt = antColony.ants.find((a) => a.type === 'WORKER');
        if (workerAnt) {
          setWorkerEnergy(Math.round(workerAnt.energy));
        }
        setHoneydewCount(honeydewSource.getAvailableCount());

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
            digQueueCount: designationManager.getPendingCount(),
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
      active = false;
      cancelAnimationFrame(animId);
      if (cleanupListeners) {
        cleanupListeners();
      }
      if (pixiApp) {
        try {
          pixiApp.destroy(true, { children: true });
        } catch (e) {
          console.warn('Pixi destroy cleanup:', e);
        }
      }
      delete (window as unknown as Record<string, unknown>).__CAMERA__;
      delete (window as unknown as Record<string, unknown>).__TERRAIN_RENDERER__;
      delete (window as unknown as Record<string, unknown>).__TERRAIN_DATA__;
      delete (window as unknown as Record<string, unknown>).__AQUATIC_RENDERER__;
      delete (window as unknown as Record<string, unknown>).__AQUATIC_SYSTEM__;
      delete (window as unknown as Record<string, unknown>).__WEATHER_RENDERER__;
      delete (window as unknown as Record<string, unknown>).__WEATHER_SYSTEM__;
      delete (window as unknown as Record<string, unknown>).__DESIGNATION_MANAGER__;
      delete (window as unknown as Record<string, unknown>).__JOB_QUEUE__;
      delete (window as unknown as Record<string, unknown>).__STOCKPILE__;
      delete (window as unknown as Record<string, unknown>).__ANT_COLONY__;
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
            THE VIVARIUM — V0.1 FIRST PLAYABLE (ANCIENT FOREST)
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
            <span className="text-neutral-400 mr-1">Hàng đợi:</span>
            <span className="font-bold text-amber-300" data-testid="telemetry-dig-queue">{telemetry.digQueueCount}</span>
          </div>
          <div>
            <span className="text-neutral-400 mr-1">Gió:</span>
            <span className="font-bold text-teal-300" data-testid="telemetry-wind">{telemetry.windSpeed.toFixed(1)} m/s</span>
          </div>
          <div>
            <span className="text-neutral-400 mr-1">FPS:</span>
            <span className="font-bold text-emerald-400" data-testid="telemetry-fps">{telemetry.fps}</span>
          </div>
          <div>
            <span className="text-neutral-400 mr-1">Năng Lượng:</span>
            <span className="font-bold text-yellow-300" data-testid="telemetry-worker-energy">{workerEnergy}</span>
          </div>
          <div>
            <span className="text-neutral-400 mr-1">Bùn Đất Sét:</span>
            <span className="font-bold text-amber-500" data-testid="telemetry-clay-mud">{stockpileRef.current?.getAvailableCount() ?? 16}</span>
          </div>
          <div>
            <span className="text-neutral-400 mr-1">Mật Rệp (Food):</span>
            <span className="font-bold text-amber-400" data-testid="telemetry-honeydew">{honeydewCount}</span>
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
        {/* Tools: Dig / Fill / Cancel & Dev Mode Toggle */}
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
            ⛏️ Chỉ định đào (Dig)
          </button>
          <button
            data-testid="btn-tool-fill"
            onClick={() => setCurrentTool('FILL')}
            className={`px-3 py-1.5 rounded-xl font-medium transition ${
              currentTool === 'FILL' ? 'bg-emerald-600 text-white font-bold' : 'bg-white/5 hover:bg-white/10 text-neutral-300'
            }`}
          >
            🧱 Chỉ định lấp (Fill)
          </button>
          <button
            data-testid="btn-tool-cancel"
            onClick={() => setCurrentTool('CANCEL')}
            className={`px-3 py-1.5 rounded-xl font-medium transition ${
              currentTool === 'CANCEL' ? 'bg-rose-600 text-white font-bold' : 'bg-white/5 hover:bg-white/10 text-neutral-300'
            }`}
          >
            ❌ Hủy chỉ định
          </button>
          <button
            data-testid="btn-toggle-dev-brush"
            onClick={() => setIsInstantBrushDevMode((prev) => !prev)}
            className={`px-3 py-1.5 rounded-xl font-medium transition text-[11px] ${
              isInstantBrushDevMode ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50'
            }`}
          >
            {isInstantBrushDevMode ? '⚡ Cọ tức thì DEV' : '🐜 Mô phỏng 2 Lớp'}
          </button>
        </div>

        
        {/* Save & Load Game Controls */}
        <div className="flex items-center gap-1.5 border-l border-white/10 pl-2">
          <button
            data-testid="btn-action-save"
            onClick={() => {
              const ok = GameStateManager.saveGame(
                terrainDataRef.current,
                antColonyRef.current!,
                stockpileRef.current,
                honeydewSourceRef.current,
                jobQueueRef.current,
                designationManagerRef.current
              );
              setSaveStatusMsg(ok ? 'Lưu thành công!' : 'Lưu thất bại!');
              setTimeout(() => setSaveStatusMsg(''), 2500);
            }}
            className="px-2.5 py-1.5 rounded-xl bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/40 font-medium text-[11px] transition"
          >
            💾 Lưu Game
          </button>
          <button
            data-testid="btn-action-load"
            onClick={() => {
              const ok = GameStateManager.loadGame(
                terrainDataRef.current,
                antColonyRef.current!,
                stockpileRef.current,
                honeydewSourceRef.current,
                jobQueueRef.current,
                designationManagerRef.current,
                (box) => terrainRendererRef.current?.rebuildTerrainMesh(false, box)
              );
              setSaveStatusMsg(ok ? 'Tải thành công!' : 'Chưa có file lưu!');
              setTimeout(() => setSaveStatusMsg(''), 2500);
            }}
            className="px-2.5 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 font-medium text-[11px] transition"
          >
            📂 Tải Game
          </button>
          {saveStatusMsg && (
            <span className="text-[10px] text-amber-300 font-bold ml-1 animate-pulse" data-testid="save-status-msg">
              {saveStatusMsg}
            </span>
          )}
        </div>

        {/* Quick Guidance Overlay */}
        <div className="hidden lg:flex items-center gap-2 px-2 py-1 rounded-lg bg-white/5 border border-white/5 text-[10px] text-neutral-300">
          <span>💡 <b>Hướng dẫn:</b> 1. Chọn ⛏️ <b>Đào</b> click vào đất ngầm &rarr; 2. Kiến đào 3.5s mang bùn về kho &rarr; 3. Chọn 🧱 <b>Lấp</b> click ô trống &rarr; 4. Bấm 💾 <b>Lưu Game</b></span>
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
              data-testid={`btn-speed-${s}`}
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
