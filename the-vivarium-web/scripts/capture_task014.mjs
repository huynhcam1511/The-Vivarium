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

  const outDir = 'c:/Users/ADMIN-PC/Documents/ANTIGRAVITY/GAME/the-vivarium-web/QA/TASK-014';
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

  // 1. Overview 1x: Full unified cave void and organic surface
  console.log('Capturing 1. Overview 1x...');
  await clickButtonWithText('Toàn Cảnh (1x)');
  await new Promise((r) => setTimeout(r, 800));
  await page.screenshot({ path: path.join(outDir, 'task014_cave_overview_1x.png') });
  console.log('Saved task014_cave_overview_1x.png');

  // 2. Chamber Detail (1.6x): Tunnel entering chamber with ant inside, showing continuous wall rim and warm interior
  console.log('Capturing 2. Chamber Detail...');
  await clickButtonWithText('Hang & Buồng (1.6x)');
  await new Promise((r) => setTimeout(r, 800));
  await page.screenshot({ path: path.join(outDir, 'task014_chamber_ant_detail.png') });
  console.log('Saved task014_chamber_ant_detail.png');

  // 3, 4, 5: VALIDATION TRIPLE AT EXACT FIXED CAMERA COORDINATES
  // Switch to fixed test preset
  console.log('Switching to fixed Test Dig/Fill preset...');
  await clickButtonWithText('Test Dig/Fill (Task-014)');
  await new Promise((r) => setTimeout(r, 800));

  // 3. BEFORE DIG: Capture initial state
  console.log('Capturing 3. BEFORE DIG...');
  await page.screenshot({ path: path.join(outDir, 'task014_01_before_dig.png') });
  console.log('Saved task014_01_before_dig.png');

  // 4. AFTER DIG: Dig a connecting tunnel extension at exact screen coordinates (centerX, centerY)
  console.log('Executing DIG brush interaction at center...');
  await clickButtonWithText('Đào Đất');
  await new Promise((r) => setTimeout(r, 300));

  // Drag mouse to dig a carved tunnel segment
  await page.mouse.move(780, 520);
  await page.mouse.down();
  for (let x = 780; x <= 920; x += 15) {
    await page.mouse.move(x, 520 + Math.sin((x - 780) * 0.05) * 20);
    await new Promise((r) => setTimeout(r, 30));
  }
  await page.mouse.up();
  await new Promise((r) => setTimeout(r, 800));

  // Capture AFTER DIG screenshot at EXACT SAME CAMERA
  console.log('Capturing 4. AFTER DIG...');
  await page.screenshot({ path: path.join(outDir, 'task014_02_after_dig.png') });
  console.log('Saved task014_02_after_dig.png');

  // 5. AFTER FILL: Fill back a portion of the soil
  console.log('Executing FILL brush interaction...');
  await clickButtonWithText('Lấp Đất');
  await new Promise((r) => setTimeout(r, 300));

  // Drag mouse to fill back part of the newly dug section
  await page.mouse.move(860, 520);
  await page.mouse.down();
  for (let x = 860; x <= 930; x += 10) {
    await page.mouse.move(x, 520);
    await new Promise((r) => setTimeout(r, 30));
  }
  await page.mouse.up();
  await new Promise((r) => setTimeout(r, 800));

  // Capture AFTER FILL screenshot at EXACT SAME CAMERA
  console.log('Capturing 5. AFTER FILL...');
  await page.screenshot({ path: path.join(outDir, 'task014_03_after_fill.png') });
  console.log('Saved task014_03_after_fill.png');

  // 6. DEBUG VIEW: Occupancy grid and boundary contours
  console.log('Capturing 6. Debug View (Grid 32px + boundary lines)...');
  await clickButtonWithText('Grid 32px');
  await new Promise((r) => setTimeout(r, 800));
  await page.screenshot({ path: path.join(outDir, 'task014_debug_occupancy_mask.png') });
  console.log('Saved task014_debug_occupancy_mask.png');

  // 7. HIGH ZOOM: Inspecting cave wall perimeter detail and absence of individual circles
  console.log('Capturing 7. Zoom Cave Wall Contour Detail...');
  await clickButtonWithText('Grid 32px'); // Turn off grid
  await clickButtonWithText('Vách Hang (3.2x)');
  await new Promise((r) => setTimeout(r, 800));
  await page.screenshot({ path: path.join(outDir, 'task014_zoom4x_wall_contour.png') });
  console.log('Saved task014_zoom4x_wall_contour.png');

  await browser.close();
  console.log('All TASK-014 screenshots captured successfully!');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
