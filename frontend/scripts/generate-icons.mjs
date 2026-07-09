import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const inputFile = path.join(root, 'public', 'logo-nobg.png');
const brandBlue = '#3B82F6';

const sizes = [
  { name: 'pwa-192x192.png', size: 192 },
  { name: 'pwa-512x512.png', size: 512 },
  { name: 'apple-touch-icon-180x180.png', size: 180 },
  { name: 'apple-touch-icon-152x152.png', size: 152 },
  { name: 'apple-touch-icon-120x120.png', size: 120 },
];

const trimmedBuffer = await sharp(inputFile).trim({ threshold: 10 }).png().toBuffer();
const meta = await sharp(trimmedBuffer).metadata();
console.log(`Original: 536×466 → Trimmed: ${meta.width}×${meta.height}`);
console.log('---');

for (const { name, size } of sizes) {
  const outputPath = path.join(root, 'public', name);

  await sharp(trimmedBuffer)
    .resize(size, size, { fit: 'cover', position: 'centre' })
    .tint(brandBlue)
    .png()
    .toFile(outputPath);

  console.log(`✓ ${name}  (${size}×${size})`);
}
