import { createRequire } from 'module';
import fs from 'fs';

const require = createRequire('c:/Users/ADMIN-PC/Documents/ANTIGRAVITY/GAME/.worktrees/task-021-world-integration/the-vivarium-web/package.json');
const puppeteer = require('puppeteer');

async function checkDiff() {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewport({ width: 1600, height: 1000 });

  const img1 = fs.readFileSync('c:/Users/ADMIN-PC/Documents/ANTIGRAVITY/GAME/.worktrees/task-021-world-integration/QA/TASK-021_B3/03a_root_before_dig.png').toString('base64');
  const img2 = fs.readFileSync('c:/Users/ADMIN-PC/Documents/ANTIGRAVITY/GAME/.worktrees/task-021-world-integration/QA/TASK-021_B3/03b_root_dig_exposed.png').toString('base64');
  const img3 = fs.readFileSync('c:/Users/ADMIN-PC/Documents/ANTIGRAVITY/GAME/.worktrees/task-021-world-integration/QA/TASK-021_B3/04_root_fill_recovered.png').toString('base64');

  await page.setContent('<canvas id="c1" width="1600" height="1000"></canvas><canvas id="c2" width="1600" height="1000"></canvas><canvas id="c3" width="1600" height="1000"></canvas>');
  const diffResult = await page.evaluate(async (b1, b2, b3) => {
    function load(src) {
      return new Promise((r) => {
        const i = new Image();
        i.onload = () => r(i);
        i.src = 'data:image/png;base64,' + src;
      });
    }
    const [i1, i2, i3] = await Promise.all([load(b1), load(b2), load(b3)]);
    const c1 = document.getElementById('c1');
    const c2 = document.getElementById('c2');
    const c3 = document.getElementById('c3');
    const ctx1 = c1.getContext('2d');
    const ctx2 = c2.getContext('2d');
    const ctx3 = c3.getContext('2d');
    ctx1.drawImage(i1, 0, 0);
    ctx2.drawImage(i2, 0, 0);
    ctx3.drawImage(i3, 0, 0);

    const d1 = ctx1.getImageData(0, 0, 1600, 1000).data;
    const d2 = ctx2.getImageData(0, 0, 1600, 1000).data;
    const d3 = ctx3.getImageData(0, 0, 1600, 1000).data;

    let diffDig = 0;
    let diffFillVsBefore = 0;
    let diffFillVsDig = 0;

    let minX = 1600, maxX = 0, minY = 1000, maxY = 0;
    const digSamples = [];

    for (let y = 0; y < 1000; y++) {
      for (let x = 0; x < 1600; x++) {
        const idx = (y * 1600 + x) * 4;
        const deltaDig = Math.abs(d1[idx] - d2[idx]) + Math.abs(d1[idx + 1] - d2[idx + 1]) + Math.abs(d1[idx + 2] - d2[idx + 2]);
        const deltaFill = Math.abs(d1[idx] - d3[idx]) + Math.abs(d1[idx + 1] - d3[idx + 1]) + Math.abs(d1[idx + 2] - d3[idx + 2]);
        const deltaFillDig = Math.abs(d2[idx] - d3[idx]) + Math.abs(d2[idx + 1] - d3[idx + 1]) + Math.abs(d2[idx + 2] - d3[idx + 2]);

        if (deltaDig > 30) {
          diffDig++;
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
          if (diffDig % 1500 === 0) {
            digSamples.push({
              screenX: x,
              screenY: y,
              before: [d1[idx], d1[idx + 1], d1[idx + 2]],
              afterDig: [d2[idx], d2[idx + 1], d2[idx + 2]],
            });
          }
        }
        if (deltaFill > 30) diffFillVsBefore++;
        if (deltaFillDig > 30) diffFillVsDig++;
      }
    }

    return {
      diffDigCount: diffDig,
      diffBoundingBox: { minX, maxX, minY, maxY },
      diffFillVsBeforeCount: diffFillVsBefore,
      diffFillVsDigCount: diffFillVsDig,
      digSamples,
    };
  }, img1, img2, img3);

  console.log(JSON.stringify(diffResult, null, 2));
  await browser.close();
}

checkDiff().catch(console.error);
