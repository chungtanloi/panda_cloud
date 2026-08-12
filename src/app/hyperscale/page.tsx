import { redirect } from "next/navigation";

/**
 * The Hyperscale service landing page (system report item 15) was not among the
 * exported screens, so the flow entry redirects straight to its first step
 * rather than showing an invented marketing page.
 *
 * Replace this with the real landing when its design is available.
 */
export default function HyperscaleEntryPage() {
  redirect("/hyperscale/stage");
}
