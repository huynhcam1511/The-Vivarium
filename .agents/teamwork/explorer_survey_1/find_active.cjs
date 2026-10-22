const puppeteer = require('../../../.worktrees/task-021-world-integration/the-vivarium-web/node_modules/puppeteer');

async function findActivePixiObjects() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1600,1000'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1600, height: 1000 });
  await page.goto('http://localhost:22021/?mode=integration', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));

  const diag = await page.evaluate(() => {
    // Traverse the entire DOM to find all canvas elements and parents
    const canvases = Array.from(document.querySelectorAll('canvas'));

    // Check canvas context
    const canvas = canvases[0];
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');

    // How many WebGL contexts or Pixi instances exist?
    // Let's search window properties
    const windowProps = Object.keys(window);

    // Let's search React component tree
    const root = document.getElementById('root');
    const rootFiberKey = Object.keys(root).find(k => k.startsWith('__reactFiber$') || k.startsWith('__reactContainer$'));
    
    // Let's crawl all fibers to find all useRefs and instances
    const foundApps = [];
    const foundStages = [];
    const foundCameras = [];

    function crawl(node, depth = 0) {
      if (!node || depth > 50) return;
      if (node.memoizedState) {
        let s = node.memoizedState;
        while (s) {
          if (s.memoizedState && s.memoizedState.current) {
            const val = s.memoizedState.current;
            if (val.stage) foundApps.push(val);
            if (val.worldContainer || val.worldStage) foundStages.push(val);
            if (val.jumpTo) foundCameras.push(val);
          }
          s = s.next;
        }
      }
      crawl(node.child, depth + 1);
      crawl(node.sibling, depth);
    }
    crawl(root[rootFiberKey]);

    return {
      canvases: canvases.length,
      foundAppsCount: foundApps.length,
      foundStagesCount: foundStages.length,
      foundCamerasCount: foundCameras.length,
      camerasMatch: foundCameras.map(c => c === window.__CAMERA__),
      cameraZooms: foundCameras.map(c => c.zoom),
    };
  });

  console.log('Heap crawl results:\n', JSON.stringify(diag, null, 2));
  await browser.close();
}

findActivePixiObjects().catch(console.error);
