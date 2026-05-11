import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'
import Components from 'unplugin-vue-components/vite'
import { VantResolver } from '@vant/auto-import-resolver'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  base: '/plant-manager/',
  plugins: [
    vue(),
    Components({
      resolvers: [VantResolver()]
    }),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: '植物管家',
        short_name: '植物管家',
        description: '植物管理助手',
        theme_color: '#4CAF50',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          {
            src: '/icons/icon.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any'
          }
        ]
      },
      workbox: {
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/ark\.cn-beijing\.volces\.com\/.*/i,
            handler: 'NetworkOnly',
            options: {
              cacheName: 'doubao-api',
              backgroundSync: {
                name: 'doubao-queue'
              }
            }
          }
        ]
      }
    })
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  }
})
