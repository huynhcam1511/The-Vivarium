import React, { useEffect, useRef, useState } from 'react';
import { Application, Container, Graphics, Sprite, Assets } from 'pixi.js';
import { OrganicTerrainData } from '../engine/OrganicTerrainData';
import { OrganicTerrainRenderer } from '../engine/OrganicTerrainRenderer';

export const OakUnifiedV5QAScene: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<Application | null>(null);

  // View state
  const [activeVersion] = useState<'V5' | 'V4' | 'V2' | 'COMPARE_ALL'>('V5');
  const [bgStyle] = useState<'STRATIFIED_CAVE' | 'WHITE' | 'DARK_SOIL' | 'CHECKER'>('STRATIFIED_CAVE');
  const [zoomLevel, setZoomLevel] = useState<number>(1.0);
  const [cameraPos, setCameraPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // V5 Groundline Alignment: Anchor Y = 0.55 (~924px flare point)
  const [v5AnchorY] = useState<number>(0.55);

  // Digging & Layering Simulation State
  const [testAction, setTestAction] = useState<'INITIAL' | 'DUG' | 'FILLED'>('INITIAL');
  const [renderMode, setRenderMode] = useState<'NAIVE_SPRITE' | 'DUAL_PASS_SANDWICH'>('DUAL_PASS_SANDWICH');

  // Telemetry metrics
  const [telemetry, setTelemetry] = useState<{
    solidCount: number;
    excavatedCount: number;
    deltaCells: number;
    actionLabel: string;
  }>({
    solidCount: 2315,
    excavatedCount: 85,
    deltaCells: 0,
    actionLabel: 'INITIAL (Địa hình nguyên bản)',
  });

  // Stage containers
  const worldContainerRef = useRef<Container | null>(null);
  const bgContainerRef = useRef<Container | null>(null);
  const subterraneanCavityGroupRef = useRef<Container | null>(null);
  const rootBackGroupRef = useRef<Container | null>(null);
  const terrainRendererRef = useRef<OrganicTerrainRenderer | null>(null);
  const trunkFrontGroupRef = useRef<Container | null>(null);
  const antContainerRef = useRef<Container | null>(null);
  const diffHighlightGraphicsRef = useRef<Graphics | null>(null);

  const terrainDataRef = useRef<OrganicTerrainData>(new OrganicTerrainData());

  // Cached textures
  const texturesRef = useRef<{
    unifiedV5: any;
    trunkV4: any;
    rootV4: any;
    trunkV2: any;
    rootV2: any;
    soil: any;
    ant: any;
  } | null>(null);

  // Dragging camera state
  const isMouseDownRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0, camStartX: 0, camStartY: 0 });

  useEffect(() => {
    let active = true;
    let pixiApp: Application | null = null;

    const init = async () => {
      if (!containerRef.current) return;
      while (containerRef.current.firstChild) {
        containerRef.current.removeChild(containerRef.current.firstChild);
      }

      pixiApp = new Application();
      await pixiApp.init({
        width: window.innerWidth,
        height: window.innerHeight,
        backgroundColor: 0x0a1017,
        resolution: window.devicePixelRatio || 1,
        autoDensity: true,
        antialias: true,
      });

      if (!active) return;
      containerRef.current.appendChild(pixiApp.canvas);
      appRef.current = pixiApp;

      // 1. BG Layer
      const bgContainer = new Container();
      pixiApp.stage.addChild(bgContainer);
      bgContainerRef.current = bgContainer;

      // 2. World Container
      const worldContainer = new Container();
      worldContainer.position.set(window.innerWidth * 0.5, window.innerHeight * 0.56);
      pixiApp.stage.addChild(worldContainer);
      worldContainerRef.current = worldContainer;

      // Load Assets
      try {
        const [texV5, texTrunkV4, texRootV4, texTrunkV2, texRootV2, texSoil, texAnt] = await Promise.all([
          Assets.load('/assets/qa_temp_v5/env_tree_ancient_unified_v5.png'),
          Assets.load('/assets/qa_temp_v4/env_tree_ancient_trunk_base_v4.png'),
          Assets.load('/assets/qa_temp_v4/env_tree_root_deep_cluster_v4.png'),
          Assets.load('/assets/source/env_tree_ancient_trunk_base_v2.png'),
          Assets.load('/assets/source/env_tree_root_deep_cluster_v2.png'),
          Assets.load('/assets/terrain/terrain_soil_dark_loam_v2.png'),
          Assets.load('/assets/source/char_ant_worker_idle_v2.png'),
        ]);

        texturesRef.current = {
          unifiedV5: texV5,
          trunkV4: texTrunkV4,
          rootV4: texRootV4,
          trunkV2: texTrunkV2,
          rootV2: texRootV2,
          soil: texSoil,
          ant: texAnt,
        };
      } catch (e) {
        console.warn('Asset loading QA error:', e);
      }

      // Layer 1: Subterranean Cavity Group (Cavities & Bedrock)
      const subCavityGroup = new Container();
      worldContainer.addChild(subCavityGroup);
      subterraneanCavityGroupRef.current = subCavityGroup;

      // Layer 2: Root Back Group (V5 Root Pass: Z 35 - in front of cavity, behind solid soil)
      const rootBackGroup = new Container();
      worldContainer.addChild(rootBackGroup);
      rootBackGroupRef.current = rootBackGroup;

      // Layer 3: Terrain Soil Mesh (OrganicTerrainRenderer - solid soil blocks & contours)
      const terrainData = terrainDataRef.current;
      const terrainRenderer = new OrganicTerrainRenderer(terrainData);
      terrainRendererRef.current = terrainRenderer;
      worldContainer.addChild(terrainRenderer.container);

      if (texturesRef.current?.soil) {
        terrainRenderer.setSoilTexture(texturesRef.current.soil);
      }
      terrainRenderer.rebuildTerrainMesh(false);

      // Layer 4: Trunk Front Group (V5 Trunk & Buttress Pass: Z 45 - above ground)
      const trunkFrontGroup = new Container();
      worldContainer.addChild(trunkFrontGroup);
      trunkFrontGroupRef.current = trunkFrontGroup;

      // Layer 5: Ant Container (Z 55 - entities moving inside tunnels & surface)
      const antContainer = new Container();
      worldContainer.addChild(antContainer);
      antContainerRef.current = antContainer;

      // Layer 6: Diff Highlight Overlay (For QA verification)
      const diffG = new Graphics();
      worldContainer.addChild(diffG);
      diffHighlightGraphicsRef.current = diffG;

      updateScene();
    };

    init();

    return () => {
      active = false;
      if (pixiApp) {
        try {
          pixiApp.destroy(true);
        } catch (e) {
          // ignore
        }
        appRef.current = null;
      }
    };
  }, []);

  const updateScene = () => {
    const W = window.innerWidth;
    const H = window.innerHeight;

    // 1. Draw Background
    if (bgContainerRef.current) {
      bgContainerRef.current.removeChildren();
      const g = new Graphics();
      if (bgStyle === 'WHITE') {
        g.rect(0, 0, W, H).fill({ color: 0xffffff });
      } else if (bgStyle === 'DARK_SOIL') {
        g.rect(0, 0, W, H).fill({ color: 0x150d08 });
      } else if (bgStyle === 'CHECKER') {
        const sz = 24;
        for (let y = 0; y < H; y += sz) {
          for (let x = 0; x < W; x += sz) {
            const isDark = ((x / sz) + (y / sz)) % 2 === 0;
            g.rect(x, y, sz, sz).fill({ color: isDark ? 0x222222 : 0x333333 });
          }
        }
      } else {
        // STRATIFIED_CAVE
        g.rect(0, 0, W, H * 0.45).fill({ color: 0x68859e });
        g.rect(0, H * 0.45, W, H * 0.55).fill({ color: 0x1a110b });
      }
      bgContainerRef.current.addChild(g);
    }

    // 2. Terrain Visibility & Mesh Rebuild
    const terrainData = terrainDataRef.current;
    if (terrainRendererRef.current) {
      terrainRendererRef.current.container.visible = (bgStyle === 'STRATIFIED_CAVE');
      terrainRendererRef.current.rebuildTerrainMesh(false);
    }

    // 3. Render Tree Groups (Dual-Pass vs Naive)
    if (texturesRef.current) {
      if (rootBackGroupRef.current) rootBackGroupRef.current.removeChildren();
      if (trunkFrontGroupRef.current) trunkFrontGroupRef.current.removeChildren();
      if (antContainerRef.current) antContainerRef.current.removeChildren();

      const { unifiedV5, trunkV4, rootV4, trunkV2, rootV2, ant } = texturesRef.current;
      const trunkGroundY = terrainData.getSurfaceY(0);

      if (activeVersion === 'V5') {
        if (unifiedV5) {
          if (renderMode === 'DUAL_PASS_SANDWICH' && bgStyle === 'STRATIFIED_CAVE') {
            // === PASS 1: ROOT SYSTEM (Z: 35) ===
            // Placed behind Solid Soil, in front of Cavity
            const rootSpr = new Sprite(unifiedV5);
            rootSpr.anchor.set(0.5, v5AnchorY);
            rootSpr.scale.set(0.5);
            rootSpr.position.set(0, trunkGroundY);

            // Clip mask for roots: Only show below surface level (Y >= trunkGroundY - 8)
            const rootMask = new Graphics();
            rootMask.rect(-600, trunkGroundY - 8, 1200, 1000).fill({ color: 0xffffff });
            rootSpr.mask = rootMask;
            rootSpr.addChild(rootMask);
            rootBackGroupRef.current?.addChild(rootSpr);

            // === PASS 2: TRUNK & BUTTRESS (Z: 45) ===
            // Placed in front of Solid Soil, on top of groundline
            const trunkSpr = new Sprite(unifiedV5);
            trunkSpr.anchor.set(0.5, v5AnchorY);
            trunkSpr.scale.set(0.5);
            trunkSpr.position.set(0, trunkGroundY);

            // Clip mask for trunk: Only show above surface level (Y <= trunkGroundY + 12)
            const trunkMask = new Graphics();
            trunkMask.rect(-600, trunkGroundY - 900, 1200, 912).fill({ color: 0xffffff });
            trunkSpr.mask = trunkMask;
            trunkSpr.addChild(trunkMask);
            trunkFrontGroupRef.current?.addChild(trunkSpr);
          } else {
            // NAIVE MODE or NON-CAVE BG: Single sprite on front
            const fullSpr = new Sprite(unifiedV5);
            fullSpr.anchor.set(0.5, v5AnchorY);
            fullSpr.scale.set(0.5);
            fullSpr.position.set(0, trunkGroundY);
            trunkFrontGroupRef.current?.addChild(fullSpr);
          }
        }
      } else if (activeVersion === 'V4' || activeVersion === 'V2') {
        const texR = activeVersion === 'V4' ? rootV4 : rootV2;
        const texT = activeVersion === 'V4' ? trunkV4 : trunkV2;

        if (texR) {
          const rootSpr = new Sprite(texR);
          rootSpr.anchor.set(0.5, 0.0);
          rootSpr.scale.set(0.5);
          const rY = activeVersion === 'V4' ? (trunkGroundY - 22) : (trunkGroundY - 4);
          rootSpr.position.set(0, rY);
          rootBackGroupRef.current?.addChild(rootSpr);
        }

        if (texT) {
          const trunkSpr = new Sprite(texT);
          trunkSpr.anchor.set(0.5, 1.0);
          trunkSpr.scale.set(0.5);
          trunkSpr.position.set(0, trunkGroundY);
          trunkFrontGroupRef.current?.addChild(trunkSpr);
        }
      } else {
        // COMPARE_ALL: Side by side
        const addSubTree = (ver: 'V2' | 'V4' | 'V5', offX: number) => {
          if (ver === 'V5' && unifiedV5) {
            const spr = new Sprite(unifiedV5);
            spr.anchor.set(0.5, v5AnchorY);
            spr.scale.set(0.5);
            spr.position.set(offX, trunkGroundY);
            trunkFrontGroupRef.current?.addChild(spr);
          } else {
            const texR = ver === 'V4' ? rootV4 : rootV2;
            const texT = ver === 'V4' ? trunkV4 : trunkV2;
            if (texR) {
              const rSpr = new Sprite(texR);
              rSpr.anchor.set(0.5, 0.0);
              rSpr.scale.set(0.5);
              rSpr.position.set(offX, ver === 'V4' ? trunkGroundY - 22 : trunkGroundY - 4);
              rootBackGroupRef.current?.addChild(rSpr);
            }
            if (texT) {
              const tSpr = new Sprite(texT);
              tSpr.anchor.set(0.5, 1.0);
              tSpr.scale.set(0.5);
              tSpr.position.set(offX, trunkGroundY);
              trunkFrontGroupRef.current?.addChild(tSpr);
            }
          }
        };
        addSubTree('V2', -380);
        addSubTree('V4', 0);
        addSubTree('V5', 380);
      }

      // Add Worker Ants
      if (ant && antContainerRef.current && bgStyle === 'STRATIFIED_CAVE') {
        const ant1 = new Sprite(ant);
        ant1.anchor.set(0.5, 0.95);
        ant1.scale.set(0.4);
        ant1.position.set(activeVersion === 'COMPARE_ALL' ? 440 : 60, trunkGroundY - 2);
        antContainerRef.current.addChild(ant1);

        const ant2 = new Sprite(ant);
        ant2.anchor.set(0.5, 0.95);
        ant2.scale.set(0.4);
        ant2.position.set(activeVersion === 'COMPARE_ALL' ? 380 : 0, trunkGroundY + 160);
        antContainerRef.current.addChild(ant2);

        const ant3 = new Sprite(ant);
        ant3.anchor.set(0.5, 0.95);
        ant3.scale.set(0.4);
        ant3.position.set(activeVersion === 'COMPARE_ALL' ? 480 : 100, trunkGroundY + 220);
        antContainerRef.current.addChild(ant3);
      }
    }
  };

  useEffect(() => {
    updateScene();
  }, [activeVersion, bgStyle, testAction, renderMode]);

  // Sync Camera position & Zoom
  useEffect(() => {
    if (worldContainerRef.current) {
      worldContainerRef.current.scale.set(zoomLevel);
      worldContainerRef.current.x = window.innerWidth * 0.5 + cameraPos.x;
      worldContainerRef.current.y = window.innerHeight * 0.56 + cameraPos.y;
    }
  }, [cameraPos, zoomLevel]);

  // Mouse pan interaction
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) {
      isMouseDownRef.current = true;
      dragStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        camStartX: cameraPos.x,
        camStartY: cameraPos.y,
      };
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isMouseDownRef.current) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    setCameraPos({
      x: dragStartRef.current.camStartX + dx,
      y: dragStartRef.current.camStartY + dy,
    });
  };

  const handleMouseUp = () => {
    isMouseDownRef.current = false;
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.15 : 0.85;
    setZoomLevel((prev) => Math.min(6.0, Math.max(0.4, prev * factor)));
  };

  // High-Impact Verified Dig / Fill Actions across Root Zone
  const handleTriggerDig = () => {
    const data = terrainDataRef.current;
    // Carve a broad transverse tunnel directly across the solid root core:
    // X = -120 to +120, Y = 160
    for (let x = -120; x <= 120; x += 16) {
      data.digRadius(x, 160, 36);
    }
    const solid = data.getSolidCount();
    const excavated = data.getExcavatedCount();
    setTelemetry({
      solidCount: solid,
      excavatedCount: excavated,
      deltaCells: 85 - excavated,
      actionLabel: 'AFTER DIG (Đã đào hầm xuyên vùng rễ)',
    });
    setTestAction('DUG');
    updateScene();
  };

  const handleTriggerFill = () => {
    const data = terrainDataRef.current;
    // Partially refill tunnel: X = -120 to -20 at Y = 160
    for (let x = -120; x <= -20; x += 16) {
      data.fillRadius(x, 160, 32);
    }
    const solid = data.getSolidCount();
    const excavated = data.getExcavatedCount();
    setTelemetry({
      solidCount: solid,
      excavatedCount: excavated,
      deltaCells: 85 - excavated,
      actionLabel: 'AFTER FILL (Đã lấp lại một nửa hầm)',
    });
    setTestAction('FILLED');
    updateScene();
  };

  const handleResetTerrain = () => {
    const data = new OrganicTerrainData();
    terrainDataRef.current = data;
    if (terrainRendererRef.current) {
      (terrainRendererRef.current as any).terrainData = data;
    }
    setTelemetry({
      solidCount: data.getSolidCount(),
      excavatedCount: data.getExcavatedCount(),
      deltaCells: 0,
      actionLabel: 'INITIAL (Địa hình nguyên bản)',
    });
    setTestAction('INITIAL');
    updateScene();
  };

  return (
    <div
      className="relative w-screen h-screen overflow-hidden select-none bg-stone-950 font-sans cursor-grab active:cursor-grabbing"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onWheel={handleWheel}
    >
      <div ref={containerRef} className="w-full h-full" />

      {/* TOP QA TELEMETRY & CONTROLS */}
      <div className="absolute top-3 left-4 right-4 flex flex-wrap items-center justify-between gap-3 bg-stone-900/90 backdrop-blur-md px-4 py-3 rounded-2xl border border-stone-700/60 shadow-2xl text-stone-200 z-50">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
            <h1 className="font-bold text-sm tracking-wide uppercase text-emerald-300">
              TASK-017 QA SCENE — V5 DIG/FILL CORRECTION
            </h1>
          </div>
          <span className="text-xs bg-stone-800 text-stone-400 px-2 py-0.5 rounded border border-stone-700">
            QA ONLY — DUAL-PASS SANDWICH ACTIVE
          </span>
        </div>

        {/* Live Occupancy Telemetry HUD */}
        <div className="flex items-center gap-3 bg-stone-950/80 px-3 py-1.5 rounded-xl border border-stone-700/80 font-mono text-xs">
          <span className="text-stone-400">Trạng thái: <strong className="text-amber-300">{telemetry.actionLabel}</strong></span>
          <span className="text-emerald-400">Solid Cells: <strong>{telemetry.solidCount}</strong></span>
          <span className="text-sky-400">Excavated: <strong>{telemetry.excavatedCount}</strong></span>
          <span className="text-amber-400">Δ Cells: <strong>{telemetry.deltaCells}</strong></span>
        </div>

        {/* Layer Mode Switcher */}
        <div className="flex items-center gap-1 bg-stone-800/80 p-1 rounded-xl border border-stone-700">
          <button
            onClick={() => setRenderMode('DUAL_PASS_SANDWICH')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
              renderMode === 'DUAL_PASS_SANDWICH'
                ? 'bg-emerald-500 text-stone-950 shadow'
                : 'text-stone-300 hover:bg-stone-700/50'
            }`}
          >
            Dual-Pass Sandwich (PASS)
          </button>
          <button
            onClick={() => setRenderMode('NAIVE_SPRITE')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
              renderMode === 'NAIVE_SPRITE'
                ? 'bg-amber-500 text-stone-950 shadow'
                : 'text-stone-300 hover:bg-stone-700/50'
            }`}
          >
            Naive Full Front (FAIL)
          </button>
        </div>

        {/* Dig / Fill Test Actions */}
        <div className="flex items-center gap-1 bg-stone-800/80 p-1 rounded-xl border border-stone-700 text-xs">
          <button
            onClick={handleTriggerDig}
            className={`px-2.5 py-1 rounded-lg transition-all ${
              testAction === 'DUG' ? 'bg-amber-500 text-stone-950 font-bold' : 'text-amber-300 hover:bg-stone-700/50'
            }`}
          >
            ⛏️ Đào Đường Hầm Rễ (-120..+120)
          </button>
          <button
            onClick={handleTriggerFill}
            className={`px-2.5 py-1 rounded-lg transition-all ${
              testAction === 'FILLED' ? 'bg-amber-500 text-stone-950 font-bold' : 'text-amber-300 hover:bg-stone-700/50'
            }`}
          >
            🧱 Lấp Lại Nửa Hầm (-120..-20)
          </button>
          <button
            onClick={handleResetTerrain}
            className="px-2 py-1 rounded-lg text-stone-400 hover:text-stone-200 transition-all"
          >
            ↺ Reset
          </button>
        </div>
      </div>

      {/* QUICK PRESET BUTTONS (BOTTOM) */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-stone-900/90 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-stone-700/60 shadow-xl z-50 text-xs">
        <button
          onClick={() => {
            setZoomLevel(1.0);
            setCameraPos({ x: 0, y: 0 });
          }}
          className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-stone-200 font-medium transition-all"
        >
          Toàn Cảnh (1×)
        </button>
        <button
          onClick={() => {
            setZoomLevel(2.0);
            setCameraPos({ x: 0, y: -200 });
          }}
          className="px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 border border-emerald-500/30 font-medium transition-all"
        >
          Mặt Đất & Rễ Ngầm (2×)
        </button>
        <button
          onClick={() => {
            setZoomLevel(2.0);
            setCameraPos({ x: 0, y: -260 });
          }}
          className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/30 font-medium transition-all"
        >
          Kiểm Tra Hang Rễ (2×)
        </button>
        <button
          onClick={() => {
            setZoomLevel(4.0);
            setCameraPos({ x: 0, y: 0 });
          }}
          className="px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border border-rose-500/30 font-medium transition-all"
        >
          Chi Tiết Cổ Rễ (4×)
        </button>
      </div>
    </div>
  );
};
