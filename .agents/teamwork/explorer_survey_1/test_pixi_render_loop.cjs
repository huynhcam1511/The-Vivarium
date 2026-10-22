const puppeteer = require('../../../.worktrees/task-021-world-integration/the-vivarium-web/node_modules/puppeteer');

async function testPixiRenderLoop() {
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
    const stage = cam.stage; // worldStage
    const appStage = stage.parent; // pixiApp.stage
    
    // Look for pixiApp instance
    // Let's check ticker on stage or renderer
    // In PixiJS v8, stage doesn't have ticker, but can we find the Application?
    // How can we find the Application instance from the canvas or stage?
    const canvas = document.querySelector('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');

    return {
      canvas: { width: canvas.width, height: canvas.height },
      stageHasParent: !!stage.parent,
      appStageChildren: appStage ? appStage.children.length : 0,
      appStageIsSame: appStage ? appStage.children[0] === stage : false,
    };
  });

  console.log('Pixi render loop diag:', result);
  await browser.close();
}

testPixiRenderLoop().catch(console.error);
