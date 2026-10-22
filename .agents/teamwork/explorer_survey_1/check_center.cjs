const puppeteer = require('../../../.worktrees/task-021-world-integration/the-vivarium-web/node_modules/puppeteer');
const fs = require('fs');
const path = require('path');

async function checkCenterHorizontal() {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewport({ width: 1600, height: 1000 });

  const loadBase64 = (p) => 'data:image/png;base64,' + fs.readFileSync(path.join(__dirname, p)).toString('base64');
  const img1 = loadBase64('test_1x.png');
  const img2 = loadBase64('test_2x.png');
  const img4 = loadBase64('test_4x.png');

  const profile = await page.evaluate(async (s1, s2, s4) => {
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

    function getRow(img, name) {
      ctx.clearRect(0, 0, 1600, 1000);
      ctx.drawImage(img, 0, 0);
      const row = ctx.getImageData(0, 500, 1600, 1).data;
      const samples = [];
      for (let x = 0; x < 1600; x += 100) {
        const idx = x * 4;
        samples.push({ x, rgb: [row[idx], row[idx+1], row[idx+2]] });
      }
      return { name, samples };
    }

    return {
      r1: getRow(i1, '1x'),
      r2: getRow(i2, '2x'),
      r4: getRow(i4, '4x'),
    };
  }, img1, img2, img4);

  console.log('Center row (y=500) samples across X:');
  for (let i = 0; i < profile.r1.samples.length; i++) {
    const s1 = profile.r1.samples[i];
    const s2 = profile.r2.samples[i];
    const s4 = profile.r4.samples[i];
    const diff12 = Math.abs(s1.rgb[0]-s2.rgb[0]) + Math.abs(s1.rgb[1]-s2.rgb[1]) + Math.abs(s1.rgb[2]-s2.rgb[2]);
    const diff14 = Math.abs(s1.rgb[0]-s4.rgb[0]) + Math.abs(s1.rgb[1]-s4.rgb[1]) + Math.abs(s1.rgb[2]-s4.rgb[2]);
    console.log(`x=${s1.x} 1x:${JSON.stringify(s1.rgb)} 2x:${JSON.stringify(s2.rgb)} 4x:${JSON.stringify(s4.rgb)} d12=${diff12} d14=${diff14}`);
  }

  await browser.close();
}

checkCenterHorizontal().catch(console.error);
