const puppeteer = require('../../../.worktrees/task-021-world-integration/the-vivarium-web/node_modules/puppeteer');
const fs = require('fs');
const path = require('path');

async function testRedRect() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1600,1000'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1600, height: 1000 });
  await page.goto('http://localhost:22021/?mode=integration', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));

  // Add big magenta rectangle to worldStage
  const res = await page.evaluate(() => {
    const cam = window.__CAMERA__;
    const stage = cam.stage; // worldStage
    
    // In Pixi 8, create Graphics
    // Note: Graphics class is in global or we can use child constructor
    const g = new stage.children[0].children[0].constructor();
    g.rect(0, 0, 500, 500);
    g.fill({ color: 0xff00ff });
    stage.addChild(g);

    return { added: true, stageChildren: stage.children.length };
  });

  console.log('Added rectangle:', res);
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: path.join(__dirname, 'test_magenta.png') });

  // Now check if pixel at (800, 500) or wherever g is located changed to magenta
  const loadBase64 = (p) => 'data:image/png;base64,' + fs.readFileSync(path.join(__dirname, p)).toString('base64');
  const imgMag = loadBase64('test_magenta.png');
  const img1 = loadBase64('test_1x.png');

  const diff = await page.evaluate(async (s1, s2) => {
    const load = (src) => new Promise(r => { const i = new Image(); i.onload = () => r(i); i.src = src; });
    const [i1, i2] = await Promise.all([load(s1), load(s2)]);
    const c = document.createElement('canvas');
    c.width = 1600; c.height = 1000;
    const ctx = c.getContext('2d');
    ctx.drawImage(i1, 0, 0);
    const d1 = ctx.getImageData(0, 0, 1600, 1000).data;
    ctx.drawImage(i2, 0, 0);
    const d2 = ctx.getImageData(0, 0, 1600, 1000).data;
    let ch = 0;
    for (let i = 0; i < d1.length; i += 4) {
      if (Math.abs(d1[i]-d2[i]) + Math.abs(d1[i+1]-d2[i+1]) + Math.abs(d1[i+2]-d2[i+2]) > 30) ch++;
    }
    return ch;
  }, imgMag, img1);

  console.log('Difference when adding magenta rect:', diff);
  await browser.close();
}

testRedRect().catch(console.error);
