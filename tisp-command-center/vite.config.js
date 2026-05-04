import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  const proxyUrl = env.VITE_PROXY_URL || 'http://tisp-proxy:3001'
  const n8nUrl = env.VITE_N8N_URL || 'http://localhost:5678'

  return {
    plugins: [react(), tailwindcss()],
    test: {
      environment: 'jsdom',
      exclude: ['e2e/**', 'node_modules/**', 'dist/**'],
    },
    build: {
      rolldownOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules/recharts')) return 'charts';
            if (id.includes('node_modules/framer-motion')) return 'motion';
            return undefined;
          },
        },
      },
    },
    server: {
      port: 5173,
      proxy: {
        '/api/misp': {
          target: proxyUrl,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/misp/, '/proxy/misp'),
          configure: (proxy) => {
            proxy.on('error', (err) => console.warn('[proxy] MISP error:', err.message));
          },
        },
        '/api/opencti': {
          target: proxyUrl,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/opencti/, '/proxy/opencti'),
          configure: (proxy) => {
            proxy.on('error', (err) => console.warn('[proxy] OpenCTI error:', err.message));
          },
        },
        '/api/thehive': {
          target: proxyUrl,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/thehive/, '/proxy/thehive'),
          configure: (proxy) => {
            proxy.on('error', (err) => console.warn('[proxy] TheHive error:', err.message));
          },
        },
        '/api/n8n': {
          target: n8nUrl,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/n8n/, '/webhook'),
          configure: (proxy) => {
            proxy.on('error', (err) => console.warn('[proxy] n8n error:', err.message));
          },
        },
      },
    },
  }
})
