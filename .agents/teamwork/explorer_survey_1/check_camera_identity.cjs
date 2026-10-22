const puppeteer = require('../../../.worktrees/task-021-world-integration/the-vivarium-web/node_modules/puppeteer');

async function checkCameraInstances() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1600,1000'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1600, height: 1000 });
  await page.goto('http://localhost:22021/?mode=integration', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));

  const res = await page.evaluate(() => {
    const root = document.getElementById('root');
    const rootFiberKey = Object.keys(root).find(k => k.startsWith('__reactFiber$') || k.startsWith('__reactContainer$'));
    
    let fiberCam = null;
    let fiberApp = null;
    function crawl(node) {
      if (!node) return;
      if (node.memoizedState) {
        let s = node.memoizedState;
        while (s) {
          if (s.memoizedState && s.memoizedState.current) {
            const val = s.memoizedState.current;
            if (val.jumpTo) fiberCam = val;
            if (val.renderer) fiberApp = val;
          }
          s = s.next;
        }
      }
      crawl(node.child);
      crawl(node.sibling);
    }
    crawl(root[rootFiberKey]);

    const winCam = window.__CAMERA__;
    const canvas = document.querySelector('canvas');

    return {
      fiberCam_stage: fiberCam ? fiberCam.stage.children.length : null,
      winCam_stage: winCam ? winCam.stage.children.length : null,
      fiberCam_stage_parent: fiberCam && fiberCam.stage.parent ? fiberCam.stage.parent.constructor.name : null,
      winCam_stage_parent: winCam && winCam.stage.parent ? winCam.stage.parent.constructor.name : null,
      fiberApp_stage_child: fiberApp ? (fiberApp.stage.children[0] === fiberCam.stage) : null,
      winCam_in_fiberApp: fiberApp ? (fiberApp.stage.children[0] === winCam.stage) : null,
      fiberApp_canvas_matches_DOM: fiberApp ? (fiberApp.canvas === canvas) : null,
    };
  });

  console.log('Camera Identity Analysis:\n', JSON.stringify(res, null, 2));
  await browser.close();
}

checkCameraInstances().catch(console.error);
