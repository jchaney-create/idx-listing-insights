import { resolve } from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  server: {
    open: '/demo/index.html',
  },
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.js'),
      name: 'IdxListingInsights',
      fileName: 'idx-listing-insights',
      formats: ['iife'],
    },
    rollupOptions: {
      output: {
        assetFileNames: 'idx-listing-insights.[ext]',
      },
    },
    cssCodeSplit: false,
    outDir: 'dist',
    emptyOutDir: true,
  },
});
