import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  server: {
    proxy: {
      '/api': {
        target: 'https://www.371181668.xyz',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      },
      '/v1/files': {
        target: 'https://www.371181668.xyz',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/v1\/files/, '/v1/files')
      }
    }
  }
})
