import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'https://api.singularity-resume.ru',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
        secure: true,
        cookieDomainRewrite: {
          '*': 'localhost'
        },
        configure: (proxy, _options) => {
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            // Передаем cookies из запроса
            if (req.headers.cookie) {
              proxyReq.setHeader('Cookie', req.headers.cookie);
            }
            // Логирование для отладки
            console.log(`[PROXY] ${req.method} ${req.url} -> ${proxyReq.path}`);
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            // Убираем ограничения CORS, так как запрос идет через прокси
            proxyRes.headers['access-control-allow-origin'] = '*';
            proxyRes.headers['access-control-allow-credentials'] = 'true';
            // Логирование ответа
            console.log(`[PROXY] Response: ${proxyRes.statusCode} for ${req.url}`);
          });
        },
      }
    }
  }
})
