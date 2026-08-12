import { BookingProvider } from "@/controllers/BookingContext";

/**
 * Wraps the GPU Cluster Booking flow so the draft, GPU catalogue and live
 * quote survive navigation between steps.
 *
 * The flow is open to anonymous visitors; sign-in is requested only at
 * "Initialize Deployment" on step 5, because that is the point the design
 * describes as binding.
 */
export default function BookingLayout({ children }: { children: React.ReactNode }) {
  return (
    <BookingProvider>
      <div className="flex min-h-screen flex-col">{children}</div>
    </BookingProvider>
  );
}
