const puppeteer = require('../../../.worktrees/task-021-world-integration/the-vivarium-web/node_modules/puppeteer');
const fs = require('fs');
const path = require('path');

async function testDiffVisual() {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewport({ width: 1600, height: 1000 });

  const loadBase64 = (p) => 'data:image/png;base64,' + fs.readFileSync(p).toString('base64');
  const img1 = loadBase64('./test_1x.png');
  const img2 = loadBase64('./test_2x.png');
  const img4 = loadBase64('./test_4x.png');

  const diffResult = await page.evaluate(async (s1, s2) => {
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
    const d1 = ctx.getImageData(0, 0, 1600, 1000);
    ctx.drawImage(i2, 0, 0);
    const d2 = ctx.getImageData(0, 0, 1600, 1000);

    const out = ctx.createImageData(1600, 1000);
    let changed = 0;

    for (let i = 0; i < d1.data.length; i += 4) {
      const delta = Math.abs(d1.data[i] - d2.data[i]) +
                    Math.abs(d1.data[i+1] - d2.data[i+1]) +
                    Math.abs(d1.data[i+2] - d2.data[i+2]);
      if (delta > 25) {
        changed++;
        out.data[i] = 255; // Red diff
        out.data[i+1] = 0;
        out.data[i+2] = 0;
        out.data[i+3] = 255;
      } else {
        out.data[i] = d1.data[i] * 0.3;
        out.data[i+1] = d1.data[i+1] * 0.3;
        out.data[i+2] = d1.data[i+2] * 0.3;
        out.data[i+3] = 255;
      }
    }
    ctx.putImageData(out, 0, 0);
    return { changed, dataUrl: c.toDataURL('image/png') };
  }, img1, img2);

  console.log('Total changed pixels:', diffResult.changed);
  const base64Data = diffResult.dataUrl.replace(/^data:image\/png;base64,/, '');
  fs.writeFileSync(path.join(__dirname, 'diff_test_1x_2x.png'), Buffer.from(base64Data, 'base64'));
  console.log('Saved diff_test_1x_2x.png');

  await browser.close();
}

testDiffVisual().catch(console.error);
