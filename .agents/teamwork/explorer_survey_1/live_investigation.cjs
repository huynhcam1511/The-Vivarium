const puppeteer = require('../../../.worktrees/task-021-world-integration/the-vivarium-web/node_modules/puppeteer');
const fs = require('fs');
const path = require('path');

async function run() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1600,1000'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1600, height: 1000 });

  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.error('PAGE ERROR:', err));

  await page.goto('http://localhost:22021/?mode=integration', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));

  const info0 = await page.evaluate(() => {
    const cam = window.__CAMERA__;
    return {
      windowSize: { innerWidth: window.innerWidth, innerHeight: window.innerHeight },
      camProps: {
        x: cam.x,
        y: cam.y,
        zoom: cam.zoom,
        viewportWidth: cam.viewportWidth,
        viewportHeight: cam.viewportHeight,
        stageScale: { x: cam.stage.scale.x, y: cam.stage.scale.y },
        stagePos: { x: cam.stage.position.x, y: cam.stage.position.y },
        childrenCount: cam.stage.children.length
      }
    };
  });
  console.log('Initial camera state:', JSON.stringify(info0, null, 2));

  // Jump to 1x
  const info1 = await page.evaluate(() => {
    window.__CAMERA__.jumpTo(0, -180, 1.0);
    return {
      zoom: window.__CAMERA__.zoom,
      stageScale: { x: window.__CAMERA__.stage.scale.x, y: window.__CAMERA__.stage.scale.y },
      stagePos: { x: window.__CAMERA__.stage.position.x, y: window.__CAMERA__.stage.position.y },
    };
  });
  console.log('After jumpTo(0, -180, 1.0):', info1);
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: path.join(__dirname, 'test_1x.png') });

  // Jump to 2x
  const info2 = await page.evaluate(() => {
    window.__CAMERA__.jumpTo(0, -180, 2.0);
    return {
      zoom: window.__CAMERA__.zoom,
      stageScale: { x: window.__CAMERA__.stage.scale.x, y: window.__CAMERA__.stage.scale.y },
      stagePos: { x: window.__CAMERA__.stage.position.x, y: window.__CAMERA__.stage.position.y },
    };
  });
  console.log('After jumpTo(0, -180, 2.0):', info2);
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: path.join(__dirname, 'test_2x.png') });

  // Jump to 4x
  const info4 = await page.evaluate(() => {
    window.__CAMERA__.jumpTo(0, -180, 4.0);
    return {
      zoom: window.__CAMERA__.zoom,
      stageScale: { x: window.__CAMERA__.stage.scale.x, y: window.__CAMERA__.stage.scale.y },
      stagePos: { x: window.__CAMERA__.stage.position.x, y: window.__CAMERA__.stage.position.y },
    };
  });
  console.log('After jumpTo(0, -180, 4.0):', info4);
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: path.join(__dirname, 'test_4x.png') });

  await browser.close();
}

run().catch(console.error);
