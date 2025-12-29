import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { lingui } from '@lingui/vite-plugin';
import path from 'path';

export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: ['macros'],
      },
    }),
    lingui(),
  ],
  resolve: {
    alias: {
      '@/client': path.resolve(__dirname, './src/components/resume/client'),
      '@/artboard': path.resolve(__dirname, './src/components/resume/artboard'),
      '@reactive-resume/schema': path.resolve(__dirname, './src/components/resume/libs/schema'),
      '@reactive-resume/parser': path.resolve(__dirname, './src/components/resume/libs/parser'),
      '@reactive-resume/dto': path.resolve(__dirname, './src/components/resume/libs/dto'),
      '@reactive-resume/ui': path.resolve(__dirname, './src/components/resume/libs/ui'),
      '@reactive-resume/utils': path.resolve(__dirname, './src/components/resume/libs/utils'),
      '@reactive-resume/hooks': path.resolve(__dirname, './src/components/resume/libs/hooks'),
      'cookie': path.resolve(__dirname, './src/cookie-fix.js'),
      'cookie-original': path.resolve(__dirname, './node_modules/cookie/dist/index.js'),
      '@': path.resolve(__dirname, './src'),
    },
  },
  define: {
    'process.env': {},
    'global': 'window',
    'exports': {},
  },
  build: {
    commonjsOptions: {
      transformMixedEsModules: true,
      include: [/node_modules/],
    },
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
        },
      },
    },
  },
  optimizeDeps: {
    include: ['pdfjs-dist', 'cookie'],
    exclude: ['path', 'url', 'fs'],
  },
});
