import { BookingProvider } from "@/controllers/BookingContext";

/**
 * Wraps the GPU Cluster Booking flow so the draft, GPU catalogue and live
 * quote survive navigation between steps.
 *
 * The flow is open to anonymous visitors; the final step requests a quote and
 * creates a Sales lead rather than provisioning a cluster.
 */
export default function BookingLayout({ children }: { children: React.ReactNode }) {
  return (
    <BookingProvider>
      <div className="flex min-h-screen flex-col">{children}</div>
    </BookingProvider>
  );
}
