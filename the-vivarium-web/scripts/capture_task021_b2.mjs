import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

const PORT = 22021;
const BASE_URL = `http://localhost:${PORT}/?mode=integration`;
const OUT_DIR = 'C:/Users/ADMIN-PC/Documents/ANTIGRAVITY/GAME/.worktrees/task-021-world-integration/QA/TASK-021_B2';

async function measureFrameMetrics(page, durationMs = 2500) {
  return await page.evaluate((duration) => {
    return new Promise((resolve) => {
      const frameDeltas = [];
      let last = performance.now();
      const start = last;

      function onFrame(now) {
        const delta = now - last;
        last = now;
        frameDeltas.push(delta);
        if (now - start < duration) {
          requestAnimationFrame(onFrame);
        } else {
          if (frameDeltas.length > 2) frameDeltas.shift();
          const count = frameDeltas.length;
          const sorted = [...frameDeltas].sort((a, b) => a - b);
          const sum = frameDeltas.reduce((acc, v) => acc + v, 0);
          const avgFrameTime = sum / count;
          const avgFps = 1000 / avgFrameTime;
          const minFrameTime = sorted[0];
          const maxFrameTime = sorted[count - 1];
          const minFps = 1000 / maxFrameTime;
          const maxFps = 1000 / minFrameTime;
          const p95Idx = Math.floor(count * 0.95);
          const p99Idx = Math.floor(count * 0.99);
          const p95 = sorted[p95Idx];
          const p99 = sorted[p99Idx];

          resolve({
            sampleCount: count,
            durationMs: parseFloat(sum.toFixed(1)),
            avgFrameTimeMs: parseFloat(avgFrameTime.toFixed(2)),
            avgFps: parseFloat(avgFps.toFixed(1)),
            minFps: parseFloat(minFps.toFixed(1)),
            maxFps: parseFloat(maxFps.toFixed(1)),
            p95FrameTimeMs: parseFloat(p95.toFixed(2)),
            p99FrameTimeMs: parseFloat(p99.toFixed(2)),
            frameDeltasMs: frameDeltas.map((v) => parseFloat(v.toFixed(2))),
          });
        }
      }
      requestAnimationFrame(onFrame);
    });
  }, durationMs);
}

async function run() {
  console.log(`Starting GATE B.2 FINAL QA & PERFORMANCE RUN on ${BASE_URL} ...`);
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1600,1000'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1600, height: 1000 });

  const jsErrors = [];
  page.on('pageerror', (err) => {
    console.error('Browser JS Error:', err);
    jsErrors.push(err.toString());
  });

  await page.goto(BASE_URL, { waitUntil: 'networkidle2' });
  await new Promise((r) => setTimeout(r, 2500));

  // 1. Verify Canvas Count
  const canvases = await page.$$('canvas');
  console.log(`Canvas count: ${canvases.length}`);
  if (canvases.length !== 1) {
    throw new Error(`CRITICAL FAIL: Canvas count is ${canvases.length}`);
  }

  // 2. WORLD OVERVIEW: Oak V5, Real Mountains, Clouds, Aquatic Basin, Ground, Atmosphere
  console.log('Capturing 01_world_overview_b2.png ...');
  await page.click('[data-testid="btn-cam-overview"]');
  await new Promise((r) => setTimeout(r, 1500));
  await page.screenshot({ path: path.join(OUT_DIR, '01_world_overview_b2.png') });

  // 3. OAK V5 & DUAL PASS MASKING AT GROUNDLINE
  console.log('Capturing 02_oak_v5_undulating_groundline.png ...');
  await page.click('[data-testid="btn-cam-tree"]');
  await new Promise((r) => setTimeout(r, 1500));
  await page.screenshot({ path: path.join(OUT_DIR, '02_oak_v5_undulating_groundline.png') });

  // 4. DIG -> AFTER -> FILL VERIFICATION AT SAME COORDINATES
  console.log('Testing Dig -> After -> Fill cycle ...');
  await page.click('[data-testid="btn-tool-dig"]');
  // Excavate root zone
  await page.mouse.click(800, 580);
  await new Promise((r) => setTimeout(r, 200));
  await page.mouse.click(800, 620);
  await new Promise((r) => setTimeout(r, 200));
  await page.mouse.click(780, 600);
  await new Promise((r) => setTimeout(r, 1200));
  await page.screenshot({ path: path.join(OUT_DIR, '03_root_dig_exposed.png') });

  // Fill back to prove roots are re-covered
  await page.click('[data-testid="btn-tool-fill"]');
  await page.mouse.click(800, 580);
  await new Promise((r) => setTimeout(r, 200));
  await page.mouse.click(800, 620);
  await new Promise((r) => setTimeout(r, 200));
  await page.mouse.click(780, 600);
  await new Promise((r) => setTimeout(r, 1200));
  await page.screenshot({ path: path.join(OUT_DIR, '04_root_fill_recovered.png') });

  // 5. AQUATIC REAL ASSET INTEGRATION (Waterfall 6-frame sheet, Mud Tiling, Flora)
  console.log('Capturing 05_aquatic_waterfall_sheet.png ...');
  await page.click('[data-testid="btn-cam-waterfall"]');
  await new Promise((r) => setTimeout(r, 1500));
  await page.screenshot({ path: path.join(OUT_DIR, '05_aquatic_waterfall_sheet.png') });

  console.log('Capturing 06_aquatic_lake_basin_mud.png ...');
  await page.click('[data-testid="btn-cam-lake"]');
  await new Promise((r) => setTimeout(r, 1500));
  await page.screenshot({ path: path.join(OUT_DIR, '06_aquatic_lake_basin_mud.png') });

  // 6. UNDERGROUND STRATIFIED CAVE (Clay, Peat, Pebble Tiling)
  console.log('Capturing 07_underground_strata_clay_peat.png ...');
  await page.click('[data-testid="btn-cam-cave"]');
  await new Promise((r) => setTimeout(r, 1500));
  await page.screenshot({ path: path.join(OUT_DIR, '07_underground_strata_clay_peat.png') });

  // 7. WEATHER PHENOMENA (RAIN, STORM, FOG)
  console.log('Capturing 08a_weather_rain.png ...');
  await page.click('[data-testid="btn-weather-GENTLE_RAIN"]');
  await new Promise((r) => setTimeout(r, 2500));
  await page.screenshot({ path: path.join(OUT_DIR, '08a_weather_rain.png') });

  console.log('Capturing 08b_weather_storm_lightning.png ...');
  await page.click('[data-testid="btn-weather-STORMY_TEMPEST"]');
  await new Promise((r) => setTimeout(r, 3000));
  await page.screenshot({ path: path.join(OUT_DIR, '08b_weather_storm_lightning.png') });

  console.log('Capturing 08c_weather_fog_mist.png ...');
  await page.click('[data-testid="btn-weather-FOGGY_MIST"]');
  await new Promise((r) => setTimeout(r, 3000));
  await page.screenshot({ path: path.join(OUT_DIR, '08c_weather_fog_mist.png') });

  // 8. CAMERA MULTI-ZOOM VERIFICATION (1x, 2x, 4x)
  console.log('Capturing Multi-Zoom 1x, 2x, 4x ...');
  await page.click('[data-testid="btn-weather-CLEAR_SUNNY"]');
  await page.click('[data-testid="btn-cam-overview"]');
  await new Promise((r) => setTimeout(r, 1500));
  await page.screenshot({ path: path.join(OUT_DIR, '09a_camera_zoom_1x.png') });

  // Zoom 2x
  await page.evaluate(() => {
    window.dispatchEvent(new WheelEvent('wheel', { deltaY: -400, clientX: 800, clientY: 500 }));
  });
  await new Promise((r) => setTimeout(r, 1200));
  await page.screenshot({ path: path.join(OUT_DIR, '09b_camera_zoom_2x.png') });

  // Zoom 4x
  await page.evaluate(() => {
    window.dispatchEvent(new WheelEvent('wheel', { deltaY: -800, clientX: 800, clientY: 500 }));
  });
  await new Promise((r) => setTimeout(r, 1200));
  await page.screenshot({ path: path.join(OUT_DIR, '09c_camera_zoom_4x.png') });

  // 9. RIGOROUS PERFORMANCE PROFILING WITH DIRTY-REGION REBUILD
  console.log('Running Critical Gate B.2 Performance Profiling...');
  await page.click('[data-testid="btn-cam-overview"]');
  await new Promise((r) => setTimeout(r, 2000));

  // Phase A: Steady State Before Dig (2500ms profiling)
  console.log('Measuring: Phase A (Steady State Before Dig)...');
  const metricsBefore = await measureFrameMetrics(page, 2500);

  // Phase B: Continuous Drag Dig Stress (8 continuous drag movements)
  console.log('Measuring: Phase B (Continuous Dig Stress)...');
  await page.click('[data-testid="btn-tool-dig"]');

  const digStressPromise = (async () => {
    await page.mouse.move(500, 480);
    await page.mouse.down();
    for (let k = 0; k < 12; k++) {
      await page.mouse.move(500 + k * 30, 480 + (k % 2) * 20);
      await new Promise((r) => setTimeout(r, 80));
    }
    await page.mouse.up();
  })();

  const metricsDuring = await measureFrameMetrics(page, 2500);
  await digStressPromise;

  // Phase C: Steady State After Dig (2500ms profiling)
  console.log('Measuring: Phase C (Steady State Sustained After Dig)...');
  await new Promise((r) => setTimeout(r, 1000));
  const metricsAfter = await measureFrameMetrics(page, 2500);

  const fullPerfReport = {
    timestamp: new Date().toISOString(),
    hardwareEnvironment: 'Chromium Headless / WebGL2 / 1600x1000 Viewport',
    summary: {
      beforeAvgFps: metricsBefore.avgFps,
      beforeP95Ms: metricsBefore.p95FrameTimeMs,
      duringAvgFps: metricsDuring.avgFps,
      duringP95Ms: metricsDuring.p95FrameTimeMs,
      duringMinFps: metricsDuring.minFps,
      afterAvgFps: metricsAfter.avgFps,
      afterP95Ms: metricsAfter.p95FrameTimeMs,
      verdict: metricsDuring.avgFps >= 55 && metricsDuring.p95FrameTimeMs <= 33.3 ? 'PERFORMANCE_PASS' : 'PERFORMANCE_CONDITIONAL',
    },
    metricsBeforeDig: metricsBefore,
    metricsDuringDig: metricsDuring,
    metricsAfterDig: metricsAfter,
  };

  await page.screenshot({ path: path.join(OUT_DIR, '10_performance_b2_steady_overview.png') });
  fs.writeFileSync(path.join(OUT_DIR, 'TASK-021_PERFORMANCE_RAW_METRICS.json'), JSON.stringify(fullPerfReport, null, 2), 'utf8');
  console.log('Saved TASK-021_PERFORMANCE_RAW_METRICS.json');

  if (jsErrors.length > 0) {
    throw new Error(`Browser errors detected: ${jsErrors.join('; ')}`);
  }

  await browser.close();
  console.log('GATE B.2 AUTOMATION & PROFILING RUN COMPLETED SUCCESSFULLY!');
}

run().catch((err) => {
  console.error('QA Runner error:', err);
  process.exit(1);
});
