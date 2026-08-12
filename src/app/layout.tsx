import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { AuthProvider } from "@/controllers/AuthContext";
import { CircuitBackground } from "@/components/effects/CircuitBackground";
import { CursorGlow } from "@/components/effects/CursorGlow";
import "./globals.css";

/**
 * Figma specifies "Geist" for auth/UI chrome and "Liberation Serif" for the
 * assessment and marketing display type.
 *
 * Geist ships as a local package (Vercel's `geist`), so it is bundled — no
 * network fetch at build or request time.
 *
 * The display face is resolved from a local font stack in globals.css rather
 * than `next/font/google`. Liberation Serif, Times New Roman and Tinos are all
 * metric-compatible, so whichever the OS has produces identical line breaks and
 * spacing. This also removes a build-time download from fonts.googleapis.com,
 * which is the usual cause of a dev server that appears to hang on first load.
 */
export const metadata: Metadata = {
  title: "Cloud Panda",
  description: "GPU capacity, energy and land infrastructure for AI workloads.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={GeistSans.variable}>
      <body className="min-h-screen bg-base text-ink antialiased">
        {/* Decorative, global — behind every route. Consumes the existing
            circuit engine/config as-is; see src/components/effects. */}
        <CircuitBackground />
        <CursorGlow />
        <div className="relative z-10">
          <AuthProvider>{children}</AuthProvider>
        </div>
      </body>
    </html>
  );
}
