const puppeteer = require('../../../.worktrees/task-021-world-integration/the-vivarium-web/node_modules/puppeteer');
const fs = require('fs');

async function test() {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewport({ width: 1600, height: 1000 });

  const loadBase64 = (p) => 'data:image/png;base64,' + fs.readFileSync(p).toString('base64');
  const img1 = loadBase64('./test_1x.png');
  const img2 = loadBase64('./test_2x.png');

  const analysis = await page.evaluate(async (s1, s2) => {
    const load = (src) => new Promise(res => {
      const img = new Image();
      img.onload = () => res(img);
      img.src = src;
    });
    const [i1, i2] = await Promise.all([load(s1), load(s2)]);
    const c = document.createElement('canvas');
    c.width = 1600;
    c.height = 1000;
    const ctx = c.getContext('2d');
    ctx.drawImage(i1, 0, 0);
    const d1 = ctx.getImageData(0, 0, 1600, 1000).data;
    ctx.drawImage(i2, 0, 0);
    const d2 = ctx.getImageData(0, 0, 1600, 1000).data;

    let diffPixels = [];
    for (let y = 0; y < 1000; y++) {
      for (let x = 0; x < 1600; x++) {
        const idx = (y * 1600 + x) * 4;
        const diff = Math.abs(d1[idx]-d2[idx]) + Math.abs(d1[idx+1]-d2[idx+1]) + Math.abs(d1[idx+2]-d2[idx+2]);
        if (diff > 30) {
          diffPixels.push({ x, y });
        }
      }
    }

    // Also check what color is at screen center (800, 500), (800, 680), (800, 860)
    function getColor(d, x, y) {
      const idx = (y * 1600 + x) * 4;
      return [d[idx], d[idx+1], d[idx+2], d[idx+3]];
    }

    return {
      diffCount: diffPixels.length,
      diffBoundingBox: {
        minX: Math.min(...diffPixels.map(p => p.x)),
        maxX: Math.max(...diffPixels.map(p => p.x)),
        minY: Math.min(...diffPixels.map(p => p.y)),
        maxY: Math.max(...diffPixels.map(p => p.y)),
      },
      color1_800_500: getColor(d1, 800, 500),
      color2_800_500: getColor(d2, 800, 500),
      color1_800_680: getColor(d1, 800, 680),
      color2_800_680: getColor(d2, 800, 680),
    };
  }, img1, img2);

  console.log('Analysis of test_1x vs test_2x:', JSON.stringify(analysis, null, 2));
  await browser.close();
}
test().catch(console.error);
