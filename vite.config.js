import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

import { cloudflare } from "@cloudflare/vite-plugin";

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), cloudflare()],
  server: {
    proxy: {
      '/api': {
        target: 'https://xycm.site',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      },
      '/v1': {
        target: 'https://xycm.site',
        changeOrigin: true
      }
    }
  }
})