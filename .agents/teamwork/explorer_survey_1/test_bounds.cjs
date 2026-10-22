const puppeteer = require('../../../.worktrees/task-021-world-integration/the-vivarium-web/node_modules/puppeteer');

async function testBounds() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1600,1000'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1600, height: 1000 });
  await page.goto('http://localhost:22021/?mode=integration', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));

  const result = await page.evaluate(() => {
    const cam = window.__CAMERA__;
    const trunkGroup = cam.stage.children[3]; // trunkFrontGroup

    function getTrunkInfo() {
      const b = trunkGroup.getBounds();
      const spr = trunkGroup.children[0];
      const g = spr.toGlobal({ x: 0, y: 0 });
      return {
        bounds: { x: Math.round(b.x), y: Math.round(b.y), w: Math.round(b.width), h: Math.round(b.height) },
        sprGlobal: { x: Math.round(g.x), y: Math.round(g.y) },
        stagePos: { x: Math.round(cam.stage.position.x), y: Math.round(cam.stage.position.y) },
        stageScale: cam.stage.scale.x
      };
    }

    cam.jumpTo(0, -180, 1.0);
    const z1 = getTrunkInfo();

    cam.jumpTo(0, -180, 2.0);
    const z2 = getTrunkInfo();

    cam.jumpTo(0, -180, 4.0);
    const z4 = getTrunkInfo();

    return { z1, z2, z4 };
  });

  console.log('Trunk Bounds at 1x, 2x, 4x:\n', JSON.stringify(result, null, 2));

  await browser.close();
}

testBounds().catch(console.error);
