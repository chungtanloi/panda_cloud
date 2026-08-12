import type { Config } from "tailwindcss";

/**
 * Every value here is lifted directly from the Figma file
 * (pCxGT1lfFqO2CiDXEmrTk7). Do not invent new scale steps — if a value is
 * missing, read it off the design first.
 *
 * Colours are declared as CSS variables in `src/app/globals.css` and merely
 * referenced here, so the same tokens are available to plain CSS, inline
 * styles and Tailwind utilities alike.
 */
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Surfaces
        base: "var(--color-base)", // #111318 page background
        deep: "var(--color-deep)", // #0c0e12 input wells
        surface: "var(--color-surface)", // rgba(26,26,26,.8) glass cards
        "surface-alt": "var(--color-surface-alt)", // rgba(30,32,36,.9) Log In card
        "surface-auth": "var(--color-surface-auth)", // rgba(51,53,57,.6) Sign Up card
        "surface-soft": "var(--color-surface-soft)", // rgba(26,26,26,.6) path cards
        "surface-solid": "var(--color-surface-solid)", // #1a1a1a dashboard search
        card: "var(--color-card)", // #1e2024 marketing cards
        band: "var(--color-band)", // #1a1c20 about band
        glass: "var(--color-glass)", // rgba(12,14,18,.85) spec cards
        "glass-hi": "var(--color-glass-hi)", // rgba(18,22,28,.9) featured card
        panel: "var(--color-panel)", // rgba(26,28,32,.6) Buy GPU cards
        "panel-head": "var(--color-panel-head)", // rgba(30,32,36,.5) table header
        raised: "var(--color-raised)", // #282a2e toggle / progress track
        muted: "var(--color-muted)", // #333539 completed progress segment

        // Accent
        accent: "var(--color-accent)", // #00f2ff
        "accent-fg": "var(--color-accent-fg)", // #002022 text on accent
        "accent-soft": "var(--color-accent-soft)", // rgba(0,242,255,.1)
        "accent-line": "var(--color-accent-line)", // rgba(0,242,255,.2)
        "accent-dim": "var(--color-accent-dim)", // #00dbe7 footer links
        "accent-deep": "var(--color-accent-deep)", // #006a71 nav CTA

        // Text
        ink: "var(--color-ink)", // #e2e2e8 primary
        "ink-dim": "var(--color-ink-dim)", // #b9cacb secondary
        "ink-faint": "var(--color-ink-faint)", // #3a494b Log In placeholder
        "ink-placeholder": "var(--color-ink-placeholder)", // #849495 Sign Up placeholder
        "ink-search": "var(--color-ink-search)", // #6b7280 dashboard search
        "ink-bright": "var(--color-ink-bright)", // #d1d5db GPU page body
        "ink-mute": "var(--color-ink-mute)", // #9ca3af spec labels

        // Borders
        line: "var(--color-line)", // rgba(58,73,75,.3)
        "line-strong": "var(--color-line-strong)", // rgba(58,73,75,.5)
        "line-faint": "var(--color-line-faint)", // rgba(58,73,75,.2)
        "line-card": "var(--color-line-card)", // rgba(255,255,255,.2)
        "line-soft": "var(--color-line-soft)", // rgba(255,255,255,.1)
        "line-hair": "var(--color-line-hair)", // rgba(255,255,255,.05)
        "line-band": "var(--color-line-band)", // rgba(58,73,75,.1)
      },

      fontFamily: {
        // Assessment / wizard / marketing display type
        serif: ["var(--font-display)", "Liberation Serif", "Times New Roman", "serif"],
        // Auth screens and UI chrome
        sans: ["var(--font-body)", "Geist", "system-ui", "sans-serif"],
        // Node-status chips on the landing page
        mono: ["var(--font-mono)", "Liberation Mono", "Courier New", "monospace"],
      },

      fontSize: {
        // [size, { lineHeight, letterSpacing }] — exact Figma metrics
        display: ["48px", { lineHeight: "52.8px", letterSpacing: "-1.92px" }],
        h2: ["24px", { lineHeight: "31.2px" }],
        score: ["36px", { lineHeight: "36px" }],
        body: ["16px", { lineHeight: "25.6px" }],
        label: ["12px", { lineHeight: "12px", letterSpacing: "1.2px" }],
        "label-tight": ["12px", { lineHeight: "12px", letterSpacing: "0.6px" }],
        micro: ["10px", { lineHeight: "10px", letterSpacing: "1.2px" }],
      },

      borderRadius: {
        card: "48px", // wizard section cards
        panel: "32px", // auth card, selectable cards
        field: "16px", // inputs, buttons, stat chips
      },

      spacing: {
        gutter: "64px", // page padding
        card: "41px", // card inner padding
        section: "40px", // vertical rhythm between sections
        grid: "20px", // 12-col grid gap
      },

      backdropBlur: {
        chrome: "6px", // dashboard sidebar/header, nodes 2:1435 / 2:1481
        card: "8px",
        auth: "12px",
      },

      boxShadow: {
        auth: "0px 25px 50px -12px rgba(0,0,0,0.25)",
        chrome: "0px 4px 30px 0px rgba(0,0,0,0.1)", // node 2:1481
        "accent-dot": "0px 0px 8px 0px rgba(0,242,255,0.8)", // node 2:1492
        "accent-bar": "0px 0px 10px 0px rgba(0,242,255,0.5)", // node 2:1527
      },

      dropShadow: {
        glow: "0px 0px 10px rgba(0,242,255,0.4)",
      },

      maxWidth: {
        canvas: "1280px",
        content: "1152px",
        auth: "448px",
      },
    },
  },
  plugins: [],
};

export default config;
