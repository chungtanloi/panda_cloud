import { HyperscaleProvider } from "@/controllers/HyperscaleContext";

/** Wraps the Hyperscale Data Center flow so answers survive navigation. */
export default function HyperscaleLayout({ children }: { children: React.ReactNode }) {
  return (
    <HyperscaleProvider>
      <div className="flex min-h-screen flex-col">{children}</div>
    </HyperscaleProvider>
  );
}
