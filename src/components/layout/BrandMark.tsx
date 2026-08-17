import { cn } from "@/lib/cn";

/**
 * The cloud glyph beside the "Panda Cloud" wordmark.
 * Figma nodes 1:177 (nav, 25.7×18.7) and 1:156 (footer, 22×16).
 *
 * ⚠ PLACEHOLDER — the real mark is an exported SVG asset that could not be
 * downloaded in this session. See docs/FIGMA_ASSETS.md. The shape below is a
 * generic cloud, close to the render but not the exact vector.
 */
export function BrandMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 26 19"
      fill="none"
      aria-hidden
      className={cn("shrink-0 text-accent", className)}
      data-placeholder="figma-node-1:177"
    >
      <path
        d="M6.8 16.5h13a5.2 5.2 0 0 0 .6-10.36A7 7 0 0 0 7.2 5.1a4.9 4.9 0 0 0-.4 9.78Z"
        fill="currentColor"
      />
    </svg>
  );
}
