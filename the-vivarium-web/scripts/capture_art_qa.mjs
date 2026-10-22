import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

async function captureArtQA() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1600,1000'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1600, height: 1000 });

  const targetUrl = 'http://127.0.0.1:2019/?mode=aquatic-art-qa';
  console.log(`Navigating to ${targetUrl} ...`);
  await page.goto(targetUrl, { waitUntil: 'networkidle2' });
  await new Promise((r) => setTimeout(r, 2000));

  const outDir = 'C:/Users/ADMIN-PC/Documents/ANTIGRAVITY/GAME/.worktrees/task-019-aquatic/QA/TASK-019/PACK004_ART_QA';
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const clickButton = async (text) => {
    const clicked = await page.evaluate((txt) => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes(txt));
      if (btn) {
        btn.click();
        return true;
      }
      return false;
    }, text);
    await new Promise((r) => setTimeout(r, 600));
    return clicked;
  };

  // 1. Gallery Mode (Dark Background) - All 5 PNGs side by side
  console.log('1. Capturing Gallery (Dark Background)...');
  await clickButton('Gallery');
  await clickButton('DARK');
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: path.join(outDir, '01_pack004_gallery_dark.png') });

  // 2. Gallery Mode (Checkerboard & White Background) - Checking Alpha Fringes
  console.log('2. Capturing Gallery (Checkerboard Background)...');
  await clickButton('CHECKER');
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: path.join(outDir, '02_pack004_gallery_checkerboard.png') });

  console.log('3. Capturing Gallery (White Background)...');
  await clickButton('WHITE');
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: path.join(outDir, '03_pack004_gallery_white_fringe_test.png') });

  // 3. Zoom Inspection (1x, 2x, 4x)
  console.log('4. Capturing Zoom 1x...');
  await clickButton('Zoom');
  await clickButton('DARK');
  await clickButton('1×');
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: path.join(outDir, '04_pack004_zoom_1x.png') });

  console.log('5. Capturing Zoom 2x...');
  await clickButton('2×');
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: path.join(outDir, '05_pack004_zoom_2x.png') });

  console.log('6. Capturing Zoom 4x...');
  await clickButton('4×');
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: path.join(outDir, '06_pack004_zoom_4x_pixel_detail.png') });

  // 4. Mud Seams & Tiling Test
  console.log('7. Capturing Mud Seam Tiling Test...');
  await clickButton('Mối Nối Bùn');
  await clickButton('DARK');
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: path.join(outDir, '07_pack004_lake_bottom_mud_seams.png') });

  // 5. Waterfall 6-Frame Animation Strip & Loop
  console.log('8. Capturing Waterfall 6-Frame Strip...');
  await clickButton('6 Frame Thác');
  await clickButton('DARK');
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: path.join(outDir, '08_pack004_waterfall_6frames_strip.png') });

  // 6. Composition & Proportions with Oak Tree, Fauna & Basin
  console.log('9. Capturing Composition & Proportions...');
  await clickButton('Tỷ Lệ Cảnh');
  await clickButton('TERRAIN');
  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({ path: path.join(outDir, '09_pack004_composition_proportions.png') });

  console.log('All QA screenshots captured successfully into', outDir);
  await browser.close();
}

captureArtQA().catch(console.error);
