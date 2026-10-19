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

  const outDir = 'c:/Users/ADMIN-PC/Documents/ANTIGRAVITY/GAME/the-vivarium-web/QA/TASK-013';
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

  // 1. Toàn cảnh 1x với Mặt Đất Hữu Cơ Uốn Lượn & Hang Ngầm
  console.log('Capturing 1. Toàn cảnh 1x Organic Terrain...');
  await clickButtonWithText('Toàn Cảnh (1x)');
  await new Promise((r) => setTimeout(r, 800));
  await page.screenshot({ path: path.join(outDir, 'task013_organic_overview_1x.png') });
  console.log('Saved task013_organic_overview_1x.png');

  // 2. Chi tiết Hang Cong & Buồng Tổ Tròn Không Đều (Zoom 1.6x)
  console.log('Capturing 2. Hang & Buồng (1.6x)...');
  await clickButtonWithText('Hang & Buồng (1.6x)');
  await new Promise((r) => setTimeout(r, 800));
  await page.screenshot({ path: path.join(outDir, 'task013_cave_chamber_detail.png') });
  console.log('Saved task013_cave_chamber_detail.png');

  // 3. Bật Grid 32px để chứng minh Decoupled Architecture (Không lộ ô vuông)
  console.log('Capturing 3. Grid Wireframe Decoupled...');
  await clickButtonWithText('Grid 32px');
  await new Promise((r) => setTimeout(r, 600));
  await page.screenshot({ path: path.join(outDir, 'task013_grid_wireframe_decoupled.png') });
  console.log('Saved task013_grid_wireframe_decoupled.png');
  await clickButtonWithText('Grid 32px'); // turn off

  // 4. Thao tác ĐÀO THỬ NGHIỆM (DIG interactive test)
  console.log('Capturing 4. Thao tác Đào đất...');
  await clickButtonWithText('Đào Đất');
  // Click/drag to dig a curved new branch in the soil
  await page.mouse.move(700, 550);
  await page.mouse.down();
  await page.mouse.move(750, 620, { steps: 8 });
  await page.mouse.move(820, 650, { steps: 8 });
  await page.mouse.up();
  await new Promise((r) => setTimeout(r, 800));
  await page.screenshot({ path: path.join(outDir, 'task013_interactive_dig_action.png') });
  console.log('Saved task013_interactive_dig_action.png');

  // 5. Thao tác LẤP THỬ NGHIỆM (FILL interactive test)
  console.log('Capturing 5. Thao tác Lấp đất...');
  await clickButtonWithText('Lấp Đất');
  // Click/drag to fill soil back
  await page.mouse.move(700, 550);
  await page.mouse.down();
  await page.mouse.move(720, 580, { steps: 5 });
  await page.mouse.up();
  await new Promise((r) => setTimeout(r, 800));
  await page.screenshot({ path: path.join(outDir, 'task013_interactive_fill_action.png') });
  console.log('Saved task013_interactive_fill_action.png');

  // 6. Gốc Sồi & Mặt Đất Hữu Cơ (Zoom 2.0x) - Xác minh gốc bám đất không lơ lửng
  console.log('Capturing 6. Gốc & Mặt Đất (2x)...');
  await clickButtonWithText('Pan Camera');
  await clickButtonWithText('Gốc & Mặt Đất (2x)');
  await new Promise((r) => setTimeout(r, 800));
  await page.screenshot({ path: path.join(outDir, 'task013_oak_root_surface_fit_2x.png') });
  console.log('Saved task013_oak_root_surface_fit_2x.png');

  // 7. Soi viền tiếp giáp Thân Cây (Zoom 4.0x)
  console.log('Capturing 7. Thân Cây (4x)...');
  await clickButtonWithText('Thân Cây (4x)');
  await new Promise((r) => setTimeout(r, 800));
  await page.screenshot({ path: path.join(outDir, 'task013_zoom_4x_texture_continuity.png') });
  console.log('Saved task013_zoom_4x_texture_continuity.png');

  await browser.close();
  console.log('All 7 TASK-013 QA screenshots captured successfully.');
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
