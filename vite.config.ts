/// <reference types="vitest/config" />
import { defineConfig } from 'vitest/config'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/GoblinGamble/',
  build: {
    outDir: 'docs',
    emptyOutDir: true,
  },
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/apple-touch-icon.png'],
      manifest: {
        name: 'Goblin Gamble',
        short_name: 'Goblin Gamble',
        description:
          'Roll polyhedral dice, fill your dungeon scorecard, and blame the goblin.',
        theme_color: '#0f6b4c',
        background_color: '#fff8e8',
        display: 'standalone',
        orientation: 'any',
        start_url: '/GoblinGamble/',
        scope: '/GoblinGamble/',
        lang: 'en-NZ',
        icons: [
          {
            src: 'icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'icons/icon-192-maskable.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable',
          },
          {
            src: 'icons/icon-512-maskable.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        navigateFallback: '/GoblinGamble/index.html',
        runtimeCaching: [
          {
            urlPattern: ({ url }) =>
              url.origin === 'https://fonts.googleapis.com' ||
              url.origin === 'https://fonts.gstatic.com',
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts',
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 60 * 60 * 24 * 365,
              },
            },
          },
        ],
      },
    }),
  ],
  test: {
    environment: 'node',
  },
})
