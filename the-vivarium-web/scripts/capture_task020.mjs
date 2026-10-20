import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

async function run() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1600,1000'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1600, height: 1000 });

  const targetUrl = 'http://localhost:2000/?mode=weather';
  console.log(`Navigating to ${targetUrl} ...`);
  await page.goto(targetUrl, { waitUntil: 'networkidle2' });
  await new Promise((r) => setTimeout(r, 2000));

  const outDir = 'c:/Users/ADMIN-PC/Documents/ANTIGRAVITY/worktrees/task-020-weather/QA/TASK-020';
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  // Helper to click button with text
  async function clickButtonWithText(text) {
    const buttons = await page.$$('button');
    for (const b of buttons) {
      const t = await page.evaluate((el) => el.textContent, b);
      if (t && t.includes(text)) {
        await b.click();
        await new Promise((r) => setTimeout(r, 600));
        return true;
      }
    }
    return false;
  }

  // 1. CLEAR_SUNNY (Default overview)
  console.log('Capturing 1. CLEAR_SUNNY state...');
  await new Promise((r) => setTimeout(r, 1000));
  await page.screenshot({ path: path.join(outDir, 'task020_01_clear_sunny.png') });
  console.log('Saved task020_01_clear_sunny.png');

  // 2. GENTLE_RAIN
  console.log('Switching to GENTLE_RAIN...');
  await clickButtonWithText('Mưa Rào Rải Rác');
  await new Promise((r) => setTimeout(r, 3500)); // wait for transition
  await page.screenshot({ path: path.join(outDir, 'task020_02_gentle_rain.png') });
  console.log('Saved task020_02_gentle_rain.png');

  // 3. STORMY_TEMPEST (Tropical storm, lightning, heavy rain, wind slant)
  console.log('Switching to STORMY_TEMPEST...');
  await clickButtonWithText('Bão Nhiệt Đới');
  await new Promise((r) => setTimeout(r, 3500)); // wait for transition
  await page.screenshot({ path: path.join(outDir, 'task020_03_stormy_tempest.png') });
  console.log('Saved task020_03_stormy_tempest.png');

  // 4. HEATWAVE (Arid high temp, low moisture)
  console.log('Switching to HEATWAVE...');
  await clickButtonWithText('Nắng Gắt');
  await new Promise((r) => setTimeout(r, 3500));
  await page.screenshot({ path: path.join(outDir, 'task020_04_heatwave.png') });
  console.log('Saved task020_04_heatwave.png');

  // 5. AUTUMN_BREEZE (Foliage sway & falling leaves)
  console.log('Switching to AUTUMN_BREEZE...');
  await clickButtonWithText('Gió Thu Lá Rụng');
  await new Promise((r) => setTimeout(r, 3500));
  await page.screenshot({ path: path.join(outDir, 'task020_05_autumn_breeze.png') });
  console.log('Saved task020_05_autumn_breeze.png');

  // 6. FOGGY_MIST (High humidity, soft morning mist ribbons)
  console.log('Switching to FOGGY_MIST...');
  await clickButtonWithText('Sương Mù');
  await new Promise((r) => setTimeout(r, 3500));
  await page.screenshot({ path: path.join(outDir, 'task020_06_foggy_mist.png') });
  console.log('Saved task020_06_foggy_mist.png');

  await browser.close();
  console.log('All TASK-020 screenshots captured successfully!');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
