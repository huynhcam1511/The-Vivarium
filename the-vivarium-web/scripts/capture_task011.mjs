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

  console.log('Navigating to http://localhost:2000/?mode=preview ...');
  await page.goto('http://localhost:2000/?mode=preview', { waitUntil: 'networkidle2' });
  await new Promise((r) => setTimeout(r, 2000));

  const outDir = 'c:/Users/ADMIN-PC/Documents/ANTIGRAVITY/GAME/the-vivarium-web/QA/TASK-011';
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  // Helper to click text
  async function clickButtonWithText(text) {
    const buttons = await page.$$('button');
    for (const b of buttons) {
      const t = await page.evaluate(el => el.textContent, b);
      if (t && t.includes(text)) {
        await b.click();
        await new Promise(r => setTimeout(r, 600));
        return true;
      }
    }
    return false;
  }

  // 1. Cây ghép 1.0x (Zoom 1x)
  await clickButtonWithText('1x');
  await page.screenshot({ path: path.join(outDir, 'task011_tree_assembled_1x.png') });
  console.log('Saved task011_tree_assembled_1x.png');

  // 2. Cây ghép 2.0x (Zoom 2x)
  await clickButtonWithText('2x');
  await page.screenshot({ path: path.join(outDir, 'task011_tree_assembled_2x.png') });
  console.log('Saved task011_tree_assembled_2x.png');

  // 3. Cây ghép 4.0x (Zoom 4x)
  await clickButtonWithText('4x');
  await page.screenshot({ path: path.join(outDir, 'task011_tree_assembled_4x.png') });
  console.log('Saved task011_tree_assembled_4x.png');

  // 4. Khớp nối & Rời từng lớp (TREE_SEAMS) at 1.0x
  await clickButtonWithText('Khớp Nối');
  await clickButtonWithText('1x');
  await page.screenshot({ path: path.join(outDir, 'task011_tree_seams_disassembled.png') });
  console.log('Saved task011_tree_seams_disassembled.png');

  // 5. Cây ghép trên nền trắng (White background to inspect edges/checkerboard remnants)
  await clickButtonWithText('Cây Ghép');
  await clickButtonWithText('Trắng');
  await clickButtonWithText('1x');
  await page.screenshot({ path: path.join(outDir, 'task011_tree_white_bg_seams.png') });
  console.log('Saved task011_tree_white_bg_seams.png');

  await browser.close();
  console.log('All QA screenshots captured successfully.');
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
