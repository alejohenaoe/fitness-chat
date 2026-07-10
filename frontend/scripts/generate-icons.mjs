import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const inputFile = path.join(root, 'public', 'fitnesschat-logo.png');

const sizes = [
  { name: 'pwa-192x192-v2.png', size: 192 },
  { name: 'pwa-512x512-v2.png', size: 512 },
  { name: 'apple-touch-icon-180x180-v2.png', size: 180 },
  { name: 'apple-touch-icon-152x152-v2.png', size: 152 },
  { name: 'apple-touch-icon-120x120-v2.png', size: 120 },
];

const meta = await sharp(inputFile).metadata();
console.log(`Source: ${meta.width}×${meta.height}`);
console.log('---');

for (const { name, size } of sizes) {
  const outputPath = path.join(root, 'public', name);

  await sharp(inputFile)
    .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(outputPath);

  console.log(`✓ ${name}  (${size}×${size})`);
}
