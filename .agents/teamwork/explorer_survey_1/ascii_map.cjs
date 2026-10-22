const puppeteer = require('../../../.worktrees/task-021-world-integration/the-vivarium-web/node_modules/puppeteer');
const fs = require('fs');

async function asciiMap() {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewport({ width: 1600, height: 1000 });

  const loadBase64 = (p) => 'data:image/png;base64,' + fs.readFileSync(p).toString('base64');
  const img1 = loadBase64('./test_1x.png');
  const img2 = loadBase64('./test_2x.png');
  const img4 = loadBase64('./test_4x.png');

  const maps = await page.evaluate(async (s1, s2, s4) => {
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

    function makeGrid(img) {
      ctx.clearRect(0, 0, 1600, 1000);
      ctx.drawImage(img, 0, 0);
      const grid = [];
      for (let y = 0; y < 1000; y += 40) {
        let row = '';
        for (let x = 0; x < 1600; x += 40) {
          const p = ctx.getImageData(x, y, 1, 1).data;
          // Classify color: Sky (blue), Soil (dark brown), Trunk (medium brown/tan), Foliage (green)
          const r = p[0], g = p[1], b = p[2];
          if (b > r + 30 && b > g) row += '~'; // Sky/water
          else if (g > r && g > b) row += '#'; // Foliage
          else if (r > 60 && g > 30 && b < 50) row += 'T'; // Trunk/bough
          else if (r < 40 && g < 30 && b < 30) row += '.'; // Dark soil/void
          else row += ' ';
        }
        grid.push(row);
      }
      return grid;
    }

    return {
      grid1: makeGrid(i1),
      grid2: makeGrid(i2),
      grid4: makeGrid(i4),
    };
  }, img1, img2, img4);

  console.log('=== GRID 1x ===');
  console.log(maps.grid1.join('\n'));
  console.log('=== GRID 2x ===');
  console.log(maps.grid2.join('\n'));
  console.log('=== GRID 4x ===');
  console.log(maps.grid4.join('\n'));

  await browser.close();
}

asciiMap().catch(console.error);
