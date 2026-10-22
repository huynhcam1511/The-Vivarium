const puppeteer = require('../../../.worktrees/task-021-world-integration/the-vivarium-web/node_modules/puppeteer');

async function findPixiApp() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1600,1000'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1600, height: 1000 });
  await page.goto('http://localhost:22021/?mode=integration', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));

  const appInfo = await page.evaluate(() => {
    const cam = window.__CAMERA__;
    const stage = cam.stage;
    const appStage = stage.parent;
    const canvas = document.querySelector('canvas');

    // Look for __PIXI_APP__ or ticker on gl
    const gl = canvas.getContext('webgl2');

    // Find all properties on canvas
    const canvasProps = Object.keys(canvas);

    // Let's check React fiber
    const reactKey = Object.keys(canvas.parentElement).find(k => k.startsWith('__reactFiber$') || k.startsWith('__reactInternalInstance$'));
    let fiber = canvas.parentElement[reactKey];
    let appFromFiber = null;
    while (fiber) {
      if (fiber.memoizedState) {
        let s = fiber.memoizedState;
        while (s) {
          if (s.memoizedState && s.memoizedState.current && s.memoizedState.current.stage) {
            appFromFiber = s.memoizedState.current;
            break;
          }
          s = s.next;
        }
      }
      if (appFromFiber) break;
      fiber = fiber.return;
    }

    let tickerInfo = null;
    if (appFromFiber) {
      tickerInfo = {
        tickerStarted: appFromFiber.ticker ? appFromFiber.ticker.started : null,
        tickerSpeed: appFromFiber.ticker ? appFromFiber.ticker.speed : null,
        tickerFPS: appFromFiber.ticker ? appFromFiber.ticker.FPS : null,
        tickerCount: appFromFiber.ticker ? appFromFiber.ticker.count : null,
        rendererType: appFromFiber.renderer ? appFromFiber.renderer.type : null,
      };
    }

    return {
      foundApp: !!appFromFiber,
      tickerInfo
    };
  });

  console.log('App info from React fiber:\n', JSON.stringify(appInfo, null, 2));
  await browser.close();
}

findPixiApp().catch(console.error);
