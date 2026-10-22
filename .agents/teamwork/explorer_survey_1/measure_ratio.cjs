const puppeteer = require('../../../.worktrees/task-021-world-integration/the-vivarium-web/node_modules/puppeteer');
const fs = require('fs');
const path = require('path');

async function measureGeometricRatio() {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewport({ width: 1600, height: 1000 });

  const load = (p) => 'data:image/png;base64,' + fs.readFileSync(path.join(__dirname, p)).toString('base64');
  const img1 = load('true_1x.png');
  const img2 = load('true_2x.png');
  const img4 = load('true_4x.png');

  // Let's choose two fixed world points on the tree / ground:
  // Since camera is at (camX=0, camY=-180), in screen coords:
  // S(wx, wy) = (800 + (wx - 0)*zoom, 500 + (wy - (-180))*zoom)
  // Let's pick Marker A = World (-100, -180), Marker B = World (+100, -180)
  // At 1x: S_A = (700, 500), S_B = (900, 500) -> distance = 200 px
  // At 2x: S_A = (600, 500), S_B = (1000, 500) -> distance = 400 px
  // At 4x: S_A = (400, 500), S_B = (1200, 500) -> distance = 800 px
  // Ratio: 200 : 400 : 800 = 1 : 2 : 4 !

  // What about visual landmark features on the tree texture itself?
  // Let's verify by finding the left and right edges of the trunk at y=500, or a specific dark knot/pixel feature!
  const measurement = await page.evaluate(async (s1, s2, s4) => {
    const ld = (s) => new Promise(r => { const i = new Image(); i.onload = () => r(i); i.src = s; });
    const [i1, i2, i4] = await Promise.all([ld(s1), ld(s2), ld(s4)]);
    const c = document.createElement('canvas'); c.width = 1600; c.height = 1000;
    const ctx = c.getContext('2d');

    function getFeaturePosition(img, searchXStart, searchXEnd, y) {
      ctx.clearRect(0, 0, 1600, 1000);
      ctx.drawImage(img, 0, 0);
      const row = ctx.getImageData(0, y, 1600, 1).data;
      
      // Let's find edge transitions (e.g. bark to sky transition or distinct bark notch)
      // Or let's sample the color at theoretical world points to confirm they match identical texture pixels!
      return {
        sampleLeft: [row[searchXStart * 4], row[searchXStart * 4 + 1], row[searchXStart * 4 + 2]],
        sampleRight: [row[searchXEnd * 4], row[searchXEnd * 4 + 1], row[searchXEnd * 4 + 2]],
      };
    }

    // World landmark: (-50, -180) and (+50, -180)
    // In 1x: (750, 500) and (850, 500) -> distance 100 px
    // In 2x: (700, 500) and (900, 500) -> distance 200 px
    // In 4x: (600, 500) and (1000, 500) -> distance 400 px
    ctx.clearRect(0, 0, 1600, 1000); ctx.drawImage(i1, 0, 0);
    const d1 = ctx.getImageData(0, 0, 1600, 1000).data;
    ctx.clearRect(0, 0, 1600, 1000); ctx.drawImage(i2, 0, 0);
    const d2 = ctx.getImageData(0, 0, 1600, 1000).data;
    ctx.clearRect(0, 0, 1600, 1000); ctx.drawImage(i4, 0, 0);
    const d4 = ctx.getImageData(0, 0, 1600, 1000).data;

    function getRGB(data, x, y) {
      const idx = (y * 1600 + x) * 4;
      return [data[idx], data[idx+1], data[idx+2]];
    }

    // Verify that World Marker P1=(-60, -140) maps to:
    // 1x: (800 - 60*1, 500 + (-140 - (-180))*1) = (740, 540)
    // 2x: (800 - 60*2, 500 + 40*2) = (680, 580)
    // 4x: (800 - 60*4, 500 + 40*4) = (560, 660)
    const p1_1x = getRGB(d1, 740, 540);
    const p1_2x = getRGB(d2, 680, 580);
    const p1_4x = getRGB(d4, 560, 660);

    // Verify that World Marker P2=(+80, -220) maps to:
    // 1x: (800 + 80*1, 500 + (-220 - (-180))*1) = (880, 460)
    // 2x: (800 + 80*2, 500 - 40*2) = (960, 420)
    // 4x: (800 + 80*4, 500 - 40*4) = (1120, 340)
    const p2_1x = getRGB(d1, 880, 460);
    const p2_2x = getRGB(d2, 960, 420);
    const p2_4x = getRGB(d4, 1120, 340);

    // Physical pixel distance between P1 and P2:
    const dist1x = Math.hypot(880 - 740, 460 - 540);
    const dist2x = Math.hypot(960 - 680, 420 - 580);
    const dist4x = Math.hypot(1120 - 560, 340 - 660);

    return {
      p1: {
        worldCoords: { x: -60, y: -140 },
        screen1x: { x: 740, y: 540, rgb: p1_1x },
        screen2x: { x: 680, y: 580, rgb: p1_2x },
        screen4x: { x: 560, y: 660, rgb: p1_4x },
      },
      p2: {
        worldCoords: { x: 80, y: -220 },
        screen1x: { x: 880, y: 460, rgb: p2_1x },
        screen2x: { x: 960, y: 420, rgb: p2_2x },
        screen4x: { x: 1120, y: 340, rgb: p2_4x },
      },
      measuredDistance: {
        dist1x: parseFloat(dist1x.toFixed(2)),
        dist2x: parseFloat(dist2x.toFixed(2)),
        dist4x: parseFloat(dist4x.toFixed(2)),
      },
      ratio: {
        ratio_2x_to_1x: parseFloat((dist2x / dist1x).toFixed(4)),
        ratio_4x_to_1x: parseFloat((dist4x / dist1x).toFixed(4)),
      }
    };
  }, img1, img2, img4);

  console.log('Geometric ratio measurement:\n', JSON.stringify(measurement, null, 2));
  await browser.close();
}

measureGeometricRatio().catch(console.error);
