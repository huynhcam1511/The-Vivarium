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

  const targetUrl = 'http://127.0.0.1:2019/?mode=aquatic';
  console.log(`Navigating to ${targetUrl} ...`);
  await page.goto(targetUrl, { waitUntil: 'networkidle2' });
  await new Promise((r) => setTimeout(r, 2000));

  const outDir = 'C:/Users/ADMIN-PC/Documents/ANTIGRAVITY/worktrees/task-019-aquatic/QA/TASK-019';
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

  // 1. Lake Overview (Default 1.25x view showing water column, swimming fish, duck, submerged flora)
  console.log('Capturing 1. Lake Overview (LOD1-LOD2)...');
  await new Promise((r) => setTimeout(r, 1200));
  await page.screenshot({ path: path.join(outDir, 'task019_01_lake_overview.png') });
  console.log('Saved task019_01_lake_overview.png');

  // 2. Waterfall Stream Detail (1.5x zoom focusing on cascading stream, rock gorge, and splash foam)
  console.log('Capturing 2. Waterfall Detail...');
  await clickButtonWithText('Thác Nước');
  await new Promise((r) => setTimeout(r, 1200));
  await page.screenshot({ path: path.join(outDir, 'task019_02_waterfall_detail.png') });
  console.log('Saved task019_02_waterfall_detail.png');

  // 3. Riparian Flora (Bluebells, Velvet Moss, Fern clusters on lake banks)
  console.log('Capturing 3. Riparian Flora Banks...');
  await clickButtonWithText('Lòng Hồ');
  await new Promise((r) => setTimeout(r, 1000));
  await page.screenshot({ path: path.join(outDir, 'task019_03_riparian_flora_banks.png') });
  console.log('Saved task019_03_riparian_flora_banks.png');

  // 4. Rain Inflow Interaction (Rising lake water level)
  console.log('Testing Rain Inflow interaction...');
  await clickButtonWithText('Nạp Nước Mưa');
  await new Promise((r) => setTimeout(r, 400));
  await clickButtonWithText('Nạp Nước Mưa');
  await new Promise((r) => setTimeout(r, 1200));
  await page.screenshot({ path: path.join(outDir, 'task019_04_rain_inflow_rising_water.png') });
  console.log('Saved task019_04_rain_inflow_rising_water.png');

  // 5. Broad Ecosystem Overview (Tree, Waterfall, Lake Basin & Wildlife)
  console.log('Capturing 5. Broad Overview...');
  await clickButtonWithText('Toàn Cảnh');
  await new Promise((r) => setTimeout(r, 1200));
  await page.screenshot({ path: path.join(outDir, 'task019_05_broad_ecosystem_overview.png') });
  console.log('Saved task019_05_broad_ecosystem_overview.png');

  await browser.close();
  console.log('All TASK-019 screenshots captured successfully!');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
