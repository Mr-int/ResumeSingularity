import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: process.env.VITE_BASE_PATH || '/',
  plugins: [react()],
  server: {
    proxy: {
      '/api/v1': {
        target: 'https://api.singularity-resume.ru',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/v1/, ''),
        secure: true,
        cookieDomainRewrite: {
          '*': 'localhost'
        },
        configure: (proxy, _options) => {
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            if (req.headers.cookie) {
              proxyReq.setHeader('Cookie', req.headers.cookie);
            }
            console.log(`[PROXY] ${req.method} ${req.url} -> ${proxyReq.path}`);
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            proxyRes.headers['access-control-allow-origin'] = '*';
            proxyRes.headers['access-control-allow-credentials'] = 'true';
            console.log(`[PROXY] Response: ${proxyRes.statusCode} for ${req.url}`);
          });
        },
      }
    }
  }
})