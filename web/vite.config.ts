import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';

// El dev server hace proxy de `/api` y `/auth` al core, de modo que `vite dev` es
// TAMBIEN mismo-origen. Asi la cookie de sesion sigue siendo first-party en local y
// el entorno de desarrollo se comporta igual que el dominio desplegado: nada de
// "en mi maquina funciona" por diferencias de CORS o de cookies.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': path.resolve(import.meta.dirname, 'src') },
  },
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/api': { target: 'http://localhost:3000', changeOrigin: false },
      '/auth': { target: 'http://localhost:3000', changeOrigin: false },
    },
  },
  preview: { port: 5173, host: true },
  build: {
    outDir: 'dist',
    // El core lo sirve tal cual desde `web/dist`; los nombres con hash permiten
    // cachear los assets para siempre.
    emptyOutDir: true,
  },
});
