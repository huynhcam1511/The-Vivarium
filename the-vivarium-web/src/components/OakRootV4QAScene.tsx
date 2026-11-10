import React, { useEffect, useRef, useState } from 'react';
import { Application, Container, Graphics, Sprite, Assets } from 'pixi.js';
import { OrganicTerrainData } from '../engine/OrganicTerrainData';
import { OrganicTerrainRenderer } from '../engine/OrganicTerrainRenderer';

export const OakRootV4QAScene: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<Application | null>(null);

  // View state
  const [activeVersion, setActiveVersion] = useState<'V4' | 'V2' | 'SPLIT_SIDE_BY_SIDE'>('V4');
  const [bgStyle, setBgStyle] = useState<'WHITE' | 'DARK_SOIL' | 'STRATIFIED_CAVE' | 'CHECKER'>('STRATIFIED_CAVE');
  const [zoomLevel, setZoomLevel] = useState<number>(1.0);
  const [cameraPos, setCameraPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Overlap micro-adjustment (Director Task-017 parameters)
  const [overlapY, setOverlapY] = useState<number>(22); // World units overlap

  // Stage containers
  const worldContainerRef = useRef<Container | null>(null);
  const bgContainerRef = useRef<Container | null>(null);
  const treeContainerRef = useRef<Container | null>(null);
  const terrainRendererRef = useRef<OrganicTerrainRenderer | null>(null);
  const terrainDataRef = useRef<OrganicTerrainData>(new OrganicTerrainData());

  // Cached textures
  const texturesRef = useRef<{
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

  // Initialize Pixi Application ONCE
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
        const [texTrunkV4, texRootV4, texTrunkV2, texRootV2, texSoil, texAnt] = await Promise.all([
          Assets.load('/assets/qa_temp_v4/env_tree_ancient_trunk_base_v4.png'),
          Assets.load('/assets/qa_temp_v4/env_tree_root_deep_cluster_v4.png'),
          Assets.load('/assets/source/env_tree_ancient_trunk_base_v2.png'),
          Assets.load('/assets/source/env_tree_root_deep_cluster_v2.png'),
          Assets.load('/assets/terrain/terrain_soil_dark_loam_v2.png'),
          Assets.load('/assets/source/char_ant_worker_idle_v2.png'),
        ]);

        texturesRef.current = {
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

      // Terrain
      const terrainData = terrainDataRef.current;
      const terrainRenderer = new OrganicTerrainRenderer(terrainData);
      terrainRendererRef.current = terrainRenderer;
      worldContainer.addChild(terrainRenderer.container);

      if (texturesRef.current?.soil) {
        terrainRenderer.setSoilTexture(texturesRef.current.soil);
      }
      terrainRenderer.rebuildTerrainMesh(false);

      // Tree container
      const treeContainer = new Container();
      worldContainer.addChild(treeContainer);
      treeContainerRef.current = treeContainer;

      // Re-render visual scene
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

  // Update Scene when activeVersion, bgStyle, or overlapY changes
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

    // 2. Terrain visibility
    if (terrainRendererRef.current) {
      terrainRendererRef.current.container.visible = (bgStyle === 'STRATIFIED_CAVE');
    }

    // 3. Build Trees
    if (treeContainerRef.current && texturesRef.current) {
      treeContainerRef.current.removeChildren();
      const { trunkV4, rootV4, trunkV2, rootV2, ant } = texturesRef.current;
      const terrainData = terrainDataRef.current;
      const trunkGroundY = terrainData.getSurfaceY(0);

      const buildTree = (ver: 'V4' | 'V2', offsetX: number) => {
        const sub = new Container();
        sub.position.set(offsetX, 0);

        const texR = ver === 'V4' ? rootV4 : rootV2;
        const texT = ver === 'V4' ? trunkV4 : trunkV2;

        // Roots (Behind Trunk)
        if (texR) {
          const rootSpr = new Sprite(texR);
          rootSpr.anchor.set(0.5, 0.0);
          rootSpr.scale.set(0.5); // strictly 0.5 uniform
          const rY = ver === 'V4' ? (trunkGroundY - overlapY) : (trunkGroundY - 4);
          rootSpr.position.set(0, rY);
          sub.addChild(rootSpr);
        }

        // Trunk
        if (texT) {
          const trunkSpr = new Sprite(texT);
          trunkSpr.anchor.set(0.5, 1.0);
          trunkSpr.scale.set(0.5); // strictly 0.5 uniform
          trunkSpr.position.set(0, trunkGroundY);
          sub.addChild(trunkSpr);
        }

        return sub;
      };

      if (activeVersion === 'V4') {
        treeContainerRef.current.addChild(buildTree('V4', 0));
      } else if (activeVersion === 'V2') {
        treeContainerRef.current.addChild(buildTree('V2', 0));
      } else {
        // SIDE BY SIDE
        treeContainerRef.current.addChild(buildTree('V2', -240));
        treeContainerRef.current.addChild(buildTree('V4', 240));
      }

      // Add Worker Ant scale probe in stratified cave
      if (ant && bgStyle === 'STRATIFIED_CAVE') {
        const antSpr = new Sprite(ant);
        antSpr.anchor.set(0.5, 0.95);
        antSpr.scale.set(0.4);
        antSpr.position.set(activeVersion === 'V4' ? 90 : 0, trunkGroundY + 140);
        treeContainerRef.current.addChild(antSpr);
      }
    }
  };

  useEffect(() => {
    updateScene();
  }, [activeVersion, bgStyle, overlapY]);

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
            <span className="w-3 h-3 rounded-full bg-amber-400 animate-pulse" />
            <h1 className="font-bold text-sm tracking-wide uppercase text-amber-300">
              TASK-017 QA SCENE — OAK ROOT V4 INSPECTION
            </h1>
          </div>
          <span className="text-xs bg-stone-800 text-stone-400 px-2 py-0.5 rounded border border-stone-700">
            INSPECTION ONLY — NO INTEGRATION
          </span>
        </div>

        {/* Version Switcher */}
        <div className="flex items-center gap-1 bg-stone-800/80 p-1 rounded-xl border border-stone-700">
          <button
            onClick={() => setActiveVersion('V4')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
              activeVersion === 'V4'
                ? 'bg-amber-500 text-stone-950 shadow'
                : 'text-stone-300 hover:bg-stone-700/50'
            }`}
          >
            V4 Candidate
          </button>
          <button
            onClick={() => setActiveVersion('V2')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
              activeVersion === 'V2'
                ? 'bg-amber-500 text-stone-950 shadow'
                : 'text-stone-300 hover:bg-stone-700/50'
            }`}
          >
            V2 Benchmark
          </button>
          <button
            onClick={() => setActiveVersion('SPLIT_SIDE_BY_SIDE')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
              activeVersion === 'SPLIT_SIDE_BY_SIDE'
                ? 'bg-amber-500 text-stone-950 shadow'
                : 'text-stone-300 hover:bg-stone-700/50'
            }`}
          >
            V2 vs V4 So Sánh
          </button>
        </div>

        {/* Background mode */}
        <div className="flex items-center gap-1 bg-stone-800/80 p-1 rounded-xl border border-stone-700">
          <button
            onClick={() => setBgStyle('STRATIFIED_CAVE')}
            className={`px-2.5 py-1 rounded-lg text-xs transition-all ${
              bgStyle === 'STRATIFIED_CAVE' ? 'bg-amber-500/30 text-amber-200 border border-amber-500/50' : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            Địa Tầng & Hang
          </button>
          <button
            onClick={() => setBgStyle('WHITE')}
            className={`px-2.5 py-1 rounded-lg text-xs transition-all ${
              bgStyle === 'WHITE' ? 'bg-amber-500/30 text-amber-200 border border-amber-500/50' : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            Nền Trắng
          </button>
          <button
            onClick={() => setBgStyle('DARK_SOIL')}
            className={`px-2.5 py-1 rounded-lg text-xs transition-all ${
              bgStyle === 'DARK_SOIL' ? 'bg-amber-500/30 text-amber-200 border border-amber-500/50' : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            Nền Đất Tối
          </button>
          <button
            onClick={() => setBgStyle('CHECKER')}
            className={`px-2.5 py-1 rounded-lg text-xs transition-all ${
              bgStyle === 'CHECKER' ? 'bg-amber-500/30 text-amber-200 border border-amber-500/50' : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            Nền Caro
          </button>
        </div>

        {/* Overlap Adjust */}
        <div className="flex items-center gap-2 text-xs bg-stone-800/80 px-3 py-1.5 rounded-xl border border-stone-700">
          <span className="text-stone-400">Overlap Cổ Rễ:</span>
          <span className="font-mono text-amber-300 font-bold">{overlapY} px</span>
          <input
            type="range"
            min="0"
            max="50"
            value={overlapY}
            onChange={(e) => setOverlapY(parseInt(e.target.value, 10))}
            className="w-20 accent-amber-500 cursor-pointer"
          />
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
            setCameraPos({ x: 0, y: 20 });
          }}
          className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/30 font-medium transition-all"
        >
          Nối Thân–Rễ (2×)
        </button>
        <button
          onClick={() => {
            setZoomLevel(4.0);
            setCameraPos({ x: 0, y: 50 });
          }}
          className="px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border border-rose-500/30 font-medium transition-all"
        >
          Cận Cảnh Khớp Nối (4×)
        </button>
        <button
          onClick={() => {
            setZoomLevel(2.0);
            setCameraPos({ x: 0, y: -250 });
          }}
          className="px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 border border-emerald-500/30 font-medium transition-all"
        >
          Mặt Cắt Địa Tầng & Rễ (2×)
        </button>
        <button
          onClick={() => {
            setActiveVersion('SPLIT_SIDE_BY_SIDE');
            setZoomLevel(1.6);
            setCameraPos({ x: 0, y: 0 });
          }}
          className="px-3 py-1.5 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 text-sky-200 border border-sky-500/30 font-medium transition-all"
        >
          So Sánh V2 / V4 (1.6×)
        </button>
      </div>
    </div>
  );
};
