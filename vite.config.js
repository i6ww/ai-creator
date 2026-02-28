import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

import { cloudflare } from "@cloudflare/vite-plugin";

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), cloudflare()],
  server: {
    proxy: {
      '/api': {
        target: 'https://grok2api-xings-projects-3a939220.vercel.app',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      },
      '/v1/files': {
        target: 'https://grok2api-xings-projects-3a939220.vercel.app',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/v1\/files/, '/v1/files')
      }
    }
  }
})