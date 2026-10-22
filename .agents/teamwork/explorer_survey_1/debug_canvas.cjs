const puppeteer = require('../../../.worktrees/task-021-world-integration/the-vivarium-web/node_modules/puppeteer');

async function debugCanvas() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1600,1000'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1600, height: 1000 });
  await page.goto('http://localhost:22021/?mode=integration', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));

  const info = await page.evaluate(() => {
    const cam = window.__CAMERA__;
    const stage = cam.stage; // worldStage
    const appStage = stage.parent;

    // How many canvases in the entire document?
    const allCanvases = Array.from(document.querySelectorAll('canvas'));

    // Check parent elements of the canvas
    const c = allCanvases[0];
    const parent = c.parentElement;

    // Check if there are other elements in the DOM
    return {
      allCanvasesCount: allCanvases.length,
      canvasInDOM: document.body.contains(c),
      canvasParent: parent ? parent.className : null,
      stageParent: appStage ? appStage.constructor.name : null,
      appStageChildrenCount: appStage ? appStage.children.length : null,
      stagePosition: { x: stage.position.x, y: stage.position.y },
      stageScale: { x: stage.scale.x, y: stage.scale.y },
    };
  });

  console.log('DOM & Canvas state:\n', JSON.stringify(info, null, 2));
  await browser.close();
}

debugCanvas().catch(console.error);
