import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

const PORT = 22021;
const BASE_URL = `http://localhost:${PORT}/?mode=integration`;
const OUT_DIR = 'C:/Users/ADMIN-PC/Documents/ANTIGRAVITY/GAME/.worktrees/task-021-world-integration/QA/TASK-021_B1';

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
            frameDeltasMs: frameDeltas.map(v => parseFloat(v.toFixed(2)))
          });
        }
      }
      requestAnimationFrame(onFrame);
    });
  }, durationMs);
}

async function run() {
  console.log(`Starting GATE B.1 CORRECTION QA & PROFILING on ${BASE_URL} ...`);
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
  await new Promise((r) => setTimeout(r, 2000));

  // 1. Verify Canvas Count
  const canvases = await page.$$('canvas');
  console.log(`Canvas count: ${canvases.length}`);
  if (canvases.length !== 1) {
    throw new Error(`CRITICAL FAIL: Canvas count is ${canvases.length}`);
  }

  // 2. ROOT MASKING EVIDENCE (BEFORE & AFTER DIG IN EXACT ROOT REGION)
  console.log('Capturing Root Masking BEFORE Dig...');
  await page.click('[data-testid="btn-cam-tree"]');
  await new Promise((r) => setTimeout(r, 1500));
  await page.screenshot({ path: path.join(OUT_DIR, '01_root_masking_before_dig.png') });
  console.log('Saved 01_root_masking_before_dig.png');

  // Dig in root zone (X=800, Y=560-640)
  console.log('Performing Dig in root zone...');
  await page.click('[data-testid="btn-tool-dig"]');
  await page.mouse.click(800, 580);
  await new Promise((r) => setTimeout(r, 250));
  await page.mouse.click(800, 620);
  await new Promise((r) => setTimeout(r, 250));
  await page.mouse.click(770, 600);
  await new Promise((r) => setTimeout(r, 250));
  await page.mouse.click(830, 600);
  await new Promise((r) => setTimeout(r, 1500));
  await page.screenshot({ path: path.join(OUT_DIR, '02_root_masking_after_dig.png') });
  console.log('Saved 02_root_masking_after_dig.png');

  // 3. CAPTURE VISUAL REFINEMENTS (LAKE BASIN & WATERFALL BACKDROP)
  console.log('Capturing Waterfall contour...');
  await page.click('[data-testid="btn-cam-waterfall"]');
  await new Promise((r) => setTimeout(r, 1500));
  await page.screenshot({ path: path.join(OUT_DIR, '03_waterfall_organic_contour.png') });
  console.log('Saved 03_waterfall_organic_contour.png');

  console.log('Capturing Lake Basin blended curve...');
  await page.click('[data-testid="btn-cam-lake"]');
  await new Promise((r) => setTimeout(r, 1500));
  await page.screenshot({ path: path.join(OUT_DIR, '04_lake_basin_organic_blend.png') });
  console.log('Saved 04_lake_basin_organic_blend.png');

  // 4. RIGOROUS PERFORMANCE PROFILING: BEFORE, DURING, AFTER DIG/FILL
  console.log('Starting rigorous performance telemetry collection...');
  await page.click('[data-testid="btn-cam-overview"]');
  await new Promise((r) => setTimeout(r, 2000));

  // A. Steady State BEFORE Dig (2500ms profiling)
  console.log('Measuring Profiling: Phase A (Before Dig Steady State)...');
  const metricsBefore = await measureFrameMetrics(page, 2500);

  // B. Active Dig/Fill Stress (8 continuous digs across world)
  console.log('Measuring Profiling: Phase B (During Continuous Dig Stress)...');
  await page.click('[data-testid="btn-tool-dig"]');
  const digPromise = (async () => {
    for (let k = 0; k < 8; k++) {
      await page.mouse.click(500 + k * 45, 480 + (k % 2) * 30);
      await new Promise(r => setTimeout(r, 220));
    }
  })();
  const metricsDuring = await measureFrameMetrics(page, 2500);
  await digPromise;

  // C. Steady State AFTER Dig (2500ms profiling)
  console.log('Measuring Profiling: Phase C (After Dig Sustained Steady State)...');
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
      afterAvgFps: metricsAfter.avgFps,
      afterP95Ms: metricsAfter.p95FrameTimeMs,
      verdict: (metricsAfter.avgFps >= 55) ? 'PASS_STEADY_60FPS' : 'HOLD_BELOW_THRESHOLD'
    },
    metricsBeforeDig: metricsBefore,
    metricsDuringDig: metricsDuring,
    metricsAfterDig: metricsAfter
  };

  await page.screenshot({ path: path.join(OUT_DIR, '05_performance_after_dig_overview.png') });
  fs.writeFileSync(path.join(OUT_DIR, 'TASK-021_PERFORMANCE_RAW_METRICS.json'), JSON.stringify(fullPerfReport, null, 2), 'utf8');
  console.log('Saved TASK-021_PERFORMANCE_RAW_METRICS.json');

  if (jsErrors.length > 0) {
    throw new Error(`Browser errors detected: ${jsErrors.join('; ')}`);
  }

  await browser.close();
  console.log('GATE B.1 AUTOMATION RUN COMPLETED SUCCESSFULLY!');
}

run().catch((err) => {
  console.error('QA Runner error:', err);
  process.exit(1);
});
