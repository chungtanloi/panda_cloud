import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
    css: false,
  },
  resolve: {
    // Mirrors the tsconfig `@/*` alias; vite does not read tsconfig paths on
    // its own. process.cwd() is the repository root when run via npm scripts.
    alias: { "@": path.resolve(process.cwd(), "src") },
  },
});
