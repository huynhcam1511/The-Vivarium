import React, { useEffect, useRef, useState } from 'react';
import { Application } from 'pixi.js';
import { EcoSim } from './simulation/EcoSim';
import { WorldRenderer } from './engine/WorldRenderer';
import { TelemetryHeader } from './components/TelemetryHeader';
import { GameToolbar } from './components/GameToolbar';
import { AssetPreviewScene } from './components/AssetPreviewScene';
import { EnvironmentPreviewScene } from './components/EnvironmentPreviewScene';
import { AquaticShowcaseScene } from './aquatic/AquaticShowcaseScene';
import type { ToolType, TimeSpeed } from './types';

export const App: React.FC = () => {
  // Check URL parameters for standalone preview modes
  const isAquaticMode = window.location.search.includes('mode=aquatic');
  if (isAquaticMode) {
    return <AquaticShowcaseScene />;
  }

  const isEnvPreviewMode = window.location.search.includes('mode=environment-preview');
  const isPreviewMode = window.location.search.includes('mode=preview');

  if (isEnvPreviewMode) {
    return <EnvironmentPreviewScene />;
  }

  if (isPreviewMode) {
    return <AssetPreviewScene />;
  }

  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<WorldRenderer | null>(null);
  const simRef = useRef<EcoSim>(new EcoSim());

  const [currentTool, setCurrentTool] = useState<ToolType>('SELECT');
  const [timeSpeed, setTimeSpeed] = useState<TimeSpeed>(1);
  const [environment, setEnvironment] = useState(simRef.current.environment);
  const [resources, setResources] = useState(simRef.current.resources);
  const [fps, setFps] = useState<number>(60);
  const [gameMode, setGameMode] = useState<'SANDBOX' | 'SURVIVAL'>('SANDBOX');

  // Background visual mode toggle: allows switching between rich master illustration background and procedural layers
  const [bgMode, setBgMode] = useState<'MASTER_ILLUSTRATION' | 'PROCEDURAL'>('MASTER_ILLUSTRATION');

  useEffect(() => {
    let app: Application | null = null;
    let animationFrameId: number;
    let lastTime = performance.now();
    let frameCount = 0;
    let fpsTimer = 0;

    const initPixi = async () => {
      if (!canvasContainerRef.current) return;

      const pixiApp = new Application();
      await pixiApp.init({
        resizeTo: window,
        backgroundColor: 0x080c10,
        resolution: window.devicePixelRatio || 1,
        autoDensity: true,
        antialias: true,
      });

      if (!canvasContainerRef.current) {
        pixiApp.destroy();
        return;
      }
      app = pixiApp;
      canvasContainerRef.current.appendChild(pixiApp.canvas);

      const sim = simRef.current;
      const renderer = new WorldRenderer(pixiApp, sim);
      rendererRef.current = renderer;

      // Event handlers for mouse interactions
      const handlePointerDown = (e: PointerEvent) => {
        renderer.camera.handleMouseDown(e.clientX, e.clientY, e.button);
        if (e.button === 0) {
          renderer.handlePointerClick(e.clientX, e.clientY);
        }
      };

      const handlePointerMove = (e: PointerEvent) => {
        renderer.camera.handleMouseMove(e.clientX, e.clientY);
        renderer.handlePointerMove(e.clientX, e.clientY);
      };

      const handlePointerUp = () => {
        renderer.camera.handleMouseUp();
      };

      const handleWheel = (e: WheelEvent) => {
        e.preventDefault();
        renderer.camera.handleWheel(e.clientX, e.clientY, e.deltaY);
      };

      const handleContextMenu = (e: MouseEvent) => {
        e.preventDefault(); // allow right drag without context menu
      };

      const container = canvasContainerRef.current;
      if (container) {
        container.addEventListener('pointerdown', handlePointerDown);
        window.addEventListener('pointermove', handlePointerMove);
        window.addEventListener('pointerup', handlePointerUp);
        container.addEventListener('wheel', handleWheel, { passive: false });
        container.addEventListener('contextmenu', handleContextMenu);
      }

      // Main Game Loop
      const loop = (currentTime: number) => {
        const dt = Math.min(0.1, (currentTime - lastTime) / 1000);
        lastTime = currentTime;

        // 1. Tick simulation
        sim.update(dt);

        // 2. Render graphics
        renderer.update(dt);

        // 3. FPS & telemetry sync
        frameCount++;
        fpsTimer += dt;
        if (fpsTimer >= 0.5) {
          setFps(Math.round(frameCount / fpsTimer));
          frameCount = 0;
          fpsTimer = 0;
          setEnvironment({ ...sim.environment });
          setResources({ ...sim.resources });
        }

        animationFrameId = requestAnimationFrame(loop);
      };

      animationFrameId = requestAnimationFrame(loop);
    };

    initPixi();

    return () => {
      cancelAnimationFrame(animationFrameId);
      if (app) {
        try {
          app.destroy(true);
        } catch (e) {
          console.warn('Pixi destroy cleanup:', e);
        }
      }
    };
  }, []);

  const handleSelectTool = (tool: ToolType) => {
    setCurrentTool(tool);
    if (rendererRef.current) {
      rendererRef.current.currentTool = tool;
    }
  };

  const handleChangeSpeed = (speed: TimeSpeed) => {
    setTimeSpeed(speed);
    simRef.current.timeSpeed = speed;
  };

  const handleJumpCamera = (preset: 'CANOPY' | 'SURFACE' | 'QUEEN' | 'LAKE' | 'WATERFALL' | 'HIVE' | 'CAVE') => {
    if (!rendererRef.current) return;
    const cam = rendererRef.current.camera;
    if (preset === 'CANOPY') {
      cam.jumpTo(1300, 320, 1.2);
    } else if (preset === 'HIVE') {
      cam.jumpTo(960, 260, 1.4);
    } else if (preset === 'SURFACE') {
      cam.jumpTo(960, 640, 0.9);
    } else if (preset === 'LAKE') {
      cam.jumpTo(1660, 600, 1.25);
    } else if (preset === 'QUEEN') {
      cam.jumpTo(336, 1072, 1.35);
    } else {
      cam.jumpTo(960, 720, 1.0);
    }
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-neutral-950 font-sans">
      {/* Top HUD Telemetry */}
      <TelemetryHeader
        environment={environment}
        resources={resources}
        gameMode={gameMode}
        onToggleMode={() => setGameMode(m => m === 'SANDBOX' ? 'SURVIVAL' : 'SANDBOX')}
      />

      {/* Main PixiJS Viewport Canvas Container */}
      <div
        ref={canvasContainerRef}
        className="absolute inset-0 cursor-crosshair active:cursor-grabbing"
      />

      {/* Mini-map Viewfinder in Top Right (like in user screenshot) */}
      <div className="fixed top-18 right-4 z-30 flex flex-col items-end gap-1.5 select-none pointer-events-auto">
        {/* Minimap card */}
        <div className="relative w-56 h-32 rounded-xl overflow-hidden border border-white/20 shadow-2xl bg-neutral-950/80 backdrop-blur-md">
          <img
            src="/art/macro_overview.jpg"
            alt="World Minimap"
            className="w-full h-full object-cover opacity-80"
          />
          {/* Viewfinder rectangle */}
          <div className="absolute inset-4 border border-amber-400/80 rounded bg-amber-400/10 pointer-events-none" />
          {/* Coordinates & Zoom badge */}
          <div className="absolute bottom-1.5 left-2 right-2 flex items-center justify-between text-[9px] font-mono text-white/90 bg-black/60 px-1.5 py-0.5 rounded">
            <span>X: 2,480 Y: -180</span>
            <span className="text-amber-300">Zoom: 1.0x</span>
          </div>
        </div>

        {/* View mode toggle pill */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-neutral-900/80 backdrop-blur-md border border-white/10 text-[10px] font-medium text-neutral-300">
          <button
            onClick={() => setBgMode('MASTER_ILLUSTRATION')}
            className={`px-1.5 py-0.5 rounded ${bgMode === 'MASTER_ILLUSTRATION' ? 'bg-amber-600 text-white font-bold' : 'hover:text-white'}`}
          >
            Đồ họa Tuyệt đối
          </button>
          <span className="text-white/20">|</span>
          <button
            onClick={() => setBgMode('PROCEDURAL')}
            className={`px-1.5 py-0.5 rounded ${bgMode === 'PROCEDURAL' ? 'bg-amber-600 text-white font-bold' : 'hover:text-white'}`}
          >
            Chỉ Layer Động
          </button>
          <span className="text-white/20">|</span>
          <span className="text-emerald-400 font-bold">{fps} FPS</span>
        </div>
      </div>

      {/* Bottom Toolset & Controls */}
      <GameToolbar
        currentTool={currentTool}
        onSelectTool={handleSelectTool}
        timeSpeed={timeSpeed}
        onChangeSpeed={handleChangeSpeed}
        onJumpCamera={handleJumpCamera}
        antPopulation={resources.antPopulation}
        beePopulation={resources.beePopulation}
      />
    </div>
  );
};
