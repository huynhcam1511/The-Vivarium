const puppeteer = require('../../../.worktrees/task-021-world-integration/the-vivarium-web/node_modules/puppeteer');
const fs = require('fs');
const path = require('path');

async function testCanvasDataUrl() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1600,1000'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1600, height: 1000 });
  await page.goto('http://localhost:22021/?mode=integration', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));

  const urls = await page.evaluate(() => {
    const cam = window.__CAMERA__;
    const canvas = document.querySelector('canvas');

    cam.jumpTo(0, -180, 1.0);
    const u1 = canvas.toDataURL();

    cam.jumpTo(0, -180, 2.0);
    const u2 = canvas.toDataURL();

    cam.jumpTo(0, -180, 4.0);
    const u4 = canvas.toDataURL();

    return { u1: u1.length, u2: u2.length, u4: u4.length, eq12: u1 === u2, eq24: u2 === u4 };
  });

  console.log('toDataURL result:', urls);
  await browser.close();
}

testCanvasDataUrl().catch(console.error);
