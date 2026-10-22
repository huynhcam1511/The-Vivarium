const puppeteer = require('../../../.worktrees/task-021-world-integration/the-vivarium-web/node_modules/puppeteer');

async function testReset() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1600,1000'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1600, height: 1000 });
  await page.goto('http://localhost:22021/?mode=integration', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));

  const history = await page.evaluate(async () => {
    const cam = window.__CAMERA__;
    cam.jumpTo(0, -180, 2.0);

    const log = [];
    log.push({ t: 0, zoom: cam.zoom, scale: cam.stage.scale.x, pos: { x: cam.stage.position.x, y: cam.stage.position.y } });

    for (let i = 1; i <= 10; i++) {
      await new Promise(r => setTimeout(r, 100));
      log.push({ t: i * 100, zoom: cam.zoom, scale: cam.stage.scale.x, pos: { x: cam.stage.position.x, y: cam.stage.position.y } });
    }
    return log;
  });

  console.log('Scale over 1 second after jumpTo:\n', JSON.stringify(history, null, 2));
  await browser.close();
}

testReset().catch(console.error);
