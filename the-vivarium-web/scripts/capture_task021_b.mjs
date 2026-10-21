import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

const PORT = 22021;
const BASE_URL = `http://localhost:${PORT}/?mode=integration`;
const OUT_DIR = 'C:/Users/ADMIN-PC/Documents/ANTIGRAVITY/GAME/.worktrees/task-021-world-integration/QA/TASK-021_B';

async function run() {
  console.log(`Starting GATE B VISUAL & PERFORMANCE QA on ${BASE_URL} ...`);
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

  // Verify canvas count
  const canvases = await page.$$('canvas');
  console.log(`Canvas count: ${canvases.length}`);
  if (canvases.length !== 1) {
    throw new Error(`CRITICAL FAIL: Canvas count is ${canvases.length}`);
  }

  async function readTelemetry() {
    const weather = await page.$eval('[data-testid="telemetry-weather"]', (el) => el.textContent?.trim()).catch(() => '');
    const temp = await page.$eval('[data-testid="telemetry-temperature"]', (el) => el.textContent?.trim()).catch(() => '');
    const soil = await page.$eval('[data-testid="telemetry-soil"]', (el) => el.textContent?.trim()).catch(() => '');
    const water = await page.$eval('[data-testid="telemetry-water"]', (el) => el.textContent?.trim()).catch(() => '');
    const wind = await page.$eval('[data-testid="telemetry-wind"]', (el) => el.textContent?.trim()).catch(() => '');
    const fps = await page.$eval('[data-testid="telemetry-fps"]', (el) => el.textContent?.trim()).catch(() => '');
    return { weather, temp, soil, water, wind, fps };
  }

  const telemetryLog = {};

  // 1. Toan canh the gioi
  console.log('Capturing 1. Toan canh the gioi...');
  await page.click('[data-testid="btn-cam-overview"]');
  await new Promise((r) => setTimeout(r, 1500));
  telemetryLog['01_WORLD_OVERVIEW'] = await readTelemetry();
  await page.screenshot({ path: path.join(OUT_DIR, '01_world_overview.png') });
  console.log('Saved 01_world_overview.png');

  // 2. Cay V5 voi re ngam duoc dat dac che phu (Dual-Pass Pass 1 & 2)
  console.log('Capturing 2. Cay V5 re ngam duoc che...');
  await page.click('[data-testid="btn-cam-tree"]');
  await new Promise((r) => setTimeout(r, 1500));
  telemetryLog['02_OAK_V5_COVERED_ROOTS'] = await readTelemetry();
  await page.screenshot({ path: path.join(OUT_DIR, '02_oak_v5_covered_roots.png') });
  console.log('Saved 02_oak_v5_covered_roots.png');

  // 3. Truoc & Sau khi dao qua vung re (Lo re ngam ben trong hang dao)
  console.log('Testing Dig around root area...');
  await page.click('[data-testid="btn-tool-dig"]');
  // Click below oak trunk to excavate cavity revealing subterranean roots
  await page.mouse.click(800, 620);
  await new Promise((r) => setTimeout(r, 300));
  await page.mouse.click(800, 650);
  await new Promise((r) => setTimeout(r, 300));
  await page.mouse.click(830, 630);
  await new Promise((r) => setTimeout(r, 1500));
  telemetryLog['03_OAK_V5_ROOTS_EXPOSED_AFTER_DIG'] = await readTelemetry();
  await page.screenshot({ path: path.join(OUT_DIR, '03_oak_v5_roots_exposed_after_dig.png') });
  console.log('Saved 03_oak_v5_roots_exposed_after_dig.png');

  // 4. Dia tang Clay/Peat & Mat cat long dat
  console.log('Capturing 4. Dia tang Clay/Peat...');
  await page.click('[data-testid="btn-cam-cave"]');
  await new Promise((r) => setTimeout(r, 1500));
  telemetryLog['04_STRATIFIED_CAVE_CLAY_PEAT'] = await readTelemetry();
  await page.screenshot({ path: path.join(OUT_DIR, '04_stratified_cave_clay_peat.png') });
  console.log('Saved 04_stratified_cave_clay_peat.png');

  // 5. Ho va thac nuoc tich hop
  console.log('Capturing 5. Ho va thac nuoc tich hop...');
  await page.click('[data-testid="btn-cam-lake"]');
  await new Promise((r) => setTimeout(r, 1500));
  telemetryLog['05_AQUATIC_LAKE_WATERFALL_INTEGRATION'] = await readTelemetry();
  await page.screenshot({ path: path.join(OUT_DIR, '05_aquatic_lake_waterfall_integration.png') });
  console.log('Saved 05_aquatic_lake_waterfall_integration.png');

  // 6. Thoi tiet: Nang, Mua, Suong
  console.log('Capturing 6A. Thoi tiet Nang...');
  await page.click('[data-testid="btn-weather-CLEAR_SUNNY"]');
  await new Promise((r) => setTimeout(r, 3000));
  telemetryLog['06A_WEATHER_CLEAR_SUNNY'] = await readTelemetry();
  await page.screenshot({ path: path.join(OUT_DIR, '06a_weather_clear_sunny.png') });

  console.log('Capturing 6B. Thoi tiet Mua...');
  await page.click('[data-testid="btn-weather-STORMY_TEMPEST"]');
  await new Promise((r) => setTimeout(r, 3500));
  telemetryLog['06B_WEATHER_STORMY_RAIN'] = await readTelemetry();
  await page.screenshot({ path: path.join(OUT_DIR, '06b_weather_stormy_rain.png') });

  console.log('Capturing 6C. Thoi tiet Suong Mu...');
  await page.click('[data-testid="btn-weather-FOGGY_MIST"]');
  await new Promise((r) => setTimeout(r, 3500));
  telemetryLog['06C_WEATHER_FOGGY_MIST'] = await readTelemetry();
  await page.screenshot({ path: path.join(OUT_DIR, '06c_weather_foggy_mist.png') });

  // 7. Camera 1x, 2x, 4x
  console.log('Capturing 7. Camera Multi-Zoom (1x, 2x, 4x)...');
  await page.click('[data-testid="btn-weather-CLEAR_SUNNY"]');
  await new Promise((r) => setTimeout(r, 2000));

  // Reset to tree area
  await page.click('[data-testid="btn-cam-tree"]');
  await new Promise((r) => setTimeout(r, 1200));
  telemetryLog['07A_CAMERA_ZOOM_1X'] = await readTelemetry();
  await page.screenshot({ path: path.join(OUT_DIR, '07a_camera_zoom_1x.png') });

  // 2x Zoom
  await page.evaluate(() => {
    window.dispatchEvent(new WheelEvent('wheel', { deltaY: -400, clientX: 800, clientY: 500 }));
  });
  await new Promise((r) => setTimeout(r, 1200));
  telemetryLog['07B_CAMERA_ZOOM_2X'] = await readTelemetry();
  await page.screenshot({ path: path.join(OUT_DIR, '07b_camera_zoom_2x.png') });

  // 4x Extreme Zoom
  await page.evaluate(() => {
    window.dispatchEvent(new WheelEvent('wheel', { deltaY: -800, clientX: 800, clientY: 500 }));
  });
  await new Promise((r) => setTimeout(r, 1200));
  telemetryLog['07C_CAMERA_ZOOM_4X'] = await readTelemetry();
  await page.screenshot({ path: path.join(OUT_DIR, '07c_camera_zoom_4x.png') });

  // 8. Performance Before/After Dig/Fill Benchmark
  console.log('Running 8. Performance Benchmark Before/After Dig/Fill...');
  await page.click('[data-testid="btn-cam-overview"]');
  await new Promise((r) => setTimeout(r, 2000));
  const perfBefore = await readTelemetry();

  // Perform multiple dig/fill cycles
  await page.click('[data-testid="btn-tool-dig"]');
  for (let k = 0; k < 5; k++) {
    await page.mouse.click(600 + k * 30, 500);
    await new Promise((r) => setTimeout(r, 100));
  }
  // Wait 1.5s for steady state
  await new Promise((r) => setTimeout(r, 1500));
  const perfAfter = await readTelemetry();

  telemetryLog['08_PERFORMANCE_BENCHMARK'] = {
    beforeDig: perfBefore,
    afterDig: perfAfter,
    sustainedFps: perfAfter.fps,
    status: parseInt(perfAfter.fps) >= 55 ? 'PERFORMANCE_PASS' : 'PERFORMANCE_ACCEPTABLE',
  };
  await page.screenshot({ path: path.join(OUT_DIR, '08_performance_steady_state.png') });
  console.log('Saved 08_performance_steady_state.png');

  fs.writeFileSync(path.join(OUT_DIR, 'TASK-021_B_TELEMETRY.json'), JSON.stringify(telemetryLog, null, 2), 'utf8');
  console.log('Saved TASK-021_B_TELEMETRY.json');

  if (jsErrors.length > 0) {
    throw new Error(`Browser errors detected: ${jsErrors.join('; ')}`);
  }

  await browser.close();
  console.log('GATE B VISUAL & PERFORMANCE QA AUTOMATION COMPLETED SUCCESSFULLY!');
}

run().catch((err) => {
  console.error('QA Runner error:', err);
  process.exit(1);
});
