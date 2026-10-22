import puppeteer from 'puppeteer';

async function testStage() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--window-size=1600,1000'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1600, height: 1000 });

  await page.goto('http://127.0.0.1:2019/?mode=aquatic', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));

  // Let's inspect the Pixi Application stage
  const result = await page.evaluate(() => {
    // Look for canvas
    const canvas = document.querySelector('canvas');
    return {
      canvasWidth: canvas?.width,
      canvasHeight: canvas?.height,
      canvasClientW: canvas?.clientWidth,
      canvasClientH: canvas?.clientHeight,
    };
  });
  console.log('Canvas info:', result);

  await browser.close();
}

testStage().catch(console.error);
