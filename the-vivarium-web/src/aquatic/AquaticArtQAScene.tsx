import React, { useEffect, useRef, useState } from 'react';
import { Application, Container, Sprite, Texture, Assets, Graphics, Rectangle } from 'pixi.js';

type InspectionMode = 'GALLERY' | 'ZOOM' | 'COMPOSITION' | 'SEAMS' | 'ANIMATION';
type BgStyle = 'DARK' | 'WHITE' | 'CHECKER' | 'TERRAIN';

export const AquaticArtQAScene: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<Application | null>(null);

  const [mode, setMode] = useState<InspectionMode>('GALLERY');
  const [zoomLevel, setZoomLevel] = useState<number>(1.0);
  const [bgStyle, setBgStyle] = useState<BgStyle>('DARK');
  const [waterfallFps, setWaterfallFps] = useState<number>(8);
  const [activeFrame, setActiveFrame] = useState<number>(0);
  const [fps, setFps] = useState<number>(60);

  // Asset textures state
  const texturesRef = useRef<{
    bluebell?: Texture;
    moss?: Texture;
    fern?: Texture;
    mud?: Texture;
    waterfall?: Texture;
    waterfallFrames: Texture[];
    oakTrunk?: Texture;
    oakCanopy?: Texture;
  }>({
    waterfallFrames: [],
  });

  const worldContainerRef = useRef<Container | null>(null);
  const bgGraphicsRef = useRef<Graphics | null>(null);

  useEffect(() => {
    let active = true;
    let animId: number;
    let lastTime = performance.now();
    let frameCount = 0;
    let fpsTimer = 0;
    let waterfallTimer = 0;
    let currentWfFrame = 0;

    const init = async () => {
      if (!containerRef.current) return;
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

      // Load QA candidate assets
      try {
        const [texBluebell, texMoss, texFern, texMud, texWaterfall, texTrunk, texCanopy] = await Promise.all([
          Assets.load<Texture>('/assets/qa_temp_pack004/env_flower_bluebell.png'),
          Assets.load<Texture>('/assets/qa_temp_pack004/env_moss_patch.png'),
          Assets.load<Texture>('/assets/qa_temp_pack004/env_fern_cluster.png'),
          Assets.load<Texture>('/assets/qa_temp_pack004/env_lake_bottom_mud.png'),
          Assets.load<Texture>('/assets/qa_temp_pack004/env_waterfall_stream.png'),
          Assets.load<Texture>('/assets/source/env_tree_ancient_trunk_base_v2.png').catch(() => null),
          Assets.load<Texture>('/assets/source/env_foliage_canopy_clump_01_v2.png').catch(() => null),
        ]);

        texturesRef.current.bluebell = texBluebell;
        texturesRef.current.moss = texMoss;
        texturesRef.current.fern = texFern;
        texturesRef.current.mud = texMud;
        texturesRef.current.waterfall = texWaterfall;
        texturesRef.current.oakTrunk = texTrunk || undefined;
        texturesRef.current.oakCanopy = texCanopy || undefined;

        // Slice waterfall 6 frames (128 x 440)
        if (texWaterfall && texWaterfall.source) {
          const frames: Texture[] = [];
          for (let f = 0; f < 6; f++) {
            const frameTex = new Texture({
              source: texWaterfall.source,
              frame: new Rectangle(0, f * 440, 128, 440),
            });
            frames.push(frameTex);
          }
          texturesRef.current.waterfallFrames = frames;
        }
      } catch (err) {
        console.error('Failed to load candidate assets:', err);
      }

      // Root scene container
      const world = new Container();
      worldContainerRef.current = world;
      pixiApp.stage.addChild(world);

      // Background graphics
      const bg = new Graphics();
      bgGraphicsRef.current = bg;
      pixiApp.stage.addChildAt(bg, 0);

      // Render loop
      const loop = (currentTime: number) => {
        const dt = Math.min(0.1, (currentTime - lastTime) / 1000);
        lastTime = currentTime;

        // Animate waterfall frames
        waterfallTimer += dt;
        const frameInterval = 1 / Math.max(1, waterfallFps);
        if (waterfallTimer >= frameInterval) {
          waterfallTimer %= frameInterval;
          currentWfFrame = (currentWfFrame + 1) % 6;
          setActiveFrame(currentWfFrame);
        }

        frameCount++;
        fpsTimer += dt;
        if (fpsTimer >= 0.5) {
          setFps(Math.round(frameCount / fpsTimer));
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
      if (appRef.current) {
        appRef.current.destroy({ removeView: true });
        appRef.current = null;
      }
    };
  }, [waterfallFps]);

  // Re-draw scene when mode, zoom, bg, or activeFrame changes
  useEffect(() => {
    const world = worldContainerRef.current;
    const bg = bgGraphicsRef.current;
    if (!world || !bg) return;

    world.removeChildren();
    bg.clear();

    const W = window.innerWidth;
    const H = window.innerHeight;

    // 1. Draw Background
    if (bgStyle === 'WHITE') {
      bg.rect(0, 0, W, H);
      bg.fill({ color: 0xffffff });
    } else if (bgStyle === 'CHECKER') {
      const cSize = 24;
      for (let y = 0; y < H; y += cSize) {
        for (let x = 0; x < W; x += cSize) {
          const isDark = (Math.floor(x / cSize) + Math.floor(y / cSize)) % 2 === 0;
          bg.rect(x, y, cSize, cSize);
          bg.fill({ color: isDark ? 0x242424 : 0x141414 });
        }
      }
    } else if (bgStyle === 'TERRAIN') {
      // Sky to dark soil gradient
      bg.rect(0, 0, W, H * 0.55);
      bg.fill({ color: 0x182838 });
      bg.rect(0, H * 0.55, W, H * 0.45);
      bg.fill({ color: 0x1a120c });
      // Water body
      bg.rect(W * 0.45, H * 0.52, W * 0.55, H * 0.48);
      bg.fill({ color: 0x0a2233 });
    } else {
      // DARK
      bg.rect(0, 0, W, H);
      bg.fill({ color: 0x0a1017 });
    }

    const { bluebell, moss, fern, mud, waterfallFrames, oakTrunk, oakCanopy } = texturesRef.current;

    // Helper: draw asset card with frame
    const drawCard = (x: number, y: number, w: number, h: number) => {
      const g = new Graphics();
      g.roundRect(x - 12, y - 12, w + 24, h + 24, 12);
      g.fill({ color: 0x121720, alpha: 0.75 });
      g.stroke({ color: 0x2a3648, width: 1 });
      world.addChild(g);
    };

    // =========================================================================
    // MODE 1: GALLERY — 5 PNGs side by side with spec labels
    // =========================================================================
    if (mode === 'GALLERY') {
      world.position.set(60, 100);
      world.scale.set(1.0);

      let curX = 0;

      // 1. Bluebell (128x128)
      if (bluebell) {
        drawCard(curX, 0, 128, 128);
        const s = new Sprite(bluebell);
        s.position.set(curX, 0);
        world.addChild(s);
      }
      curX += 200;

      // 2. Moss Patch (128x128)
      if (moss) {
        drawCard(curX, 0, 128, 128);
        const s = new Sprite(moss);
        s.position.set(curX, 0);
        world.addChild(s);
      }
      curX += 200;

      // 3. Fern Cluster (128x128)
      if (fern) {
        drawCard(curX, 0, 128, 128);
        const s = new Sprite(fern);
        s.position.set(curX, 0);
        world.addChild(s);
      }
      curX += 200;

      // 4. Lake Bottom Mud (768x128, scaled or native)
      if (mud) {
        drawCard(curX, 0, 768 * 0.65, 128);
        const s = new Sprite(mud);
        s.position.set(curX, 0);
        s.scale.set(0.65, 1.0);
        world.addChild(s);
      }
      curX += 768 * 0.65 + 70;

      // 5. Waterfall Stream (Current active frame 128x440)
      if (waterfallFrames.length > 0) {
        const frameTex = waterfallFrames[activeFrame] || waterfallFrames[0];
        drawCard(curX, 0, 128, 440);
        const s = new Sprite(frameTex);
        s.position.set(curX, 0);
        world.addChild(s);
      }
    }

    // =========================================================================
    // MODE 2: ZOOM (1x / 2x / 4x Inspection of Pixel Quality & Alpha Fringe)
    // =========================================================================
    else if (mode === 'ZOOM') {
      world.position.set(80, 120);
      world.scale.set(zoomLevel);

      let curX = 0;

      // Bluebell
      if (bluebell) {
        const s = new Sprite(bluebell);
        s.position.set(curX, 0);
        world.addChild(s);
      }
      curX += 160;

      // Moss
      if (moss) {
        const s = new Sprite(moss);
        s.position.set(curX, 0);
        world.addChild(s);
      }
      curX += 160;

      // Fern
      if (fern) {
        const s = new Sprite(fern);
        s.position.set(curX, 0);
        world.addChild(s);
      }
      curX += 160;

      // Waterfall Frame
      if (waterfallFrames.length > 0) {
        const s = new Sprite(waterfallFrames[activeFrame] || waterfallFrames[0]);
        s.position.set(curX, 0);
        world.addChild(s);
      }
    }

    // =========================================================================
    // MODE 3: SEAMS & TILING (Lake Bottom Mud Seamless Continuity Test)
    // =========================================================================
    else if (mode === 'SEAMS') {
      world.position.set(100, 160);
      world.scale.set(1.0);

      if (mud) {
        // Tile 2 instances horizontally side-by-side to visually inspect seam!
        const s1 = new Sprite(mud);
        s1.position.set(0, 50);
        world.addChild(s1);

        const s2 = new Sprite(mud);
        s2.position.set(768, 50);
        world.addChild(s2);

        // Seam guideline
        const line = new Graphics();
        line.moveTo(768, 20);
        line.lineTo(768, 210);
        line.stroke({ color: 0xff3366, width: 2 });
        world.addChild(line);

        // Third tile below with offset to test vertical/horizontal blending
        const s3 = new Sprite(mud);
        s3.position.set(384, 230);
        world.addChild(s3);
      }
    }

    // =========================================================================
    // MODE 4: ANIMATION (6 Frames of Waterfall Stream Side-by-Side & Animated)
    // =========================================================================
    else if (mode === 'ANIMATION') {
      world.position.set(60, 120);
      world.scale.set(1.0);

      // Draw all 6 frames side by side
      for (let i = 0; i < 6; i++) {
        if (waterfallFrames[i]) {
          const s = new Sprite(waterfallFrames[i]);
          s.position.set(i * 150, 0);
          world.addChild(s);

          // Highlight current active frame
          if (i === activeFrame) {
            const h = new Graphics();
            h.rect(i * 150 - 4, -4, 128 + 8, 440 + 8);
            h.stroke({ color: 0x00f0ff, width: 3 });
            world.addChild(h);
          }
        }
      }

      // Draw animated preview on the right
      const animX = 6 * 150 + 60;
      if (waterfallFrames[activeFrame]) {
        drawCard(animX, 0, 128, 440);
        const s = new Sprite(waterfallFrames[activeFrame]);
        s.position.set(animX, 0);
        world.addChild(s);
      }
    }

    // =========================================================================
    // MODE 5: COMPOSITION & SCALE (Relation with Oak Tree, Fish, Duck, Soil)
    // =========================================================================
    else if (mode === 'COMPOSITION') {
      world.position.set(0, 0);
      world.scale.set(0.9);

      // 1. Ancient Oak Tree (Approved production source)
      if (oakTrunk) {
        const trunk = new Sprite(oakTrunk);
        trunk.anchor.set(0.5, 1.0);
        trunk.scale.set(0.5);
        trunk.position.set(380, 560);
        world.addChild(trunk);
      }
      if (oakCanopy) {
        const canopy = new Sprite(oakCanopy);
        canopy.anchor.set(0.5, 0.5);
        canopy.scale.set(0.65);
        canopy.position.set(420, 260);
        world.addChild(canopy);
      }

      // 2. Lake Water Column Graphic
      const lakeG = new Graphics();
      // Ground bank
      lakeG.moveTo(0, 560);
      lakeG.lineTo(720, 560);
      lakeG.bezierCurveTo(780, 560, 820, 620, 860, 680);
      lakeG.lineTo(1700, 680);
      lakeG.lineTo(1700, 1000);
      lakeG.lineTo(0, 1000);
      lakeG.fill({ color: 0x140e0a }); // Soil

      // Water basin body
      lakeG.moveTo(820, 570);
      lakeG.lineTo(1700, 570);
      lakeG.lineTo(1700, 920);
      lakeG.bezierCurveTo(1500, 940, 1100, 930, 840, 780);
      lakeG.closePath();
      lakeG.fill({ color: 0x0f3448, alpha: 0.7 });
      world.addChild(lakeG);

      // 3. Lake Bottom Mud Asset
      if (mud) {
        const mudSprite = new Sprite(mud);
        mudSprite.position.set(860, 760);
        mudSprite.scale.set(1.0, 1.0);
        world.addChild(mudSprite);
      }

      // 4. Waterfall Stream Asset (Cascading at rocky bank)
      if (waterfallFrames.length > 0) {
        const wf = new Sprite(waterfallFrames[activeFrame] || waterfallFrames[0]);
        wf.position.set(780, 360);
        wf.scale.set(0.85, 0.95);
        world.addChild(wf);
      }

      // 5. Riparian Flora on Bank
      if (fern) {
        const f1 = new Sprite(fern);
        f1.anchor.set(0.5, 1.0);
        f1.scale.set(0.7);
        f1.position.set(680, 560);
        world.addChild(f1);

        const f2 = new Sprite(fern);
        f2.anchor.set(0.5, 1.0);
        f2.scale.set(0.6);
        f2.position.set(730, 565);
        world.addChild(f2);
      }

      if (bluebell) {
        const b1 = new Sprite(bluebell);
        b1.anchor.set(0.5, 1.0);
        b1.scale.set(0.65);
        b1.position.set(620, 560);
        world.addChild(b1);

        const b2 = new Sprite(bluebell);
        b2.anchor.set(0.5, 1.0);
        b2.scale.set(0.55);
        b2.position.set(650, 562);
        world.addChild(b2);
      }

      if (moss) {
        const m1 = new Sprite(moss);
        m1.anchor.set(0.5, 0.5);
        m1.scale.set(0.7);
        m1.position.set(760, 575);
        world.addChild(m1);
      }

      // 6. Fauna References (Mallard Duck & Fish for Scale Comparison)
      const faunaG = new Graphics();
      // Mallard Duck at water surface (820, 565)
      faunaG.ellipse(1050, 565, 20, 12);
      faunaG.fill({ color: 0x3d2817 }); // body
      faunaG.circle(1068, 558, 8);
      faunaG.fill({ color: 0x1f5c35 }); // green head
      faunaG.moveTo(1074, 558);
      faunaG.lineTo(1082, 560);
      faunaG.lineTo(1074, 562);
      faunaG.fill({ color: 0xd9822b }); // beak

      // Carp Fish deep in water (1150, 720)
      faunaG.ellipse(1150, 720, 24, 10);
      faunaG.fill({ color: 0x8c6d3b }); // carp

      // Minnow small schooling fish (1300, 640)
      faunaG.ellipse(1300, 640, 10, 4);
      faunaG.fill({ color: 0x6ca0b0 }); // minnow
      faunaG.ellipse(1330, 650, 11, 4.5);
      faunaG.fill({ color: 0x6ca0b0 });

      world.addChild(faunaG);
    }
  }, [mode, zoomLevel, bgStyle, activeFrame]);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-neutral-950 font-sans select-none">
      {/* Top Header Badge */}
      <div className="fixed top-4 left-6 z-30 flex items-center gap-3 px-3.5 py-1.5 rounded-xl bg-neutral-900/90 backdrop-blur-md border border-white/10 text-xs text-white">
        <span className="font-bold text-cyan-400">THE VIVARIUM</span>
        <span className="text-white/20">|</span>
        <span className="text-amber-300 font-mono font-bold">TASK-019 PACK-004 ART INTAKE QA</span>
        <span className="text-white/20">|</span>
        <span className="text-emerald-400 font-mono">{fps} FPS</span>
      </div>

      {/* Main Viewport Container */}
      <div ref={containerRef} className="absolute inset-0 cursor-default" />

      {/* Floating QA Control Panel */}
      <div className="fixed bottom-6 left-6 z-40 flex flex-col gap-3 p-4 rounded-2xl bg-neutral-900/95 backdrop-blur-md border border-white/10 shadow-2xl text-white max-w-md">
        <div className="flex items-center justify-between border-b border-white/10 pb-2">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-amber-200">
              Kiểm Tra Độc Lập 5 PNG Thủy Sinh (PACK-004)
            </h2>
          </div>
          <span className="text-[10px] font-mono text-neutral-400">Isolated Candidate Scene</span>
        </div>

        {/* Mode Selector */}
        <div className="flex flex-col gap-1 text-xs">
          <span className="text-[10px] text-neutral-400 font-mono">Chế Độ Khảo Sát QA:</span>
          <div className="grid grid-cols-5 gap-1 text-[11px] font-medium">
            <button
              onClick={() => { setMode('GALLERY'); setZoomLevel(1.0); }}
              className={`px-2 py-1.5 rounded-lg border transition ${mode === 'GALLERY' ? 'bg-amber-500/30 border-amber-400 text-amber-200' : 'bg-white/5 border-white/10 text-neutral-300'}`}
            >
              Gallery
            </button>
            <button
              onClick={() => setMode('ZOOM')}
              className={`px-2 py-1.5 rounded-lg border transition ${mode === 'ZOOM' ? 'bg-amber-500/30 border-amber-400 text-amber-200' : 'bg-white/5 border-white/10 text-neutral-300'}`}
            >
              Zoom
            </button>
            <button
              onClick={() => setMode('SEAMS')}
              className={`px-2 py-1.5 rounded-lg border transition ${mode === 'SEAMS' ? 'bg-amber-500/30 border-amber-400 text-amber-200' : 'bg-white/5 border-white/10 text-neutral-300'}`}
            >
              Mối Nối Bùn
            </button>
            <button
              onClick={() => setMode('ANIMATION')}
              className={`px-2 py-1.5 rounded-lg border transition ${mode === 'ANIMATION' ? 'bg-amber-500/30 border-amber-400 text-amber-200' : 'bg-white/5 border-white/10 text-neutral-300'}`}
            >
              6 Frame Thác
            </button>
            <button
              onClick={() => setMode('COMPOSITION')}
              className={`px-2 py-1.5 rounded-lg border transition ${mode === 'COMPOSITION' ? 'bg-amber-500/30 border-amber-400 text-amber-200' : 'bg-white/5 border-white/10 text-neutral-300'}`}
            >
              Tỷ Lệ Cảnh
            </button>
          </div>
        </div>

        {/* Zoom Controls (if in ZOOM mode) */}
        {mode === 'ZOOM' && (
          <div className="flex items-center gap-2 pt-1 border-t border-white/10 text-xs">
            <span className="text-[10px] text-neutral-400 font-mono">Zoom Scale:</span>
            {[1.0, 2.0, 4.0].map((z) => (
              <button
                key={z}
                onClick={() => setZoomLevel(z)}
                className={`px-2.5 py-1 rounded border text-xs font-mono ${zoomLevel === z ? 'bg-cyan-500/30 border-cyan-400 text-cyan-200' : 'bg-white/5 border-white/10 text-neutral-400'}`}
              >
                {z}×
              </button>
            ))}
          </div>
        )}

        {/* Background Style Toggle */}
        <div className="flex items-center gap-2 pt-1 border-t border-white/10 text-xs">
          <span className="text-[10px] text-neutral-400 font-mono">Nền Kiểm Thử:</span>
          {(['DARK', 'WHITE', 'CHECKER', 'TERRAIN'] as BgStyle[]).map((bg) => (
            <button
              key={bg}
              onClick={() => setBgStyle(bg)}
              className={`px-2 py-0.5 rounded border text-[10px] font-mono ${bgStyle === bg ? 'bg-white/20 border-white/40 text-white' : 'bg-white/5 border-white/10 text-neutral-400'}`}
            >
              {bg}
            </button>
          ))}
        </div>

        {/* Waterfall FPS control (if in ANIMATION mode) */}
        {mode === 'ANIMATION' && (
          <div className="flex items-center gap-2 pt-1 border-t border-white/10 text-xs">
            <span className="text-[10px] text-neutral-400 font-mono">Tốc Độ Thác:</span>
            {[4, 8, 12, 16].map((rate) => (
              <button
                key={rate}
                onClick={() => setWaterfallFps(rate)}
                className={`px-2 py-0.5 rounded border text-[10px] font-mono ${waterfallFps === rate ? 'bg-cyan-500/30 border-cyan-400 text-cyan-200' : 'bg-white/5 border-white/10 text-neutral-400'}`}
              >
                {rate} FPS
              </button>
            ))}
            <span className="ml-auto text-[10px] font-mono text-cyan-300">Frame {activeFrame+1}/6</span>
          </div>
        )}
      </div>
    </div>
  );
};
