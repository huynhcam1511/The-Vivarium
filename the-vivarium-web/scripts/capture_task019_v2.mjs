import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

async function captureV2() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1600,1000'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1600, height: 1000 });

  // Use paused=true to eliminate animation jitter/movement from fishes, duck, waves and sway
  const targetUrl = 'http://127.0.0.1:2019/?mode=aquatic&paused=true';
  console.log(`Navigating to ${targetUrl} ...`);
  await page.goto(targetUrl, { waitUntil: 'networkidle2' });
  await new Promise((r) => setTimeout(r, 2000));

  const outDir = 'C:/Users/ADMIN-PC/Documents/ANTIGRAVITY/GAME/.worktrees/task-019-aquatic/QA/TASK-019/CAMERA_PRESETS_V2';
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const clickPreset = async (name) => {
    const clicked = await page.evaluate((txt) => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes(txt));
      if (btn) {
        btn.click();
        return true;
      }
      return false;
    }, name);
    await new Promise((r) => setTimeout(r, 800));
    return clicked;
  };

  // Inspect telemetry and bounding boxes
  const inspectScene = async () => {
    const b64 = await page.screenshot({ encoding: 'base64' });
    return await page.evaluate(async (base64) => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent?.includes('Thác Nước'));
      const fiberKey = Object.keys(btn).find(k => k.startsWith('__reactFiber'));
      let fiber = btn[fiberKey];
      while (fiber && fiber.elementType?.name !== 'AquaticShowcaseScene') {
        fiber = fiber.return;
      }
      const camRef = fiber.memoizedState.next.next.memoizedState.current;
      const stage = camRef.stage;

      const trunk = stage.children[1];
      const canopy = stage.children[2];
      const lake = stage.children[3];

      const trunkScreen = stage.toGlobal(trunk.position);
      const canopyScreen = stage.toGlobal(canopy.position);

      // Pixel analysis from screenshot
      const img = new Image();
      img.src = 'data:image/png;base64,' + base64;
      await new Promise(res => img.onload = res);
      const c = document.createElement('canvas');
      c.width = img.width;
      c.height = img.height;
      const ctx = c.getContext('2d');
      ctx.drawImage(img, 0, 0);
      const data = ctx.getImageData(0, 0, c.width, c.height).data;

      let minX = c.width, maxX = 0, minY = c.height, maxY = 0;
      let count = 0;
      for (let y = 0; y < 600; y++) {
        for (let x = 0; x < c.width; x++) {
          const idx = (y * c.width + x) * 4;
          const r = data[idx], g = data[idx+1], b = data[idx+2];
          // Oak Foliage green filter (exclude UI panel area)
          if (g > r + 15 && g > b + 15 && (x > 420 || y < 600)) {
            count++;
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
          }
        }
      }

      return {
        cam: { x: camRef.x, y: camRef.y, zoom: camRef.zoom },
        stageTransform: { pos: { x: stage.position.x, y: stage.position.y }, scale: { x: stage.scale.x, y: stage.scale.y } },
        trunkScreenCoord: { x: trunkScreen.x, y: trunkScreen.y },
        canopyScreenCoord: { x: canopyScreen.x, y: canopyScreen.y },
        measuredCanopyPixelBBox: { minX, maxX, minY, maxY, width: maxX - minX, height: maxY - minY, greenPixelCount: count },
      };
    }, b64);
  };

  const telemetryLog = {};

  // 1. Preset LAKE (Lòng Hồ)
  console.log('Capturing 1. LAKE Preset...');
  await clickPreset('Lòng Hồ');
  await new Promise((r) => setTimeout(r, 600));
  telemetryLog.LAKE = await inspectScene();
  const lakePath = path.join(outDir, '01_preset_lake_1680_600_z1.25.png');
  await page.screenshot({ path: lakePath });
  console.log('Saved LAKE to', lakePath, 'Data:', JSON.stringify(telemetryLog.LAKE, null, 2));

  // 2. Preset WATERFALL (Thác Nước)
  console.log('Capturing 2. WATERFALL Preset...');
  await clickPreset('Thác Nước');
  await new Promise((r) => setTimeout(r, 600));
  telemetryLog.WATERFALL = await inspectScene();
  const waterfallPath = path.join(outDir, '02_preset_waterfall_1390_480_z1.50.png');
  await page.screenshot({ path: waterfallPath });
  console.log('Saved WATERFALL to', waterfallPath, 'Data:', JSON.stringify(telemetryLog.WATERFALL, null, 2));

  // 3. Preset OVERVIEW (Toàn Cảnh)
  console.log('Capturing 3. OVERVIEW Preset...');
  await clickPreset('Toàn Cảnh');
  await new Promise((r) => setTimeout(r, 600));
  telemetryLog.OVERVIEW = await inspectScene();
  const overviewPath = path.join(outDir, '03_preset_overview_1580_520_z0.90.png');
  await page.screenshot({ path: overviewPath });
  console.log('Saved OVERVIEW to', overviewPath, 'Data:', JSON.stringify(telemetryLog.OVERVIEW, null, 2));

  fs.writeFileSync(path.join(outDir, 'telemetry_comparison.json'), JSON.stringify(telemetryLog, null, 2), 'utf8');

  await browser.close();
  console.log('V2 Camera Captures Completed successfully!');
}

captureV2().catch(console.error);
