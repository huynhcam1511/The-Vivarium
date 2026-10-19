import React, { useEffect, useRef, useState } from 'react';
import { Application, Container, Graphics, Sprite, Assets, Text, TextStyle } from 'pixi.js';

export const AssetPreviewScene: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<Application | null>(null);

  // View modes
  type ViewMode =
    | 'TREE_ASSEMBLY'
    | 'TREE_SEAMS'
    | 'GAMEPLAY_SCALE'
    | 'ANT_INSPECT'
    | 'TERRAIN_3X3'
    | 'TERRAIN_5X5'
    | 'V1_V2_COMPARE';

  const [viewMode, setViewMode] = useState<ViewMode>('TREE_ASSEMBLY');
  const [assetVersion] = useState<'V1' | 'V2'>('V2');
  const [zoomLevel, setZoomLevel] = useState<number>(1.0);
  const [bgPattern, setBgPattern] = useState<'EARTH' | 'CHECKER' | 'BLACK' | 'WHITE'>('EARTH');
  const [showTreeLayers, setShowTreeLayers] = useState<{
    roots: boolean;
    trunk: boolean;
    bough: boolean;
    foliage: boolean;
  }>({
    roots: true,
    trunk: true,
    bough: true,
    foliage: true,
  });

  const [assetStatus, setAssetStatus] = useState<{
    antLoaded: boolean;
    terrainLoaded: boolean;
    treeLoaded: boolean;
    errors: string[];
  }>({
    antLoaded: false,
    terrainLoaded: false,
    treeLoaded: false,
    errors: [],
  });

  if (assetStatus.errors.length > 0) {
    console.warn('Asset Preview warnings:', assetStatus.errors);
  }

  // Stage references
  const mainStageRef = useRef<Container | null>(null);
  const treeContainerRef = useRef<Container | null>(null);
  const treeSeamsContainerRef = useRef<Container | null>(null);
  const antGameplayContainerRef = useRef<Container | null>(null);
  const antMasterContainerRef = useRef<Container | null>(null);
  const terrain3x3ContainerRef = useRef<Container | null>(null);
  const terrain5x5ContainerRef = useRef<Container | null>(null);
  const compareContainerRef = useRef<Container | null>(null);

  // Sprites references for tree layers
  const treeRootsSpriteRef = useRef<Sprite | null>(null);
  const treeTrunkSpriteRef = useRef<Sprite | null>(null);
  const treeBoughSpriteRef = useRef<Sprite | null>(null);
  const treeFoliageSpriteRef = useRef<Sprite | null>(null);

  const pivotGraphicsRef = useRef<Graphics | null>(null);
  const seamGraphicsTreeRef = useRef<Graphics | null>(null);
  const seamGraphics3x3Ref = useRef<Graphics | null>(null);
  const seamGraphics5x5Ref = useRef<Graphics | null>(null);
  const bgGraphicsRef = useRef<Graphics | null>(null);

  // Background update helper
  const renderBackground = (pattern: string) => {
    if (!bgGraphicsRef.current) return;
    const g = bgGraphicsRef.current;
    g.clear();
    const W = window.innerWidth;
    const H = window.innerHeight;

    if (pattern === 'BLACK') {
      g.rect(0, 0, W, H);
      g.fill({ color: 0x050505 });
    } else if (pattern === 'WHITE') {
      g.rect(0, 0, W, H);
      g.fill({ color: 0xfafafa });
    } else if (pattern === 'EARTH') {
      g.rect(0, 0, W, H);
      g.fill({ color: 0x1a0f0a });
    } else {
      // High-contrast Checkerboard
      const checkSize = 24;
      for (let y = 0; y < H; y += checkSize) {
        for (let x = 0; x < W; x += checkSize) {
          const isDark = (Math.floor(x / checkSize) + Math.floor(y / checkSize)) % 2 === 0;
          g.rect(x, y, checkSize, checkSize);
          g.fill({ color: isDark ? 0x262626 : 0x171717 });
        }
      }
    }
  };

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
        resizeTo: window,
        backgroundColor: 0x121212,
        resolution: window.devicePixelRatio || 1,
        autoDensity: true,
        antialias: true,
      });

      if (!active) return;
      containerRef.current.appendChild(pixiApp.canvas);
      appRef.current = pixiApp;

      // 0. Background Graphics
      const bgGraphics = new Graphics();
      pixiApp.stage.addChild(bgGraphics);
      bgGraphicsRef.current = bgGraphics;
      renderBackground(bgPattern);

      const mainStage = new Container();
      pixiApp.stage.addChild(mainStage);
      mainStageRef.current = mainStage;

      // Load Assets
      const antV1Path = '/assets/source/char_ant_worker_idle.png';
      const antV2Path = '/assets/source/char_ant_worker_idle_v2.png';
      const terrainV1Path = '/assets/terrain/terrain_soil_dark_loam.png';
      const terrainV2Path = '/assets/terrain/terrain_soil_dark_loam_v2.png';

      // Tree Prototype Assets (V2 Extraction)
      const treeTrunkPath = '/assets/source/env_tree_ancient_trunk_base_v2.png';
      const treeBoughPath = '/assets/source/env_tree_bough_main_moss_v2.png';
      const treeFoliagePath = '/assets/source/env_foliage_canopy_clump_01_v2.png';
      const treeRootsPath = '/assets/source/env_tree_root_deep_cluster_v2.png';

      let texAntV1: any = null;
      let texAntV2: any = null;
      let texTerrainV1: any = null;
      let texTerrainV2: any = null;
      let texTreeTrunk: any = null;
      let texTreeBough: any = null;
      let texTreeFoliage: any = null;
      let texTreeRoots: any = null;
      const loadErrors: string[] = [];

      try {
        texAntV1 = await Assets.load(antV1Path);
        texAntV2 = await Assets.load(antV2Path);
        texTerrainV1 = await Assets.load(terrainV1Path);
        texTerrainV2 = await Assets.load(terrainV2Path);
      } catch (e: any) {
        loadErrors.push('Ant/Terrain load warning: ' + e.message);
      }

      try {
        texTreeTrunk = await Assets.load(treeTrunkPath);
        texTreeBough = await Assets.load(treeBoughPath);
        texTreeFoliage = await Assets.load(treeFoliagePath);
        texTreeRoots = await Assets.load(treeRootsPath);
      } catch (e: any) {
        loadErrors.push('Tree prototype V2 load error: ' + e.message);
      }

      setAssetStatus({
        antLoaded: !!(texAntV1 || texAntV2),
        terrainLoaded: !!(texTerrainV1 || texTerrainV2),
        treeLoaded: !!(texTreeTrunk && texTreeBough && texTreeFoliage && texTreeRoots),
        errors: loadErrors,
      });

      const activeAntTex = assetVersion === 'V2' ? texAntV2 || texAntV1 : texAntV1 || texAntV2;
      const activeTerrainTex = assetVersion === 'V2' ? texTerrainV2 || texTerrainV1 : texTerrainV1 || texTerrainV2;

      // ====================================================================
      // 1. ANCIENT OAK ASYMMETRICAL 2D ASSEMBLY STAGE (TASK-011 PROTOTYPE QA)
      // ====================================================================
      const treeContainer = new Container();
      treeContainer.x = window.innerWidth * 0.5;
      treeContainer.y = window.innerHeight * 0.52;
      treeContainer.visible = viewMode === 'TREE_ASSEMBLY';
      mainStage.addChild(treeContainer);
      treeContainerRef.current = treeContainer;

      // Ground Horizon Line
      const groundLine = new Graphics();
      groundLine.moveTo(-600, 0);
      groundLine.lineTo(600, 0);
      groundLine.stroke({ color: 0x10b981, width: 2, alpha: 0.85 });
      treeContainer.addChild(groundLine);

      const groundLabelStyle = new TextStyle({
        fill: '#10b981',
        fontSize: 10,
        fontFamily: 'monospace',
        fontWeight: 'bold',
      });
      const groundLabel = new Text({ text: '─── ĐƯỜNG MẶT ĐẤT (Y = 0) ───', style: groundLabelStyle });
      groundLabel.position.set(-580, -18);
      treeContainer.addChild(groundLabel);

      // Assemble 4 parts per ASSET_PACK_002A_CONTRACT.md:
      // Contract scale: Logical world is 50% of 2x canvas source.
      // Logical sizes: Trunk 380x400 (Canvas 760x800), Bough 600x180 (Canvas 1200x360), Roots 320x460 (Canvas 640x920), Foliage 256x256 (Canvas 512x512)
      // Base scale = 0.5 for all assets at 1.0x logic.

      if (texTreeRoots && texTreeTrunk && texTreeBough && texTreeFoliage) {
        // Z: 35 Roots (Anchor: 0.50, 0.00 at ground level Y = 0)
        const rootsSprite = new Sprite(texTreeRoots);
        rootsSprite.anchor.set(0.5, 0.0);
        rootsSprite.scale.set(0.5);
        rootsSprite.position.set(0, 0);
        treeContainer.addChild(rootsSprite);
        treeRootsSpriteRef.current = rootsSprite;

        // Z: 40 Trunk Base (Anchor: 0.50, 1.00 at ground level Y = 0)
        const trunkSprite = new Sprite(texTreeTrunk);
        trunkSprite.anchor.set(0.5, 1.0);
        trunkSprite.scale.set(0.5);
        trunkSprite.position.set(0, 0);
        treeContainer.addChild(trunkSprite);
        treeTrunkSpriteRef.current = trunkSprite;

        // Z: 45 Main Bough (Anchor: 0.15, 0.65)
        // Mounted on the V-crotch at top of trunk: Top of trunk is around Y = -400 (logic)
        // With overlap, anchor connects at (X: -20, Y: -360)
        const boughSprite = new Sprite(texTreeBough);
        boughSprite.anchor.set(0.15, 0.65);
        boughSprite.scale.set(0.5);
        boughSprite.position.set(-30, -360);
        treeContainer.addChild(boughSprite);
        treeBoughSpriteRef.current = boughSprite;

        // Z: 70 Canopy Clumps
        const foliageSprite = new Sprite(texTreeFoliage);
        foliageSprite.anchor.set(0.5, 0.5);
        foliageSprite.scale.set(0.5);
        foliageSprite.position.set(60, -480);
        treeContainer.addChild(foliageSprite);
        treeFoliageSpriteRef.current = foliageSprite;

        // Test Ant walking on Bough (Z: 50)
        if (activeAntTex) {
          const treeAnt = new Sprite(activeAntTex);
          treeAnt.anchor.set(0.5, 0.8438);
          treeAnt.scale.set(0.317); // 36px span
          treeAnt.position.set(120, -385); // Walking on bough moss
          treeContainer.addChild(treeAnt);

          // Bee flying near canopy (Z: 60)
          const beeBadge = new Graphics();
          beeBadge.circle(180, -460, 8);
          beeBadge.fill({ color: 0xf59e0b });
          treeContainer.addChild(beeBadge);

          const beeLabel = new Text({
            text: '🐝 Bee (Z:60)',
            style: new TextStyle({ fill: '#f59e0b', fontSize: 9, fontFamily: 'monospace', fontWeight: 'bold' }),
          });
          beeLabel.position.set(195, -465);
          treeContainer.addChild(beeLabel);

          const antLabel = new Text({
            text: '🐜 Ant (Z:50)',
            style: new TextStyle({ fill: '#10b981', fontSize: 9, fontFamily: 'monospace', fontWeight: 'bold' }),
          });
          antLabel.position.set(135, -405);
          treeContainer.addChild(antLabel);
        }

        // Beehive reserved box indicator
        const beehiveBox = new Graphics();
        beehiveBox.rect(100, -330, 120, 80);
        beehiveBox.stroke({ color: 0xf59e0b, width: 1.5, alpha: 0.8 });
        treeContainer.addChild(beehiveBox);

        const beehiveLabel = new Text({
          text: '🍯 BEEHIVE ZONE (Reserved)',
          style: new TextStyle({ fill: '#f59e0b', fontSize: 9, fontFamily: 'monospace', fontWeight: 'bold' }),
        });
        beehiveLabel.position.set(100, -345);
        treeContainer.addChild(beehiveLabel);
      }

      // ====================================================================
      // 2. TREE SEAMS & DISASSEMBLY AUDIT STAGE
      // ====================================================================
      const treeSeamsContainer = new Container();
      treeSeamsContainer.x = window.innerWidth * 0.15;
      treeSeamsContainer.y = window.innerHeight * 0.20;
      treeSeamsContainer.visible = viewMode === 'TREE_SEAMS';
      mainStage.addChild(treeSeamsContainer);
      treeSeamsContainerRef.current = treeSeamsContainer;

      const seamGraphicsTree = new Graphics();
      treeSeamsContainer.addChild(seamGraphicsTree);
      seamGraphicsTreeRef.current = seamGraphicsTree;

      if (texTreeTrunk && texTreeBough && texTreeFoliage && texTreeRoots) {
        // Render 4 individual assets side-by-side with bounding boxes and bounding measurements
        const items = [
          { name: '1. GỐC THÂN (Trunk Base)', tex: texTreeTrunk, x: 0, y: 0, w: 220, h: 232, orig: '760×800' },
          { name: '2. CÀNH NGANG (Bough)', tex: texTreeBough, x: 260, y: 0, w: 320, h: 96, orig: '1200×360' },
          { name: '3. TÁN LÁ (Canopy)', tex: texTreeFoliage, x: 620, y: 0, w: 180, h: 180, orig: '512×512' },
          { name: '4. CHÙM RỄ (Deep Roots)', tex: texTreeRoots, x: 840, y: 0, w: 180, h: 258, orig: '640×920' },
        ];

        items.forEach((item) => {
          const card = new Container();
          card.position.set(item.x, item.y);

          const sp = new Sprite(item.tex);
          sp.width = item.w;
          sp.height = item.h;
          card.addChild(sp);

          const border = new Graphics();
          border.rect(0, 0, item.w, item.h);
          border.stroke({ color: 0x38bdf8, width: 1.5, alpha: 0.9 });
          card.addChild(border);

          const title = new Text({
            text: `${item.name}\nCanvas: ${item.orig}`,
            style: new TextStyle({ fill: '#38bdf8', fontSize: 10, fontFamily: 'monospace', fontWeight: 'bold' }),
          });
          title.position.set(0, -28);
          card.addChild(title);

          treeSeamsContainer.addChild(card);
        });
      }

      // ====================================================================
      // 3. LEGACY STAGES (GAMEPLAY_SCALE, ANT_INSPECT, TERRAIN_3X3, TERRAIN_5X5, V1_V2_COMPARE)
      // ====================================================================
      const antGameplayContainer = new Container();
      antGameplayContainer.x = window.innerWidth * 0.5;
      antGameplayContainer.y = window.innerHeight * 0.52;
      antGameplayContainer.visible = viewMode === 'GAMEPLAY_SCALE';
      mainStage.addChild(antGameplayContainer);
      antGameplayContainerRef.current = antGameplayContainer;

      if (activeTerrainTex) {
        const soilStrip = new Sprite(activeTerrainTex);
        soilStrip.x = -320;
        soilStrip.y = 0;
        soilStrip.width = 640;
        soilStrip.height = 160;
        antGameplayContainer.addChild(soilStrip);
      }

      if (activeAntTex) {
        const gpAntSprite = new Sprite(activeAntTex);
        gpAntSprite.anchor.set(0.5, 0.8438);
        const targetScale = 20.0 / (assetVersion === 'V2' ? 63.0 : 50.0);
        gpAntSprite.scale.set(targetScale);
        antGameplayContainer.addChild(gpAntSprite);
      }

      const antMasterContainer = new Container();
      antMasterContainer.x = window.innerWidth * 0.5;
      antMasterContainer.y = window.innerHeight * 0.52;
      antMasterContainer.visible = viewMode === 'ANT_INSPECT';
      mainStage.addChild(antMasterContainer);
      antMasterContainerRef.current = antMasterContainer;

      if (activeAntTex) {
        const masterSprite = new Sprite(activeAntTex);
        masterSprite.anchor.set(0.5, 0.8438);
        antMasterContainer.addChild(masterSprite);

        const pivotGraphics = new Graphics();
        antMasterContainer.addChild(pivotGraphics);
        pivotGraphicsRef.current = pivotGraphics;
      }

      // Terrain 3x3
      const terrain3x3Container = new Container();
      terrain3x3Container.visible = viewMode === 'TERRAIN_3X3';
      mainStage.addChild(terrain3x3Container);
      terrain3x3ContainerRef.current = terrain3x3Container;

      const seamGraphics3x3 = new Graphics();
      seamGraphics3x3Ref.current = seamGraphics3x3;

      if (activeTerrainTex) {
        const matrix3x3 = new Container();
        matrix3x3.x = window.innerWidth * 0.45;
        matrix3x3.y = window.innerHeight * 0.18;
        const tSize = 140;

        for (let r = 0; r < 3; r++) {
          for (let c = 0; c < 3; c++) {
            const tile = new Sprite(activeTerrainTex);
            tile.x = c * tSize;
            tile.y = r * tSize;
            tile.width = tSize;
            tile.height = tSize;
            matrix3x3.addChild(tile);
          }
        }
        matrix3x3.addChild(seamGraphics3x3);
        terrain3x3Container.addChild(matrix3x3);
      }

      // Terrain 5x5
      const terrain5x5Container = new Container();
      terrain5x5Container.visible = viewMode === 'TERRAIN_5X5';
      mainStage.addChild(terrain5x5Container);
      terrain5x5ContainerRef.current = terrain5x5Container;

      const seamGraphics5x5 = new Graphics();
      seamGraphics5x5Ref.current = seamGraphics5x5;

      if (activeTerrainTex) {
        const matrix5x5 = new Container();
        matrix5x5.x = window.innerWidth * 0.40;
        matrix5x5.y = window.innerHeight * 0.15;
        const t5Size = 96;

        for (let r = 0; r < 5; r++) {
          for (let c = 0; c < 5; c++) {
            const tile = new Sprite(activeTerrainTex);
            tile.x = c * t5Size;
            tile.y = r * t5Size;
            tile.width = t5Size;
            tile.height = t5Size;
            matrix5x5.addChild(tile);
          }
        }
        matrix5x5.addChild(seamGraphics5x5);
        terrain5x5Container.addChild(matrix5x5);
      }

      // Compare
      const compareContainer = new Container();
      compareContainer.visible = viewMode === 'V1_V2_COMPARE';
      mainStage.addChild(compareContainer);
      compareContainerRef.current = compareContainer;
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
  }, [assetVersion]);

  // Sync background pattern
  useEffect(() => {
    renderBackground(bgPattern);
  }, [bgPattern]);

  // Sync tree layer toggles
  useEffect(() => {
    if (treeRootsSpriteRef.current) treeRootsSpriteRef.current.visible = showTreeLayers.roots;
    if (treeTrunkSpriteRef.current) treeTrunkSpriteRef.current.visible = showTreeLayers.trunk;
    if (treeBoughSpriteRef.current) treeBoughSpriteRef.current.visible = showTreeLayers.bough;
    if (treeFoliageSpriteRef.current) treeFoliageSpriteRef.current.visible = showTreeLayers.foliage;
  }, [showTreeLayers]);

  // Sync Zoom level to active Container
  useEffect(() => {
    if (viewMode === 'TREE_ASSEMBLY' && treeContainerRef.current) {
      treeContainerRef.current.scale.set(zoomLevel);
    } else if (viewMode === 'TREE_SEAMS' && treeSeamsContainerRef.current) {
      treeSeamsContainerRef.current.scale.set(zoomLevel);
    } else if (viewMode === 'GAMEPLAY_SCALE' && antGameplayContainerRef.current) {
      antGameplayContainerRef.current.scale.set(zoomLevel);
    } else if (viewMode === 'ANT_INSPECT' && antMasterContainerRef.current) {
      antMasterContainerRef.current.scale.set(zoomLevel);
    }
  }, [zoomLevel, viewMode]);

  // Sync View Mode visibility
  useEffect(() => {
    if (treeContainerRef.current) treeContainerRef.current.visible = viewMode === 'TREE_ASSEMBLY';
    if (treeSeamsContainerRef.current) treeSeamsContainerRef.current.visible = viewMode === 'TREE_SEAMS';
    if (antGameplayContainerRef.current) antGameplayContainerRef.current.visible = viewMode === 'GAMEPLAY_SCALE';
    if (antMasterContainerRef.current) antMasterContainerRef.current.visible = viewMode === 'ANT_INSPECT';
    if (terrain3x3ContainerRef.current) terrain3x3ContainerRef.current.visible = viewMode === 'TERRAIN_3X3';
    if (terrain5x5ContainerRef.current) terrain5x5ContainerRef.current.visible = viewMode === 'TERRAIN_5X5';
    if (compareContainerRef.current) compareContainerRef.current.visible = viewMode === 'V1_V2_COMPARE';
  }, [viewMode]);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-neutral-950 font-sans select-none">
      {/* Top Header Navigation */}
      <header className="fixed top-3 left-4 right-4 z-40 flex items-center justify-between pointer-events-none">
        {/* Brand pill */}
        <div className="flex items-center gap-3 bg-neutral-900/95 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10 shadow-2xl pointer-events-auto">
          <div className="w-8 h-8 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-black text-sm">
            🌳
          </div>
          <div>
            <h1 className="text-xs font-black tracking-widest text-emerald-100 uppercase">
              The Vivarium — Ancient Oak Prototype QA (Task-011)
            </h1>
            <p className="text-[10px] text-emerald-400 font-medium">
              Kiểm định 4 lớp: Thân, Cành, Tán, Rễ & Khớp nối Overlap
            </p>
          </div>
        </div>

        {/* View Mode Tabs */}
        <div className="flex items-center gap-1.5 bg-neutral-900/95 backdrop-blur-md p-1.5 rounded-2xl border border-white/10 shadow-2xl pointer-events-auto text-xs font-bold">
          <button
            onClick={() => setViewMode('TREE_ASSEMBLY')}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              viewMode === 'TREE_ASSEMBLY'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                : 'text-neutral-400 hover:text-white hover:bg-white/10'
            }`}
          >
            🌳 Cây Ghép Hoàn Chỉnh
          </button>
          <button
            onClick={() => setViewMode('TREE_SEAMS')}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              viewMode === 'TREE_SEAMS'
                ? 'bg-sky-600 text-white shadow-lg shadow-sky-600/30'
                : 'text-neutral-400 hover:text-white hover:bg-white/10'
            }`}
          >
            🧩 Khớp Nối & Rời Từng Lớp
          </button>
          <button
            onClick={() => setViewMode('GAMEPLAY_SCALE')}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              viewMode === 'GAMEPLAY_SCALE'
                ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/30'
                : 'text-neutral-400 hover:text-white hover:bg-white/10'
            }`}
          >
            🐜 Kiến & Đất V2
          </button>
          <button
            onClick={() => setViewMode('TERRAIN_3X3')}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              viewMode === 'TERRAIN_3X3'
                ? 'bg-neutral-800 text-neutral-300'
                : 'text-neutral-500 hover:text-white'
            }`}
          >
            🧱 Đất 3×3
          </button>
          <button
            onClick={() => setViewMode('V1_V2_COMPARE')}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              viewMode === 'V1_V2_COMPARE'
                ? 'bg-neutral-800 text-neutral-300'
                : 'text-neutral-500 hover:text-white'
            }`}
          >
            ⚖️ So Sánh V1/V2
          </button>
        </div>

        {/* Back to Home Button */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <a
            href="/"
            className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all border border-white/10 flex items-center gap-1.5"
          >
            <span>🎮 Về Game</span>
          </a>
        </div>
      </header>

      {/* Main Viewport Canvas rendered in containerRef */}
      <div ref={containerRef} className="w-full h-full" />

      {/* Bottom Floating Toolbar */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 flex items-center gap-4 bg-neutral-900/95 backdrop-blur-md px-5 py-2.5 rounded-2xl border border-white/10 shadow-2xl">
        {/* Zoom Controls */}
        <div className="flex items-center gap-2 border-r border-white/10 pr-4">
          <span className="text-[11px] font-mono text-neutral-400 font-bold">ZOOM:</span>
          {([0.5, 1.0, 2.0, 4.0] as const).map((z) => (
            <button
              key={z}
              onClick={() => setZoomLevel(z)}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all ${
                zoomLevel === z
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-neutral-400 hover:text-white hover:bg-white/10'
              }`}
            >
              {z}x
            </button>
          ))}
        </div>

        {/* Layer Toggles (Visible in TREE_ASSEMBLY) */}
        {viewMode === 'TREE_ASSEMBLY' && (
          <div className="flex items-center gap-1.5 border-r border-white/10 pr-4 text-xs font-bold font-mono">
            <span className="text-[11px] text-neutral-400 mr-1">LỚP CÂY:</span>
            <button
              onClick={() => setShowTreeLayers((p) => ({ ...p, foliage: !p.foliage }))}
              className={`px-2 py-1 rounded-lg transition-all ${
                showTreeLayers.foliage ? 'bg-emerald-900 text-emerald-300 border border-emerald-600/50' : 'text-neutral-500 line-through'
              }`}
            >
              🍃 Tán Lá
            </button>
            <button
              onClick={() => setShowTreeLayers((p) => ({ ...p, bough: !p.bough }))}
              className={`px-2 py-1 rounded-lg transition-all ${
                showTreeLayers.bough ? 'bg-amber-900 text-amber-300 border border-amber-600/50' : 'text-neutral-500 line-through'
              }`}
            >
              🪵 Cành Bạnh
            </button>
            <button
              onClick={() => setShowTreeLayers((p) => ({ ...p, trunk: !p.trunk }))}
              className={`px-2 py-1 rounded-lg transition-all ${
                showTreeLayers.trunk ? 'bg-stone-900 text-stone-300 border border-stone-600/50' : 'text-neutral-500 line-through'
              }`}
            >
              🌲 Thân Gốc
            </button>
            <button
              onClick={() => setShowTreeLayers((p) => ({ ...p, roots: !p.roots }))}
              className={`px-2 py-1 rounded-lg transition-all ${
                showTreeLayers.roots ? 'bg-yellow-950 text-yellow-300 border border-yellow-700/50' : 'text-neutral-500 line-through'
              }`}
            >
              🌿 Chùm Rễ
            </button>
          </div>
        )}

        {/* Background Toggles */}
        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-[11px] font-mono text-neutral-400 font-bold mr-1">NỀN:</span>
          {(['EARTH', 'CHECKER', 'BLACK', 'WHITE'] as const).map((bg) => (
            <button
              key={bg}
              onClick={() => setBgPattern(bg)}
              className={`px-2 py-1 rounded-lg text-xs font-bold transition-all ${
                bgPattern === bg
                  ? 'bg-emerald-600 text-white font-bold'
                  : 'text-neutral-400 hover:text-white hover:bg-white/10'
              }`}
            >
              {bg === 'EARTH' && 'Đất Tối'}
              {bg === 'CHECKER' && 'Caro'}
              {bg === 'BLACK' && 'Đen'}
              {bg === 'WHITE' && 'Trắng'}
            </button>
          ))}
        </div>
      </div>

      {/* Left Telemetry Card */}
      <div className="fixed top-20 left-4 z-30 w-88 bg-neutral-900/90 backdrop-blur-md p-4 rounded-2xl border border-white/10 shadow-2xl text-xs text-neutral-300">
        <h3 className="font-bold text-emerald-200 mb-2 flex items-center justify-between">
          <span>THÔNG SỐ ĐO ĐẠC PACK-002-A</span>
          <span className="text-[10px] px-2 py-0.5 rounded bg-amber-950 text-amber-400 border border-amber-800/50 font-mono font-bold">
            PROTOTYPE AUDIT
          </span>
        </h3>

        <div className="space-y-3 font-mono text-[11px]">
          {viewMode === 'TREE_ASSEMBLY' || viewMode === 'TREE_SEAMS' ? (
            <div className="p-3 rounded-xl bg-black/50 border border-white/5 space-y-2">
              <div className="flex justify-between items-center text-amber-400 font-bold">
                <span>CÂY SỒI CỔ THỤ (4 LỚP)</span>
                <span className="text-amber-400 font-bold">PROTOTYPE QA</span>
              </div>
              <div className="text-[10px] space-y-1 pt-1 border-t border-white/10 text-neutral-300">
                <div>• <span className="text-stone-400 font-bold">Thân gốc:</span> 760×800 px (Bounding: 468×365 px)</div>
                <div>• <span className="text-amber-400 font-bold">Cành ngang:</span> 1200×360 px (Bounding: 565×313 px)</div>
                <div>• <span className="text-emerald-400 font-bold">Tán lá sồi:</span> 512×512 px (Bounding: 465×404 px)</div>
                <div>• <span className="text-yellow-500 font-bold">Chùm rễ sâu:</span> 640×920 px (Bounding: 471×405 px)</div>
              </div>
              <div className="text-[9px] text-rose-400 pt-1 border-t border-white/10 space-y-1">
                <div className="font-bold">⚠️ PHÁT HIỆN LỖI MỸ THUẬT:</div>
                <div>1. Thân và Rễ vẽ co cụm ở giữa canvas, để lại khoảng trống đệm lớn.</div>
                <div>2. Đỉnh thân cây cắt cụt, chưa có chạc V loe đón cành ngang bough.</div>
                <div>3. Rễ không loe tiếp giáp trọn vẹn với chu vi gốc cây.</div>
                <div>4. Vết caro được khử thuật toán nhưng có tì vết khử viền.</div>
              </div>
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-black/50 border border-white/5 space-y-2">
              <div className="text-amber-400 font-bold">CHẾ ĐỘ KIỂM ĐỊNH KHÁC</div>
              <div className="text-[10px] text-neutral-400">Xem lại kiến thợ 26×18px và ma trận đất mùn V2 đã được phê duyệt.</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
