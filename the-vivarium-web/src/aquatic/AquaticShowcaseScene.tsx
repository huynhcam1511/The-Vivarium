import React, { useEffect, useRef, useState } from 'react';
import { Application, Container, Sprite, Texture, Assets } from 'pixi.js';
import { CameraController } from '../engine/CameraController';
import { OrganicTerrainData } from '../engine/OrganicTerrainData';
import { OrganicTerrainRenderer } from '../engine/OrganicTerrainRenderer';
import { AquaticSystem } from './AquaticSystem';
import { AquaticRenderer } from './AquaticRenderer';
import { AquaticControlPanel } from './AquaticControlPanel';

export const AquaticShowcaseScene: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const aquaticSystemRef = useRef<AquaticSystem>(new AquaticSystem());
  const cameraRef = useRef<CameraController | null>(null);
  const appRef = useRef<Application | null>(null);

  const [fps, setFps] = useState<number>(60);
  const [, setTick] = useState<number>(0);

  useEffect(() => {
    let active = true;
    let animId: number;
    let lastTime = performance.now();
    let frameCount = 0;
    let fpsTimer = 0;

    const init = async () => {
      if (!containerRef.current) return;

      // Clean existing children in case of React StrictMode double-mount
      while (containerRef.current.firstChild) {
        containerRef.current.removeChild(containerRef.current.firstChild);
      }

      const pixiApp = new Application();
      await pixiApp.init({
        resizeTo: window,
        backgroundColor: 0x0a1017,
        resolution: window.devicePixelRatio || 1,
        autoDensity: true,
        antialias: true,
      });

      if (!active || !containerRef.current) {
        pixiApp.destroy({ removeView: true });
        return;
      }

      appRef.current = pixiApp;
      containerRef.current.appendChild(pixiApp.canvas);

      const worldContainer = new Container();
      pixiApp.stage.addChild(worldContainer);

      const camera = new CameraController(worldContainer);
      camera.setViewportSize(window.innerWidth, window.innerHeight);
      cameraRef.current = camera;
      // Focus on Lake Basin by default
      camera.jumpTo(1680, 600, 1.25);

      // 1. Organic Terrain System
      const terrainData = new OrganicTerrainData(75, 32, 32, -1200, 560);
      const terrainRenderer = new OrganicTerrainRenderer(terrainData);
      worldContainer.addChild(terrainRenderer.container);

      // 2. Load Approved Ancient Oak Trunk & Canopy Assets
      try {
        const [texTrunk, texCanopy] = await Promise.all([
          Assets.load<Texture>('/assets/source/env_tree_ancient_trunk_base_v2.png').catch(() => null),
          Assets.load<Texture>('/assets/source/env_foliage_canopy_clump_01_v2.png').catch(() => null),
        ]);

        if (texTrunk) {
          const trunkSprite = new Sprite(texTrunk);
          trunkSprite.anchor.set(0.50, 1.00);
          trunkSprite.scale.set(0.5);
          trunkSprite.position.set(1220, 560);
          worldContainer.addChild(trunkSprite);
        }

        if (texCanopy) {
          const canopySprite = new Sprite(texCanopy);
          canopySprite.anchor.set(0.50, 0.50);
          canopySprite.scale.set(0.65);
          canopySprite.position.set(1260, 260);
          worldContainer.addChild(canopySprite);
        }
      } catch (err) {
        console.warn('Foliage texture load fallback:', err);
      }

      // 3. PACK-004 Aquatic Renderer & Simulation
      const aquaticSim = aquaticSystemRef.current;
      const aquaticRenderer = new AquaticRenderer(aquaticSim);
      worldContainer.addChild(aquaticRenderer.container);

      // Pointer event listeners for camera pan & zoom
      const handlePointerDown = (e: PointerEvent) => {
        camera.handleMouseDown(e.clientX, e.clientY, e.button);
      };
      const handlePointerMove = (e: PointerEvent) => {
        camera.handleMouseMove(e.clientX, e.clientY);
      };
      const handlePointerUp = () => {
        camera.handleMouseUp();
      };
      const handleWheel = (e: WheelEvent) => {
        e.preventDefault();
        camera.handleWheel(e.clientX, e.clientY, e.deltaY);
      };

      const c = containerRef.current;
      if (c) {
        c.addEventListener('pointerdown', handlePointerDown);
        window.addEventListener('pointermove', handlePointerMove);
        window.addEventListener('pointerup', handlePointerUp);
        c.addEventListener('wheel', handleWheel, { passive: false });
      }

      // Main render loop
      const urlParams = new URLSearchParams(window.location.search);
      let isPaused = urlParams.get('paused') === 'true';

      // Expose pause toggle & camera helper for QA and screenshot automation
      (window as unknown as { __AQUATIC_PAUSE__?: (pause: boolean) => void }).__AQUATIC_PAUSE__ = (pause: boolean) => {
        isPaused = pause;
      };

      const loop = (currentTime: number) => {
        const dt = Math.min(0.1, (currentTime - lastTime) / 1000);
        lastTime = currentTime;

        camera.update(dt);
        if (!isPaused) {
          aquaticSim.update(dt);
          aquaticRenderer.update(dt);
        }

        frameCount++;
        fpsTimer += dt;
        if (fpsTimer >= 0.5) {
          setFps(Math.round(frameCount / fpsTimer));
          frameCount = 0;
          fpsTimer = 0;
          setTick(t => t + 1);
        }

        animId = requestAnimationFrame(loop);
      };

      animId = requestAnimationFrame(loop);
    };

    init();

    return () => {
      active = false;
      cancelAnimationFrame(animId);
      if (appRef.current) {
        try {
          appRef.current.destroy({ removeView: true });
        } catch (e) {
          console.warn('Cleanup:', e);
        }
        appRef.current = null;
      }
    };
  }, []);

  const handleJumpCamera = (preset: 'LAKE' | 'WATERFALL' | 'OVERVIEW') => {
    if (!cameraRef.current) return;
    const cam = cameraRef.current;
    if (preset === 'LAKE') {
      cam.jumpTo(1680, 600, 1.25);
    } else if (preset === 'WATERFALL') {
      cam.jumpTo(1390, 480, 1.5);
    } else if (preset === 'OVERVIEW') {
      cam.jumpTo(1580, 520, 0.9);
    }
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-neutral-950 font-sans">
      {/* Top Header Badge */}
      <div className="fixed top-4 left-6 z-30 flex items-center gap-3 px-3.5 py-1.5 rounded-xl bg-neutral-900/80 backdrop-blur-md border border-white/10 text-xs text-white">
        <span className="font-bold text-cyan-400">THE VIVARIUM</span>
        <span className="text-white/20">|</span>
        <span className="text-neutral-300">PACK-004 Aquatic Showcase</span>
        <span className="text-white/20">|</span>
        <span className="text-emerald-400 font-mono font-bold">{fps} FPS</span>
      </div>

      {/* Main Viewport Container */}
      <div
        ref={containerRef}
        className="absolute inset-0 cursor-crosshair active:cursor-grabbing"
      />

      {/* Floating Control Panel */}
      <AquaticControlPanel
        system={aquaticSystemRef.current}
        onRefresh={() => setTick(t => t + 1)}
        onJumpCamera={handleJumpCamera}
      />
    </div>
  );
};
