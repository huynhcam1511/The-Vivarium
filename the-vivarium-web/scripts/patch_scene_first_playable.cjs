// scripts/patch_scene_first_playable.cjs
const fs = require('fs');
const path = require('path');

const scenePath = path.resolve(__dirname, '../src/components/WorldIntegrationScene.tsx');
let content = fs.readFileSync(scenePath, 'utf8').replace(/\r\n/g, '\n');

// 1. Add import for HoneydewSourceView
const importTarget = "import { ClayMudStockpileView } from '../rendering/ClayMudStockpileView';";
const importReplacement = `import { ClayMudStockpileView } from '../rendering/ClayMudStockpileView';\nimport { HoneydewSourceView } from '../rendering/HoneydewSourceView';`;

if (content.includes(importTarget)) {
  content = content.replace(importTarget, importReplacement);
}

// 2. Add Stockpile Clay Mud to Top Telemetry Header
const telemetryHeaderTarget = `          <div>
            <span className="text-neutral-400 mr-1">Honeydew:</span>
            <span className="font-bold text-amber-400" data-testid="telemetry-honeydew">{honeydewCount}</span>
          </div>`;

const telemetryHeaderReplacement = `          <div>
            <span className="text-neutral-400 mr-1">Bùn Đất Sét:</span>
            <span className="font-bold text-amber-500" data-testid="telemetry-clay-mud">{stockpileRef.current?.getAvailableCount() ?? 16}</span>
          </div>
          <div>
            <span className="text-neutral-400 mr-1">Mật Rệp (Food):</span>
            <span className="font-bold text-amber-400" data-testid="telemetry-honeydew">{honeydewCount}</span>
          </div>`;

if (content.includes(telemetryHeaderTarget)) {
  content = content.replace(telemetryHeaderTarget, telemetryHeaderReplacement);
}

// 3. Add HoneydewSourceView instantiation in subterranean layer
const viewTarget = `      // Physical Clay Mud Stockpile View (placed inside subterranean layer behind solid soil)
      const stockpileView = new ClayMudStockpileView(stockpile);
      stockpileViewRef.current = stockpileView;
      terrainRenderer.addSubterraneanLayer(stockpileView.container);`;

const viewReplacement = `      // Physical Clay Mud Stockpile View (placed inside subterranean layer behind solid soil)
      const stockpileView = new ClayMudStockpileView(stockpile);
      stockpileViewRef.current = stockpileView;
      terrainRenderer.addSubterraneanLayer(stockpileView.container);

      // Physical Subterranean Aphid Honeydew Cache View
      const honeydewView = new HoneydewSourceView(honeydewSource);
      terrainRenderer.addSubterraneanLayer(honeydewView.container);`;

if (content.includes(viewTarget)) {
  content = content.replace(viewTarget, viewReplacement);
}

// 4. Add Player Guidance Banner & Camera preset for Colony
const titleTarget = `<h1 className="font-bold tracking-wide uppercase text-amber-300 text-sm">
            THE VIVARIUM — WORLD INTEGRATION SUITE (TASK-021 / GATE A.2)
          </h1>`;

const titleReplacement = `<h1 className="font-bold tracking-wide uppercase text-amber-300 text-sm">
            THE VIVARIUM — V0.1 FIRST PLAYABLE (ANCIENT FOREST)
          </h1>`;

if (content.includes(titleTarget)) {
  content = content.replace(titleTarget, titleReplacement);
}

// 5. Add Guidance info modal / notification toggle
const hudGuidanceTarget = `{/* Camera Presets */}`;
const hudGuidanceReplacement = `{/* Quick Guidance Overlay */}
        <div className="hidden lg:flex items-center gap-2 px-2 py-1 rounded-lg bg-white/5 border border-white/5 text-[10px] text-neutral-300">
          <span>💡 <b>Hướng dẫn:</b> 1. Chọn ⛏️ <b>Đào</b> click vào đất ngầm &rarr; 2. Kiến đào 3.5s mang bùn về kho &rarr; 3. Chọn 🧱 <b>Lấp</b> click ô trống &rarr; 4. Bấm 💾 <b>Lưu Game</b></span>
        </div>

        {/* Camera Presets */}`;

if (content.includes(hudGuidanceTarget)) {
  content = content.replace(hudGuidanceTarget, hudGuidanceReplacement);
}

fs.writeFileSync(scenePath, content.replace(/\n/g, '\r\n'), 'utf8');
console.log('Successfully enhanced WorldIntegrationScene.tsx for V0.1 First Playable UI!');
