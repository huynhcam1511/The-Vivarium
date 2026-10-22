import puppeteer from 'puppeteer';

async function testMove() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--window-size=1600,1000'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1600, height: 1000 });
  await page.goto('http://127.0.0.1:2019/?mode=aquatic', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));

  const analyzeScreen = async () => {
    const b64 = await page.screenshot({ encoding: 'base64' });
    return await page.evaluate(async (base64) => {
      const img = new Image();
      img.src = 'data:image/png;base64,' + base64;
      await new Promise(res => img.onload = res);
      const c = document.createElement('canvas');
      c.width = img.width;
      c.height = img.height;
      const ctx = c.getContext('2d');
      ctx.drawImage(img, 0, 0);
      const data = ctx.getImageData(0, 0, c.width, c.height).data;

      let minX = c.width, maxX = 0, minY = c.height, maxY = 0;
      let count = 0;
      for (let y = 0; y < 600; y++) {
        for (let x = 0; x < c.width; x++) {
          const idx = (y * c.width + x) * 4;
          const r = data[idx], g = data[idx+1], b = data[idx+2];
          // Foliage green
          if (g > r + 15 && g > b + 15 && (x > 420 || y < 600)) {
            count++;
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
          }
        }
      }
      return { count, minX, maxX, minY, maxY, width: maxX - minX, height: maxY - minY };
    }, b64);
  };

  console.log('1. Initial (LAKE):', await analyzeScreen());

  // Click Thác Nước
  const clickedWf = await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent?.includes('Thác Nước'));
    if (btn) {
      btn.click();
      return true;
    }
    return false;
  });
  console.log('Clicked Thác Nước:', clickedWf);
  await new Promise(r => setTimeout(r, 1000));
  console.log('2. After Thác Nước:', await analyzeScreen());

  // Click Toàn Cảnh
  const clickedOv = await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent?.includes('Toàn Cảnh'));
    if (btn) {
      btn.click();
      return true;
    }
    return false;
  });
  console.log('Clicked Toàn Cảnh:', clickedOv);
  await new Promise(r => setTimeout(r, 1000));
  console.log('3. After Toàn Cảnh:', await analyzeScreen());

  await browser.close();
}

testMove().catch(console.error);
