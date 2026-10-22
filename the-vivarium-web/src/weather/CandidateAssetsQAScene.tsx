import React, { useEffect, useRef, useState } from 'react';
import { Application, Container, Sprite, Assets, Texture, Rectangle } from 'pixi.js';

interface CandidateAssetInfo {
  id: string;
  name: string;
  path: string;
  width: number;
  height: number;
  maxAlpha: number;
  verdict: 'PASS' | 'CONDITIONAL' | 'FAIL';
  note: string;
}

export const CandidateAssetsQAScene: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<Application | null>(null);

  const [zoomLevel, setZoomLevel] = useState<number>(1.0);
  const [bgStyle, setBgStyle] = useState<'TRANSPARENT_CHECK' | 'DARK_NIGHT' | 'SKY_BLUE' | 'WHITE'>('TRANSPARENT_CHECK');
  const [enableParallaxAnimation, setEnableParallaxAnimation] = useState<boolean>(true);
  const [fps, setFps] = useState<number>(60);

  const assetStatuses: CandidateAssetInfo[] = [
    {
      id: 'ENV-SKY-CLOUDS-001',
      name: 'env_sky_clouds_001.png',
      path: '/assets/pack005_candidate/env_sky_clouds_001.png',
      width: 1024,
      height: 512,
      maxAlpha: 130,
      verdict: 'PASS',
      note: 'Alpha sạch, 0 viền đen (0px edge seam), trôi ngang mượt mà LOD 1-3.',
    },
    {
      id: 'ENV-SKY-MNTN-001',
      name: 'env_sky_mountain_001.png',
      path: '/assets/pack005_candidate/env_sky_mountain_001.png',
      width: 1024,
      height: 512,
      maxAlpha: 108,
      verdict: 'CONDITIONAL',
      note: 'Dãy núi xa mờ, đáy chạm đất tốt, tuy nhiên seam ngang trái-phải lệch 11.98px cần fade viền khi lặp vô tận.',
    },
    {
      id: 'ENV-FX-FOG-MIST',
      name: 'env_fx_fog_mist.png',
      path: '/assets/pack005_candidate/env_fx_fog_mist.png',
      width: 1024,
      height: 512,
      maxAlpha: 108,
      verdict: 'CONDITIONAL',
      note: 'Sương mù mềm mại, độ trong suốt cao (maxAlpha 108), nhưng viền mép chạm canvas (edge alpha 95) cần blend biên mềm.',
    },
    {
      id: 'ENV-FX-RAIN-DROP-01',
      name: 'env_fx_rain_drop_01.png',
      path: '/assets/pack005_candidate/env_fx_rain_drop_01.png',
      width: 512,
      height: 512,
      maxAlpha: 185,
      verdict: 'PASS',
      note: 'Atlas 8x8 (64 cell hạt mưa xéo và vệt splash), alpha sạch 100%, 0 viền đen.',
    },
    {
      id: 'ENV-CANOPY-LEAF-FALL',
      name: 'env_canopy_leaf_fall.png',
      path: '/assets/pack005_candidate/env_canopy_leaf_fall.png',
      width: 512,
      height: 512,
      maxAlpha: 238,
      verdict: 'PASS',
      note: 'Atlas lá sồi rơi 8x8 với 38 cell chuyển động xoay, màu sắc tự nhiên phù hợp Oak Canopy V2.',
    },
  ];

  // Viewport & Layers
  const worldContainerRef = useRef<Container | null>(null);

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
        backgroundColor: bgStyle === 'DARK_NIGHT' ? 0x0a0f1d : bgStyle === 'SKY_BLUE' ? 0x8ecae6 : bgStyle === 'WHITE' ? 0xffffff : 0x141824,
        resolution: window.devicePixelRatio || 1,
        autoDensity: true,
        antialias: true,
      });

      if (!isMounted) {
        try { pixiApp.destroy(true, { children: true }); } catch { /* ignore */ }
        return;
      }

      containerRef.current.appendChild(pixiApp.canvas);
      appRef.current = pixiApp;

      // 1. Root Container
      const worldContainer = new Container();
      pixiApp.stage.addChild(worldContainer);
      worldContainerRef.current = worldContainer;

      // Load 5 Candidate Textures
      let texClouds: Texture | null = null;
      let texMountain: Texture | null = null;
      let texMist: Texture | null = null;
      let texRainAtlas: Texture | null = null;
      let texLeafAtlas: Texture | null = null;

      try {
        texClouds = await Assets.load('/assets/pack005_candidate/env_sky_clouds_001.png');
        texMountain = await Assets.load('/assets/pack005_candidate/env_sky_mountain_001.png');
        texMist = await Assets.load('/assets/pack005_candidate/env_fx_fog_mist.png');
        texRainAtlas = await Assets.load('/assets/pack005_candidate/env_fx_rain_drop_01.png');
        texLeafAtlas = await Assets.load('/assets/pack005_candidate/env_canopy_leaf_fall.png');
      } catch (err) {
        console.warn('Candidate asset loading error:', err);
      }

      // Parallax Scene Assembly
      const mountainContainer = new Container();
      const cloudsContainer = new Container();
      const mistContainer = new Container();
      const particlesContainer = new Container();

      worldContainer.addChild(mountainContainer);
      worldContainer.addChild(cloudsContainer);
      worldContainer.addChild(mistContainer);
      worldContainer.addChild(particlesContainer);

      // A. Distant Mountain Ridge Sprite (1024x512)
      let mountainSprite1: Sprite | null = null;
      let mountainSprite2: Sprite | null = null;
      if (texMountain) {
        mountainSprite1 = new Sprite(texMountain);
        mountainSprite1.position.set(0, 160);
        mountainSprite1.scale.set(1.2);
        mountainContainer.addChild(mountainSprite1);

        mountainSprite2 = new Sprite(texMountain);
        mountainSprite2.position.set(1024 * 1.2 - 2, 160);
        mountainSprite2.scale.set(1.2);
        mountainContainer.addChild(mountainSprite2);
      }

      // B. Drifting Cloud Overlays (1024x512)
      let cloudSprite1: Sprite | null = null;
      let cloudSprite2: Sprite | null = null;
      if (texClouds) {
        cloudSprite1 = new Sprite(texClouds);
        cloudSprite1.position.set(0, 40);
        cloudSprite1.scale.set(1.3);
        cloudsContainer.addChild(cloudSprite1);

        cloudSprite2 = new Sprite(texClouds);
        cloudSprite2.position.set(1024 * 1.3, 40);
        cloudSprite2.scale.set(1.3);
        cloudsContainer.addChild(cloudSprite2);
      }

      // C. Mist Overlay (1024x512)
      let mistSprite: Sprite | null = null;
      if (texMist) {
        mistSprite = new Sprite(texMist);
        mistSprite.position.set(100, 220);
        mistSprite.scale.set(1.4);
        mistSprite.alpha = 0.85;
        mistContainer.addChild(mistSprite);
      }

      // D. Particle Samples from Atlases (Rain & Leaves)
      const rainSprites: Sprite[] = [];
      if (texRainAtlas && texRainAtlas.source) {
        // Extract 28 rain drop cells from atlas
        for (let i = 0; i < 28; i++) {
          const col = i % 8;
          const row = Math.floor(i / 8);
          const frame = new Rectangle(col * 64, row * 64, 64, 64);
          const subTex = new Texture({ source: texRainAtlas.source, frame });
          const drop = new Sprite(subTex);
          drop.position.set(80 + Math.random() * 1400, 100 + Math.random() * 500);
          drop.scale.set(1.0);
          particlesContainer.addChild(drop);
          rainSprites.push(drop);
        }
      }

      const leafSprites: { sprite: Sprite; vx: number; vy: number; vrot: number }[] = [];
      if (texLeafAtlas && texLeafAtlas.source) {
        // Extract leaves
        for (let i = 0; i < 18; i++) {
          const col = (i * 2 + 1) % 8;
          const row = Math.floor((i * 2 + 1) / 8);
          const frame = new Rectangle(col * 64, row * 64, 64, 64);
          const subTex = new Texture({ source: texLeafAtlas.source, frame });
          const leaf = new Sprite(subTex);
          leaf.anchor.set(0.5, 0.5);
          leaf.position.set(300 + Math.random() * 1000, 150 + Math.random() * 400);
          particlesContainer.addChild(leaf);
          leafSprites.push({
            sprite: leaf,
            vx: 15 + Math.random() * 30,
            vy: 20 + Math.random() * 25,
            vrot: (Math.random() - 0.5) * 3,
          });
        }
      }

      // Ticker Loop for live parallax & animation verification
      pixiApp.ticker.add((ticker) => {
        const dt = ticker.deltaMS / 1000;
        frameCount++;
        fpsTimer += dt;
        if (fpsTimer >= 0.25) {
          setFps(Math.round(frameCount / fpsTimer));
          frameCount = 0;
          fpsTimer = 0;
        }

        if (!enableParallaxAnimation) return;

        // 1. Cloud drift (0.15 parallax factor)
        if (cloudSprite1 && cloudSprite2) {
          cloudSprite1.x -= dt * 25;
          cloudSprite2.x -= dt * 25;
          const totalW = 1024 * 1.3;
          if (cloudSprite1.x <= -totalW) cloudSprite1.x = cloudSprite2.x + totalW;
          if (cloudSprite2.x <= -totalW) cloudSprite2.x = cloudSprite1.x + totalW;
        }

        // 2. Mist subtle pulse
        if (mistSprite) {
          mistSprite.x += Math.sin(performance.now() * 0.001) * 0.25;
        }

        // 3. Falling leaves animation
        for (const l of leafSprites) {
          l.sprite.x += l.vx * dt;
          l.sprite.y += l.vy * dt;
          l.sprite.rotation += l.vrot * dt;
          if (l.sprite.y > 650 || l.sprite.x > 1500) {
            l.sprite.x = 250 + Math.random() * 600;
            l.sprite.y = 120 + Math.random() * 50;
          }
        }

        // 4. Rain drop stream
        for (const r of rainSprites) {
          r.y += dt * 450;
          r.x += dt * 110; // wind slant
          if (r.y > 700) {
            r.y = 80;
            r.x = 50 + Math.random() * 1400;
          }
        }
      });
    };

    init();

    return () => {
      isMounted = false;
      if (pixiApp) {
        try { pixiApp.destroy(true, { children: true }); } catch { /* ignore */ }
      }
    };
  }, [bgStyle, enableParallaxAnimation]);

  // Apply Zoom Transform
  useEffect(() => {
    if (!worldContainerRef.current) return;
    worldContainerRef.current.scale.set(zoomLevel);
    // Center at zoom point
    if (zoomLevel === 1.0) {
      worldContainerRef.current.position.set(0, 0);
    } else if (zoomLevel === 2.0) {
      worldContainerRef.current.position.set(-350, -100);
    } else if (zoomLevel === 4.0) {
      worldContainerRef.current.position.set(-900, -300);
    }
  }, [zoomLevel]);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-neutral-950 font-sans select-none" data-testid="art-qa-root">
      {/* Pixi Canvas */}
      <div ref={containerRef} className="absolute inset-0 z-0" />

      {/* Header Bar */}
      <header className="fixed top-3 left-4 right-4 z-30 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-3 bg-neutral-900/95 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/10 shadow-2xl pointer-events-auto">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-700 flex items-center justify-center text-white font-black text-sm">
            🎨
          </div>
          <div>
            <h1 className="text-xs font-black tracking-wider text-purple-100 uppercase" data-testid="qa-scene-title">
              THE VIVARIUM — PACK-005 ART INTAKE QA SCENE
            </h1>
            <p className="text-[10px] text-purple-300/80 font-medium">
              Candidate Raster Evaluation: 5 Weather Sprites & Atlases (Zoom 1x / 2x / 4x)
            </p>
          </div>
        </div>

        {/* Controls: Zoom, BG Style, Animation Toggle */}
        <div className="flex items-center gap-3 bg-neutral-900/95 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-white/10 shadow-2xl pointer-events-auto text-xs">
          <span className="font-mono text-emerald-400 font-bold" data-testid="qa-telemetry-fps">{fps} FPS</span>
          <div className="w-px h-4 bg-white/15" />

          {/* Zoom Buttons */}
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-neutral-400 font-bold">ZOOM:</span>
            {[1.0, 2.0, 4.0].map((z) => (
              <button
                key={z}
                data-testid={`btn-zoom-${z}x`}
                onClick={() => setZoomLevel(z)}
                className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold transition-all ${
                  zoomLevel === z
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                    : 'bg-white/5 text-neutral-400 hover:text-white'
                }`}
              >
                {z.toFixed(0)}x
              </button>
            ))}
          </div>

          <div className="w-px h-4 bg-white/15" />

          {/* BG Modes */}
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-neutral-400 font-bold">NỀN:</span>
            {[
              { id: 'TRANSPARENT_CHECK', label: 'Checker' },
              { id: 'SKY_BLUE', label: 'Bầu trời' },
              { id: 'DARK_NIGHT', label: 'Đêm đen' },
              { id: 'WHITE', label: 'Trắng' },
            ].map((m) => (
              <button
                key={m.id}
                onClick={() => setBgStyle(m.id as any)}
                className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all ${
                  bgStyle === m.id
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white/5 text-neutral-400 hover:text-white'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>

          <div className="w-px h-4 bg-white/15" />

          <button
            onClick={() => setEnableParallaxAnimation(!enableParallaxAnimation)}
            className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all ${
              enableParallaxAnimation ? 'bg-teal-600 text-white' : 'bg-neutral-800 text-neutral-400'
            }`}
          >
            {enableParallaxAnimation ? '▶ Parallax ON' : '⏸ Đứng yên'}
          </button>
        </div>
      </header>

      {/* Candidate Asset Intake Checklist Overlay */}
      <div className="fixed bottom-4 left-4 z-30 bg-neutral-900/95 backdrop-blur-md p-3.5 rounded-2xl border border-white/10 shadow-2xl max-w-md pointer-events-auto text-xs text-neutral-200">
        <div className="flex items-center justify-between mb-2">
          <div className="font-bold text-amber-300 flex items-center gap-1.5">
            <span>📋</span>
            <span>BẢNG NGHIỆM THU 5 ASSET ỨNG VIÊN PACK-005</span>
          </div>
          <span className="text-[10px] font-mono text-purple-300">Zoom: {zoomLevel}x</span>
        </div>

        <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
          {assetStatuses.map((item) => (
            <div
              key={item.id}
              className={`p-2 rounded-xl border text-[11px] transition-all ${
                item.verdict === 'PASS'
                  ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-200'
                  : 'bg-amber-950/40 border-amber-500/30 text-amber-200'
              }`}
            >
              <div className="flex items-center justify-between font-bold mb-0.5">
                <span className="font-mono text-[10px] text-white">{item.name}</span>
                <span
                  className={`px-1.5 py-0.2 rounded text-[9px] uppercase font-bold ${
                    item.verdict === 'PASS' ? 'bg-emerald-600 text-white' : 'bg-amber-600 text-white'
                  }`}
                >
                  {item.verdict}
                </span>
              </div>
              <div className="text-[10px] text-neutral-300">{item.note}</div>
              <div className="text-[9px] text-neutral-400 mt-0.5 font-mono">
                {item.width}×{item.height} px | Max Alpha: {item.maxAlpha}/255
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Guide & Zoom Inspection Tips */}
      <div className="fixed bottom-4 right-4 z-30 bg-neutral-900/95 backdrop-blur-md p-3.5 rounded-2xl border border-white/10 shadow-2xl max-w-xs pointer-events-auto text-[11px] text-neutral-300">
        <div className="font-bold text-sky-300 mb-1 flex items-center gap-1">
          <span>🔍</span>
          <span>TIÊU CHÍ SOI CHI TIẾT 1x / 2x / 4x:</span>
        </div>
        <ul className="list-disc list-inside space-y-1 text-[10px] text-neutral-400">
          <li><strong>1x (Toàn cảnh):</strong> Kiểm tra bố cục mây, dải núi xa và sương phủ.</li>
          <li><strong>2x (Trung cảnh):</strong> Soi hạt mưa nghiêng và lá rụng xoay quanh vòm cây.</li>
          <li><strong>4x (Cận cảnh):</strong> Soi viền răng cưa pixel, khử halo đen, kiểm tra độ mờ biên alpha.</li>
        </ul>
      </div>
    </div>
  );
};
