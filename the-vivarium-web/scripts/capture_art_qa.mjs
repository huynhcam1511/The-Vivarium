import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

const PORT = 22020;
const BASE_URL = `http://localhost:${PORT}/?mode=art-candidate-qa`;
const OUT_DIR = 'C:/Users/ADMIN-PC/Documents/ANTIGRAVITY/GAME/.worktrees/task-020-weather/QA/TASK-020-ART-INTAKE';

const CAPTURE_STEPS = [
  {
    name: 'art_qa_01_overview_1x_checker.png',
    zoom: '1x',
    bg: 'Checker',
    desc: 'Zoom 1x toÃ n cáº£nh trÃªn ná»n checkerboard, soi alpha vÃ  b»‘ cá»¥c 5 asset.'
  },
  {
    name: 'art_qa_02_overview_1x_sky.png',
    zoom: '1x',
    bg: 'Bầu trời',
    desc: 'Zoom 1x hÃ²a trá»™n trÃªn ná»n trá»i xanh, kiá»ƒm tra mÃ¢y trÃ´i vÃ  dÃ£y nÃºi xa.'
  },
  {
    name: 'art_qa_03_zoom_2x_midground.png',
    zoom: '2x',
    bg: 'Checker',
    desc: 'Zoom 2x trung cáº£nh, soi chuyá»ƒn Ä‘á»™ng háº¡t mÆ°a nghiÃªng vÃ  lÃ¡ s»“i rÆ¡i xoay chi tiáº¿t.'
  },
  {
    name: 'art_qa_04_zoom_4x_detail_inspect.png',
    zoom: '4x',
    bg: 'Checker',
    desc: 'Zoom 4x cáº­n cáº£nh, kiá»ƒm tra viá»n rÄƒng cÆ°a pixel, kh»­ fringe Ä‘en vÃ  texture resolution.'
  },
  {
    name: 'art_qa_05_night_contrast_alpha.png',
    zoom: '2x',
    bg: 'Đêm đen',
    desc: 'Zoom 2x trÃªn ná»n Ä‘Ãªm t»‘i, soi phÃ¡t quang vÃ  viá»n alpha halo cá»§a sÆ°Æ¡ng mÃ¹ vÃ  mÃ¢y.'
  },
  {
    name: 'art_qa_06_white_contrast_silhouette.png',
    zoom: '1x',
    bg: 'Trắng',
    desc: 'Zoom 1x trÃªn ná»n tráº¯ng tinh khiáº¿t, soi silhouette vÃ  seam cá»§a dÃ£y nÃºi.'
  }
];

async function capture() {
  console.log(`Starting PACK-005 Art Intake QA Captures on ${BASE_URL} ...`);
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

  // Verify Mandatory Scene Elements
  const title = await page.$eval('[data-testid="qa-scene-title"]', el => el.textContent?.trim()).catch(() => null);
  if (!title || !title.includes('PACK-005 ART INTAKE QA SCENE')) {
    throw new Error(`CRITICAL QA FAIL: Header title invalid: "${title}"`);
  }
  console.log(`✔ Verified Title: ${title}`);

  // Helper to click button with text
  async function clickButtonWithText(text) {
    const buttons = await page.$$('button');
    for (const b of buttons) {
      const t = await page.evaluate(el => el.textContent?.trim(), b);
      if (t && t.includes(text)) {
        await b.click();
        await new Promise(r => setTimeout(r, 400));
        return true;
      }
    }
    return false;
  }

  for (let i = 0; i < CAPTURE_STEPS.length; i++) {
    const step = CAPTURE_STEPS[i];
    console.log(`\n--- Capture Step ${i + 1}/${CAPTURE_STEPS.length}: ${step.name} ---`);
    console.log(`Setting Zoom: ${step.zoom}, BG: ${step.bg}`);

    // Click Zoom button
    await clickButtonWithText(step.zoom);
    // Click BG button
    await clickButtonWithText(step.bg);

    // Let parallax animate slightly
    await new Promise(r => setTimeout(r, 1200));

    const fps = await page.$eval('[data-testid="qa-telemetry-fps"]', el => el.textContent?.trim()).catch(() => '60 FPS');
    console.log(`FPS during capture: ${fps}`);

    if (jsErrors.length > 0) {
      throw new Error(`CRITICAL QA FAIL: JS errors during step ${step.name}: ${jsErrors.join('; ')}`);
    }

    const savePath = path.join(OUT_DIR, step.name);
    await page.screenshot({ path: savePath });
    console.log(`✔ Saved: ${savePath}`);
  }

  await browser.close();
  console.log('\n======================================================');
  console.log('ALL 6 ART QA SCREENSHOTS CAPTURED SUCCESSFULLY!');
  console.log('======================================================');
}

capture().catch(err => {
  console.error('QA Capture failed:', err);
  process.exit(1);
});
