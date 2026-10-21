import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

async function generateDiff() {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewport({ width: 1600, height: 1000 });

  const img1 = fs.readFileSync('.worktrees/task-021-world-integration/QA/TASK-021_B1/01_root_masking_before_dig.png');
  const img2 = fs.readFileSync('.worktrees/task-021-world-integration/QA/TASK-021_B1/02_root_masking_after_dig.png');

  const b64_1 = 'data:image/png;base64,' + img1.toString('base64');
  const b64_2 = 'data:image/png;base64,' + img2.toString('base64');

  await page.setContent(`
    <canvas id="c1" width="1600" height="1000"></canvas>
    <canvas id="c2" width="1600" height="1000"></canvas>
    <canvas id="diff" width="1600" height="1000"></canvas>
  `);

  const diffStats = await page.evaluate(async (src1, src2) => {
    function loadImg(src) {
      return new Promise((res) => {
        const img = new Image();
        img.onload = () => res(img);
        img.src = src;
      });
    }
    const [i1, i2] = await Promise.all([loadImg(src1), loadImg(src2)]);
    const c1 = document.getElementById('c1');
    const c2 = document.getElementById('c2');
    const cDiff = document.getElementById('diff');
    const ctx1 = c1.getContext('2d');
    const ctx2 = c2.getContext('2d');
    const ctxD = cDiff.getContext('2d');

    ctx1.drawImage(i1, 0, 0);
    ctx2.drawImage(i2, 0, 0);

    const d1 = ctx1.getImageData(0, 0, 1600, 1000);
    const d2 = ctx2.getImageData(0, 0, 1600, 1000);
    const out = ctxD.createImageData(1600, 1000);

    let changed = 0;
    let rootChanged = 0;

    for (let y = 0; y < 1000; y++) {
      for (let x = 0; x < 1600; x++) {
        const idx = (y * 1600 + x) * 4;
        const diff = Math.abs(d1.data[idx] - d2.data[idx]) +
                     Math.abs(d1.data[idx+1] - d2.data[idx+1]) +
                     Math.abs(d1.data[idx+2] - d2.data[idx+2]);
        if (diff > 25) {
          changed++;
          if (x >= 650 && x <= 950 && y >= 500 && y <= 750) {
            rootChanged++;
          }
          // Highlight in fluorescent magenta
          out.data[idx] = 255;
          out.data[idx+1] = 0;
          out.data[idx+2] = 160;
          out.data[idx+3] = 255;
        } else {
          // Dim grayscale original
          const g = (d1.data[idx] * 0.3 + d1.data[idx+1] * 0.59 + d1.data[idx+2] * 0.11) * 0.35;
          out.data[idx] = g;
          out.data[idx+1] = g;
          out.data[idx+2] = g;
          out.data[idx+3] = 255;
        }
      }
    }
    ctxD.putImageData(out, 0, 0);
    return {
      changedPixels: changed,
      rootZoneChangedPixels: rootChanged,
      diffDataUrl: cDiff.toDataURL('image/png')
    };
  }, b64_1, b64_2);

  const base64Data = diffStats.diffDataUrl.replace(/^data:image\/png;base64,/, '');
  fs.writeFileSync('.worktrees/task-021-world-integration/QA/TASK-021_B1/02_root_mask_pixel_diff.png', Buffer.from(base64Data, 'base64'));

  const diffReport = {
    test: 'TASK-021 Root Masking Dual-Pass Dynamic Verification',
    totalChangedPixels: diffStats.changedPixels,
    rootZoneChangedPixels: diffStats.rootZoneChangedPixels,
    rootZoneBoundingBox: { minX: 650, maxX: 950, minY: 500, maxY: 750 },
    verificationVerdict: diffStats.rootZoneChangedPixels > 5000 ? 'PASS_DYNAMIC_ROOT_UNVEILED' : 'FAIL_NO_ROOT_CHANGE'
  };
  fs.writeFileSync('.worktrees/task-021-world-integration/QA/TASK-021_B1/TASK-021_ROOT_MASK_DIFF_DATA.json', JSON.stringify(diffReport, null, 2), 'utf8');

  console.log('Pixel diff completed successfully:', diffReport);
  await browser.close();
}

generateDiff().catch((err) => {
  console.error(err);
  process.exit(1);
});
