import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiTarget = env.VITE_API_URL?.replace(/\/$/, '')
  if (!apiTarget) {
    throw new Error('VITE_API_URL не задан в .env')
  }

  return {
    plugins: [react()],
    server: {
      proxy: {
        '/ws': {
          target: apiTarget,
          changeOrigin: true,
          ws: true,
          secure: true,
        },
        '/api': {
          target: apiTarget,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ''),
          secure: true,
          cookieDomainRewrite: {
            '*': 'localhost'
          },
          configure: (proxy, _options) => {
            proxy.on('proxyReq', (proxyReq, req, _res) => {
              if (req.headers.cookie) {
                proxyReq.setHeader('Cookie', req.headers.cookie);
              }
            });
            proxy.on('proxyRes', (proxyRes, _req, _res) => {
              proxyRes.headers['access-control-allow-origin'] = '*';
              proxyRes.headers['access-control-allow-credentials'] = 'true';
            });
          },
        },
      },
    },
  }
})
