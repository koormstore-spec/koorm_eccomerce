import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

const local = (path) => fileURLToPath(new URL(path, import.meta.url));

// Tests run outside Next.js, so its router modules are swapped for
// in-memory stand-ins (see src/test/).
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      'next/navigation': local('./src/test/next-navigation.js'),
      'next/link': local('./src/test/next-link.jsx'),
      'next/image': local('./src/test/next-image.jsx'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.js'],
  },
});
