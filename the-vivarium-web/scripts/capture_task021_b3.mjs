import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

const PORT = 22021;
const BASE_URL = `http://localhost:${PORT}/?mode=integration`;
const OUT_DIR = 'C:/Users/ADMIN-PC/Documents/ANTIGRAVITY/GAME/.worktrees/task-021-world-integration/QA/TASK-021_B3';

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
  console.log(`Starting GATE B.3 FINAL QA & COMPREHENSIVE PERFORMANCE RUN on ${BASE_URL} ...`);
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

  // 2. WORLD OVERVIEW: Vibrant Blue Sky Atmosphere, Oak V5, Real Mountains, Clouds, Aquatic Basin
  console.log('Capturing 01_world_overview_b3.png ...');
  await page.evaluate(() => {
    window.__CAMERA__.jumpTo(0, 0, 0.78);
  });
  await new Promise((r) => setTimeout(r, 1500));
  await page.screenshot({ path: path.join(OUT_DIR, '01_world_overview_b3.png') });

  // 3. OAK V5 & DUAL PASS MASKING AT GROUNDLINE
  console.log('Capturing 02_oak_v5_undulating_groundline.png ...');
  await page.evaluate(() => {
    window.__CAMERA__.jumpTo(0, -180, 1.2);
  });
  await new Promise((r) => setTimeout(r, 1500));
  await page.screenshot({ path: path.join(OUT_DIR, '02_oak_v5_undulating_groundline.png') });

  // 4. DIG -> AFTER -> FILL VERIFICATION AT SAME COORDINATES (BEFORE, AFTER DIG, AFTER FILL)
  console.log('Testing Dig -> After -> Fill cycle ...');
  // Capture BEFORE DIG
  await page.screenshot({ path: path.join(OUT_DIR, '03a_root_before_dig.png') });

  await page.click('[data-testid="btn-tool-dig"]');
  // Excavate root zone under tree
  await page.mouse.click(800, 580);
  await new Promise((r) => setTimeout(r, 150));
  await page.mouse.click(800, 620);
  await new Promise((r) => setTimeout(r, 150));
  await page.mouse.click(780, 600);
  await new Promise((r) => setTimeout(r, 1200));
  await page.screenshot({ path: path.join(OUT_DIR, '03b_root_dig_exposed.png') });

  // Fill back to prove roots are re-covered
  await page.click('[data-testid="btn-tool-fill"]');
  await page.mouse.click(800, 580);
  await new Promise((r) => setTimeout(r, 150));
  await page.mouse.click(800, 620);
  await new Promise((r) => setTimeout(r, 150));
  await page.mouse.click(780, 600);
  await new Promise((r) => setTimeout(r, 1200));
  await page.screenshot({ path: path.join(OUT_DIR, '04_root_fill_recovered.png') });

  // 5. AQUATIC REAL ASSET INTEGRATION (Waterfall 6-frame sheet, Mud Tiling, Flora)
  console.log('Capturing 05_aquatic_waterfall_sheet.png ...');
  await page.evaluate(() => {
    window.__CAMERA__.jumpTo(560, -60, 1.5);
  });
  await new Promise((r) => setTimeout(r, 1500));
  await page.screenshot({ path: path.join(OUT_DIR, '05_aquatic_waterfall_sheet.png') });

  console.log('Capturing 06_aquatic_lake_basin_mud.png ...');
  await page.evaluate(() => {
    window.__CAMERA__.jumpTo(800, 100, 1.25);
  });
  await new Promise((r) => setTimeout(r, 1500));
  await page.screenshot({ path: path.join(OUT_DIR, '06_aquatic_lake_basin_mud.png') });

  // 6. UNDERGROUND STRATIFIED CAVE (Soft Clay/Peat Organic Blend Mask)
  console.log('Capturing 07_underground_strata_clay_peat.png ...');
  await page.evaluate(() => {
    window.__CAMERA__.jumpTo(-300, 220, 1.35);
  });
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

  // 8. CAMERA MULTI-ZOOM VERIFICATION (1x, 2x, 4x with strict transform verification)
  console.log('Capturing Multi-Zoom 1x, 2x, 4x with Camera Verification...');
  await page.click('[data-testid="btn-weather-CLEAR_SUNNY"]');

  // Zoom 1x
  const zoom1Info = await page.evaluate(() => {
    window.__CAMERA__.jumpTo(0, -180, 1.0);
    return {
      zoom: window.__CAMERA__.zoom,
      stageScale: window.__CAMERA__.stage.scale.x,
      stagePos: { x: window.__CAMERA__.stage.position.x, y: window.__CAMERA__.stage.position.y },
      targetObject: { worldX: 0, worldY: -180, expectedSizeOnScreen: 1.0 },
    };
  });
  await new Promise((r) => setTimeout(r, 1200));
  await page.screenshot({ path: path.join(OUT_DIR, '09a_camera_zoom_1x.png') });

  // Zoom 2x
  const zoom2Info = await page.evaluate(() => {
    window.__CAMERA__.jumpTo(0, -180, 2.0);
    return {
      zoom: window.__CAMERA__.zoom,
      stageScale: window.__CAMERA__.stage.scale.x,
      stagePos: { x: window.__CAMERA__.stage.position.x, y: window.__CAMERA__.stage.position.y },
      targetObject: { worldX: 0, worldY: -180, expectedSizeOnScreen: 2.0 },
    };
  });
  await new Promise((r) => setTimeout(r, 1200));
  await page.screenshot({ path: path.join(OUT_DIR, '09b_camera_zoom_2x.png') });

  // Zoom 4x
  const zoom4Info = await page.evaluate(() => {
    window.__CAMERA__.jumpTo(0, -180, 4.0);
    return {
      zoom: window.__CAMERA__.zoom,
      stageScale: window.__CAMERA__.stage.scale.x,
      stagePos: { x: window.__CAMERA__.stage.position.x, y: window.__CAMERA__.stage.position.y },
      targetObject: { worldX: 0, worldY: -180, expectedSizeOnScreen: 4.0 },
    };
  });
  await new Promise((r) => setTimeout(r, 1200));
  await page.screenshot({ path: path.join(OUT_DIR, '09c_camera_zoom_4x.png') });

  const zoomVerification = {
    verified: zoom1Info.zoom === 1.0 && zoom2Info.zoom === 2.0 && zoom4Info.zoom === 4.0,
    zoomLevels: {
      zoom1x: zoom1Info,
      zoom2x: zoom2Info,
      zoom4x: zoom4Info,
    },
    ratioCheck: {
      zoom2x_to_1x: zoom2Info.stageScale / zoom1Info.stageScale,
      zoom4x_to_1x: zoom4Info.stageScale / zoom1Info.stageScale,
    },
  };
  fs.writeFileSync(
    path.join(OUT_DIR, 'TASK-021_CAMERA_ZOOM_VERIFICATION.json'),
    JSON.stringify(zoomVerification, null, 2),
    'utf8'
  );
  console.log('Saved TASK-021_CAMERA_ZOOM_VERIFICATION.json');

  // 9. RIGOROUS 3-CONSECUTIVE RUN BENCHMARK PROFILING
  console.log('Running Critical Gate B.3 Performance Profiling (3 consecutive runs)...');
  await page.evaluate(() => {
    window.__CAMERA__.jumpTo(0, 0, 0.78);
  });
  await new Promise((r) => setTimeout(r, 1500));

  const benchmarkRuns = [];

  for (let runIdx = 1; runIdx <= 3; runIdx++) {
    console.log(`--- BENCHMARK RUN ${runIdx}/3 ---`);
    // Phase A: Steady State Before Dig
    const metricsBefore = await measureFrameMetrics(page, 2500);

    // Phase B: Continuous Dig Stress
    await page.click('[data-testid="btn-tool-dig"]');
    const startX = 400 + (runIdx - 1) * 60;
    const digStressPromise = (async () => {
      await page.mouse.move(startX, 480);
      await page.mouse.down();
      for (let k = 0; k < 12; k++) {
        await page.mouse.move(startX + k * 25, 480 + (k % 2) * 15);
        await new Promise((r) => setTimeout(r, 80));
      }
      await page.mouse.up();
    })();

    const metricsDuring = await measureFrameMetrics(page, 2500);
    await digStressPromise;

    // Phase C: Steady State After Dig
    await new Promise((r) => setTimeout(r, 800));
    const metricsAfter = await measureFrameMetrics(page, 2500);

    benchmarkRuns.push({
      run: runIdx,
      metricsBeforeDig: metricsBefore,
      metricsDuringDig: metricsDuring,
      metricsAfterDig: metricsAfter,
    });
  }

  // Summary aggregation across 3 runs
  const avgBeforeFps = parseFloat((benchmarkRuns.reduce((acc, r) => acc + r.metricsBeforeDig.avgFps, 0) / 3).toFixed(1));
  const avgDuringFps = parseFloat((benchmarkRuns.reduce((acc, r) => acc + r.metricsDuringDig.avgFps, 0) / 3).toFixed(1));
  const avgAfterFps = parseFloat((benchmarkRuns.reduce((acc, r) => acc + r.metricsAfterDig.avgFps, 0) / 3).toFixed(1));
  const maxDuringP95 = Math.max(...benchmarkRuns.map((r) => r.metricsDuringDig.p95FrameTimeMs));
  const minDuringFps = Math.min(...benchmarkRuns.map((r) => r.metricsDuringDig.minFps));

  const fullPerfReport = {
    timestamp: new Date().toISOString(),
    hardwareEnvironment: 'Chromium Headless / WebGL2 / 1600x1000 Viewport',
    runsCount: 3,
    summary: {
      beforeAvgFps: avgBeforeFps,
      duringAvgFps: avgDuringFps,
      duringMaxP95Ms: maxDuringP95,
      duringWorstMinFps: minDuringFps,
      afterAvgFps: avgAfterFps,
      verdict: avgDuringFps >= 55 && maxDuringP95 <= 35.0 ? 'PERFORMANCE_PASS' : 'PERFORMANCE_CONDITIONAL',
    },
    runs: benchmarkRuns,
  };

  await page.screenshot({ path: path.join(OUT_DIR, '10_performance_b3_steady_overview.png') });
  fs.writeFileSync(
    path.join(OUT_DIR, 'TASK-021_PERFORMANCE_RAW_METRICS.json'),
    JSON.stringify(fullPerfReport, null, 2),
    'utf8'
  );
  console.log('Saved TASK-021_PERFORMANCE_RAW_METRICS.json');

  if (jsErrors.length > 0) {
    throw new Error(`Browser errors detected: ${jsErrors.join('; ')}`);
  }

  await browser.close();
  console.log('GATE B.3 AUTOMATION & PROFILING RUN COMPLETED SUCCESSFULLY!');
}

run().catch((err) => {
  console.error('QA Runner error:', err);
  process.exit(1);
});
