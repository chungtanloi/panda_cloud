import Link from "next/link";
import { ContactForm } from "@/components/marketing/sections/ContactForm";
import { ViewportSection } from "@/components/marketing/ViewportSection";
import { Reveal } from "@/components/motion/Reveal";
import { GPU_HERO, PLATFORM_ADVANTAGES } from "@/config/gpuRenting";

/**
 * G0 fail-closed GPU Rental entry point.
 *
 * The partner-managed catalog and quote contract are still Proposed Design.
 * This page deliberately performs no catalog, pricing, availability, booking,
 * or provisioning I/O until the corresponding contract and runtime gates pass.
 */
export default function GpuRentingPage() {
  return (
    <div className="mx-auto flex w-full max-w-[1440px] flex-col px-[24px] lg:px-[64px]">
      <ViewportSection>
        <Reveal as="section" className="flex flex-col items-center text-center">
          <span className="rounded-full border border-accent/30 bg-accent-soft px-[13px] py-[7px] font-mono text-[11px] uppercase tracking-[1.2px] text-accent">
            {GPU_HERO.badge}
          </span>

          <h1 className="max-w-[896px] pt-[40px] font-sans text-[36px] font-bold leading-[1.1] tracking-[-1.92px] text-white lg:text-[48px]">
            <span className="block">{GPU_HERO.titleLead}</span>
            <span className="block font-normal text-accent">{GPU_HERO.titleAccent}</span>
          </h1>

          <p className="max-w-[720px] pt-[28px] font-sans text-[18px] leading-[28.8px] text-ink-bright">
            {GPU_HERO.body}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-[16px] pt-[32px]">
            <Link
              href={GPU_HERO.primaryCta.href}
              className="rounded-full bg-accent px-[32px] py-[17px] font-sans text-[16px] font-bold text-accent-fg transition-opacity hover:opacity-90"
            >
              {GPU_HERO.primaryCta.label}
            </Link>
            <Link
              href={GPU_HERO.secondaryCta.href}
              className="rounded-full border border-accent/30 bg-glass px-[33px] py-[17px] font-sans text-[16px] font-bold text-white transition-colors hover:border-accent"
            >
              {GPU_HERO.secondaryCta.label}
            </Link>
          </div>
        </Reveal>
      </ViewportSection>

      <ViewportSection>
        <Reveal as="section" className="rounded-panel border border-accent-line bg-glass p-[32px] backdrop-blur-card">
          <div className="flex flex-col gap-[16px] border-b border-line-soft pb-[24px]">
            <span className="w-fit rounded-[2px] border border-accent/30 bg-accent-soft px-[9px] py-[5px] font-mono text-[11px] uppercase tracking-[1.2px] text-accent">
              Capacity review required
            </span>
            <h2 className="font-sans text-[28px] font-semibold text-white">
              Rental offers are not yet published
            </h2>
            <p className="max-w-[900px] font-sans text-[16px] leading-[26px] text-ink-dim">
              Published capacity will be indicative until an infrastructure operator reconfirms
              availability. No capacity is reserved and no deployment is initialized through this
              page.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-[16px] pt-[24px] md:grid-cols-2">
            {PLATFORM_ADVANTAGES.map((item) => (
              <div key={item} className="rounded-field border border-line-soft bg-deep p-[20px]">
                <p className="font-sans text-[14px] leading-[22px] text-ink">{item}</p>
              </div>
            ))}
          </div>

          <p className="pt-[24px] font-sans text-[13px] leading-[22px] text-ink-dim">
            Pricing, billing unit, minimum term, lead time, delivery type, and SLA will be defined
            in an approved offer and issued quote. Provisioning can begin only after capacity
            review, quote acceptance, and the required contract and payment conditions.
          </p>
        </Reveal>
      </ViewportSection>

      <ViewportSection>
        <div id="gpu-consultation" className="scroll-mt-[120px]">
          <ContactForm
            title="Request a GPU rental consultation"
            subtitle="Share your workload, capacity, region, and timing requirements. Panda Cloud will review them before presenting any offer or commitment."
            defaultInterests={["gpu_renting"]}
          />
        </div>
      </ViewportSection>
    </div>
  );
}
