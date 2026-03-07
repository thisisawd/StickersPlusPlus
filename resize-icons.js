// Resize app-icon.png into the required Office Add-in icon sizes
// Run: node resize-icons.js (after saving app-icon.png to assets/)
const { PNG } = require("pngjs");
const fs = require("fs");
const path = require("path");

const sizes = [16, 32, 64, 80];
const srcPath = path.join(__dirname, "assets", "app-icon.png");

if (!fs.existsSync(srcPath)) {
  console.error("Error: assets/app-icon.png not found. Please save the icon image first.");
  process.exit(1);
}

const srcData = fs.readFileSync(srcPath);
const srcPng = PNG.sync.read(srcData);

for (const size of sizes) {
  const dst = new PNG({ width: size, height: size });

  // Simple nearest-neighbor resize
  const xRatio = srcPng.width / size;
  const yRatio = srcPng.height / size;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const srcX = Math.min(Math.floor(x * xRatio), srcPng.width - 1);
      const srcY = Math.min(Math.floor(y * yRatio), srcPng.height - 1);
      const srcIdx = (srcPng.width * srcY + srcX) << 2;
      const dstIdx = (size * y + x) << 2;
      dst.data[dstIdx] = srcPng.data[srcIdx];
      dst.data[dstIdx + 1] = srcPng.data[srcIdx + 1];
      dst.data[dstIdx + 2] = srcPng.data[srcIdx + 2];
      dst.data[dstIdx + 3] = srcPng.data[srcIdx + 3];
    }
  }

  const outPath = path.join(__dirname, "assets", `icon-${size}.png`);
  const buffer = PNG.sync.write(dst);
  fs.writeFileSync(outPath, buffer);
  console.log(`Created: assets/icon-${size}.png (${size}x${size})`);
}

console.log("Done! All icon sizes generated.");
