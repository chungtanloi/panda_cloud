import { ResourcePage } from "@/components/workspace/ResourcePage";

/**
 * Was a placeholder section list; now reads the customers table through the
 * API layer like every other workspace list screen.
 */
export default function Page() {
  return <ResourcePage kind="customers" />;
}
