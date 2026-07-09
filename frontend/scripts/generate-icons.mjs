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

const srcImg = sharp(inputFile);
const metadata = await srcImg.metadata();
const { width, height } = metadata;
const maxOriginalDim = Math.max(width, height);

console.log(`Source: ${width}×${height}`);
console.log('---');

for (const { name, size } of sizes) {
  const targetLogoDim = Math.round(size * 0.72);
  const scaleFactor = targetLogoDim / maxOriginalDim;

  const logoWidth = Math.round(width * scaleFactor);
  const logoHeight = Math.round(height * scaleFactor);

  const left = Math.round((size - logoWidth) / 2);
  const top = Math.round((size - logoHeight) / 2);

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
        input: await sharp(inputFile)
          .resize(logoWidth, logoHeight, { fit: 'fill' })
          .png()
          .toBuffer(),
        left,
        top,
      },
    ])
    .png()
    .toFile(outputPath);

  console.log(`✓ Generated ${name}  (${size}×${size})`);
}
