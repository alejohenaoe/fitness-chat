// Genera todos los íconos desde brand/logo-mark.svg (logo "Marcador F" del concepto original).
// Uso: npm run generate-icons
import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = (name) => path.join(root, 'public', name);
const source = await fs.readFile(path.join(root, 'brand', 'logo-mark.svg'), 'utf8');

// Variantes del mismo dibujo
const fullBleed = source; // fondo sólido hasta el borde: iPhone y Android recortan a su forma
const rounded = source.replace('<rect id="bg" width="100" height="100"', '<rect id="bg" width="100" height="100" rx="22.5"'); // escritorio, pestañas y app
const monochrome = source
  .replace(/<rect id="bg"[^>]*\/>/, '') // fondo transparente: Android usa solo la silueta
  .replace(/fill="#[0-9A-Fa-f]{6}"/g, 'fill="#FFFFFF"');

const raster = (svg, size, name, { opaque = false } = {}) => {
  let img = sharp(Buffer.from(svg), { density: Math.ceil((72 * size) / 100) * 2 }).resize(size, size);
  if (opaque) img = img.flatten({ background: '#16181D' }); // sin canal de transparencia
  return img.png().toFile(out(name));
};

await fs.writeFile(out('logo-mark.svg'), rounded);
await fs.writeFile(out('favicon.svg'), rounded);
await Promise.all([
  raster(fullBleed, 180, 'apple-touch-icon-v3.png', { opaque: true }),
  raster(rounded, 192, 'pwa-192x192-v3.png'),
  raster(rounded, 512, 'pwa-512x512-v3.png'),
  // El dibujo ya cabe en la zona segura (círculo del 80 %), así que el recortable usa el mismo arte.
  raster(fullBleed, 512, 'pwa-maskable-512x512-v3.png', { opaque: true }),
  raster(monochrome, 512, 'pwa-monochrome-512x512-v3.png'),
  raster(rounded, 32, 'favicon-32x32.png'),
]);
console.log('Íconos generados en public/');
