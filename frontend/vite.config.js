import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  publicDir: 'assets',
  server: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: true,
    // Proxy /api/* to the Express backend — no CORS headers needed
    proxy: {
      '/api': {
        target:       'http://localhost:4000',
        changeOrigin: true,
      },
      '/uploads': {
        target:       'http://localhost:4000',
        changeOrigin: true,
      },
      '/socket.io': {
        target:       'http://localhost:4000',
        changeOrigin: true,
        ws:           true,
      },
    },
  },
  preview: {
    host: '0.0.0.0',
    port: parseInt(process.env.PORT) || 4173,
    allowedHosts: true,
  },
});
