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

  const targetUrl = 'http://localhost:2000/?mode=environment-preview';
  console.log(`Navigating to ${targetUrl} ...`);
  await page.goto(targetUrl, { waitUntil: 'networkidle2' });
  await new Promise((r) => setTimeout(r, 2000));

  const outDir = 'c:/Users/ADMIN-PC/Documents/ANTIGRAVITY/GAME/the-vivarium-web/QA/TASK-012';
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  // Helper to click text
  async function clickButtonWithText(text) {
    const buttons = await page.$$('button');
    for (const b of buttons) {
      const t = await page.evaluate(el => el.textContent, b);
      if (t && t.includes(text)) {
        await b.click();
        await new Promise(r => setTimeout(r, 600));
        return true;
      }
    }
    return false;
  }

  // 1. Toàn cảnh 1x (Overview 1.0x with Gradient Sky)
  console.log('Capturing 1. Toàn cảnh 1x...');
  await clickButtonWithText('Toàn Cảnh (1x)');
  await clickButtonWithText('Bầu Trời');
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: path.join(outDir, 'task012_overview_1x.png') });
  console.log('Saved task012_overview_1x.png');

  // 2. Toàn cảnh khi Pan camera (Drag / Pan)
  console.log('Capturing 2. Pan camera...');
  // Drag canvas to simulate panning
  await page.mouse.move(800, 500);
  await page.mouse.down();
  await page.mouse.move(500, 300, { steps: 10 });
  await page.mouse.up();
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: path.join(outDir, 'task012_camera_pan.png') });
  console.log('Saved task012_camera_pan.png');

  // 3. Chi tiết Gốc và Rễ 2x (Root & Base 2.0x)
  console.log('Capturing 3. Gốc & Rễ 2x...');
  await clickButtonWithText('Gốc & Rễ (2x)');
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: path.join(outDir, 'task012_root_base_2x.png') });
  console.log('Saved task012_root_base_2x.png');

  // 4. Chi tiết Thân và Cành 4x (Trunk & Bough 4.0x)
  console.log('Capturing 4. Thân & Cành 4x...');
  await clickButtonWithText('Thân & Cành (4x)');
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: path.join(outDir, 'task012_trunk_bough_4x.png') });
  console.log('Saved task012_trunk_bough_4x.png');

  // 5. So sánh trên Nền Đất Tối (Dark Soil Background)
  console.log('Capturing 5. Nền Đất Tối 1x...');
  await clickButtonWithText('Toàn Cảnh (1x)');
  await clickButtonWithText('Đất Tối');
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: path.join(outDir, 'task012_dark_soil_bg_1x.png') });
  console.log('Saved task012_dark_soil_bg_1x.png');

  // 6. So sánh trên Nền Trắng Sáng (High Contrast White to inspect edges)
  console.log('Capturing 6. Nền Trắng Sáng 1x...');
  await clickButtonWithText('Trắng Sáng');
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: path.join(outDir, 'task012_white_contrast_1x.png') });
  console.log('Saved task012_white_contrast_1x.png');

  await browser.close();
  console.log('All 6 TASK-012 QA screenshots captured successfully.');
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
