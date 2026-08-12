/**
 * Figma nodes 2:890 / 2:891 — two 128px bracket marks inset 24px from the
 * top-left and bottom-right corners, drawn with a 1px rgba(58,73,75,.2) rule.
 */
export function DecorativeCorners() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute left-[24px] top-[24px] size-[128px] border-l border-t border-line-faint" />
      <div className="absolute bottom-[24px] right-[24px] size-[128px] border-b border-r border-line-faint" />
    </div>
  );
}
