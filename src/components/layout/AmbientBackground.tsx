/**
 * Figma nodes 2:931 / 2:932 — the layered atmospheric wash behind auth and
 * transactional screens: a faint white grid overlay plus a wide cyan radial
 * gradient centred on the viewport.
 */
export function AmbientBackground() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(90deg, rgba(255,255,255,0.03) 2.5%, rgba(255,255,255,0) 2.5%), " +
            "linear-gradient(180deg, rgba(255,255,255,0.03) 2.5%, rgba(255,255,255,0) 2.5%)",
        }}
      />
      <div className="ambient-wash absolute inset-0" />
    </div>
  );
}
