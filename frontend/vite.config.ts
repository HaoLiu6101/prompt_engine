import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(() => ({
  base: './',
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true
  },
  build: {
    target: 'esnext'
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
    css: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src-tauri/**', 'dist/**', 'node_modules/**']
    }
  }
}));
