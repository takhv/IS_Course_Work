import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';

// Vite-конфиг: React + TS, прокси на backend
export default defineConfig({
  plugins: [react()],
  define: {
    global: 'globalThis',
    'process.env': {},
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3939',
        changeOrigin: true,
      },
    },
  },
});

