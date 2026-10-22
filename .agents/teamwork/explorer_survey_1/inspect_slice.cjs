const puppeteer = require('../../../.worktrees/task-021-world-integration/the-vivarium-web/node_modules/puppeteer');
const fs = require('fs');
const path = require('path');

async function test() {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewport({ width: 1600, height: 1000 });

  const rootDir = 'C:/Users/ADMIN-PC/Documents/ANTIGRAVITY/GAME/.worktrees/task-021-world-integration';
  const loadBase64 = (p) => 'data:image/png;base64,' + fs.readFileSync(path.join(rootDir, p)).toString('base64');
  const img02 = loadBase64('QA/TASK-021_B3/02_oak_v5_undulating_groundline.png');
  const img9a = loadBase64('QA/TASK-021_B3/09a_camera_zoom_1x.png');

  const diffCount = await page.evaluate(async (s1, s2) => {
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
    let diff = 0;
    for (let i = 0; i < d1.length; i += 4) {
      if (Math.abs(d1[i]-d2[i]) + Math.abs(d1[i+1]-d2[i+1]) + Math.abs(d1[i+2]-d2[i+2]) > 30) {
        diff++;
      }
    }
    return diff;
  }, img02, img9a);

  console.log('Diff 02 vs 09a:', diffCount);
  await browser.close();
}
test().catch(console.error);
