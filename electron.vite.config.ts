import { defineConfig } from 'electron-vite';
import { resolve } from 'node:path';

export default defineConfig({
  main: {
    resolve: { alias: { '@shared': resolve('src/shared') } },
    build: { outDir: 'out/main' }
  },
  preload: {
    resolve: { alias: { '@shared': resolve('src/shared') } },
    build: { outDir: 'out/preload' }
  },
  renderer: {
    root: 'src/renderer',
    resolve: { alias: { '@shared': resolve('src/shared') } },
    build: { outDir: 'out/renderer' }
  }
});
