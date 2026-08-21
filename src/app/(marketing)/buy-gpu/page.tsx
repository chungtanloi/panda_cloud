import { ContactForm } from "@/components/marketing/sections/ContactForm";
import { ViewportSection } from "@/components/marketing/ViewportSection";
import { Reveal } from "@/components/motion/Reveal";
import { BUY_HERO } from "@/config/buyGpu";

/**
 * G0 fail-closed GPU Purchase entry point.
 *
 * Purchase is intentionally separated from GPU Rental. No legacy GPU model,
 * stock, price, booking, warranty, or delivery claim is rendered here.
 */
export default function BuyGpuPage() {
  return (
    <div className="mx-auto flex w-full max-w-[1440px] flex-col px-[24px] lg:px-[64px]">
      <ViewportSection>
        <Reveal as="section" className="flex flex-col items-center text-center">
          <span className="rounded-full border border-accent/30 bg-accent-soft px-[13px] py-[7px] font-mono text-[11px] uppercase tracking-[1.2px] text-accent">
            {BUY_HERO.badge}
          </span>
          <h1 className="max-w-[896px] pt-[40px] font-sans text-[36px] font-bold leading-[1.1] tracking-[-1.5px] text-white lg:text-[48px]">
            {BUY_HERO.titleLead}
            <span className="text-accent">{BUY_HERO.titleAccent}</span>
            {BUY_HERO.titleTail}
          </h1>
          <p className="max-w-[720px] pt-[28px] font-sans text-[18px] leading-[28.8px] text-ink-bright">
            {BUY_HERO.body}
          </p>
        </Reveal>
      </ViewportSection>

      <ViewportSection>
        <Reveal as="section" className="rounded-panel border border-accent-line bg-glass p-[32px] backdrop-blur-card">
          <span className="rounded-[2px] border border-accent/30 bg-accent-soft px-[9px] py-[5px] font-mono text-[11px] uppercase tracking-[1.2px] text-accent">
            Consultation only
          </span>
          <h2 className="pt-[20px] font-sans text-[28px] font-semibold text-white">
            Purchase offers are reviewed individually
          </h2>
          <p className="max-w-[900px] pt-[16px] font-sans text-[16px] leading-[26px] text-ink-dim">
            GPU procurement has separate stock, warranty, delivery, cancellation, tax, and
            commercial rules. No purchasable inventory, price, or delivery commitment is
            published through this page.
          </p>
        </Reveal>
      </ViewportSection>

      <ViewportSection>
        <ContactForm
          title="Request a purchase consultation"
          subtitle="Tell us the configuration, deployment location, quantity, and timing you are considering. Panda Cloud will review the requirements before presenting an offer."
          defaultInterests={["buy_gpu"]}
        />
      </ViewportSection>
    </div>
  );
}
