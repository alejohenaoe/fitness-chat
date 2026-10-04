import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [
        'logo-mark.svg',
        'favicon.svg',
        'favicon-32x32.png',
        'apple-touch-icon-v3.png',
      ],
      manifest: {
        name: 'FitnessChat',
        short_name: 'FitnessChat',
        description: 'Tu asistente de nutrición personal con IA',
        theme_color: '#F6F5F1',
        background_color: '#F6F5F1',
        lang: 'es',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          { src: '/pwa-192x192-v3.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/pwa-512x512-v3.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: '/pwa-maskable-512x512-v3.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          { src: '/pwa-monochrome-512x512-v3.png', sizes: '512x512', type: 'image/png', purpose: 'monochrome' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https?:\/\/.*\/api\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 },
              networkTimeoutSeconds: 5,
            },
          },
        ],
      },
    }),
  ],
});
