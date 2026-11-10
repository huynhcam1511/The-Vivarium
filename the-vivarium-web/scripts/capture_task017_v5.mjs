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

  const targetUrl = 'http://localhost:2000/?mode=qa-oak-unified-v5';
  console.log(`Navigating to ${targetUrl} ...`);
  await page.goto(targetUrl, { waitUntil: 'networkidle2' });
  await new Promise((r) => setTimeout(r, 2000));

  const outDir = 'c:/Users/ADMIN-PC/Documents/ANTIGRAVITY/GAME/the-vivarium-web/QA/TASK-017_V5';
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

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

  // 1. V5 Toàn Cảnh 1×
  console.log('Capturing 01: V5 Toàn Cảnh (1×) - Địa tầng & Hang...');
  await clickButtonWithText('V5 Unified');
  await clickButtonWithText('Địa Tầng & Hang');
  await clickButtonWithText('Toàn Cảnh (1×)');
  await new Promise((r) => setTimeout(r, 800));
  await page.screenshot({ path: path.join(outDir, '01_v5_overview_1x.png') });

  // 2. V5 Mặt đất & Rễ ngầm 2×
  console.log('Capturing 02: V5 Mặt Đất & Rễ Ngầm (2×)...');
  await clickButtonWithText('Mặt Đất & Rễ Ngầm (2×)');
  await new Promise((r) => setTimeout(r, 800));
  await page.screenshot({ path: path.join(outDir, '02_v5_ground_roots_2x.png') });

  // 3. V5 Chi tiết cổ rễ 4×
  console.log('Capturing 03: V5 Chi Tiết Cổ Rễ (4×)...');
  await clickButtonWithText('Chi Tiết Cổ Rễ (4×)');
  await new Promise((r) => setTimeout(r, 800));
  await page.screenshot({ path: path.join(outDir, '03_v5_collar_extreme_4x.png') });

  // 4. V5 trên Nền Trắng (1×, 2×, 4×)
  console.log('Capturing 04: V5 Nền Trắng (1×, 2×, 4×)...');
  await clickButtonWithText('Nền Trắng');
  await clickButtonWithText('Toàn Cảnh (1×)');
  await new Promise((r) => setTimeout(r, 800));
  await page.screenshot({ path: path.join(outDir, '04_v5_white_bg_1x.png') });

  await clickButtonWithText('Mặt Đất & Rễ Ngầm (2×)');
  await new Promise((r) => setTimeout(r, 800));
  await page.screenshot({ path: path.join(outDir, '05_v5_white_bg_2x.png') });

  await clickButtonWithText('Chi Tiết Cổ Rễ (4×)');
  await new Promise((r) => setTimeout(r, 800));
  await page.screenshot({ path: path.join(outDir, '06_v5_white_bg_4x.png') });

  // 5. V5 trên Nền Đất Tối (1×, 2×, 4×)
  console.log('Capturing 05: V5 Nền Đất Tối (1×, 2×, 4×)...');
  await clickButtonWithText('Nền Đất Tối');
  await clickButtonWithText('Toàn Cảnh (1×)');
  await new Promise((r) => setTimeout(r, 800));
  await page.screenshot({ path: path.join(outDir, '07_v5_dark_soil_1x.png') });

  await clickButtonWithText('Mặt Đất & Rễ Ngầm (2×)');
  await new Promise((r) => setTimeout(r, 800));
  await page.screenshot({ path: path.join(outDir, '08_v5_dark_soil_2x.png') });

  await clickButtonWithText('Chi Tiết Cổ Rễ (4×)');
  await new Promise((r) => setTimeout(r, 800));
  await page.screenshot({ path: path.join(outDir, '09_v5_dark_soil_4x.png') });

  // 6. V5 trên Nền Caro (Alpha & Fringe Inspection)
  console.log('Capturing 06: V5 Nền Caro 2×...');
  await clickButtonWithText('Nền Caro');
  await clickButtonWithText('Mặt Đất & Rễ Ngầm (2×)');
  await new Promise((r) => setTimeout(r, 800));
  await page.screenshot({ path: path.join(outDir, '10_v5_checker_alpha_2x.png') });

  // 7. V5 trong Mặt cắt Địa tầng có Hang kiến (Chi tiết khoảng trống hang)
  console.log('Capturing 07: V5 Mặt Cắt Địa Tầng & Hang Kiến (Clearance Inspection)...');
  await clickButtonWithText('Địa Tầng & Hang');
  await clickButtonWithText('Mặt Đất & Rễ Ngầm (2×)');
  await new Promise((r) => setTimeout(r, 800));
  await page.screenshot({ path: path.join(outDir, '11_v5_stratified_cave_cutaway.png') });

  // 8. So sánh trực tiếp V2 / V4 / V5 cùng điều kiện
  console.log('Capturing 08: So sánh V2 / V4 / V5 (1.1×)...');
  await clickButtonWithText('So Sánh V2 / V4 / V5');
  await new Promise((r) => setTimeout(r, 1200));
  await page.screenshot({ path: path.join(outDir, '12_comparison_v2_v4_v5_trio.png') });

  await browser.close();
  console.log('All V5 QA screenshots captured successfully!');
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
