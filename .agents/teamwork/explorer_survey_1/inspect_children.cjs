const puppeteer = require('../../../.worktrees/task-021-world-integration/the-vivarium-web/node_modules/puppeteer');

async function inspectWorldStage() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1600,1000'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1600, height: 1000 });
  await page.goto('http://localhost:22021/?mode=integration', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));

  const list = await page.evaluate(() => {
    const cam = window.__CAMERA__;
    const stage = cam.stage;
    return stage.children.map((c, i) => {
      const b = c.getBounds ? c.getBounds() : null;
      return {
        index: i,
        type: c.constructor.name,
        childCount: c.children ? c.children.length : 0,
        x: c.position.x,
        y: c.position.y,
        scale: { x: c.scale.x, y: c.scale.y },
        bounds: b ? { x: Math.round(b.x), y: Math.round(b.y), w: Math.round(b.width), h: Math.round(b.height) } : null,
        childrenTypes: c.children ? c.children.map(ch => ch.constructor.name) : []
      };
    });
  });

  console.log('worldStage children:', JSON.stringify(list, null, 2));
  await browser.close();
}

inspectWorldStage().catch(console.error);
