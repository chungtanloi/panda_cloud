/** @type {import('tailwindcss').Config} */
export default {
  // Consumers that import this library's compiled CSS as-is don't need to run
  // this config. It exists so the library itself (and its `examples/`) can be
  // developed/previewed standalone with `npm run dev`.
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  // This package is embedded in a host application. Shipping Tailwind's
  // global reset changes unrelated workspace layouts after the board loads.
  corePlugins: { preflight: false },
  theme: {
    extend: {
      colors: {
        kanban: {
          bg: 'rgb(var(--kanban-bg) / <alpha-value>)',
          surface: 'rgb(var(--kanban-surface) / <alpha-value>)',
          border: 'rgb(var(--kanban-border) / <alpha-value>)',
          accent: 'rgb(var(--kanban-accent) / <alpha-value>)',
        },
      },
    },
  },
  plugins: [],
};
