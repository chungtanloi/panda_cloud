import { redirect } from "next/navigation";

/**
 * G0 fail-closed boundary for the superseded GPU booking prototype.
 * All legacy booking steps return to the consultation-only rental entry point.
 */
export default function BookingLayout({ children: _children }: { children: React.ReactNode }) {
  redirect("/gpu-renting");
}
