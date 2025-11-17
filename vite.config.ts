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
        manualChunks: (id) => {
          // Audio libraries - large, load on demand
          if (id.includes('tone') || id.includes('@tonejs/midi')) {
            return 'audio-engine';
          }
          
          // MIDI export - only needed when exporting
          if (id.includes('midi-export')) {
            return 'midi-export';
          }
          
          // AI clients - load on demand
          if (id.includes('lib/ai/') && !id.includes('ai-service')) {
            return 'ai-clients';
          }
          
          // Tutorial system - load on first use
          if (id.includes('tutorial/') || id.includes('TutorialOverlay')) {
            return 'tutorial';
          }
          
          // React and core UI
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
            return 'react-vendor';
          }
          
          // State management
          if (id.includes('node_modules/zustand')) {
            return 'state';
          }
          
          // UI components (Radix)
          if (id.includes('node_modules/@radix-ui')) {
            return 'ui-components';
          }
          
          // Validation library
          if (id.includes('node_modules/zod')) {
            return 'validation';
          }
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
    testTimeout: 5000, // 5 second timeout per test
  },
});
