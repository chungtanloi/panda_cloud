import { InvestmentProvider } from "@/controllers/InvestmentContext";

/**
 * Wraps the AI Token Investment flow so answers survive navigation.
 *
 * Open to anonymous visitors up to the KYC step; identity is required there by
 * definition, and the submission itself is gated behind an account.
 */
export default function InvestmentLayout({ children }: { children: React.ReactNode }) {
  return (
    <InvestmentProvider>
      <div className="flex min-h-screen flex-col">{children}</div>
    </InvestmentProvider>
  );
}
