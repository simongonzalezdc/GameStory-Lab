import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Audio libraries
          'audio-engine': ['tone', '@tonejs/midi'],
          // React and core UI
          'react-vendor': ['react', 'react-dom'],
          // State management
          'state': ['zustand'],
          // UI components
          'ui': ['@radix-ui/react-dialog', '@radix-ui/react-slider'],
        },
      },
    },
    // Increase chunk size warning limit to 600KB since we have audio libraries
    chunkSizeWarningLimit: 600,
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
});
