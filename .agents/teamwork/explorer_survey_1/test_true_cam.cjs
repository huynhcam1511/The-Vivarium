const puppeteer = require('../../../.worktrees/task-021-world-integration/the-vivarium-web/node_modules/puppeteer');
const fs = require('fs');
const path = require('path');

async function testActiveCameraZoom() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1600,1000'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1600, height: 1000 });
  await page.goto('http://localhost:22021/?mode=integration', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));

  // Find activeCamera from React fiber
  await page.evaluate(() => {
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

    // Attach true active camera to window.__TRUE_CAMERA__
    window.__TRUE_CAMERA__ = activeCamera;
  });

  // Capture 1x
  await page.evaluate(() => {
    window.__TRUE_CAMERA__.jumpTo(0, -180, 1.0);
  });
  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({ path: path.join(__dirname, 'true_1x.png') });

  // Capture 2x
  await page.evaluate(() => {
    window.__TRUE_CAMERA__.jumpTo(0, -180, 2.0);
  });
  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({ path: path.join(__dirname, 'true_2x.png') });

  // Capture 4x
  await page.evaluate(() => {
    window.__TRUE_CAMERA__.jumpTo(0, -180, 4.0);
  });
  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({ path: path.join(__dirname, 'true_4x.png') });

  // Compare diff
  const load = (p) => 'data:image/png;base64,' + fs.readFileSync(path.join(__dirname, p)).toString('base64');
  const d = await page.evaluate(async (s1, s2, s4) => {
    const ld = (s) => new Promise(r => { const i = new Image(); i.onload = () => r(i); i.src = s; });
    const [i1, i2, i4] = await Promise.all([ld(s1), ld(s2), ld(s4)]);
    const c = document.createElement('canvas'); c.width = 1600; c.height = 1000;
    const ctx = c.getContext('2d');
    ctx.drawImage(i1, 0, 0); const d1 = ctx.getImageData(0,0,1600,1000).data;
    ctx.drawImage(i2, 0, 0); const d2 = ctx.getImageData(0,0,1600,1000).data;
    ctx.drawImage(i4, 0, 0); const d4 = ctx.getImageData(0,0,1600,1000).data;

    let diff12 = 0, diff14 = 0;
    for (let i = 0; i < d1.length; i += 4) {
      if (Math.abs(d1[i]-d2[i])+Math.abs(d1[i+1]-d2[i+1])+Math.abs(d1[i+2]-d2[i+2]) > 30) diff12++;
      if (Math.abs(d1[i]-d4[i])+Math.abs(d1[i+1]-d4[i+1])+Math.abs(d1[i+2]-d4[i+2]) > 30) diff14++;
    }
    return { diff12, diff14 };
  }, load('true_1x.png'), load('true_2x.png'), load('true_4x.png'));

  console.log('True camera diff:\n', JSON.stringify(d, null, 2));
  await browser.close();
}

testActiveCameraZoom().catch(console.error);
