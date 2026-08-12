import { cn } from "@/lib/cn";

/**
 * Drifting accent orbs plus an optional starfield, layered behind a section.
 *
 * Purely decorative and purely CSS — no JS, so it can live in a Server
 * Component. Both layers stop under prefers-reduced-motion.
 *
 * The starfield is a repeating radial-gradient rather than an image, so it
 * costs nothing to download and scales to any viewport.
 */
export function AnimatedBackdrop({
  orbs = true,
  stars = false,
  className,
}: {
  orbs?: boolean;
  stars?: boolean;
  className?: string;
}) {
  return (
    <div
      aria-hidden
      className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}
    >
      {stars ? (
        <div
          className="starfield absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage:
              "radial-gradient(1px 1px at 20% 30%, rgba(255,255,255,0.5), transparent), " +
              "radial-gradient(1px 1px at 70% 60%, rgba(0,242,255,0.4), transparent), " +
              "radial-gradient(1px 1px at 40% 80%, rgba(255,255,255,0.35), transparent), " +
              "radial-gradient(1px 1px at 85% 15%, rgba(255,255,255,0.3), transparent)",
            backgroundSize: "400px 400px",
          }}
        />
      ) : null}

      {orbs ? (
        <>
          <div className="orb-drift absolute -left-[120px] top-[10%] size-[320px] rounded-full bg-accent/[0.06] blur-[70px]" />
          <div className="orb-drift-slow absolute -right-[100px] top-[45%] size-[260px] rounded-full bg-accent/[0.05] blur-[60px]" />
        </>
      ) : null}
    </div>
  );
}
