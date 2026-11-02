import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['icons/*.png'],
      manifest: {
        id: '/',
        name: 'Lucianos Rent-a-Car',
        lang: 'es-MX',
        short_name: 'Lucianos',
        description: 'Panel de gestión · Lucianos Rent-a-Car',
        theme_color: '#1a8a52',
        background_color: '#f8f8f4',
        display: 'standalone',
        orientation: 'any',
        categories: ['business', 'productivity'],
        // Long-press the app icon for these
        shortcuts: [
          { name: 'Nueva reserva', url: '/#/app/reservations?new=1', icons: [{ src: 'icons/icon-96x96.png', sizes: '96x96' }] },
          { name: 'Reservas', url: '/#/app/reservations', icons: [{ src: 'icons/icon-96x96.png', sizes: '96x96' }] },
          { name: 'Flota', url: '/#/app/vehicles', icons: [{ src: 'icons/icon-96x96.png', sizes: '96x96' }] },
        ],
        scope: '/',
        start_url: '/#/app/home',
        icons: [
          { src: 'icons/icon-72x72.png',   sizes: '72x72',   type: 'image/png' },
          { src: 'icons/icon-96x96.png',   sizes: '96x96',   type: 'image/png' },
          { src: 'icons/icon-128x128.png', sizes: '128x128', type: 'image/png' },
          { src: 'icons/icon-144x144.png', sizes: '144x144', type: 'image/png' },
          { src: 'icons/icon-152x152.png', sizes: '152x152', type: 'image/png' },
          { src: 'icons/icon-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
          { src: 'icons/icon-384x384.png', sizes: '384x384', type: 'image/png' },
          { src: 'icons/icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
      workbox: {
        // Cache all static assets + Google Fonts
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
  base: './',
  define: { __VERSION__: JSON.stringify(new Date().toISOString().slice(0, 16).replace('T', ' ')) },
})
