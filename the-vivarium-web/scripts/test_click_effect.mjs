import puppeteer from 'puppeteer';

async function testClickEffect() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--window-size=1600,1000'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1600, height: 1000 });

  await page.goto('http://127.0.0.1:2019/?mode=aquatic', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));

  // Find canvas and observe pixels before and after click
  const getPixel = async (x, y) => {
    return await page.evaluate((px, py) => {
      const canvas = document.querySelector('canvas');
      if (!canvas) return null;
      const ctx = canvas.getContext('2d');
      // If WebGL, 2d context is null
      return { webgl: !!canvas.getContext('webgl2') || !!canvas.getContext('webgl') };
    }, x, y);
  };

  console.log('Canvas context:', await getPixel(100, 100));

  // Screenshot 1
  const b1 = await page.screenshot();
  console.log('Screenshot 1 bytes:', b1.length);

  // Click Thác Nước
  const clicked = await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent?.includes('Thác Nước'));
    if (btn) {
      btn.click();
      return true;
    }
    return false;
  });
  console.log('Clicked Thác Nước:', clicked);
  await new Promise(r => setTimeout(r, 1000));

  // Screenshot 2
  const b2 = await page.screenshot();
  console.log('Screenshot 2 bytes:', b2.length);

  // Compare buffers
  let diffCount = 0;
  const minLen = Math.min(b1.length, b2.length);
  for (let i = 0; i < minLen; i++) {
    if (b1[i] !== b2[i]) diffCount++;
  }
  console.log('Difference byte count between screens:', diffCount, 'out of', minLen);

  await browser.close();
}

testClickEffect().catch(console.error);
