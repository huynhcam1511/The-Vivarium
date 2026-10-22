const puppeteer = require('../../../.worktrees/task-021-world-integration/the-vivarium-web/node_modules/puppeteer');
const fs = require('fs');
const path = require('path');

async function testRender() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1600,1000'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1600, height: 1000 });
  await page.goto('http://localhost:22021/?mode=integration', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));

  const checkTicker = await page.evaluate(() => {
    const cam = window.__CAMERA__;
    const stage = cam.stage;
    const app = stage.parent.parent || stage.parent; // find Application or renderer
    
    // Check ticker
    // In Pixi v8, where is ticker?
    // Let's find window.__TERRAIN_RENDERER__, etc.
    return {
      hasTicker: !!(window.__PIXI_APP__ || window.__CAMERA__),
      stageScale: stage.scale.x,
      stagePos: { x: stage.position.x, y: stage.position.y }
    };
  });
  console.log('checkTicker:', checkTicker);

  // Let's test calling jumpTo and then forcing render if app is accessible
  // Wait, let's see how pixiApp is referenced in WorldIntegrationScene
  await browser.close();
}

testRender().catch(console.error);
