import fs from 'fs';
import path from 'path';
import { PNG } from 'pngjs';

const dir = 'c:/Users/ADMIN-PC/Documents/ANTIGRAVITY/GAME/the-vivarium-web/public/assets/source';
const files = [
  'env_tree_ancient_trunk_base.png',
  'env_tree_bough_main_moss.png',
  'env_foliage_canopy_clump_01.png',
  'env_tree_root_deep_cluster.png'
];

for (const file of files) {
  const filePath = path.join(dir, file);
  const data = fs.readFileSync(filePath);
  const png = PNG.sync.read(data);
  const { width, height } = png;

  let minX = width, maxX = 0, minY = height, maxY = 0;
  let alphaCount = 0, semiAlphaCount = 0, opaqueCount = 0;
  let borderBleed = 0;
  let checkerboardArtifacts = 0;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (width * y + x) << 2;
      const r = png.data[idx];
      const g = png.data[idx + 1];
      const b = png.data[idx + 2];
      const a = png.data[idx + 3];

      if (a > 10) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
        if (x === 0 || x === width - 1 || y === 0 || y === height - 1) {
          borderBleed++;
        }
      }

      if (a === 0) alphaCount++;
      else if (a < 250) semiAlphaCount++;
      else opaqueCount++;

      // Check for leftover checkerboard grey patterns (e.g. alternating ~204 or ~255 grey pixels with high alpha)
      if (a > 200 && Math.abs(r - g) < 5 && Math.abs(g - b) < 5 && (r > 190 && r < 240)) {
        checkerboardArtifacts++;
      }
    }
  }

  console.log(`=== ${file} ===`);
  console.log(`Dimensions: ${width} x ${height}`);
  console.log(`Bounding Box X: ${minX} .. ${maxX} (width: ${maxX - minX + 1})`);
  console.log(`Bounding Box Y: ${minY} .. ${maxY} (height: ${maxY - minY + 1})`);
  console.log(`Border Bleed Pixels (on canvas edges): ${borderBleed}`);
  console.log(`Alpha Pct: ${(alphaCount / (width * height) * 100).toFixed(1)}%`);
  console.log(`Semi-Alpha Pct: ${(semiAlphaCount / (width * height) * 100).toFixed(1)}%`);
  console.log(`Opaque Pct: ${(opaqueCount / (width * height) * 100).toFixed(1)}%`);
  console.log(`Suspected Checkerboard Grey Pixels: ${checkerboardArtifacts}`);
}
