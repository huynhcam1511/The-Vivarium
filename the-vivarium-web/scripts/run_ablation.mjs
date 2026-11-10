import puppeteer from 'puppeteer';

const browser = await puppeteer.launch({
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1600,1000'],
});
const page = await browser.newPage();
await page.setViewport({ width: 1600, height: 1000 });
await page.goto('http://localhost:22021/?mode=integration');
await new Promise((r) => setTimeout(r, 2000));

async function measure(name, durationMs = 2500) {
  return await page.evaluate((dur, label) => {
    return new Promise((resolve) => {
      const d = [];
      let last = performance.now();
      const start = last;
      function onFrame(now) {
        const delta = now - last;
        last = now;
        d.push(delta);
        if (now - start < dur) {
          requestAnimationFrame(onFrame);
        } else {
          if (d.length > 2) d.shift();
          const sum = d.reduce((a, b) => a + b, 0);
          const avg = sum / d.length;
          const sorted = [...d].sort((a, b) => a - b);
          const min = 1000 / sorted[sorted.length - 1];
          const max = 1000 / sorted[0];
          const p95 = sorted[Math.floor(d.length * 0.95)];
          const p99 = sorted[Math.floor(d.length * 0.99)];
          resolve({
            name: label,
            sampleCount: d.length,
            durationMs: parseFloat(sum.toFixed(1)),
            avgFrameTimeMs: parseFloat(avg.toFixed(2)),
            avgFps: parseFloat((1000 / avg).toFixed(1)),
            minFps: parseFloat(min.toFixed(1)),
            maxFps: parseFloat(max.toFixed(1)),
            p95FrameTimeMs: parseFloat(p95.toFixed(2)),
            p99FrameTimeMs: parseFloat(p99.toFixed(2)),
          });
        }
      }
      requestAnimationFrame(onFrame);
    });
  }, durationMs, name);
}

// 1. Full Stack Baseline (B.3 Full Assets)
console.log('Measuring: Full Stack Baseline...');
const m1 = await measure('Layer 1: Full System (Oak V5 + Strata + Aquatic + Weather)');

// 2. Weather Ablation (Hide Weather)
console.log('Measuring: Weather Ablated...');
await page.evaluate(() => {
  window.__WEATHER_RENDERER__.container.visible = false;
});
await new Promise((r) => setTimeout(r, 500));
const m2 = await measure('Layer 2: Weather Ablated (Oak V5 + Strata + Aquatic)');

// 3. Aquatic Ablation (Hide Aquatic)
console.log('Measuring: Aquatic Ablated...');
await page.evaluate(() => {
  window.__AQUATIC_RENDERER__.container.visible = false;
});
await new Promise((r) => setTimeout(r, 500));
const m3 = await measure('Layer 3: Weather + Aquatic Ablated (Oak V5 + Strata)');

// 4. Underground Strata Ablation (Hide Clay/Peat Tiling)
console.log('Measuring: Strata Ablated...');
await page.evaluate(() => {
  if (window.__TERRAIN_RENDERER__.clayTilingLayer) window.__TERRAIN_RENDERER__.clayTilingLayer.visible = false;
  if (window.__TERRAIN_RENDERER__.peatTilingLayer) window.__TERRAIN_RENDERER__.peatTilingLayer.visible = false;
  if (window.__TERRAIN_RENDERER__.pebbleTilingLayer) window.__TERRAIN_RENDERER__.pebbleTilingLayer.visible = false;
});
await new Promise((r) => setTimeout(r, 500));
const m4 = await measure('Layer 4: Strata Ablated (Oak V5 + Loam Base Only)');

// Restore All
await page.evaluate(() => {
  window.__WEATHER_RENDERER__.container.visible = true;
  window.__AQUATIC_RENDERER__.container.visible = true;
  if (window.__TERRAIN_RENDERER__.clayTilingLayer) window.__TERRAIN_RENDERER__.clayTilingLayer.visible = true;
  if (window.__TERRAIN_RENDERER__.peatTilingLayer) window.__TERRAIN_RENDERER__.peatTilingLayer.visible = true;
  if (window.__TERRAIN_RENDERER__.pebbleTilingLayer) window.__TERRAIN_RENDERER__.pebbleTilingLayer.visible = true;
});

const ablationResults = [m1, m2, m3, m4];
console.log('Ablation Results:', JSON.stringify(ablationResults, null, 2));

await browser.close();
