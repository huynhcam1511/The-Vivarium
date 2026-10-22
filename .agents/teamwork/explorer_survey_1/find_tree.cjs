const puppeteer = require('../../../.worktrees/task-021-world-integration/the-vivarium-web/node_modules/puppeteer');
const fs = require('fs');
const path = require('path');

async function findTreeInImage() {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewport({ width: 1600, height: 1000 });

  const loadBase64 = (p) => 'data:image/png;base64,' + fs.readFileSync(path.join(__dirname, p)).toString('base64');
  const img1 = loadBase64('test_1x.png');
  const img2 = loadBase64('test_2x.png');
  const img4 = loadBase64('test_4x.png');

  const boundsInImages = await page.evaluate(async (s1, s2, s4) => {
    const load = (src) => new Promise(res => {
      const img = new Image();
      img.onload = () => res(img);
      img.src = src;
    });
    const [i1, i2, i4] = await Promise.all([load(s1), load(s2), load(s4)]);
    const c = document.createElement('canvas');
    c.width = 1600;
    c.height = 1000;
    const ctx = c.getContext('2d');

    // In QA/TASK-021_B3, tree trunk texture has distinct brown/moss colors:
    // Let's find horizontal width of the trunk at y = 400
    function getTrunkWidthAtY(img, y) {
      ctx.clearRect(0, 0, 1600, 1000);
      ctx.drawImage(img, 0, 0);
      const row = ctx.getImageData(0, y, 1600, 1).data;
      const xIndices = [];
      for (let x = 0; x < 1600; x++) {
        const idx = x * 4;
        const r = row[idx], g = row[idx+1], b = row[idx+2];
        // Trunk color check (not blue sky, not black header/controls)
        // Sky has b > 140, r < 100
        const isSky = (b > 120 && b > r + 20);
        const isDarkUi = (r < 25 && g < 25 && b < 25);
        if (!isSky && !isDarkUi && (r > 40 || g > 40)) {
          xIndices.push(x);
        }
      }
      return {
        y,
        count: xIndices.length,
        minX: Math.min(...xIndices),
        maxX: Math.max(...xIndices),
        width: xIndices.length ? Math.max(...xIndices) - Math.min(...xIndices) : 0
      };
    }

    return {
      w1: getTrunkWidthAtY(i1, 400),
      w2: getTrunkWidthAtY(i2, 400),
      w4: getTrunkWidthAtY(i4, 400),
    };
  }, img1, img2, img4);

  console.log('Trunk width at y=400 in images:\n', JSON.stringify(boundsInImages, null, 2));
  await browser.close();
}

findTreeInImage().catch(console.error);
