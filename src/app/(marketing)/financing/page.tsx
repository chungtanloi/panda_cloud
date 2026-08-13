import Link from "next/link";
import { AssetPlaceholder } from "@/components/marketing/AssetPlaceholder";
import { ViewportSection } from "@/components/marketing/ViewportSection";
import { ContactForm } from "@/components/marketing/sections/ContactForm";
import { CtaBand } from "@/components/marketing/sections/CtaBand";
import { FaqAccordion } from "@/components/marketing/sections/FaqAccordion";
import { AnimatedBackdrop } from "@/components/motion/AnimatedBackdrop";
import { Reveal } from "@/components/motion/Reveal";
import { EmptyState } from "@/components/ui/states";
import { FINANCING_FAQ, FINANCING_HERO } from "@/config/financing";

/**
 * Financing — Figma node 2:532, transcribed from an exported screenshot
 * because the file's MCP quota was exhausted. See config/financing.ts for the
 * strings that still need confirming.
 *
 * Structure: hero → product preview panel → four product cards → loan
 * calculator. FAQ, contact form and CTA band are the same additions applied to
 * the other marketing pages.
 */
export default function FinancingPage() {
  return (
    <div className="mx-auto flex w-full max-w-[1440px] flex-col px-[24px] lg:px-[64px]">
      {/* Hero */}
      <ViewportSection>
        <Reveal as="section" className="relative flex flex-col items-center gap-[32px] text-center">
          <AnimatedBackdrop stars />

          <p className="relative font-sans text-[14px] font-medium leading-[20px] tracking-[0.7px] text-accent">
            {FINANCING_HERO.eyebrow}
          </p>

          <p className="relative max-w-[760px] font-sans text-[16px] leading-[25.6px] text-ink-dim">
            {FINANCING_HERO.body}
          </p>

          <div className="relative flex flex-wrap items-center justify-center gap-[16px]">
            <Link
              href={FINANCING_HERO.primaryCta.href}
              className="rounded-full bg-accent px-[32px] py-[14px] font-sans text-[14px] font-bold leading-[20px] tracking-[0.7px] text-accent-fg transition-all duration-200 hover:-translate-y-[2px] hover:drop-shadow-[0px_0px_20px_rgba(0,242,255,0.45)]"
            >
              {FINANCING_HERO.primaryCta.label}
            </Link>

            <Link
              href={FINANCING_HERO.secondaryCta.href}
              className="rounded-full border border-accent/30 px-[32px] py-[14px] font-sans text-[14px] font-bold leading-[20px] tracking-[0.7px] text-accent transition-colors hover:border-accent"
            >
              {FINANCING_HERO.secondaryCta.label}
            </Link>
          </div>

          {/* Preview panel showing the product table and estimator. */}
          <div className="relative w-full pt-[16px]">
            <AssetPlaceholder
              node="2:532 preview"
              label="Financing products preview"
              src="/assets/visuals/gpu-cluster-closeup.png"
              alt="Premium GPU compute hardware available for infrastructure financing"
              className="max-h-[calc(100svh-420px)] min-h-[220px] w-full rounded-card opacity-70"
            />
          </div>
        </Reveal>
      </ViewportSection>

      {/* Financing products and rates must come from the backend contract. */}
      <ViewportSection>
        <EmptyState
          title="Financing catalog is being connected"
          message="Products, rates, limits and calculator terms will appear only after the backend publishes the approved financing catalog operation."
          action={<Link href="#enquiry" className="text-accent hover:underline">Contact financing</Link>}
        />
      </ViewportSection>

      {/* --- Additions, consistent with the other marketing pages. --- */}

      <ViewportSection>
        <FaqAccordion title="Financing questions" items={FINANCING_FAQ} />
      </ViewportSection>

      <ViewportSection id="enquiry">
        <ContactForm
          title="Talk to the financing team"
          subtitle="Tell us the configuration and structure you have in mind, and we'll send a term sheet."
          defaultInterests={["financing"]}
        />
      </ViewportSection>

      <ViewportSection>
        <CtaBand
          title="Fund the cluster without draining the balance sheet"
          subtitle="Loans, leases and revenue-share structures for AI labs and enterprise deployments."
          primary={{ label: "Talk to financing", href: "#enquiry" }}
          secondary={{ label: "Compare renting", href: "/gpu-renting" }}
        />
      </ViewportSection>
    </div>
  );
}
