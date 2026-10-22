const puppeteer = require('../../../.worktrees/task-021-world-integration/the-vivarium-web/node_modules/puppeteer');

async function testFrames() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1600,1000'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1600, height: 1000 });
  await page.goto('http://localhost:22021/?mode=integration', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));

  const frames = await page.evaluate(() => {
    return new Promise(res => {
      let count = 0;
      const start = performance.now();
      function tick() {
        count++;
        if (performance.now() - start < 1000) {
          requestAnimationFrame(tick);
        } else {
          res({ framesIn1Sec: count });
        }
      }
      requestAnimationFrame(tick);
    });
  });

  console.log('Frame count:', frames);
  await browser.close();
}

testFrames().catch(console.error);
