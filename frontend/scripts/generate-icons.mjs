import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const inputFile = path.join(root, 'public', 'logo-nobg.png');

const sizes = [
  { name: 'pwa-192x192.png', size: 192 },
  { name: 'pwa-512x512.png', size: 512 },
  { name: 'apple-touch-icon-180x180.png', size: 180 },
  { name: 'apple-touch-icon-152x152.png', size: 152 },
  { name: 'apple-touch-icon-120x120.png', size: 120 },
];

const trimmed = sharp(inputFile).trim({ threshold: 10 });
const meta = await trimmed.metadata();
console.log(`Original: ${meta.width}×${meta.height}`);
console.log(`Trimmed:  ${meta.width}×${meta.height}`); // will show post-trim dims

// Re-read: trim then get buffer so we can reuse it
const trimmedBuffer = await sharp(inputFile).trim({ threshold: 10 }).png().toBuffer();
const trimmedInfo = await sharp(trimmedBuffer).metadata();
const trimW = trimmedInfo.width;
const trimH = trimmedInfo.height;
const maxTrimDim = Math.max(trimW, trimH);

console.log(`Trimmed content: ${trimW}×${trimH}`);
console.log('---');

for (const { name, size } of sizes) {
  const targetLogoDim = Math.round(size * 0.95);
  const scaleFactor = targetLogoDim / maxTrimDim;

  const logoW = Math.round(trimW * scaleFactor);
  const logoH = Math.round(trimH * scaleFactor);

  const left = Math.round((size - logoW) / 2);
  const top = Math.round((size - logoH) / 2);

  const outputPath = path.join(root, 'public', name);

  await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([
      {
        input: await sharp(trimmedBuffer)
          .resize(logoW, logoH, { fit: 'fill' })
          .png()
          .toBuffer(),
        left,
        top,
      },
    ])
    .png()
    .toFile(outputPath);

  console.log(`✓ ${name}  (${size}×${size}) — logo ${logoW}×${logoH} @ (${left},${top})`);
}
