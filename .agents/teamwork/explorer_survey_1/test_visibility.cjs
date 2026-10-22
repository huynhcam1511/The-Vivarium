const puppeteer = require('../../../.worktrees/task-021-world-integration/the-vivarium-web/node_modules/puppeteer');
const fs = require('fs');
const path = require('path');

async function testVisibility() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1600,1000'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1600, height: 1000 });
  await page.goto('http://localhost:22021/?mode=integration', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));

  await page.evaluate(() => {
    const cam = window.__CAMERA__;
    cam.stage.visible = false;
  });
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: path.join(__dirname, 'test_hidden.png') });

  // Compare test_hidden.png with test_1x.png
  const load = (p) => 'data:image/png;base64,' + fs.readFileSync(path.join(__dirname, p)).toString('base64');
  const d = await page.evaluate(async (s1, s2) => {
    const ld = (s) => new Promise(r => { const i = new Image(); i.onload = () => r(i); i.src = s; });
    const [i1, i2] = await Promise.all([ld(s1), ld(s2)]);
    const c = document.createElement('canvas'); c.width = 1600; c.height = 1000;
    const ctx = c.getContext('2d');
    ctx.drawImage(i1, 0, 0); const d1 = ctx.getImageData(0,0,1600,1000).data;
    ctx.drawImage(i2, 0, 0); const d2 = ctx.getImageData(0,0,1600,1000).data;
    let diff = 0;
    for (let i = 0; i < d1.length; i += 4) {
      if (Math.abs(d1[i]-d2[i])+Math.abs(d1[i+1]-d2[i+1])+Math.abs(d1[i+2]-d2[i+2]) > 30) diff++;
    }
    return diff;
  }, load('test_hidden.png'), load('test_1x.png'));

  console.log('Diff when worldStage.visible = false:', d);
  await browser.close();
}

testVisibility().catch(console.error);
