import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const inputFile = path.join(root, 'public', 'logo-app.png');

// Content region detected from analysis (tight crop around visible content)
const CROP = { left: 160, top: 75, width: 380, height: 480 };

const sizes = [
  { name: 'pwa-192x192.png', size: 192 },
  { name: 'pwa-512x512.png', size: 512 },
  { name: 'apple-touch-icon-180x180.png', size: 180 },
  { name: 'apple-touch-icon-152x152.png', size: 152 },
  { name: 'apple-touch-icon-120x120.png', size: 120 },
];

console.log(`Source: logo-app.png`);
console.log(`Crop region: (${CROP.left},${CROP.top}) ${CROP.width}x${CROP.height}`);
console.log('---');

// Extract content region once and reuse
const contentBuffer = await sharp(inputFile)
  .extract(CROP)
  .png()
  .toBuffer();

for (const { name, size } of sizes) {
  const outputPath = path.join(root, 'public', name);

  await sharp(contentBuffer)
    .resize(size, size, { fit: 'cover', position: 'centre' })
    .png()
    .toFile(outputPath);

  console.log(`✓ ${name}  (${size}×${size})`);
}

// Also create a properly cropped logo for in-app use
const appLogoPath = path.join(root, 'public', 'logo-app-cropped.png');
await sharp(contentBuffer).png().toFile(appLogoPath);
console.log(`✓ logo-app-cropped.png  (${CROP.width}×${CROP.height})`);
