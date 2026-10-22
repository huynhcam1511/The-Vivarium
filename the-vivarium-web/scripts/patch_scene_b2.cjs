const fs = require('fs');
const file = '.worktrees/task-021-world-integration/the-vivarium-web/src/components/WorldIntegrationScene.tsx';
let content = fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n');

// 1. Update weather initialization with PACK-005 textures
const oldWeatherLoad = [
  '      // 1. SKY & DISTANT HORIZON LAYER (Behind everything)',
  '      const weatherSystem = weatherSystemRef.current;',
  '      const weatherRenderer = new WeatherRenderer(weatherSystem, 3200, 1600);',
  '      weatherRenderer.container.position.set(-1600, -900);',
  '      worldStage.addChild(weatherRenderer.container);',
  '',
  '      // 2. SUBTERRANEAN ORGANIC TERRAIN & CAVE CAVITIES',
  '      const terrainData = terrainDataRef.current;',
  '      const terrainRenderer = new OrganicTerrainRenderer(terrainData);',
  '      terrainRendererRef.current = terrainRenderer;',
  '      worldStage.addChild(terrainRenderer.container);',
  '',
  '      // Try load soil texture',
  '      try {',
  "        const soilTex = await Assets.load('/assets/terrain/terrain_soil_dark_loam_v2.png');",
  '        if (soilTex) terrainRenderer.setSoilTexture(soilTex);',
  '      } catch (e) {',
  "        console.warn('Soil texture fallback:', e);",
  '      }',
  '      terrainRenderer.rebuildTerrainMesh(false);'
].join('\n');

const newWeatherLoad = [
  '      // 1. SKY & DISTANT HORIZON LAYER (Behind everything)',
  '      const weatherSystem = weatherSystemRef.current;',
  '      const weatherRenderer = new WeatherRenderer(weatherSystem, 3200, 1600);',
  '      weatherRenderer.container.position.set(-1600, -900);',
  '      worldStage.addChild(weatherRenderer.container);',
  '',
  '      // Load PACK-005 Real Weather Textures',
  '      try {',
  '        const [mountainTex, cloudsTex, fogMistTex, leafFallTex, rainDropTex] = await Promise.all([',
  "          Assets.load('/assets/environment/weather/env_sky_mountain_001.png').catch(() => null),",
  "          Assets.load('/assets/environment/weather/env_sky_clouds_001.png').catch(() => null),",
  "          Assets.load('/assets/environment/weather/env_fx_fog_mist.png').catch(() => null),",
  "          Assets.load('/assets/environment/weather/env_canopy_leaf_fall.png').catch(() => null),",
  "          Assets.load('/assets/environment/weather/env_fx_rain_drop_01.png').catch(() => null),",
  '        ]);',
  '        weatherRenderer.setWeatherTextures({',
  '          mountainTex,',
  '          cloudsTex,',
  '          fogMistTex,',
  '          leafFallTex,',
  '          rainDropTex,',
  '        });',
  '      } catch (e) {',
  "        console.warn('Weather textures load fallback:', e);",
  '      }',
  '',
  '      // 2. SUBTERRANEAN ORGANIC TERRAIN & CAVE CAVITIES',
  '      const terrainData = terrainDataRef.current;',
  '      const terrainRenderer = new OrganicTerrainRenderer(terrainData);',
  '      terrainRendererRef.current = terrainRenderer;',
  '      worldStage.addChild(terrainRenderer.container);',
  '',
  '      // Try load soil & PACK-003 strata textures',
  '      try {',
  "        const soilTex = await Assets.load('/assets/terrain/terrain_soil_dark_loam_v2.png');",
  '        if (soilTex) terrainRenderer.setSoilTexture(soilTex);',
  '',
  '        // Load PACK-003 Stratified textures (Clay, Peat, Pebble)',
  '        const [clayTex, peatTex, pebbleTex] = await Promise.all([',
  "          Assets.load('/assets/environment/underground/env_terrain_clay_512.png').catch(() => null),",
  "          Assets.load('/assets/environment/underground/env_terrain_peat_512.png').catch(() => null),",
  "          Assets.load('/assets/environment/underground/env_pebble_embedded.png').catch(() => null),",
  '        ]);',
  '        if (clayTex && peatTex) {',
  '          terrainRenderer.setUndergroundStrata(clayTex, peatTex, pebbleTex);',
  '        }',
  '      } catch (e) {',
  "        console.warn('Soil texture fallback:', e);",
  '      }',
  '      terrainRenderer.rebuildTerrainMesh(false);'
].join('\n');

if (!content.includes(oldWeatherLoad)) {
  console.error('oldWeatherLoad not found!');
  process.exit(1);
}
content = content.replace(oldWeatherLoad, newWeatherLoad);

// 2. Update Aquatic Subsystem with PACK-004 textures
const oldAquaticLoad = [
  '      // 5. AQUATIC BASIN & WATERFALL SUBSYSTEM',
  '      const aquaticSystem = aquaticSystemRef.current;',
  '      const aquaticRenderer = new AquaticRenderer(aquaticSystem);',
  '      worldStage.addChild(aquaticRenderer.container);',
  '',
  '      // Interactive Dig/Fill cursor preview indicator'
].join('\n');

const newAquaticLoad = [
  '      // 5. AQUATIC BASIN & WATERFALL SUBSYSTEM',
  '      const aquaticSystem = aquaticSystemRef.current;',
  '      const aquaticRenderer = new AquaticRenderer(aquaticSystem);',
  '      worldStage.addChild(aquaticRenderer.container);',
  '',
  '      // Load PACK-004 Real Aquatic Textures',
  '      try {',
  '        const [mudTex, waterfallStreamTex, bluebellTex, mossTex, fernTex] = await Promise.all([',
  "          Assets.load('/assets/environment/aquatic/env_lake_bottom_mud.png').catch(() => null),",
  "          Assets.load('/assets/environment/aquatic/env_waterfall_stream.png').catch(() => null),",
  "          Assets.load('/assets/environment/aquatic/env_flower_bluebell.png').catch(() => null),",
  "          Assets.load('/assets/environment/aquatic/env_moss_patch.png').catch(() => null),",
  "          Assets.load('/assets/environment/aquatic/env_fern_cluster.png').catch(() => null),",
  '        ]);',
  '        aquaticRenderer.setAquaticTextures({',
  '          mudTex,',
  '          waterfallStreamTex,',
  '          bluebellTex,',
  '          mossTex,',
  '          fernTex,',
  '        });',
  '      } catch (e) {',
  "        console.warn('Aquatic textures load fallback:', e);",
  '      }',
  '',
  '      // Interactive Dig/Fill cursor preview indicator'
].join('\n');

if (!content.includes(oldAquaticLoad)) {
  console.error('oldAquaticLoad not found!');
  process.exit(1);
}
content = content.replace(oldAquaticLoad, newAquaticLoad);

// 3. Update pointer handlers: use dirty-box mesh rebuild and correct 32px origin alignment
const oldPointerHandlers = [
  '      // Event Listeners for Camera Drag / Dig-Fill',
  '      const handlePointerDown = (e: PointerEvent) => {',
  '        if (e.button === 1 || e.button === 2) {',
  '          camera.handleMouseDown(e.clientX, e.clientY, e.button);',
  '        } else if (e.button === 0) {',
  '          // World click for Dig / Fill',
  '          const worldPos = camera.screenToWorld({ x: e.clientX, y: e.clientY });',
  "          if (currentToolRef.current === 'DIG') {",
  '            terrainData.digRadius(worldPos.x, worldPos.y, 28);',
  '            terrainRenderer.rebuildTerrainMesh(false);',
  "          } else if (currentToolRef.current === 'FILL') {",
  '            terrainData.fillRadius(worldPos.x, worldPos.y, 28);',
  '            terrainRenderer.rebuildTerrainMesh(false);',
  '          }',
  '        }',
  '      };',
  '',
  '      const handlePointerMove = (e: PointerEvent) => {',
  '        camera.handleMouseMove(e.clientX, e.clientY);',
  '',
  '        // Smart Selection & Preview: update preview indicator',
  '        previewIndicator.clear();',
  "        if (currentToolRef.current === 'DIG' || currentToolRef.current === 'FILL') {",
  '          const worldPos = camera.screenToWorld({ x: e.clientX, y: e.clientY });',
  '          const cellX = Math.floor((worldPos.x + 960) / 32);',
  '          const cellY = Math.floor((worldPos.y + 200) / 32);',
  '',
  '          if (cellX >= 0 && cellX < terrainData.cols && cellY >= 0 && cellY < terrainData.rows) {',
  '            const wx = cellX * 32 - 960;',
  '            const wy = cellY * 32 - 200;',
  "            const isDig = currentToolRef.current === 'DIG';",
  '',
  '            previewIndicator.roundRect(wx + 1, wy + 1, 30, 30, 4);',
  '            previewIndicator.stroke({',
  '              color: isDig ? 0xffb703 : 0x06d6a0,',
  '              width: 2.0,',
  '              alpha: 0.9,',
  '            });',
  '            previewIndicator.roundRect(wx + 2, wy + 2, 28, 28, 3);',
  '            previewIndicator.fill({',
  '              color: isDig ? 0xffb703 : 0x06d6a0,',
  '              alpha: 0.25,',
  '            });',
  '          }',
  '        }',
  '      };'
].join('\n');

const newPointerHandlers = [
  '      // Event Listeners for Camera Drag / Dig-Fill (Optimized Dirty-Region Rebuild & Precise 32px Grid Alignment)',
  '      let isMouseDown = false;',
  '      let lastDragTime = 0;',
  '',
  '      const performDigFillAt = (worldPos: { x: number; y: number }) => {',
  '        const r = 28;',
  '        const dirtyBox = {',
  '          minX: worldPos.x - r - 10,',
  '          maxX: worldPos.x + r + 10,',
  '          minY: worldPos.y - r - 10,',
  '          maxY: worldPos.y + r + 10,',
  '        };',
  "        if (currentToolRef.current === 'DIG') {",
  '          terrainData.digRadius(worldPos.x, worldPos.y, r);',
  '          terrainRenderer.rebuildTerrainMesh(false, dirtyBox);',
  "        } else if (currentToolRef.current === 'FILL') {",
  '          terrainData.fillRadius(worldPos.x, worldPos.y, r);',
  '          terrainRenderer.rebuildTerrainMesh(false, dirtyBox);',
  '        }',
  '      };',
  '',
  '      const handlePointerDown = (e: PointerEvent) => {',
  '        if (e.button === 1 || e.button === 2) {',
  '          camera.handleMouseDown(e.clientX, e.clientY, e.button);',
  '        } else if (e.button === 0) {',
  '          isMouseDown = true;',
  '          const worldPos = camera.screenToWorld({ x: e.clientX, y: e.clientY });',
  '          performDigFillAt(worldPos);',
  '        }',
  '      };',
  '',
  '      const handlePointerMove = (e: PointerEvent) => {',
  '        camera.handleMouseMove(e.clientX, e.clientY);',
  '',
  '        const worldPos = camera.screenToWorld({ x: e.clientX, y: e.clientY });',
  '',
  '        // Continuous drag dig/fill support (throttled to 45ms for buttery smooth 60fps)',
  "        if (isMouseDown && (currentToolRef.current === 'DIG' || currentToolRef.current === 'FILL')) {",
  '          const now = performance.now();',
  '          if (now - lastDragTime > 45) {',
  '            lastDragTime = now;',
  '            performDigFillAt(worldPos);',
  '          }',
  '        }',
  '',
  '        // Smart Selection & Preview: calibrated exactly to terrain grid origin (-1200, 0)',
  '        previewIndicator.clear();',
  "        if (currentToolRef.current === 'DIG' || currentToolRef.current === 'FILL') {",
  '          const cellX = Math.floor((worldPos.x - terrainData.originX) / terrainData.cellSize);',
  '          const cellY = Math.floor((worldPos.y - terrainData.originY) / terrainData.cellSize);',
  '',
  '          if (cellX >= 0 && cellX < terrainData.cols && cellY >= 0 && cellY < terrainData.rows) {',
  '            const wx = terrainData.originX + cellX * terrainData.cellSize;',
  '            const wy = terrainData.originY + cellY * terrainData.cellSize;',
  "            const isDig = currentToolRef.current === 'DIG';",
  '',
  '            previewIndicator.roundRect(wx + 1, wy + 1, 30, 30, 4);',
  '            previewIndicator.stroke({',
  '              color: isDig ? 0xffb703 : 0x06d6a0,',
  '              width: 2.0,',
  '              alpha: 0.9,',
  '            });',
  '            previewIndicator.roundRect(wx + 2, wy + 2, 28, 28, 3);',
  '            previewIndicator.fill({',
  '              color: isDig ? 0xffb703 : 0x06d6a0,',
  '              alpha: 0.25,',
  '            });',
  '          }',
  '        }',
  '      };',
  '',
  '      const handlePointerUp = () => {',
  '        isMouseDown = false;',
  '        camera.handleMouseUp();',
  '      };'
].join('\n');

// Also replace the old handlePointerUp
const oldPointerUp = [
  '      const handlePointerUp = () => {',
  '        camera.handleMouseUp();',
  '      };'
].join('\n');

const fullOldPointerBlock = oldPointerHandlers + '\n\n' + oldPointerUp;

if (content.includes(fullOldPointerBlock)) {
  content = content.replace(fullOldPointerBlock, newPointerHandlers);
} else if (content.includes(oldPointerHandlers)) {
  content = content.replace(oldPointerHandlers, newPointerHandlers);
  content = content.replace(oldPointerUp, '');
} else {
  console.error('oldPointerHandlers not found!');
  process.exit(1);
}

fs.writeFileSync(file, content.replace(/\n/g, '\r\n'), 'utf8');
console.log('Successfully updated WorldIntegrationScene.tsx for Gate B.2!');
