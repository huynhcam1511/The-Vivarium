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

  const outDir = 'c:/Users/ADMIN-PC/Documents/ANTIGRAVITY/GAME/the-vivarium-web/QA/TASK-017_V5_DIGFILL_CORRECTION';
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

  // 1. Set Exact Camera Position: Ki?m Tra Hang R? (2x)
  console.log('Setting Camera to Root Zone 2x...');
  await clickButtonWithText('Kiểm Tra Hang Rễ (2×)');
  await new Promise((r) => setTimeout(r, 1000));

  // Capture BEFORE DIG
  console.log('Capturing 01: BEFORE DIG (Initial solid soil covering roots)...');
  await page.screenshot({ path: path.join(outDir, '01_v5_before_dig_2x.png') });

  // 2. Perform Verified Dig: Carve transverse tunnel X: -120..+120 at Y: 160
  console.log('Performing Dig Action...');
  await clickButtonWithText('Đào Đường Hầm Rễ');
  await new Promise((r) => setTimeout(r, 1200));

  // Capture AFTER DIG
  console.log('Capturing 02: AFTER DIG (Tunnel carved, roots exposed through cavity)...');
  await page.screenshot({ path: path.join(outDir, '02_v5_after_dig_2x.png') });

  // 3. Perform Verified Fill: Refill half of tunnel X: -120..-20
  console.log('Performing Fill Action...');
  await clickButtonWithText('Lấp Lại Nửa Hầm');
  await new Promise((r) => setTimeout(r, 1200));

  // Capture AFTER FILL
  console.log('Capturing 03: AFTER FILL (Half of tunnel refilled with soil, burying roots)...');
  await page.screenshot({ path: path.join(outDir, '03_v5_after_fill_2x.png') });

  // 4. Capture Naive Full Front comparison (Demonstrating WHY Naive fails)
  console.log('Capturing Naive Full Front comparison...');
  await clickButtonWithText('Naive Full Front (FAIL)');
  await new Promise((r) => setTimeout(r, 1000));
  await page.screenshot({ path: path.join(outDir, '04_v5_naive_front_failure_mode.png') });

  await browser.close();
  console.log('All correction screenshots captured successfully!');
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
