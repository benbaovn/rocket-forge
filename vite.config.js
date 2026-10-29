import { defineConfig } from 'vite';

export default defineConfig({
  server: { port: 1234, open: true },
  build: { target: 'es2022', chunkSizeWarningLimit: 2000 },
});
