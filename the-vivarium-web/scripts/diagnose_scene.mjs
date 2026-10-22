import puppeteer from 'puppeteer';

async function diagnoseScene() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--window-size=1600,1000'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1600, height: 1000 });

  page.on('console', msg => console.log('PAGE LOG:', msg.text()));

  await page.goto('http://127.0.0.1:2019/?mode=aquatic', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));

  // Let's inspect the worldContainer children count and positions
  const sceneGraph = await page.evaluate(() => {
    // Check if we can find anything from canvas or react
    return {
      canvasExists: !!document.querySelector('canvas'),
    };
  });
  console.log('Scene graph check:', sceneGraph);

  await browser.close();
}

diagnoseScene().catch(console.error);
