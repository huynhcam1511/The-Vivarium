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

  const targetUrl = 'http://localhost:2000/?mode=qa-oak-root-v4';
  console.log(`Navigating to ${targetUrl} ...`);
  await page.goto(targetUrl, { waitUntil: 'networkidle2' });
  await new Promise((r) => setTimeout(r, 2000));

  const outDir = 'c:/Users/ADMIN-PC/Documents/ANTIGRAVITY/GAME/the-vivarium-web/QA/TASK-017_V4';
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

  // 1. Toàn Cảnh (1×) - Địa tầng & hang
  console.log('Capturing 01: Toàn Cảnh 1x - Địa Tầng & Hang...');
  await clickButtonWithText('V4 Candidate');
  await clickButtonWithText('Địa Tầng & Hang');
  await clickButtonWithText('Toàn Cảnh (1×)');
  await new Promise((r) => setTimeout(r, 800));
  await page.screenshot({ path: path.join(outDir, '01_v4_stratified_cave_1x.png') });

  // 2. Nối Thân–Rễ (2×) - Địa tầng & hang
  console.log('Capturing 02: Nối Thân–Rễ 2x - Địa Tầng & Hang...');
  await clickButtonWithText('Nối Thân–Rễ (2×)');
  await new Promise((r) => setTimeout(r, 800));
  await page.screenshot({ path: path.join(outDir, '02_v4_joint_detail_2x.png') });

  // 3. Cận Cảnh Khớp Nối (4×) - Địa tầng & hang
  console.log('Capturing 03: Cận Cảnh Khớp Nối 4x...');
  await clickButtonWithText('Cận Cảnh Khớp Nối (4×)');
  await new Promise((r) => setTimeout(r, 800));
  await page.screenshot({ path: path.join(outDir, '03_v4_joint_extreme_4x.png') });

  // 4. Nền Trắng - 1×, 2×, 4×
  console.log('Capturing 04: Nền Trắng (1×, 2×, 4×)...');
  await clickButtonWithText('Nền Trắng');
  await clickButtonWithText('Toàn Cảnh (1×)');
  await new Promise((r) => setTimeout(r, 800));
  await page.screenshot({ path: path.join(outDir, '04_v4_white_bg_1x.png') });

  await clickButtonWithText('Nối Thân–Rễ (2×)');
  await new Promise((r) => setTimeout(r, 800));
  await page.screenshot({ path: path.join(outDir, '05_v4_white_bg_2x.png') });

  await clickButtonWithText('Cận Cảnh Khớp Nối (4×)');
  await new Promise((r) => setTimeout(r, 800));
  await page.screenshot({ path: path.join(outDir, '06_v4_white_bg_4x.png') });

  // 5. Nền Đất Tối - 1×, 2×, 4×
  console.log('Capturing 05: Nền Đất Tối (1×, 2×, 4×)...');
  await clickButtonWithText('Nền Đất Tối');
  await clickButtonWithText('Toàn Cảnh (1×)');
  await new Promise((r) => setTimeout(r, 800));
  await page.screenshot({ path: path.join(outDir, '07_v4_dark_soil_1x.png') });

  await clickButtonWithText('Nối Thân–Rễ (2×)');
  await new Promise((r) => setTimeout(r, 800));
  await page.screenshot({ path: path.join(outDir, '08_v4_dark_soil_2x.png') });

  await clickButtonWithText('Cận Cảnh Khớp Nối (4×)');
  await new Promise((r) => setTimeout(r, 800));
  await page.screenshot({ path: path.join(outDir, '09_v4_dark_soil_4x.png') });

  // 6. Nền Caro (Alpha Inspection) - 2x
  console.log('Capturing 06: Nền Caro Alpha 2x...');
  await clickButtonWithText('Nền Caro');
  await clickButtonWithText('Nối Thân–Rễ (2×)');
  await new Promise((r) => setTimeout(r, 800));
  await page.screenshot({ path: path.join(outDir, '10_v4_checker_alpha_2x.png') });

  // 7. So sánh trực tiếp V2 vs V4 Side-by-side (1.6x)
  console.log('Capturing 07: So sánh V2 vs V4...');
  await clickButtonWithText('Địa Tầng & Hang');
  await clickButtonWithText('So Sánh V2 / V4 (1.6×)');
  await new Promise((r) => setTimeout(r, 1000));
  await page.screenshot({ path: path.join(outDir, '11_side_by_side_v2_vs_v4_1_6x.png') });

  // 8. Mặt cắt địa tầng & Rễ sâu (Kiểm tra hang kiến có bị che khuất)
  console.log('Capturing 08: Mặt cắt địa tầng & rễ sâu...');
  await clickButtonWithText('V4 Candidate');
  await clickButtonWithText('Mặt Cắt Địa Tầng & Rễ (2×)');
  await new Promise((r) => setTimeout(r, 1000));
  await page.screenshot({ path: path.join(outDir, '12_v4_subterranean_cave_root_clearance_2x.png') });

  await browser.close();
  console.log('All QA captures completed successfully!');
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
