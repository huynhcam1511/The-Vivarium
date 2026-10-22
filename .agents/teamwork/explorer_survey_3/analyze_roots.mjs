import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';

const require = createRequire('c:/Users/ADMIN-PC/Documents/ANTIGRAVITY/GAME/.worktrees/task-021-world-integration/the-vivarium-web/package.json');
const puppeteer = require('puppeteer');

async function main() {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  const imgPath = 'c:/Users/ADMIN-PC/Documents/ANTIGRAVITY/GAME/.worktrees/task-021-world-integration/the-vivarium-web/public/assets/qa_temp_v5/env_tree_ancient_unified_v5.png';
  const imgData = fs.readFileSync(imgPath).toString('base64');

  await page.setContent('<canvas id="c" width="1200" height="1680"></canvas>');
  const res = await page.evaluate(async (b64) => {
    const canvas = document.getElementById('c');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    await new Promise((r) => {
      img.onload = r;
      img.src = 'data:image/png;base64,' + b64;
    });
    ctx.drawImage(img, 0, 0);

    const data = ctx.getImageData(0, 0, 1200, 1680).data;
    let minX = 1200, maxX = 0, minY = 1680, maxY = 0, count = 0;
    const branches = [];

    // Underground region starts at Y = 924 (where anchor Y = 0.55 * 1680 = 924)
    for (let y = 924; y < 1680; y += 4) {
      for (let x = 0; x < 1200; x += 4) {
        const a = data[(y * 1200 + x) * 4 + 3];
        if (a > 30) {
          count++;
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }

    // Sample distinct horizontal and vertical slices in world coords
    // Scale is 0.5: worldX = (texX - 600) * 0.5, worldY = (texY - 924) * 0.5
    for (let wy = 20; wy <= 340; wy += 20) {
      for (let wx = -240; wx <= 240; wx += 20) {
        const tx = Math.round(wx / 0.5 + 600);
        const ty = Math.round(wy / 0.5 + 924);
        if (tx >= 0 && tx < 1200 && ty >= 0 && ty < 1680) {
          const idx = (ty * 1200 + tx) * 4;
          const a = data[idx + 3];
          if (a > 80) {
            branches.push({
              worldX: wx,
              worldY: wy,
              texX: tx,
              texY: ty,
              alpha: a,
              hex: '#' + [data[idx], data[idx + 1], data[idx + 2]].map((v) => v.toString(16).padStart(2, '0')).join(''),
            });
          }
        }
      }
    }

    return {
      count,
      texBounds: { minX, maxX, minY, maxY },
      worldBounds: {
        minWx: (minX - 600) * 0.5,
        maxWx: (maxX - 600) * 0.5,
        minWy: (minY - 924) * 0.5,
        maxWy: (maxY - 924) * 0.5,
      },
      // Find root branches grouped by depth layers
      rootDepths: [40, 80, 120, 160, 200, 240, 280, 320].map((depth) => {
        const matches = branches.filter((b) => b.worldY === depth);
        return {
          worldY: depth,
          branchCount: matches.length,
          sampleBranches: matches.slice(0, 3).map((m) => ({ worldX: m.worldX, worldY: m.worldY, alpha: m.alpha, hex: m.hex })),
        };
      }),
    };
  }, imgData);

  console.log(JSON.stringify(res, null, 2));
  await browser.close();
}

main().catch(console.error);
