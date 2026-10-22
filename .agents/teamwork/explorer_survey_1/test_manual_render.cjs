const puppeteer = require('../../../.worktrees/task-021-world-integration/the-vivarium-web/node_modules/puppeteer');
const fs = require('fs');
const path = require('path');

async function testManualRender() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1600,1000'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1600, height: 1000 });
  await page.goto('http://localhost:22021/?mode=integration', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));

  const renderResult = await page.evaluate(() => {
    const canvas = document.querySelector('canvas');
    const reactKey = Object.keys(canvas.parentElement).find(k => k.startsWith('__reactFiber$') || k.startsWith('__reactInternalInstance$'));
    let fiber = canvas.parentElement[reactKey];
    let app = null;
    while (fiber) {
      if (fiber.memoizedState) {
        let s = fiber.memoizedState;
        while (s) {
          if (s.memoizedState && s.memoizedState.current && s.memoizedState.current.stage) {
            app = s.memoizedState.current;
            break;
          }
          s = s.next;
        }
      }
      if (app) break;
      fiber = fiber.return;
    }

    const cam = window.__CAMERA__;
    
    // Zoom 1x
    cam.jumpTo(0, -180, 1.0);
    app.render();

    return { hasRender: typeof app.render === 'function' };
  });

  console.log('Manual render 1x:', renderResult);
  await page.screenshot({ path: path.join(__dirname, 'manual_1x.png') });

  // Zoom 2x
  await page.evaluate(() => {
    const canvas = document.querySelector('canvas');
    const reactKey = Object.keys(canvas.parentElement).find(k => k.startsWith('__reactFiber$') || k.startsWith('__reactInternalInstance$'));
    let fiber = canvas.parentElement[reactKey];
    let app = null;
    while (fiber) {
      if (fiber.memoizedState) {
        let s = fiber.memoizedState;
        while (s) {
          if (s.memoizedState && s.memoizedState.current && s.memoizedState.current.stage) {
            app = s.memoizedState.current;
            break;
          }
          s = s.next;
        }
      }
      if (app) break;
      fiber = fiber.return;
    }

    const cam = window.__CAMERA__;
    cam.jumpTo(0, -180, 2.0);
    app.render();
  });
  await page.screenshot({ path: path.join(__dirname, 'manual_2x.png') });

  // Zoom 4x
  await page.evaluate(() => {
    const canvas = document.querySelector('canvas');
    const reactKey = Object.keys(canvas.parentElement).find(k => k.startsWith('__reactFiber$') || k.startsWith('__reactInternalInstance$'));
    let fiber = canvas.parentElement[reactKey];
    let app = null;
    while (fiber) {
      if (fiber.memoizedState) {
        let s = fiber.memoizedState;
        while (s) {
          if (s.memoizedState && s.memoizedState.current && s.memoizedState.current.stage) {
            app = s.memoizedState.current;
            break;
          }
          s = s.next;
        }
      }
      if (app) break;
      fiber = fiber.return;
    }

    const cam = window.__CAMERA__;
    cam.jumpTo(0, -180, 4.0);
    app.render();
  });
  await page.screenshot({ path: path.join(__dirname, 'manual_4x.png') });

  // Compare manual_1x, manual_2x, manual_4x
  const load = (p) => 'data:image/png;base64,' + fs.readFileSync(path.join(__dirname, p)).toString('base64');
  const d = await page.evaluate(async (s1, s2, s4) => {
    const ld = (s) => new Promise(r => { const i = new Image(); i.onload = () => r(i); i.src = s; });
    const [i1, i2, i4] = await Promise.all([ld(s1), ld(s2), ld(s4)]);
    const c = document.createElement('canvas'); c.width = 1600; c.height = 1000;
    const ctx = c.getContext('2d');
    ctx.drawImage(i1, 0, 0); const d1 = ctx.getImageData(0,0,1600,1000).data;
    ctx.drawImage(i2, 0, 0); const d2 = ctx.getImageData(0,0,1600,1000).data;
    ctx.drawImage(i4, 0, 0); const d4 = ctx.getImageData(0,0,1600,1000).data;

    let diff12 = 0, diff24 = 0;
    for (let i = 0; i < d1.length; i += 4) {
      if (Math.abs(d1[i]-d2[i])+Math.abs(d1[i+1]-d2[i+1])+Math.abs(d1[i+2]-d2[i+2]) > 30) diff12++;
      if (Math.abs(d2[i]-d4[i])+Math.abs(d2[i+1]-d4[i+1])+Math.abs(d2[i+2]-d4[i+2]) > 30) diff24++;
    }
    return { diff12, diff24 };
  }, load('manual_1x.png'), load('manual_2x.png'), load('manual_4x.png'));

  console.log('Diff with app.render():', d);
  await browser.close();
}

testManualRender().catch(console.error);
