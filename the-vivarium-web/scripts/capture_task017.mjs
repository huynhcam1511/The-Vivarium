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

  const outDir = 'c:/Users/ADMIN-PC/Documents/ANTIGRAVITY/GAME/the-vivarium-web/QA/TASK-017';
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

  // 1. Toàn cảnh 1x (Overview 1x)
  console.log('Capturing 1. Overview 1x with Ground Grass & Vegetation...');
  await clickButtonWithText('Toàn Cảnh (1x)');
  await new Promise((r) => setTimeout(r, 800));
  await page.screenshot({ path: path.join(outDir, 'task017_01_overview_1x.png') });
  console.log('Saved task017_01_overview_1x.png');

  // 2. Cận cảnh Gốc & Mặt Đất (2x)
  console.log('Capturing 2. Gốc & Mặt Đất 2x (Tree base, roots, grass strip, tufts)...');
  await clickButtonWithText('Gốc & Mặt Đất (2x)');
  await new Promise((r) => setTimeout(r, 800));
  await page.screenshot({ path: path.join(outDir, 'task017_02_zoom2x_tree_base_vegetation.png') });
  console.log('Saved task017_02_zoom2x_tree_base_vegetation.png');

  // 3. Thảm thực vật đồng cỏ & tỷ lệ Kiến thợ V2 (2.5x)
  console.log('Capturing 3. Thảm thực vật & Tỷ lệ Kiến thợ V2 (2.5x)...');
  await clickButtonWithText('Thảm Thực Vật B1 (2.5x)');
  await new Promise((r) => setTimeout(r, 800));
  await page.screenshot({ path: path.join(outDir, 'task017_03_zoom2_5x_meadow_ant_scale.png') });
  console.log('Saved task017_03_zoom2_5x_meadow_ant_scale.png');

  // 4. Cận cảnh Zoom 4x Cỏ & Hoa B1 (Clover, Daisy, Tuft micro-petals & edges)
  console.log('Capturing 4. Cận cảnh Cỏ & Hoa B1 Zoom 4x...');
  await clickButtonWithText('Cận Cảnh Cỏ & Hoa B1 (4x)');
  await new Promise((r) => setTimeout(r, 800));
  await page.screenshot({ path: path.join(outDir, 'task017_04_zoom4x_clover_daisy_details.png') });
  console.log('Saved task017_04_zoom4x_clover_daisy_details.png');

  // 5. Cận cảnh Mối nối dải cỏ Zoom 4x (Seam inspection between repeating strips)
  console.log('Capturing 5. Mối nối dải cỏ Zoom 4x...');
  await clickButtonWithText('Mối Nối Dải Cỏ (4x)');
  await new Promise((r) => setTimeout(r, 800));
  await page.screenshot({ path: path.join(outDir, 'task017_05_zoom4x_grass_strip_seams.png') });
  console.log('Saved task017_05_zoom4x_grass_strip_seams.png');

  // 6. Kiểm tra nền caro (Checkerboard Background) để soi sạch viền alpha
  console.log('Capturing 6. Checkerboard Background QA...');
  await clickButtonWithText('Nền Caro');
  await new Promise((r) => setTimeout(r, 600));
  await clickButtonWithText('Thảm Thực Vật B1 (2.5x)');
  await new Promise((r) => setTimeout(r, 800));
  await page.screenshot({ path: path.join(outDir, 'task017_06_checkerboard_alpha_qa.png') });
  console.log('Saved task017_06_checkerboard_alpha_qa.png');

  // 7. Cận cảnh Thân cây 4x (Trunk inspection integrity)
  console.log('Capturing 7. Trunk 4x...');
  await clickButtonWithText('Trời Gradient');
  await new Promise((r) => setTimeout(r, 500));
  await clickButtonWithText('Thân Cây (4x)');
  await new Promise((r) => setTimeout(r, 800));
  await page.screenshot({ path: path.join(outDir, 'task017_07_zoom4x_trunk_integrity.png') });
  console.log('Saved task017_07_zoom4x_trunk_integrity.png');

  await browser.close();
  console.log('All TASK-017 screenshots captured successfully!');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
