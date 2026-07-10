import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [
        'fitnesschat-logo.png',
        'pwa-192x192-v2.png',
        'pwa-512x512-v2.png',
        'apple-touch-icon-180x180-v2.png',
        'apple-touch-icon-152x152-v2.png',
        'apple-touch-icon-120x120-v2.png',
      ],
      manifest: {
        name: 'FitnessChat',
        short_name: 'FitnessChat',
        description: 'Tu asistente de nutrición personal con IA',
        theme_color: '#3B82F6',
        background_color: '#FFFFFF',
        lang: 'es',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          { src: '/pwa-192x192-v2.png', sizes: '192x192', type: 'image/png' },
          { src: '/pwa-512x512-v2.png', sizes: '512x512', type: 'image/png' },
          {
            src: '/pwa-512x512-v2.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
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
