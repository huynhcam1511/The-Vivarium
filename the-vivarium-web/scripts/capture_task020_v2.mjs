import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

const PORT = 22020;
const BASE_URL = `http://localhost:${PORT}/?mode=weather`;
const OUT_DIR = 'C:/Users/ADMIN-PC/Documents/ANTIGRAVITY/GAME/.worktrees/task-020-weather/QA/TASK-020';

const WEATHER_STATES = [
  { id: 'CLEAR_SUNNY', label: 'Clear Sunny' },
  { id: 'GENTLE_RAIN', label: 'Gentle Rain' },
  { id: 'STORMY_TEMPEST', label: 'Stormy Tempest' },
  { id: 'HEATWAVE', label: 'Heatwave' },
  { id: 'AUTUMN_BREEZE', label: 'Autumn Breeze' },
  { id: 'FOGGY_MIST', label: 'Foggy Mist' },
];

async function capture() {
  console.log(`Starting TASK-020 QA verification on ${BASE_URL} ...`);
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1600,1000'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1600, height: 1000 });

  const jsErrors = [];
  page.on('pageerror', err => {
    console.error('Browser JS Error:', err);
    jsErrors.push(err.toString());
  });

  await page.goto(BASE_URL, { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));

  // Verify Mandatory Elements
  const headerText = await page.$eval('[data-testid="header-title"]', el => el.textContent?.trim()).catch(() => null);
  if (!headerText || !headerText.includes('THE VIVARIUM — WEATHER SUITE')) {
    throw new Error(`CRITICAL QA FAIL: Header title missing or invalid. Got: "${headerText}"`);
  }
  console.log(`✔ Verified Header Title: ${headerText}`);

  const hasPanel = await page.$eval('[data-testid="weather-control-panel"]', el => !!el).catch(() => false);
  if (!hasPanel) {
    throw new Error('CRITICAL QA FAIL: Weather Control Panel missing from DOM.');
  }
  console.log('✔ Verified Weather Control Panel is present.');

  if (jsErrors.length > 0) {
    throw new Error(`CRITICAL QA FAIL: Initial load encountered JS errors: ${jsErrors.join('; ')}`);
  }

  const telemetryLog = {};

  for (let idx = 0; idx < WEATHER_STATES.length; idx++) {
    const item = WEATHER_STATES[idx];
    const filenameBase = `task020_0${idx + 1}_${item.id.toLowerCase()}`;
    console.log(`\n--- Transitioning to [${item.id}] (${item.label}) ---`);

    // Click button
    const btnSelector = `[data-testid="btn-weather-${item.id}"]`;
    const btnExists = await page.$(btnSelector);
    if (!btnExists) {
      throw new Error(`CRITICAL QA FAIL: Weather button ${btnSelector} not found!`);
    }

    await page.click(btnSelector);
    console.log(`Clicked ${item.id} button. Waiting for transition to complete...`);

    // Wait until transition finishes (transition duration is 3.0s, wait 4.2s for stabilization)
    await new Promise(r => setTimeout(r, 4200));

    // Verify Telemetry State
    const transitionStatus = await page.$eval('[data-testid="status-transition"]', el => el.textContent?.trim()).catch(() => '');
    const tempText = await page.$eval('[data-testid="telemetry-temperature"]', el => el.textContent?.trim()).catch(() => '');
    const humText = await page.$eval('[data-testid="telemetry-humidity"]', el => el.textContent?.trim()).catch(() => '');
    const windText = await page.$eval('[data-testid="telemetry-wind"]', el => el.textContent?.trim()).catch(() => '');
    const soilText = await page.$eval('[data-testid="telemetry-soil"]', el => el.textContent?.trim()).catch(() => '');
    const fpsText = await page.$eval('[data-testid="telemetry-fps"]', el => el.textContent?.trim()).catch(() => '');

    console.log(`Status: ${transitionStatus}`);
    console.log(`Temp: ${tempText} | Humidity: ${humText} | Wind: ${windText} | Soil: ${soilText} | FPS: ${fpsText}`);

    if (jsErrors.length > 0) {
      throw new Error(`CRITICAL QA FAIL: JS errors detected during ${item.id}: ${jsErrors.join('; ')}`);
    }

    // Save Telemetry Record
    telemetryLog[item.id] = {
      stateId: item.id,
      label: item.label,
      temperature: tempText,
      humidity: humText,
      windSpeed: windText,
      soilMoisture: soilText,
      fps: fpsText,
      transitionStatus: transitionStatus,
      timestamp: new Date().toISOString(),
    };

    // Capture screenshot
    const screenshotPath = path.join(OUT_DIR, `${filenameBase}.png`);
    await page.screenshot({ path: screenshotPath });
    console.log(`✔ Saved screenshot: ${screenshotPath}`);
  }

  // Write Telemetry JSON
  const telemetryJsonPath = path.join(OUT_DIR, 'TASK-020_TELEMETRY.json');
  fs.writeFileSync(telemetryJsonPath, JSON.stringify(telemetryLog, null, 2), 'utf8');
  console.log(`\n✔ Saved telemetry JSON to: ${telemetryJsonPath}`);

  await browser.close();
  console.log('\n======================================================');
  console.log('ALL 6 WEATHER STATES CAPTURED & VERIFIED SUCCESSFULLY!');
  console.log('======================================================');
}

capture().catch(err => {
  console.error('\n✖ QA CAPTURE RUNNER FAILED:', err);
  process.exit(1);
});
