import { cn } from "@/lib/cn";

/**
 * Makes a marketing section occupy exactly one viewport on desktop, with its
 * content vertically centred, so scrolling to a section reveals all of it at
 * once rather than half of it.
 *
 * Height maths: 100svh minus the 73px sticky TopNavBar. `svh` (small viewport
 * height) is used rather than `vh` so mobile browser chrome does not cause the
 * section to overflow when the address bar is showing.
 *
 * Deliberately `min-height`, not `height` — if content ever exceeds one screen
 * (long FAQ, small laptop) the section grows instead of clipping. Content is
 * never hidden to satisfy the layout.
 *
 * Below `lg` the constraint is dropped entirely: forcing full-screen sections
 * on a phone produces huge empty gaps.
 */
export function ViewportSection({
  children,
  id,
  className,
}: {
  children: React.ReactNode;
  id?: string;
  className?: string;
}) {
  return (
    <div
      id={id}
      className={cn(
        "flex w-full scroll-mt-[73px] flex-col justify-center py-[48px]",
        "lg:min-h-[calc(100svh-73px)] lg:snap-start lg:py-[64px]",
        className,
      )}
    >
      {children}
    </div>
  );
}
