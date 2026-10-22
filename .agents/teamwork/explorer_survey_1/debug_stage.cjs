const puppeteer = require('../../../.worktrees/task-021-world-integration/the-vivarium-web/node_modules/puppeteer');
const fs = require('fs');

async function debugStage() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1600,1000'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1600, height: 1000 });
  await page.goto('http://localhost:22021/?mode=integration', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));

  const stageTree = await page.evaluate(() => {
    const cam = window.__CAMERA__;
    const stage = cam.stage; // worldStage
    const appStage = stage.parent; // pixiApp.stage

    function inspectObj(obj, depth = 0) {
      if (depth > 4) return { name: 'depth-exceeded' };
      const info = {
        type: obj.constructor ? obj.constructor.name : typeof obj,
        x: obj.position ? obj.position.x : undefined,
        y: obj.position ? obj.position.y : undefined,
        scaleX: obj.scale ? obj.scale.x : undefined,
        scaleY: obj.scale ? obj.scale.y : undefined,
        width: obj.width,
        height: obj.height,
        visible: obj.visible,
        renderable: obj.renderable,
        childrenCount: obj.children ? obj.children.length : 0,
      };
      if (obj.children && obj.children.length > 0 && depth < 3) {
        info.children = obj.children.map(c => inspectObj(c, depth + 1));
      }
      return info;
    }

    return {
      appStage: inspectObj(appStage),
      worldStage: inspectObj(stage)
    };
  });

  console.log('Stage Hierarchy:\n', JSON.stringify(stageTree, null, 2));

  await browser.close();
}

debugStage().catch(console.error);
