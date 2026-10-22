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

  const outDir = 'c:/Users/ADMIN-PC/Documents/ANTIGRAVITY/GAME/the-vivarium-web/QA/TASK-017_V5_COMPATIBILITY';
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

  // Set default view: V5 Unified, Địa Tầng & Hang, Ki?m Tra Hang R? (2x)
  await clickButtonWithText('V5 Unified');
  await clickButtonWithText('Địa Tầng & Hang');
  await clickButtonWithText('Kiểm Tra Hang Rễ (2×)');
  await new Promise((r) => setTimeout(r, 1000));

  // 1. BEFORE DIG
  console.log('Capturing 01: BEFORE DIG (Initial undisturbed terrain)...');
  await page.screenshot({ path: path.join(outDir, '01_v5_before_dig_2x.png') });

  // 2. AFTER DIG
  console.log('Capturing 02: AFTER DIG (Excavating tunnel through root zone)...');
  await clickButtonWithText('Đào Đường Hầm Rễ');
  await new Promise((r) => setTimeout(r, 1000));
  await page.screenshot({ path: path.join(outDir, '02_v5_after_dig_2x.png') });

  // 3. AFTER FILL
  console.log('Capturing 03: AFTER FILL (Partially refilling excavated tunnel)...');
  await clickButtonWithText('Lấp Đất Lại');
  await new Promise((r) => setTimeout(r, 1000));
  await page.screenshot({ path: path.join(outDir, '03_v5_after_fill_2x.png') });

  // 4. CẬN CẢNH ĐƯỜNG HẦM & LỐI ĐI KIẾN QUA RỄ (4x)
  console.log('Capturing 04: Cận cảnh đường hầm rễ & kiểm tra che khuất kiến 4x...');
  await clickButtonWithText('Chi Tiết Cổ Rễ (4×)');
  await new Promise((r) => setTimeout(r, 1000));
  await page.screenshot({ path: path.join(outDir, '04_v5_root_ant_clearance_4x.png') });

  // 5. TOÀN CẢNH SAU KHI ĐÀO (1x)
  console.log('Capturing 05: Toàn cảnh sau đào 1x...');
  await clickButtonWithText('Toàn Cảnh (1×)');
  await new Promise((r) => setTimeout(r, 1000));
  await page.screenshot({ path: path.join(outDir, '05_v5_full_overview_post_dig_1x.png') });

  // 6. KIỂM TRA ALPHA FRINGE & HALO TRÊN NỀN CARO (4x)
  console.log('Capturing 06: Kiểm tra Alpha Fringe & Halo trên nền Caro 4x...');
  await clickButtonWithText('Nền Caro');
  await clickButtonWithText('Chi Tiết Cổ Rễ (4×)');
  await new Promise((r) => setTimeout(r, 1000));
  await page.screenshot({ path: path.join(outDir, '06_v5_alpha_fringe_inspection_4x.png') });

  // 7. KIỂM TRA TRÊN NỀN ĐẤT TỐI (4x)
  console.log('Capturing 07: Kiểm tra viền tối trên nền đất tối 4x...');
  await clickButtonWithText('Nền Đất Tối');
  await new Promise((r) => setTimeout(r, 1000));
  await page.screenshot({ path: path.join(outDir, '07_v5_dark_soil_edge_4x.png') });

  // 8. KIỂM TRA TRÊN NỀN TRẮNG (4x)
  console.log('Capturing 08: Kiểm tra viền sáng trên nền trắng 4x...');
  await clickButtonWithText('Nền Trắng');
  await new Promise((r) => setTimeout(r, 1000));
  await page.screenshot({ path: path.join(outDir, '08_v5_white_bg_halo_4x.png') });

  await browser.close();
  console.log('All V5 Compatibility captures completed successfully!');
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
