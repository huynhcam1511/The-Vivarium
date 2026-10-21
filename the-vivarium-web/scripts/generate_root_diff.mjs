import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

async function generateDiff() {
  const possiblePaths = [
    path.resolve(process.cwd(), 'QA/TASK-021_B3'),
    path.resolve(process.cwd(), '../QA/TASK-021_B3'),
    'C:/Users/ADMIN-PC/Documents/ANTIGRAVITY/GAME/.worktrees/task-021-world-integration/QA/TASK-021_B3',
  ];
  const QA_DIR = possiblePaths.find((p) => fs.existsSync(p)) || possiblePaths[2];
  console.log(`Using QA directory: ${QA_DIR}`);

  const imgBefore = fs.readFileSync(path.join(QA_DIR, '03a_root_before_dig.png'));
  const imgDig = fs.readFileSync(path.join(QA_DIR, '03b_root_dig_exposed.png'));
  const imgFill = fs.readFileSync(path.join(QA_DIR, '04_root_fill_recovered.png'));

  const b64_before = 'data:image/png;base64,' + imgBefore.toString('base64');
  const b64_dig = 'data:image/png;base64,' + imgDig.toString('base64');
  const b64_fill = 'data:image/png;base64,' + imgFill.toString('base64');

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1600, height: 1000 });

  await page.setContent(`
    <canvas id="cBefore" width="1600" height="1000"></canvas>
    <canvas id="cDig" width="1600" height="1000"></canvas>
    <canvas id="cFill" width="1600" height="1000"></canvas>
    <canvas id="cDiff" width="1600" height="1000"></canvas>
  `);

  const diffResult = await page.evaluate(async (srcBefore, srcDig, srcFill) => {
    function loadImg(src) {
      return new Promise((res) => {
        const img = new Image();
        img.onload = () => res(img);
        img.src = src;
      });
    }

    const [iBefore, iDig, iFill] = await Promise.all([
      loadImg(srcBefore),
      loadImg(srcDig),
      loadImg(srcFill),
    ]);

    const cBefore = document.getElementById('cBefore');
    const cDig = document.getElementById('cDig');
    const cFill = document.getElementById('cFill');
    const cDiff = document.getElementById('cDiff');

    const ctxBefore = cBefore.getContext('2d');
    const ctxDig = cDig.getContext('2d');
    const ctxFill = cFill.getContext('2d');
    const ctxDiff = cDiff.getContext('2d');

    ctxBefore.drawImage(iBefore, 0, 0);
    ctxDig.drawImage(iDig, 0, 0);
    ctxFill.drawImage(iFill, 0, 0);

    const dBefore = ctxBefore.getImageData(0, 0, 1600, 1000);
    const dDig = ctxDig.getImageData(0, 0, 1600, 1000);
    const dFill = ctxFill.getImageData(0, 0, 1600, 1000);
    const outDiff = ctxDiff.createImageData(1600, 1000);

    const bbox = { minX: 680, maxX: 920, minY: 440, maxY: 640 };

    let rootChangedPixels = 0;
    let recoveredUnfilledPixels = 0;

    for (let y = 0; y < 1000; y++) {
      for (let x = 0; x < 1600; x++) {
        const idx = (y * 1600 + x) * 4;
        const inBbox = x >= bbox.minX && x <= bbox.maxX && y >= bbox.minY && y <= bbox.maxY;

        // Diff between Before and Dig
        const diffDig =
          Math.abs(dBefore.data[idx] - dDig.data[idx]) +
          Math.abs(dBefore.data[idx + 1] - dDig.data[idx + 1]) +
          Math.abs(dBefore.data[idx + 2] - dDig.data[idx + 2]);

        // Diff between Before and Fill
        const diffFill =
          Math.abs(dBefore.data[idx] - dFill.data[idx]) +
          Math.abs(dBefore.data[idx + 1] - dFill.data[idx + 1]) +
          Math.abs(dBefore.data[idx + 2] - dFill.data[idx + 2]);

        if (inBbox && diffDig > 25) {
          rootChangedPixels++;
          // Highlight in fluorescent magenta
          outDiff.data[idx] = 255;
          outDiff.data[idx + 1] = 0;
          outDiff.data[idx + 2] = 160;
          outDiff.data[idx + 3] = 255;
        } else {
          // Dim grayscale background
          const g =
            (dDig.data[idx] * 0.3 + dDig.data[idx + 1] * 0.59 + dDig.data[idx + 2] * 0.11) * 0.35;
          outDiff.data[idx] = g;
          outDiff.data[idx + 1] = g;
          outDiff.data[idx + 2] = g;
          outDiff.data[idx + 3] = 255;
        }

        if (inBbox && diffFill > 25) {
          recoveredUnfilledPixels++;
        }
      }
    }

    ctxDiff.putImageData(outDiff, 0, 0);

    return {
      rootZoneChangedPixels: rootChangedPixels,
      recoveredUnfilledPixels: recoveredUnfilledPixels,
      cavityBoundingBox: bbox,
      diffDataUrl: cDiff.toDataURL('image/png'),
    };
  }, b64_before, b64_dig, b64_fill);

  const base64Data = diffResult.diffDataUrl.replace(/^data:image\/png;base64,/, '');
  fs.writeFileSync(
    path.join(QA_DIR, '03c_root_filament_diff.png'),
    Buffer.from(base64Data, 'base64')
  );

  const diffReport = {
    test: 'TASK-021 Oak V5 Root Mask Cavity Visual Verification',
    cavityBoundingBox: diffResult.cavityBoundingBox,
    rootZoneChangedPixels: diffResult.rootZoneChangedPixels,
    recoveredUnfilledPixels: diffResult.recoveredUnfilledPixels,
    verificationCriteria: {
      minExposedRootPixels: 4000,
      maxUnfilledPixels: 10,
    },
    verificationVerdict:
      diffResult.rootZoneChangedPixels >= 4000 && diffResult.recoveredUnfilledPixels <= 10
        ? 'PASS_AUTHENTIC_ROOT_EXPOSURE_AND_RECOVER'
        : 'FAIL_ROOT_MASK_CRITERIA',
  };

  fs.writeFileSync(
    path.join(QA_DIR, 'TASK-021_ROOT_MASK_DIFF_DATA.json'),
    JSON.stringify(diffReport, null, 2),
    'utf8'
  );

  console.log('Root cavity pixel diff completed:', diffReport);
  await browser.close();
}

generateDiff().catch((err) => {
  console.error('Error generating root diff:', err);
  process.exit(1);
});
