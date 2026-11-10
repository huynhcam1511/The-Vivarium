import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

const PORT = 22021;
const BASE_URL = `http://localhost:${PORT}/?mode=integration`;
const OUT_DIR = 'C:/Users/ADMIN-PC/Documents/ANTIGRAVITY/GAME/.worktrees/task-021-world-integration/QA/TASK-021_A2';

async function run() {
  console.log(`Starting TASK-021 Gate A.2 Verification on ${BASE_URL} ...`);
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

  // Verify No Double Canvas & No Severe JS Errors
  const canvases = await page.$$('canvas');
  console.log(`Canvas elements count: ${canvases.length}`);
  if (canvases.length !== 1) {
    throw new Error(`CRITICAL FAIL: Expected exactly 1 canvas, found ${canvases.length} (React StrictMode double canvas issue)!`);
  }
  if (jsErrors.length > 0) {
    throw new Error(`CRITICAL FAIL: Console errors detected on load: ${jsErrors.join('; ')}`);
  }

  // Telemetry Recorder
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

  // 1. Scene Overview: Tree, Underground Cavities, Aquatic Basin & Clear Sky
  console.log('Capturing 1. Scene Overview (Simultaneous Tree, Underground, Lake, Weather)...');
  await new Promise((r) => setTimeout(r, 1000));
  telemetryLog['BEFORE_INITIAL'] = await readTelemetry();
  await page.screenshot({ path: path.join(OUT_DIR, 'task021_01_scene_overview_initial.png') });
  console.log('Saved 01_scene_overview_initial.png');

  // 2. Rain Inflow Test: Transition to Stormy Tempest and Rain Inflow
  console.log('Testing Weather -> Aquatic: Stormy Tempest & Rising Lake Water...');
  await page.click('[data-testid="btn-weather-STORMY_TEMPEST"]');
  await new Promise((r) => setTimeout(r, 3500)); // wait for transition
  await page.click('[data-testid="btn-action-rain-inflow"]');
  await new Promise((r) => setTimeout(r, 500));
  await page.click('[data-testid="btn-action-rain-inflow"]');
  await new Promise((r) => setTimeout(r, 1500));
  telemetryLog['AFTER_RAIN_INFLOW'] = await readTelemetry();
  await page.screenshot({ path: path.join(OUT_DIR, 'task021_02_rain_inflow_rising_water.png') });
  console.log('Saved 02_rain_inflow_rising_water.png');

  // 3. Heatwave & Evaporation Test: Transition to Heatwave
  console.log('Testing Weather -> Aquatic/Underground: Heatwave & Evaporation...');
  await page.click('[data-testid="btn-weather-HEATWAVE"]');
  await new Promise((r) => setTimeout(r, 3500)); // wait for transition
  await page.click('[data-testid="btn-action-evaporate"]');
  await new Promise((r) => setTimeout(r, 500));
  await page.click('[data-testid="btn-action-evaporate"]');
  await new Promise((r) => setTimeout(r, 1500));
  telemetryLog['AFTER_HEATWAVE_EVAP'] = await readTelemetry();
  await page.screenshot({ path: path.join(OUT_DIR, 'task021_03_heatwave_arid_evaporation.png') });
  console.log('Saved 03_heatwave_arid_evaporation.png');

  // 4. Camera Navigation & Presets (Lake, Waterfall, Cave)
  console.log('Testing Camera Presets: Lake Basin...');
  await page.click('[data-testid="btn-cam-lake"]');
  await new Promise((r) => setTimeout(r, 1000));
  await page.screenshot({ path: path.join(OUT_DIR, 'task021_04_camera_lake_preset.png') });
  console.log('Saved 04_camera_lake_preset.png');

  console.log('Testing Camera Presets: Waterfall Gorge...');
  await page.click('[data-testid="btn-cam-waterfall"]');
  await new Promise((r) => setTimeout(r, 1000));
  await page.screenshot({ path: path.join(OUT_DIR, 'task021_05_camera_waterfall_preset.png') });
  console.log('Saved 05_camera_waterfall_preset.png');

  console.log('Testing Camera Presets: Cave Subterranean...');
  await page.click('[data-testid="btn-cam-cave"]');
  await new Promise((r) => setTimeout(r, 1000));
  await page.screenshot({ path: path.join(OUT_DIR, 'task021_06_camera_cave_preset.png') });
  console.log('Saved 06_camera_cave_preset.png');

  // 5. Dig / Fill Tool Test
  console.log('Testing Interactive Dig / Fill Tool...');
  await page.click('[data-testid="btn-tool-dig"]');
  // Click in center of subterranean soil to excavate
  await page.mouse.click(800, 600);
  await new Promise((r) => setTimeout(r, 500));
  await page.mouse.click(820, 600);
  await new Promise((r) => setTimeout(r, 1000));
  telemetryLog['AFTER_DIG_EXCAVATION'] = await readTelemetry();
  await page.screenshot({ path: path.join(OUT_DIR, 'task021_07_interactive_dig_fill.png') });
  console.log('Saved 07_interactive_dig_fill.png');

  // Return to Overview
  await page.click('[data-testid="btn-cam-overview"]');
  await page.click('[data-testid="btn-weather-CLEAR_SUNNY"]');
  await new Promise((r) => setTimeout(r, 3000));
  telemetryLog['FINAL_RESTORED'] = await readTelemetry();
  await page.screenshot({ path: path.join(OUT_DIR, 'task021_08_final_restored_overview.png') });
  console.log('Saved 08_final_restored_overview.png');

  // Save Telemetry
  fs.writeFileSync(path.join(OUT_DIR, 'TASK-021_TELEMETRY.json'), JSON.stringify(telemetryLog, null, 2), 'utf8');
  console.log('Saved TASK-021_TELEMETRY.json');

  await browser.close();
  console.log('ALL GATE A.2 AUTOMATED CAPTURES & TESTS FINISHED SUCCESSFULLY!');
}

run().catch((err) => {
  console.error('QA Runner error:', err);
  process.exit(1);
});
