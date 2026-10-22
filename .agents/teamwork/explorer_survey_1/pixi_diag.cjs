const puppeteer = require('../../../.worktrees/task-021-world-integration/the-vivarium-web/node_modules/puppeteer');

async function testPixiState() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1600,1000'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1600, height: 1000 });
  await page.goto('http://localhost:22021/?mode=integration', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));

  const diag = await page.evaluate(() => {
    const cam = window.__CAMERA__;
    const stage = cam.stage;
    const appStage = stage.parent;
    
    // Check canvas element and dimensions
    const canvas = document.querySelector('canvas');
    
    // Check if there are other canvases
    const allCanvases = document.querySelectorAll('canvas');

    // Check worldStage transform before and after jumpTo
    const beforeScale = { x: stage.scale.x, y: stage.scale.y };
    const beforePos = { x: stage.position.x, y: stage.position.y };

    cam.jumpTo(0, -180, 2.0);

    const afterScale = { x: stage.scale.x, y: stage.scale.y };
    const afterPos = { x: stage.position.x, y: stage.position.y };

    // Check tree sprite world transform vs local transform
    // Find tree sprite
    let trunkFrontGroup = null;
    let trunkSpr = null;
    for (const child of stage.children) {
      if (child.children) {
        for (const sub of child.children) {
          if (sub.constructor && sub.constructor.name === 'Sprite') {
            trunkSpr = sub;
            break;
          }
        }
      }
      if (trunkSpr) break;
    }

    let sprDiag = null;
    if (trunkSpr) {
      // Get global transform of trunkSpr
      const globalPos = trunkSpr.toGlobal({ x: 0, y: 0 });
      const bounds = trunkSpr.getBounds();
      sprDiag = {
        localPos: { x: trunkSpr.position.x, y: trunkSpr.position.y },
        scale: { x: trunkSpr.scale.x, y: trunkSpr.scale.y },
        globalPos: { x: globalPos.x, y: globalPos.y },
        bounds: { x: bounds.x, y: bounds.y, width: bounds.width, height: bounds.height }
      };
    }

    return {
      canvasesCount: allCanvases.length,
      canvasWidth: canvas.width,
      canvasHeight: canvas.height,
      canvasStyleWidth: canvas.style.width,
      canvasStyleHeight: canvas.style.height,
      appStageParent: appStage ? appStage.constructor.name : null,
      appStageScale: appStage ? { x: appStage.scale.x, y: appStage.scale.y } : null,
      appStagePos: appStage ? { x: appStage.position.x, y: appStage.position.y } : null,
      beforeScale,
      beforePos,
      afterScale,
      afterPos,
      sprDiag
    };
  });

  console.log('Pixi Diagnostic:', JSON.stringify(diag, null, 2));

  await browser.close();
}

testPixiState().catch(console.error);
