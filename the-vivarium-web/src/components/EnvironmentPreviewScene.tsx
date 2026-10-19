import React, { useEffect, useRef, useState } from 'react';
import { Application, Container, Graphics, Sprite, Assets, Text, TextStyle } from 'pixi.js';
import { OrganicTerrainData } from '../engine/OrganicTerrainData';
import { OrganicTerrainRenderer } from '../engine/OrganicTerrainRenderer';

export const EnvironmentPreviewScene: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<Application | null>(null);

  // Camera & view states
  const [zoomLevel, setZoomLevel] = useState<number>(1.0);
  const [cameraPos, setCameraPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [bgStyle, setBgStyle] = useState<'GRADIENT_SKY' | 'DARK_SOIL' | 'HIGH_CONTRAST_WHITE' | 'CHECKER'>('GRADIENT_SKY');
  const [enableSway, setEnableSway] = useState<boolean>(true);
  const [enableParallax, setEnableParallax] = useState<boolean>(true);
  const [showWireframe, setShowWireframe] = useState<boolean>(false);
  const [activeBrush, setActiveBrush] = useState<'NONE' | 'DIG' | 'FILL'>('NONE');

  // Organic terrain instances
  const terrainDataRef = useRef<OrganicTerrainData>(new OrganicTerrainData());
  const terrainRendererRef = useRef<OrganicTerrainRenderer | null>(null);

  // Telemetry
  const [telemetry, setTelemetry] = useState<{
    fps: number;
    camX: number;
    camY: number;
    zoom: number;
    antScreenSize: string;
    terrainMode: string;
    brushState: string;
  }>({
    fps: 60,
    camX: 0,
    camY: 0,
    zoom: 1.0,
    antScreenSize: '36.8 × 20.0 px',
    terrainMode: 'Organic Undulating + Caves',
    brushState: 'Idle (Click Dig/Fill)',
  });

  // Stage refs
  const worldContainerRef = useRef<Container | null>(null);
  const skyContainerRef = useRef<Container | null>(null);
  const canopyContainerRef = useRef<Container | null>(null);
  const boughSpriteRef = useRef<Sprite | null>(null);
  const trunkSpriteRef = useRef<Sprite | null>(null);
  const rootsSpriteRef = useRef<Sprite | null>(null);

  // Dragging / Painting camera state
  const isMouseDownRef = useRef(false);
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0, camStartX: 0, camStartY: 0 });

  useEffect(() => {
    let active = true;
    let pixiApp: Application | null = null;
    let tickerFn: (() => void) | null = null;

    const init = async () => {
      if (!containerRef.current) return;

      while (containerRef.current.firstChild) {
        containerRef.current.removeChild(containerRef.current.firstChild);
      }

      pixiApp = new Application();
      await pixiApp.init({
        resizeTo: window,
        backgroundColor: 0x0a1017,
        resolution: window.devicePixelRatio || 1,
        autoDensity: true,
        antialias: true,
      });

      if (!active) return;
      containerRef.current.appendChild(pixiApp.canvas);
      appRef.current = pixiApp;

      const W = window.innerWidth;
      const H = window.innerHeight;

      // ====================================================================
      // 1. SKY CONTAINER (Parallax Far Layer)
      // ====================================================================
      const skyContainer = new Container();
      pixiApp.stage.addChild(skyContainer);
      skyContainerRef.current = skyContainer;

      const drawSky = (style: typeof bgStyle) => {
        skyContainer.removeChildren();
        const g = new Graphics();
        if (style === 'DARK_SOIL') {
          g.rect(0, 0, W, H);
          g.fill({ color: 0x150d08 });
        } else if (style === 'HIGH_CONTRAST_WHITE') {
          g.rect(0, 0, W, H);
          g.fill({ color: 0xfdfdfd });
        } else if (style === 'CHECKER') {
          const cSize = 24;
          for (let y = 0; y < H; y += cSize) {
            for (let x = 0; x < W; x += cSize) {
              const isDark = (Math.floor(x / cSize) + Math.floor(y / cSize)) % 2 === 0;
              g.rect(x, y, cSize, cSize);
              g.fill({ color: isDark ? 0x222222 : 0x141414 });
            }
          }
        } else {
          // GRADIENT_SKY: Procedural multi-band sky per VISUAL_BIBLE (8ECAE6 -> 219EBC)
          const steps = 30;
          const stepH = H / steps;
          for (let i = 0; i < steps; i++) {
            const t = i / (steps - 1);
            let r: number, gr: number, b: number;
            if (t < 0.6) {
              const localT = t / 0.6;
              r = Math.round(142 * (1 - localT) + 33 * localT);
              gr = Math.round(202 * (1 - localT) + 158 * localT);
              b = Math.round(230 * (1 - localT) + 188 * localT);
            } else {
              const localT = (t - 0.6) / 0.4;
              r = Math.round(33 * (1 - localT) + 210 * localT);
              gr = Math.round(158 * (1 - localT) + 235 * localT);
              b = Math.round(188 * (1 - localT) + 250 * localT);
            }
            const color = (r << 16) | (gr << 8) | b;
            g.rect(0, i * stepH, W, stepH + 1);
            g.fill({ color });
          }

          // Subtle sun haze disc
          g.circle(W * 0.75, H * 0.22, 120);
          g.fill({ color: 0xffffff, alpha: 0.22 });
          g.circle(W * 0.75, H * 0.22, 60);
          g.fill({ color: 0xfffbeb, alpha: 0.35 });
        }
        skyContainer.addChild(g);
      };

      drawSky(bgStyle);

      // ====================================================================
      // 2. WORLD CONTAINER (Camera Target)
      // ====================================================================
      const worldContainer = new Container();
      worldContainer.x = W * 0.5;
      worldContainer.y = H * 0.56;
      pixiApp.stage.addChild(worldContainer);
      worldContainerRef.current = worldContainer;

      // Load Assets
      const trunkPath = '/assets/source/env_tree_ancient_trunk_base_v2.png';
      const boughPath = '/assets/source/env_tree_bough_main_moss_v2.png';
      const foliagePath = '/assets/source/env_foliage_canopy_clump_01_v2.png';
      const rootsPath = '/assets/source/env_tree_root_deep_cluster_v2.png';
      const soilPath = '/assets/terrain/terrain_soil_dark_loam_v2.png';
      const antPath = '/assets/source/char_ant_worker_idle_v2.png';

      let texTrunk: any = null;
      let texBough: any = null;
      let texFoliage: any = null;
      let texRoots: any = null;
      let texSoil: any = null;
      let texAnt: any = null;

      try {
        texTrunk = await Assets.load(trunkPath);
        texBough = await Assets.load(boughPath);
        texFoliage = await Assets.load(foliagePath);
        texRoots = await Assets.load(rootsPath);
        texSoil = await Assets.load(soilPath);
        texAnt = await Assets.load(antPath);
      } catch (err) {
        console.warn('Asset loading error in environment preview:', err);
      }

      // ====================================================================
      // 3. ORGANIC TERRAIN RENDERER (Marching Mask + Undulating Surface + Cave Cavities)
      // ====================================================================
      const terrainData = terrainDataRef.current;
      const terrainRenderer = new OrganicTerrainRenderer(terrainData);
      terrainRendererRef.current = terrainRenderer;
      worldContainer.addChild(terrainRenderer.container);

      if (texSoil) {
        terrainRenderer.setSoilTexture(texSoil);
      }
      terrainRenderer.rebuildTerrainMesh(false);

      // ====================================================================
      // 4. ANCIENT OAK 4-LAYER ASSEMBLY (Z: 35 Roots, Z: 40 Trunk, Z: 45 Bough, Z: 70 Foliage)
      // Ground elevation at trunk center (X = 0)
      // ====================================================================
      const trunkGroundY = terrainData.getSurfaceY(0);

      // A. Roots (Z: 35) - Placed under ground, flush with bottom of trunk
      if (texRoots) {
        const rootsSprite = new Sprite(texRoots);
        rootsSprite.anchor.set(0.50, 0.00);
        rootsSprite.scale.set(0.5); // Strictly uniform 0.5
        rootsSprite.position.set(0, trunkGroundY - 4);
        worldContainer.addChild(rootsSprite);
        rootsSpriteRef.current = rootsSprite;
      }

      // B. Trunk Base (Z: 40) - Planted on undulating surface at X = 0
      if (texTrunk) {
        const trunkSprite = new Sprite(texTrunk);
        trunkSprite.anchor.set(0.50, 1.00);
        trunkSprite.scale.set(0.5);
        trunkSprite.position.set(0, trunkGroundY);
        worldContainer.addChild(trunkSprite);
        trunkSpriteRef.current = trunkSprite;
      }

      // C. Bough (Z: 45) - Mounted on trunk crotch
      if (texBough) {
        const boughSprite = new Sprite(texBough);
        boughSprite.anchor.set(0.15, 0.65);
        boughSprite.scale.set(0.5);
        boughSprite.position.set(-10, trunkGroundY - 285);
        worldContainer.addChild(boughSprite);
        boughSpriteRef.current = boughSprite;
      }

      // D. Canopy Clump (Z: 70) - Swaying
      if (texFoliage) {
        const canopyContainer = new Container();
        canopyContainer.position.set(80, trunkGroundY - 410);
        worldContainer.addChild(canopyContainer);
        canopyContainerRef.current = canopyContainer;

        const foliageSprite = new Sprite(texFoliage);
        foliageSprite.anchor.set(0.50, 0.50);
        foliageSprite.scale.set(0.5);
        foliageSprite.position.set(0, 0);
        canopyContainer.addChild(foliageSprite);

        const foliageSprite2 = new Sprite(texFoliage);
        foliageSprite2.anchor.set(0.50, 0.50);
        foliageSprite2.scale.set(0.42);
        foliageSprite2.position.set(-160, 40);
        foliageSprite2.alpha = 0.90;
        canopyContainer.addChild(foliageSprite2);
      }

      // ====================================================================
      // 5. BIOLOGICAL SCALE PROBES: WORKER ANTS IN 3 CAVE ZONES
      // ====================================================================
      if (texAnt) {
        // Ant 1: Surface Ground Explorer
        const ant1X = 180;
        const ant1Y = terrainData.getSurfaceY(ant1X);
        const groundAnt = new Sprite(texAnt);
        groundAnt.anchor.set(0.50, 0.8438);
        groundAnt.scale.set(0.317); // 36.8px span
        groundAnt.position.set(ant1X, ant1Y);
        worldContainer.addChild(groundAnt);

        // Ant 2: Narrow Transit Tunnel (Walking through curved shaft X=265, Y=205, tunnel height ~46px)
        const tunnelAnt = new Sprite(texAnt);
        tunnelAnt.anchor.set(0.50, 0.8438);
        tunnelAnt.scale.set(0.317);
        tunnelAnt.position.set(265, 205);
        worldContainer.addChild(tunnelAnt);

        // Ant 3: Medium Living Chamber (Resting on curved floor X=430, Y=348)
        const livingAnt = new Sprite(texAnt);
        livingAnt.anchor.set(0.50, 0.8438);
        livingAnt.scale.set(0.317);
        livingAnt.position.set(430, 348);
        worldContainer.addChild(livingAnt);

        // Ant 4: Spacious Royal Queen Chamber (Standing on wide natural floor X=640, Y=508)
        const queenChamberAnt = new Sprite(texAnt);
        queenChamberAnt.anchor.set(0.50, 0.8438);
        queenChamberAnt.scale.set(0.317);
        queenChamberAnt.position.set(640, 508);
        worldContainer.addChild(queenChamberAnt);

        // Ant 5: Second ant in Queen Chamber tending brood
        const nurseAnt = new Sprite(texAnt);
        nurseAnt.anchor.set(0.50, 0.8438);
        nurseAnt.scale.set(0.317);
        nurseAnt.scale.x = -0.317; // Face left
        nurseAnt.position.set(590, 506);
        worldContainer.addChild(nurseAnt);

        // Caliper overlay on Ground Ant
        const antCaliper = new Graphics();
        antCaliper.rect(ant1X - 18.4, ant1Y - 22, 36.8, 22);
        antCaliper.stroke({ color: 0x38bdf8, width: 1, alpha: 0.8 });
        worldContainer.addChild(antCaliper);

        const antLabel = new Text({
          text: '🐜 Kiến thợ V2 (36.8px)',
          style: new TextStyle({ fill: '#38bdf8', fontSize: 9, fontFamily: 'monospace', fontWeight: 'bold' }),
        });
        antLabel.position.set(ant1X - 30, ant1Y - 36);
        worldContainer.addChild(antLabel);

        const livingAntLabel = new Text({
          text: '🐜 1. Đường hầm hẹp ➔ 2. Buồng sinh hoạt',
          style: new TextStyle({ fill: '#f59e0b', fontSize: 9, fontFamily: 'monospace', fontWeight: 'bold' }),
        });
        livingAntLabel.position.set(290, 310);
        worldContainer.addChild(livingAntLabel);

        const queenAntLabel = new Text({
          text: '👑 3. Buồng Kiến Chúa Rộng (Royal Chamber)',
          style: new TextStyle({ fill: '#fbbf24', fontSize: 10, fontFamily: 'monospace', fontWeight: 'bold' }),
        });
        queenAntLabel.position.set(530, 430);
        worldContainer.addChild(queenAntLabel);
      }

      // ====================================================================
      // 6. ANIMATION & TELEMETRY TICKER
      // ====================================================================
      let time = 0;
      let lastFrameTime = performance.now();
      let frames = 0;
      let fpsCalcTimer = 0;

      tickerFn = () => {
        const now = performance.now();
        const dt = (now - lastFrameTime) / 1000;
        lastFrameTime = now;
        frames++;
        fpsCalcTimer += dt;
        if (fpsCalcTimer >= 0.5) {
          setTelemetry((t) => ({ ...t, fps: Math.round(frames / fpsCalcTimer) }));
          frames = 0;
          fpsCalcTimer = 0;
        }

        time += dt;

        // Natural sway
        if (canopyContainerRef.current && enableSway) {
          canopyContainerRef.current.rotation = Math.sin(time * 1.8) * 0.022 + Math.cos(time * 0.7) * 0.01;
        }
        if (boughSpriteRef.current && enableSway) {
          boughSpriteRef.current.rotation = Math.sin(time * 1.4) * 0.006;
        }

        // Parallax update
        if (skyContainerRef.current && enableParallax) {
          skyContainerRef.current.x = -cameraPos.x * 0.12;
          skyContainerRef.current.y = -cameraPos.y * 0.08;
        }
      };

      pixiApp.ticker.add(tickerFn);
    };

    init();

    return () => {
      active = false;
      if (pixiApp) {
        if (tickerFn) pixiApp.ticker.remove(tickerFn);
        try {
          pixiApp.destroy(true);
        } catch (e) {
          // ignore
        }
        appRef.current = null;
      }
    };
  }, [bgStyle, enableSway, enableParallax]);

  // Sync Camera position and Zoom to World Container
  useEffect(() => {
    if (worldContainerRef.current) {
      worldContainerRef.current.scale.set(zoomLevel);
      worldContainerRef.current.x = window.innerWidth * 0.5 + cameraPos.x;
      worldContainerRef.current.y = window.innerHeight * 0.56 + cameraPos.y;
    }
    setTelemetry((t) => ({
      ...t,
      camX: Math.round(cameraPos.x),
      camY: Math.round(cameraPos.y),
      zoom: zoomLevel,
      antScreenSize: `${(36.8 * zoomLevel).toFixed(1)} × ${(20.0 * zoomLevel).toFixed(1)} px`,
    }));
  }, [cameraPos, zoomLevel]);

  // Sync Wireframe toggle
  useEffect(() => {
    if (terrainRendererRef.current) {
      terrainRendererRef.current.rebuildTerrainMesh(showWireframe);
    }
  }, [showWireframe]);

  // Mouse interaction: Camera Pan vs Dig / Fill Brush
  const handleMouseDown = (e: React.MouseEvent) => {
    isMouseDownRef.current = true;
    if (activeBrush === 'NONE') {
      isDraggingRef.current = true;
      dragStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        camStartX: cameraPos.x,
        camStartY: cameraPos.y,
      };
    } else {
      applyBrushAtScreen(e.clientX, e.clientY);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isMouseDownRef.current) return;
    if (activeBrush === 'NONE' && isDraggingRef.current) {
      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;
      setCameraPos({
        x: dragStartRef.current.camStartX + dx,
        y: dragStartRef.current.camStartY + dy,
      });
    } else if (activeBrush !== 'NONE') {
      applyBrushAtScreen(e.clientX, e.clientY);
    }
  };

  const handleMouseUp = () => {
    isMouseDownRef.current = false;
    isDraggingRef.current = false;
  };

  // Convert Screen coordinates to World coordinates and apply Dig/Fill
  const applyBrushAtScreen = (screenX: number, screenY: number) => {
    const originWX = window.innerWidth * 0.5 + cameraPos.x;
    const originWY = window.innerHeight * 0.56 + cameraPos.y;
    const worldX = (screenX - originWX) / zoomLevel;
    const worldY = (screenY - originWY) / zoomLevel;

    const data = terrainDataRef.current;
    if (activeBrush === 'DIG') {
      data.digRadius(worldX, worldY, 28);
      if (terrainRendererRef.current) terrainRendererRef.current.rebuildTerrainMesh(showWireframe);
      setTelemetry((t) => ({ ...t, brushState: `⛏️ Đào hầm tại (${Math.round(worldX)}, ${Math.round(worldY)})` }));
    } else if (activeBrush === 'FILL') {
      data.fillRadius(worldX, worldY, 28);
      if (terrainRendererRef.current) terrainRendererRef.current.rebuildTerrainMesh(showWireframe);
      setTelemetry((t) => ({ ...t, brushState: `🧱 Lấp đất tại (${Math.round(worldX)}, ${Math.round(worldY)})` }));
    }
  };

  return (
    <div
      className={`relative w-screen h-screen overflow-hidden bg-neutral-950 font-sans select-none ${
        activeBrush === 'NONE' ? 'cursor-grab active:cursor-grabbing' : 'cursor-crosshair'
      }`}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {/* Top Header Navigation */}
      <header className="fixed top-3 left-4 right-4 z-40 flex items-center justify-between pointer-events-none">
        {/* Brand Badge */}
        <div className="flex items-center gap-3 bg-neutral-900/95 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10 shadow-2xl pointer-events-auto">
          <div className="w-8 h-8 rounded-xl bg-amber-600 flex items-center justify-center text-white font-black text-sm shadow-lg shadow-amber-600/30">
            ⛏️
          </div>
          <div>
            <h1 className="text-xs font-black tracking-widest text-amber-100 uppercase">
              The Vivarium — Organic Terrain Foundation (Task-013)
            </h1>
            <p className="text-[10px] text-amber-400 font-medium">
              Địa Hình Hữu Cơ Uốn Lượn + Hầm Hang Cong + Bút Đào/Lấp Thử Nghiệm
            </p>
          </div>
        </div>

        {/* Camera Quick Presets */}
        <div className="flex items-center gap-2 bg-neutral-900/95 backdrop-blur-md p-1.5 rounded-2xl border border-white/10 shadow-2xl pointer-events-auto text-xs font-bold font-mono">
          <span className="text-[10px] text-neutral-400 px-2">GÓC NHÌN:</span>
          <button
            onClick={() => {
              setZoomLevel(1.0);
              setCameraPos({ x: 0, y: 0 });
            }}
            className="px-2.5 py-1 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all"
          >
            🌐 Toàn Cảnh (1x)
          </button>
          <button
            onClick={() => {
              setZoomLevel(1.6);
              setCameraPos({ x: -450, y: -260 });
            }}
            className="px-2.5 py-1 rounded-xl bg-white/10 hover:bg-white/20 text-amber-300 transition-all"
          >
            🕳️ Hang & Buồng (1.6x)
          </button>
          <button
            onClick={() => {
              setZoomLevel(1.8);
              setCameraPos({ x: -480, y: -260 });
            }}
            className="px-2.5 py-1 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/30 transition-all"
          >
            🧪 Test Dig/Fill (Task-014)
          </button>
          <button
            onClick={() => {
              setZoomLevel(2.0);
              setCameraPos({ x: -20, y: 120 });
            }}
            className="px-2.5 py-1 rounded-xl bg-white/10 hover:bg-white/20 text-emerald-300 transition-all"
          >
            🌱 Gốc & Mặt Đất (2x)
          </button>
          <button
            onClick={() => {
              setZoomLevel(2.0);
              setCameraPos({ x: -750, y: -450 });
            }}
            className="px-2.5 py-1 rounded-xl bg-amber-500/25 hover:bg-amber-500/40 text-amber-300 border border-amber-500/30 transition-all"
          >
            👑 Buồng Chúa (2x)
          </button>
          <button
            onClick={() => {
              setZoomLevel(4.0);
              setCameraPos({ x: -140, y: 640 });
            }}
            className="px-2.5 py-1 rounded-xl bg-white/10 hover:bg-white/20 text-sky-300 transition-all"
          >
            🪵 Thân Cây (4x)
          </button>
          <button
            onClick={() => {
              setZoomLevel(3.2);
              setCameraPos({ x: -1280, y: -720 });
            }}
            className="px-2.5 py-1 rounded-xl bg-amber-600/30 hover:bg-amber-600/50 text-amber-300 border border-amber-500/40 transition-all"
          >
            🔍 Vách Hang (3.2x)
          </button>
        </div>

        {/* Back Link */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <a
            href="/?mode=preview"
            className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all border border-white/10"
          >
            🔬 Asset Preview
          </a>
          <a
            href="/"
            className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-lg shadow-emerald-600/30"
          >
            🎮 Về Game
          </a>
        </div>
      </header>

      {/* Main Canvas */}
      <div ref={containerRef} className="w-full h-full" />

      {/* Bottom Floating Control Bar */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 bg-neutral-900/95 backdrop-blur-md px-5 py-2.5 rounded-2xl border border-white/10 shadow-2xl">
        {/* Interactive Dig / Fill Brushes */}
        <div className="flex items-center gap-1.5 border-r border-white/10 pr-3 text-xs font-mono">
          <span className="text-[11px] text-neutral-400 font-bold mr-1">THAO TÁC:</span>
          <button
            onClick={() => setActiveBrush('NONE')}
            className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
              activeBrush === 'NONE' ? 'bg-neutral-700 text-white shadow-md' : 'text-neutral-400 hover:text-white'
            }`}
          >
            🖐️ Pan Camera
          </button>
          <button
            onClick={() => setActiveBrush('DIG')}
            className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
              activeBrush === 'DIG' ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30' : 'text-neutral-400 hover:text-white'
            }`}
          >
            ⛏️ Đào Đất
          </button>
          <button
            onClick={() => setActiveBrush('FILL')}
            className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
              activeBrush === 'FILL' ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30' : 'text-neutral-400 hover:text-white'
            }`}
          >
            🧱 Lấp Đất
          </button>
        </div>

        {/* Zoom Buttons */}
        <div className="flex items-center gap-1.5 border-r border-white/10 pr-3">
          <span className="text-[11px] font-mono text-neutral-400 font-bold">ZOOM:</span>
          {([0.5, 1.0, 2.0, 4.0] as const).map((z) => (
            <button
              key={z}
              onClick={() => setZoomLevel(z)}
              className={`px-2 py-1 rounded-lg text-xs font-mono font-bold transition-all ${
                zoomLevel === z
                  ? 'bg-amber-600 text-white shadow-md'
                  : 'text-neutral-400 hover:text-white hover:bg-white/10'
              }`}
            >
              {z}x
            </button>
          ))}
        </div>

        {/* Background Selector */}
        <div className="flex items-center gap-1 border-r border-white/10 pr-3 text-xs">
          <span className="text-[11px] font-mono text-neutral-400 font-bold mr-1">NỀN:</span>
          {(
            [
              ['GRADIENT_SKY', 'Bầu Trời'],
              ['DARK_SOIL', 'Đất Tối'],
              ['HIGH_CONTRAST_WHITE', 'Trắng Sáng'],
              ['CHECKER', 'Caro'],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setBgStyle(key)}
              className={`px-2 py-1 rounded-lg text-xs font-bold transition-all ${
                bgStyle === key
                  ? 'bg-amber-600 text-white font-bold'
                  : 'text-neutral-400 hover:text-white hover:bg-white/10'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Grid & Motion Toggles */}
        <div className="flex items-center gap-1.5 text-xs font-mono">
          <button
            onClick={() => setShowWireframe((v) => !v)}
            className={`px-2 py-1 rounded-lg font-bold transition-all ${
              showWireframe ? 'bg-sky-950 text-sky-300 border border-sky-600/50' : 'text-neutral-500'
            }`}
          >
            📐 Grid 32px: {showWireframe ? 'HIỆN' : 'ẨN'}
          </button>
          <button
            onClick={() => setEnableSway((v) => !v)}
            className={`px-2 py-1 rounded-lg font-bold transition-all ${
              enableSway ? 'bg-emerald-950 text-emerald-300 border border-emerald-600/50' : 'text-neutral-500'
            }`}
          >
            🍃 Sway
          </button>
          <button
            onClick={() => setEnableParallax((v) => !v)}
            className={`px-2 py-1 rounded-lg font-bold transition-all ${
              enableParallax ? 'bg-purple-950 text-purple-300 border border-purple-600/50' : 'text-neutral-500'
            }`}
          >
            🌌 Parallax
          </button>
        </div>
      </div>

      {/* Left Diagnostic Card */}
      <div className="fixed top-20 left-4 z-30 w-88 bg-neutral-900/90 backdrop-blur-md p-4 rounded-2xl border border-white/10 shadow-2xl text-xs text-neutral-300">
        <h3 className="font-bold text-amber-200 mb-2 flex items-center justify-between">
          <span>TASK-015 CAVE VISUAL POLISH</span>
          <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/50 font-mono font-bold">
            {telemetry.fps} FPS
          </span>
        </h3>

        <div className="space-y-3 font-mono text-[11px]">
          <div className="p-3 rounded-xl bg-black/50 border border-white/5 space-y-2">
            <div className="flex justify-between items-center text-amber-400 font-bold">
              <span>MẶT CẮT HANG HỮU CƠ 2D</span>
              <span className="text-emerald-400">{telemetry.zoom}× Zoom</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[10px] pt-1 border-t border-white/10">
              <div>
                <span className="text-neutral-500 block">Tọa độ Camera:</span>
                <span className="text-white font-bold">X:{telemetry.camX} | Y:{telemetry.camY}</span>
              </div>
              <div>
                <span className="text-neutral-500 block">FPS Thực Đo:</span>
                <span className="text-emerald-400 font-bold text-xs">{telemetry.fps} FPS</span>
              </div>
              <div>
                <span className="text-neutral-500 block">Đất Đặc (Solid):</span>
                <span className="text-emerald-300 font-bold">{terrainDataRef.current.getSolidCount()} cells</span>
              </div>
              <div>
                <span className="text-neutral-500 block">Lòng Hang (Void):</span>
                <span className="text-sky-300 font-bold">{terrainDataRef.current.getExcavatedCount()} cells</span>
              </div>
            </div>
            <div className="pt-1 border-t border-white/5 text-[10px] text-neutral-400">
              Trạng thái: <span className="text-amber-300 font-bold">{telemetry.brushState}</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-black/50 border border-white/5 space-y-1.5 text-[10px]">
            <div className="font-bold text-amber-300">TIÊU CHUẨN VISUAL POLISH TASK-015:</div>
            <div className="text-neutral-300">• <span className="text-emerald-400 font-bold">8px Sub-Grid Marching:</span> Khử hoàn toàn bậc thang 32px, viền uốn lượn hữu cơ mềm mại.</div>
            <div className="text-neutral-300">• <span className="text-emerald-400 font-bold">Soft Cutaway Shading:</span> Giảm tương phản, bóng tiếp xúc umber tự nhiên `#2e1a10`, không giống ống có viền.</div>
            <div className="text-neutral-300">• <span className="text-emerald-400 font-bold">3 Không Gian Liên Tục:</span> (1) Hầm vận chuyển hẹp ➔ (2) Buồng sinh hoạt ➔ (3) Buồng kiến chúa rộng.</div>
            <div className="text-neutral-300">• <span className="text-emerald-400 font-bold">Tỷ Lệ Sinh Học:</span> Kiến đứng vững trên sàn lòng hang, chiều cao hầm vừa vặn với sải chân kiến.</div>
          </div>
        </div>
      </div>
    </div>
  );
};
