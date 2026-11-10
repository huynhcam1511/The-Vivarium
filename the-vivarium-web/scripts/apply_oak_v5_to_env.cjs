const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, '..', 'src', 'components', 'EnvironmentPreviewScene.tsx');
let content = fs.readFileSync(targetPath, 'utf8').replace(/\r\n/g, '\n');

// 1. Add treeVersion state & refs
const stateTarget = `  const [activeBrush, setActiveBrush] = useState<'NONE' | 'DIG' | 'FILL'>('NONE');`;
const stateReplacement = `  const [activeBrush, setActiveBrush] = useState<'NONE' | 'DIG' | 'FILL'>('NONE');
  const [treeVersion, setTreeVersion] = useState<'V5' | 'V2'>('V5');
  const treeVersionRef = useRef<'V5' | 'V2'>('V5');
  treeVersionRef.current = treeVersion;
  const rootBackGroupRef = useRef<Container | null>(null);
  const trunkFrontGroupRef = useRef<Container | null>(null);
  const texturesRef = useRef<any>({});
  const updateTreeRef = useRef<((v: 'V5' | 'V2') => void) | null>(null);`;

if (!content.includes(stateTarget)) {
  console.error("Could not find stateTarget");
  process.exit(1);
}
content = content.replace(stateTarget, stateReplacement);

// 2. Add loading for env_tree_ancient_unified_v5.png
const assetLoadTarget = `      // Load Assets
      const trunkPath = '/assets/source/env_tree_ancient_trunk_base_v2.png';`;
const assetLoadReplacement = `      // Load Assets
      const unifiedV5Path = '/assets/qa_temp_v5/env_tree_ancient_unified_v5.png';
      const trunkPath = '/assets/source/env_tree_ancient_trunk_base_v2.png';`;
content = content.replace(assetLoadTarget, assetLoadReplacement);

const letTexTarget = `      let texTrunk: any = null;`;
const letTexReplacement = `      let texUnifiedV5: any = null;
      let texTrunk: any = null;`;
content = content.replace(letTexTarget, letTexReplacement);

const tryLoadTarget = `        texTrunk = await Assets.load(trunkPath);`;
const tryLoadReplacement = `        texUnifiedV5 = await Assets.load(unifiedV5Path).catch(() => null);
        texTrunk = await Assets.load(trunkPath);`;
content = content.replace(tryLoadTarget, tryLoadReplacement);

// 3. Replace ancient oak assembly with Dual-Pass Sandwich & dynamic tree updater
const treeAssemblyStart = `      // ====================================================================
      // 4. ANCIENT OAK 4-LAYER ASSEMBLY (Z: 35 Roots, Z: 40 Trunk, Z: 45 Bough, Z: 70 Foliage)
      // Ground elevation at trunk center (X = 0)
      // ====================================================================`;
const treeAssemblyEnd = `      // ====================================================================
      // 4E. PACK-002-B1: GROUND SURFACE & VEGETATION (Z: 50 Grass Strip, Z: 52 Tuft, Z: 55 Flowers)
      // ====================================================================`;

const startIndex = content.indexOf(treeAssemblyStart);
const endIndex = content.indexOf(treeAssemblyEnd);

if (startIndex === -1 || endIndex === -1) {
  console.error("Could not find treeAssembly bounds", { startIndex, endIndex });
  process.exit(1);
}

const newTreeAssembly = `      // ====================================================================
      // 4. ANCIENT OAK ASSEMBLY (Oak V5 Dual-Pass Sandwich or V2 4-Layer Fallback)
      // ====================================================================
      texturesRef.current = {
        texUnifiedV5,
        texTrunk,
        texBough,
        texFoliage,
        texRoots,
      };

      const rootBackGroup = new Container();
      // Insert roots behind terrain mesh (Z: 30)
      const terrainIndex = worldContainer.children.indexOf(terrainRenderer.container);
      worldContainer.addChildAt(rootBackGroup, Math.max(0, terrainIndex));
      rootBackGroupRef.current = rootBackGroup;

      const trunkFrontGroup = new Container();
      // Insert trunk on front of terrain mesh (Z: 45)
      worldContainer.addChild(trunkFrontGroup);
      trunkFrontGroupRef.current = trunkFrontGroup;

      const trunkGroundY = terrainData.getSurfaceY(0);

      const updateTreeAssembly = (v: 'V5' | 'V2') => {
        rootBackGroup.removeChildren();
        trunkFrontGroup.removeChildren();

        const { texUnifiedV5, texTrunk, texBough, texFoliage, texRoots } = texturesRef.current;

        if (v === 'V5' && texUnifiedV5) {
          // === PASS 1: ROOT SYSTEM (Z: 30) ===
          // Placed behind Solid Soil; exposed only when excavated!
          const rootSpr = new Sprite(texUnifiedV5);
          rootSpr.anchor.set(0.5, 0.55);
          rootSpr.scale.set(0.5);
          rootSpr.position.set(0, trunkGroundY);

          // Mask: Only show below undulating ground surface contour
          const rootMask = new Graphics();
          const rootMaskPts: { x: number; y: number }[] = [];
          rootMaskPts.push({ x: -600, y: trunkGroundY + 1200 });
          for (let mx = -600; mx <= 600; mx += 16) {
            rootMaskPts.push({ x: mx, y: terrainData.getSurfaceY(mx) - 6 });
          }
          rootMaskPts.push({ x: 600, y: trunkGroundY + 1200 });
          rootMask.poly(rootMaskPts).fill({ color: 0xffffff });
          rootSpr.mask = rootMask;
          rootSpr.addChild(rootMask);
          rootBackGroup.addChild(rootSpr);
          rootsSpriteRef.current = rootSpr;

          // === PASS 2: TRUNK & BUTTRESS FLARE (Z: 45) ===
          // Placed in front of Solid Soil; anchored naturally into groundline
          const trunkSpr = new Sprite(texUnifiedV5);
          trunkSpr.anchor.set(0.5, 0.55);
          trunkSpr.scale.set(0.5);
          trunkSpr.position.set(0, trunkGroundY);

          const trunkMask = new Graphics();
          const trunkMaskPts: { x: number; y: number }[] = [];
          trunkMaskPts.push({ x: -600, y: trunkGroundY - 1200 });
          trunkMaskPts.push({ x: 600, y: trunkGroundY - 1200 });
          for (let mx = 600; mx >= -600; mx -= 16) {
            trunkMaskPts.push({ x: mx, y: terrainData.getSurfaceY(mx) + 12 });
          }
          trunkMask.poly(trunkMaskPts).fill({ color: 0xffffff });
          trunkSpr.mask = trunkMask;
          trunkSpr.addChild(trunkMask);
          trunkFrontGroup.addChild(trunkSpr);
          trunkSpriteRef.current = trunkSpr;

          // === PASS 3: LUSH CANOPY FOLIAGE ===
          if (texFoliage) {
            const canopyContainer = new Container();
            canopyContainer.position.set(40, trunkGroundY - 340);
            trunkFrontGroup.addChild(canopyContainer);
            canopyContainerRef.current = canopyContainer;

            const foliage1 = new Sprite(texFoliage);
            foliage1.anchor.set(0.5, 0.5);
            foliage1.scale.set(0.48);
            canopyContainer.addChild(foliage1);

            const foliage2 = new Sprite(texFoliage);
            foliage2.anchor.set(0.5, 0.5);
            foliage2.scale.set(0.42);
            foliage2.position.set(-140, 30);
            foliage2.alpha = 0.92;
            canopyContainer.addChild(foliage2);
          }
        } else {
          // === V2 FALLBACK (Old Assembly) ===
          if (texRoots) {
            const rootsSprite = new Sprite(texRoots);
            rootsSprite.anchor.set(0.5, 0.0);
            rootsSprite.scale.set(0.5);
            rootsSprite.position.set(0, trunkGroundY - 4);
            rootBackGroup.addChild(rootsSprite);
            rootsSpriteRef.current = rootsSprite;
          }
          if (texTrunk) {
            const trunkSprite = new Sprite(texTrunk);
            trunkSprite.anchor.set(0.5, 1.0);
            trunkSprite.scale.set(0.5);
            trunkSprite.position.set(0, trunkGroundY);
            trunkFrontGroup.addChild(trunkSprite);
            trunkSpriteRef.current = trunkSprite;
          }
          if (texBough) {
            const boughSprite = new Sprite(texBough);
            boughSprite.anchor.set(0.15, 0.65);
            boughSprite.scale.set(0.5);
            boughSprite.position.set(-10, trunkGroundY - 285);
            trunkFrontGroup.addChild(boughSprite);
            boughSpriteRef.current = boughSprite;
          }
          if (texFoliage) {
            const canopyContainer = new Container();
            canopyContainer.position.set(80, trunkGroundY - 410);
            trunkFrontGroup.addChild(canopyContainer);
            canopyContainerRef.current = canopyContainer;

            const foliageSprite = new Sprite(texFoliage);
            foliageSprite.anchor.set(0.5, 0.5);
            foliageSprite.scale.set(0.5);
            canopyContainer.addChild(foliageSprite);
          }
        }
      };

      updateTreeRef.current = updateTreeAssembly;
      updateTreeAssembly(treeVersionRef.current);
`;

content = content.substring(0, startIndex) + newTreeAssembly + "\n      " + content.substring(endIndex);

// 4. Add useEffect to trigger updateTree when treeVersion state changes
const effectTarget = `  useEffect(() => {
    let active = true;`;
const effectReplacement = `  useEffect(() => {
    if (updateTreeRef.current) {
      updateTreeRef.current(treeVersion);
    }
  }, [treeVersion]);

  useEffect(() => {
    let active = true;`;
content = content.replace(effectTarget, effectReplacement);

// 5. Update header title
content = content.replace(
  `The Vivarium — Organic Terrain Foundation (Task-013)`,
  `The Vivarium — Environment Preview (Tích Hợp Cổ Thụ Sồi V5)`
);
content = content.replace(
  `Địa Hình Hữu Cơ Uốn Lượn + Hầm Hang Cong + Bút Đào/Lấp Thử Nghiệm`,
  `Cây Sồi V5 Thống Nhất Liền Khối + Rễ Ẩn Ngầm Tự Nhiên + Hầm Hang Cong`
);

// 6. Add UI Toggle buttons in bottom control bar
const toolbarTarget = `        {/* Interactive Dig / Fill Brushes */}`;
const toolbarReplacement = `        {/* Cây Sồi V5 / V2 Version Switcher */}
        <div className="flex items-center gap-1.5 border-r border-white/10 pr-3 text-xs font-mono">
          <span className="text-[11px] text-amber-400 font-bold mr-1">CÂY SỒI:</span>
          <button
            onClick={() => setTreeVersion('V5')}
            className={\`px-3 py-1 rounded-lg font-bold transition-all \${
              treeVersion === 'V5'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 ring-1 ring-emerald-400'
                : 'bg-neutral-800 text-neutral-400 hover:text-white'
            }\`}
          >
            🌳 Oak V5 (Liền Khối Mới)
          </button>
          <button
            onClick={() => setTreeVersion('V2')}
            className={\`px-2.5 py-1 rounded-lg font-bold transition-all \${
              treeVersion === 'V2'
                ? 'bg-amber-700 text-white shadow-md'
                : 'bg-neutral-800 text-neutral-400 hover:text-white'
            }\`}
          >
            🪵 Oak V2 (Bản Cũ Đứt Đoạn)
          </button>
        </div>

        {/* Interactive Dig / Fill Brushes */}`;

content = content.replace(toolbarTarget, toolbarReplacement);

fs.writeFileSync(targetPath, content, 'utf8');
console.log("Successfully patched EnvironmentPreviewScene.tsx with Oak V5!");
