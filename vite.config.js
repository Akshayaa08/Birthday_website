import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const projectDirectory = path.dirname(fileURLToPath(import.meta.url));

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'protect-daily-video-assets',
      configureServer(server) {
        server.middlewares.use('/videos', (_req, res) => {
          res.statusCode = 404;
          res.end();
        });
      },
      closeBundle() {
        fs.rmSync(path.join(projectDirectory, 'dist/videos'), { recursive: true, force: true });
      },
    },
  ],
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/auth': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => proxyReq.setHeader('Origin', 'http://localhost:5173'));
        },
      },
    }
  }
});
