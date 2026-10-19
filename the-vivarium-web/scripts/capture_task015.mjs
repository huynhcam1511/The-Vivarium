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

  const outDir = 'c:/Users/ADMIN-PC/Documents/ANTIGRAVITY/GAME/the-vivarium-web/QA/TASK-015';
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

  // 1. Toàn cảnh 1x (Overview 1x): Toàn bộ hệ sinh thái cây sồi V2 + hệ thống 3 buồng hang uốn lượn
  console.log('Capturing 1. Overview 1x (Organic 3-Zone Cave System)...');
  await clickButtonWithText('Toàn Cảnh (1x)');
  await new Promise((r) => setTimeout(r, 800));
  await page.screenshot({ path: path.join(outDir, 'task015_01_overview_1x.png') });
  console.log('Saved task015_01_overview_1x.png');

  // 2. Cận cảnh Hang & 3 Không Gian (Chamber & Tunnels Detail 1.6x)
  console.log('Capturing 2. Cận cảnh 3 Không Gian (1.6x)...');
  await clickButtonWithText('Hang & Buồng (1.6x)');
  await new Promise((r) => setTimeout(r, 800));
  await page.screenshot({ path: path.join(outDir, 'task015_02_cave_3zones_detail.png') });
  console.log('Saved task015_02_cave_3zones_detail.png');

  // 3. Zoom 2x: Kiểm tra Kiến đứng trên sàn buồng sinh hoạt & buồng kiến chúa
  console.log('Capturing 3. Zoom 2x Biological Scale & Chambers...');
  await clickButtonWithText('Buồng Chúa (2x)');
  await new Promise((r) => setTimeout(r, 800));
  await page.screenshot({ path: path.join(outDir, 'task015_03_zoom2x_living_and_queen_chambers.png') });
  console.log('Saved task015_03_zoom2x_living_and_queen_chambers.png');

  // 4. Zoom 3.2x / 4x: Cận cảnh vách hang (Soft cutaway shading, no pipe lines, smooth 8px curves)
  console.log('Capturing 4. Zoom High Cave Wall Contour Shading...');
  await clickButtonWithText('Vách Hang (3.2x)');
  await new Promise((r) => setTimeout(r, 800));
  await page.screenshot({ path: path.join(outDir, 'task015_04_zoom3x_wall_contour_shading.png') });
  console.log('Saved task015_04_zoom3x_wall_contour_shading.png');

  // 5. Thao tác tương tác Đào/Lấp sống trên nền đồ họa mới
  console.log('Testing live Dig interaction...');
  await clickButtonWithText('Test Dig/Fill (Task-014)');
  await new Promise((r) => setTimeout(r, 600));
  await clickButtonWithText('Đào Đất');
  await new Promise((r) => setTimeout(r, 300));
  await page.mouse.move(760, 520);
  await page.mouse.down();
  for (let x = 760; x <= 880; x += 15) {
    await page.mouse.move(x, 520);
    await new Promise((r) => setTimeout(r, 30));
  }
  await page.mouse.up();
  await new Promise((r) => setTimeout(r, 800));
  await page.screenshot({ path: path.join(outDir, 'task015_05_dig_interaction_smooth.png') });
  console.log('Saved task015_05_dig_interaction_smooth.png');

  // 6. Debug View: Chứng minh Decoupled 32px Grid và Isosurface mượt
  console.log('Capturing 6. Debug Grid Decoupled...');
  await clickButtonWithText('Grid 32px');
  await new Promise((r) => setTimeout(r, 800));
  await page.screenshot({ path: path.join(outDir, 'task015_06_debug_grid_decoupled.png') });
  console.log('Saved task015_06_debug_grid_decoupled.png');

  await browser.close();
  console.log('All TASK-015 screenshots captured successfully!');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
