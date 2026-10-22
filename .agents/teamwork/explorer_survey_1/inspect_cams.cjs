const puppeteer = require('../../../.worktrees/task-021-world-integration/the-vivarium-web/node_modules/puppeteer');

async function inspectBothCameras() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1600,1000'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1600, height: 1000 });
  await page.goto('http://localhost:22021/?mode=integration', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));

  const details = await page.evaluate(() => {
    const root = document.getElementById('root');
    const rootFiberKey = Object.keys(root).find(k => k.startsWith('__reactFiber$') || k.startsWith('__reactContainer$'));
    
    let activeCamera = null;
    function crawl(node) {
      if (!node) return;
      if (node.memoizedState) {
        let s = node.memoizedState;
        while (s) {
          if (s.memoizedState && s.memoizedState.current) {
            const val = s.memoizedState.current;
            if (val.jumpTo) activeCamera = val;
          }
          s = s.next;
        }
      }
      crawl(node.child);
      crawl(node.sibling);
    }
    crawl(root[rootFiberKey]);

    const winCam = window.__CAMERA__;

    return {
      activeCameraZoom: activeCamera ? activeCamera.zoom : null,
      winCamZoom: winCam ? winCam.zoom : null,
      areEqual: activeCamera === winCam,
      activeCamStage: activeCamera ? activeCamera.stage.constructor.name : null,
      winCamStage: winCam ? winCam.stage.constructor.name : null,
      activeCamStageParent: activeCamera && activeCamera.stage.parent ? activeCamera.stage.parent.constructor.name : null,
      winCamStageParent: winCam && winCam.stage.parent ? winCam.stage.parent.constructor.name : null,
      activeCamChildrenCount: activeCamera ? activeCamera.stage.children.length : null,
      winCamChildrenCount: winCam ? winCam.stage.children.length : null,
    };
  });

  console.log('Camera comparison:\n', JSON.stringify(details, null, 2));
  await browser.close();
}

inspectBothCameras().catch(console.error);
