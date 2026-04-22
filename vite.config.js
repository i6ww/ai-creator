import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

import { cloudflare } from "@cloudflare/vite-plugin";

export default defineConfig({
  plugins: [vue(), cloudflare()],
  server: {
    proxy: {
      '/api': {
        target: 'https://www.371181668.xyz',
        changeOrigin: true,
        secure: false,
        headers: {
          'X-Forwarded-Host': 'localhost'
        },
        configure: (proxy, _options) => {
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            const cookies = proxyRes.headers['set-cookie'];
            if (cookies) {
              const host = req.headers.host || 'localhost';
              proxyRes.headers['set-cookie'] = cookies.map(c => 
                c.replace(/SameSite=Strict/gi, 'SameSite=None')
                 .replace(/domain=[^;]+/gi, `domain=${host}`)
              );
            }
          });
        }
      },
      '/v1': {
        target: 'https://www.371181668.xyz',
        changeOrigin: true,
        secure: false,
        headers: {
          'X-Forwarded-Host': 'localhost'
        },
        configure: (proxy, _options) => {
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            const cookies = proxyRes.headers['set-cookie'];
            if (cookies) {
              const host = req.headers.host || 'localhost';
              proxyRes.headers['set-cookie'] = cookies.map(c => 
                c.replace(/SameSite=Strict/gi, 'SameSite=None')
                 .replace(/domain=[^;]+/gi, `domain=${host}`)
              );
            }
          });
        }
      },
      '/generated/': {
        target: 'http://43.165.172.5:6001',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/generated/, '/generated')
      }
    }
  }
})