import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

async function inspectAssets() {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  await page.setContent('<html><body><canvas id="c"></canvas></body></html>');

  const files = [
    'env_flower_bluebell.png',
    'env_moss_patch.png',
    'env_fern_cluster.png',
    'env_lake_bottom_mud.png',
    'env_waterfall_stream.png'
  ];

  const results = {};

  for (const f of files) {
    const fullPath = path.resolve('public/assets/qa_temp_pack004', f);
    const buf = fs.readFileSync(fullPath);
    const b64 = buf.toString('base64');

    const analysis = await page.evaluate(async (base64, filename) => {
      const img = new Image();
      img.src = 'data:image/png;base64,' + base64;
      await new Promise(r => img.onload = r);

      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      ctx.drawImage(img, 0, 0);

      const imgData = ctx.getImageData(0, 0, img.width, img.height);
      const data = imgData.data;

      let minA = 255, maxA = 0;
      let semiAlphaCount = 0;
      let zeroAlphaCount = 0;
      let fullAlphaCount = 0;

      let rSum = 0, gSum = 0, bSum = 0, count = 0;

      let seamDiffLeftRight = 0;
      for (let y = 0; y < img.height; y++) {
        const leftIdx = y * img.width * 4;
        const rightIdx = (y * img.width + (img.width - 1)) * 4;
        const dr = Math.abs(data[leftIdx] - data[rightIdx]);
        const dg = Math.abs(data[leftIdx+1] - data[rightIdx+1]);
        const db = Math.abs(data[leftIdx+2] - data[rightIdx+2]);
        seamDiffLeftRight += (dr + dg + db) / 3;
      }
      seamDiffLeftRight /= img.height;

      let seamDiffTopBottom = 0;
      for (let x = 0; x < img.width; x++) {
        const topIdx = x * 4;
        const btmIdx = ((img.height - 1) * img.width + x) * 4;
        const dr = Math.abs(data[topIdx] - data[btmIdx]);
        const dg = Math.abs(data[topIdx+1] - data[btmIdx+1]);
        const db = Math.abs(data[topIdx+2] - data[btmIdx+2]);
        seamDiffTopBottom += (dr + dg + db) / 3;
      }
      seamDiffTopBottom /= img.width;

      let minX = img.width, maxX = 0, minY = img.height, maxY = 0;

      for (let i = 0; i < data.length; i += 4) {
        const a = data[i+3];
        if (a < minA) minA = a;
        if (a > maxA) maxA = a;

        if (a === 0) zeroAlphaCount++;
        else if (a === 255) fullAlphaCount++;
        else semiAlphaCount++;

        if (a > 10) {
          const px = (i / 4) % img.width;
          const py = Math.floor((i / 4) / img.width);
          if (px < minX) minX = px;
          if (px > maxX) maxX = px;
          if (py < minY) minY = py;
          if (py > maxY) maxY = py;

          rSum += data[i];
          gSum += data[i+1];
          bSum += data[i+2];
          count++;
        }
      }

      return {
        width: img.width,
        height: img.height,
        minAlpha: minA,
        maxAlpha: maxA,
        hasAlphaChannel: minA < 255,
        zeroAlphaPixels: zeroAlphaCount,
        semiAlphaPixels: semiAlphaCount,
        fullAlphaPixels: fullAlphaCount,
        bbox: count > 0 ? { minX, maxX, minY, maxY, w: maxX - minX + 1, h: maxY - minY + 1 } : null,
        avgColor: count > 0 ? [Math.round(rSum/count), Math.round(gSum/count), Math.round(bSum/count)] : null,
        seamDiffLeftRight: Math.round(seamDiffLeftRight * 10) / 10,
        seamDiffTopBottom: Math.round(seamDiffTopBottom * 10) / 10
      };
    }, b64, f);

    results[f] = analysis;
  }

  // Waterfall frames check (6 frames of 128x440 each)
  const wfAnalysis = await page.evaluate(async (base64) => {
    const img = new Image();
    img.src = 'data:image/png;base64,' + base64;
    await new Promise(r => img.onload = r);

    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 440;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    const frameStats = [];
    for (let f = 0; f < 6; f++) {
      ctx.clearRect(0, 0, 128, 440);
      ctx.drawImage(img, 0, f * 440, 128, 440, 0, 0, 128, 440);
      const data = ctx.getImageData(0, 0, 128, 440).data;
      let nonZero = 0;
      let rSum = 0, gSum = 0, bSum = 0;
      for (let i = 0; i < data.length; i += 4) {
        if (data[i+3] > 10) {
          nonZero++;
          rSum += data[i];
          gSum += data[i+1];
          bSum += data[i+2];
        }
      }
      frameStats.push({
        frame: f,
        nonZeroPixels: nonZero,
        avgRGB: nonZero > 0 ? [Math.round(rSum/nonZero), Math.round(gSum/nonZero), Math.round(bSum/nonZero)] : null
      });
    }
    return frameStats;
  }, fs.readFileSync(path.resolve('public/assets/qa_temp_pack004/env_waterfall_stream.png')).toString('base64'));

  results['waterfall_frames'] = wfAnalysis;

  fs.writeFileSync('scripts/pack004_asset_inspection.json', JSON.stringify(results, null, 2));
  console.log('Inspection saved to scripts/pack004_asset_inspection.json');
  console.log(JSON.stringify(results, null, 2));
  await browser.close();
}

inspectAssets().catch(console.error);
