const puppeteer = require('../../../.worktrees/task-021-world-integration/the-vivarium-web/node_modules/puppeteer');

async function testTicker() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1600,1000'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1600, height: 1000 });
  await page.goto('http://localhost:22021/?mode=integration', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));

  const tickerInfo = await page.evaluate(() => {
    // Find pixiApp
    const cam = window.__CAMERA__;
    // pixiApp can be found through terrain renderer or camera
    // Let's inspect window objects
    const tr = window.__TERRAIN_RENDERER__;
    const wr = window.__WEATHER_RENDERER__;
    const ar = window.__AQUATIC_RENDERER__;

    // Is there a pixiApp reference?
    // Let's find any object on window or dom
    const canvas = document.querySelector('canvas');
    // Pixi 8 attaches __PIXI_RENDERER__ or similar to canvas or gl?
    return {
      windowKeys: Object.keys(window).filter(k => k.startsWith('__')),
    };
  });

  console.log('Ticker info:', tickerInfo);
  await browser.close();
}

testTicker().catch(console.error);
