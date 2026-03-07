// Script to generate proper PNG icon files with smiley face
const { PNG } = require("pngjs");
const fs = require("fs");
const path = require("path");

function createSmileyPng(size) {
  const png = new PNG({ width: size, height: size });
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 1;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (size * y + x) << 2;
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Default: transparent
      png.data[idx] = 0;
      png.data[idx + 1] = 0;
      png.data[idx + 2] = 0;
      png.data[idx + 3] = 0;

      // Circle background (white with dark border)
      if (dist <= r) {
        if (dist > r - Math.max(1, size * 0.04)) {
          // Border
          png.data[idx] = 80;
          png.data[idx + 1] = 80;
          png.data[idx + 2] = 80;
          png.data[idx + 3] = 255;
        } else {
          // White fill
          png.data[idx] = 255;
          png.data[idx + 1] = 255;
          png.data[idx + 2] = 255;
          png.data[idx + 3] = 255;
        }
      }

      // Left eye
      const eyeR = Math.max(1, size * 0.07);
      const leftEyeX = cx - size * 0.15;
      const leftEyeY = cy - size * 0.1;
      const leftDist = Math.sqrt((x - leftEyeX) ** 2 + (y - leftEyeY) ** 2);
      if (leftDist <= eyeR) {
        png.data[idx] = 50;
        png.data[idx + 1] = 50;
        png.data[idx + 2] = 50;
        png.data[idx + 3] = 255;
      }

      // Right eye
      const rightEyeX = cx + size * 0.15;
      const rightEyeY = cy - size * 0.1;
      const rightDist = Math.sqrt((x - rightEyeX) ** 2 + (y - rightEyeY) ** 2);
      if (rightDist <= eyeR) {
        png.data[idx] = 50;
        png.data[idx + 1] = 50;
        png.data[idx + 2] = 50;
        png.data[idx + 3] = 255;
      }

      // Smile (arc approximation)
      const smileY = cy + size * 0.08;
      const smileR = size * 0.2;
      const smileWidth = Math.max(1.5, size * 0.04);
      const smileDx = x - cx;
      const smileDy = y - smileY;
      const smileDist = Math.sqrt(smileDx * smileDx + smileDy * smileDy);
      if (smileDist >= smileR - smileWidth && smileDist <= smileR + smileWidth && smileDy > 0) {
        png.data[idx] = 50;
        png.data[idx + 1] = 50;
        png.data[idx + 2] = 50;
        png.data[idx + 3] = 255;
      }
    }
  }

  return PNG.sync.write(png);
}

const sizes = [16, 32, 64, 80];
const assetsDir = path.join(__dirname, "assets");

sizes.forEach((size) => {
  const pngData = createSmileyPng(size);
  const filePath = path.join(assetsDir, `icon-${size}.png`);
  fs.writeFileSync(filePath, pngData);
  console.log(`Created ${filePath} (${pngData.length} bytes)`);
});

console.log("All icons generated!");
