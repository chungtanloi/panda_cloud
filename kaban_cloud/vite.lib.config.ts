import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import dts from 'vite-plugin-dts';

// @kanban/library npm package build (Vite library mode).
//
// This is the original build configuration that used to live in
// `vite.config.ts` before this repo was set up to also deploy as a standalone
// web app. Run it with `npm run build:lib`. It bundles `src/index.ts` (the
// library's public entry point) into `dist-lib/`, along with generated
// `.d.ts` type declarations.
//
// The default `npm run build` (see `vite.config.ts`) instead builds the demo
// web app in `dist/` for deployment (e.g. Vercel) — it does not affect this
// library build.
export default defineConfig({
  plugins: [
    react(),
    dts({
      insertTypesEntry: true,
      outDir: 'dist-lib',
      include: ['src'],
      exclude: ['src/examples/**', 'src/dev/**', 'src/App.tsx', 'src/main.tsx'],
    }),
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  build: {
    outDir: 'dist-lib',
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'KanbanLibrary',
      formats: ['es', 'cjs'],
      fileName: (format) => `kanban-library.${format === 'es' ? 'es' : 'cjs'}.js`,
    },
    cssCodeSplit: false,
    rollupOptions: {
      // Do not bundle React / ReactDOM into the library.
      external: ['react', 'react-dom', 'react/jsx-runtime'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
        },
        assetFileNames: (assetInfo) =>
          assetInfo.name === 'style.css' ? 'kanban-library.css' : (assetInfo.name ?? 'assets/[name][extname]'),
      },
    },
    sourcemap: true,
  },
});
