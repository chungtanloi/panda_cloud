import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Web application (demo) build — this is what `npm run dev` / `npm run build`
// use, and what Vercel deploys. It bundles `src/main.tsx` (which renders
// `src/App.tsx`, a thin switcher between the existing DealBoard and
// SalesPipelineBoard implementations) into a static site in `dist/`.
//
// The @kanban/library npm package build (Vite library mode + type
// declarations) has been preserved separately in `vite.lib.config.ts` and is
// run via `npm run build:lib`, so the library packaging story is unaffected.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});
