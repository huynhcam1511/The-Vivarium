import puppeteer from 'puppeteer';

async function testTransform() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--window-size=1600,1000'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1600, height: 1000 });

  await page.goto('http://127.0.0.1:2019/?mode=aquatic', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));

  // Expose camera on window if possible, or query Pixi stage
  const inspectPixi = async () => {
    return await page.evaluate(() => {
      // Find canvas
      const canvas = document.querySelector('canvas');
      return {
        canvasWidth: canvas?.width,
        canvasHeight: canvas?.height,
        canvasStyle: canvas?.getAttribute('style'),
      };
    });
  };

  console.log('Initial Pixi State:', await inspectPixi());

  await browser.close();
}

testTransform().catch(console.error);
