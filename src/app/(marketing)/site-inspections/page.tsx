import Link from "next/link";
import { ViewportSection } from "@/components/marketing/ViewportSection";
import { CtaBand } from "@/components/marketing/sections/CtaBand";
import { FaqAccordion } from "@/components/marketing/sections/FaqAccordion";
import { AnimatedBackdrop } from "@/components/motion/AnimatedBackdrop";
import { Reveal } from "@/components/motion/Reveal";
import { SpotlightCard } from "@/components/motion/SpotlightCard";
import { SimulationDisclosure } from "@/components/inspection/SimulationDisclosure";

export const metadata = {
  title: "Rapid Standards-Aligned Site Inspection | Panda Cloud",
  description:
    "AI-assisted mobile evidence capture and technical peer-reviewed readiness reports for AI data centers and electrical power infrastructure.",
};

const INSPECTION_FAQ = [
  {
    question: "Does Panda Cloud site inspection replace an official AHJ electrical inspection?",
    answer:
      "No. Panda Cloud provides a rapid advisory assessment for data center and power readiness. It does not replace an Authority Having Jurisdiction (AHJ), licensed local electrical code inspection, or professional engineer (PE) sign-off on building permits.",
  },
  {
    question: "How fast is the provisional AI analysis compared to the final report?",
    answer:
      "Provisional AI synthesis completes within 5 minutes of submission. A Panda Cloud Technical Reviewer then performs peer review on risk-bearing findings and issues the final report within 1 business day SLA.",
  },
  {
    question: "What equipment needs to be photographed during capture?",
    answer:
      "The mobile checklist guides you through primary utility switchgear nameplates, UPS LCD control panels, battery storage rooms, emergency generator fuel gauges, and CRAC cooling units—all from safe, non-energized observation distances.",
  },
  {
    question: "What file formats are supported for evidence upload?",
    answer:
      "Panda Cloud accepts JPEG, PNG, WebP photographs and official engineering PDF documents (such as annual infrared thermography scan reports).",
  },
];

export default function SiteInspectionsMarketingPage() {
  return (
    <div className="mx-auto flex w-full max-w-[1440px] flex-col px-[24px] lg:px-[64px]">
      <SimulationDisclosure />

      {/* Hero Section */}
      <ViewportSection>
        <section className="relative grid grid-cols-1 items-center gap-[48px] lg:grid-cols-2">
          <AnimatedBackdrop stars />

          <Reveal className="relative flex flex-col items-start gap-[24px]">
            <span className="inline-flex items-center gap-[8px] rounded-full border border-accent/30 bg-accent-soft px-[13px] py-[6px]">
              <span aria-hidden className="pulse-dot size-[8px] rounded-full bg-accent" />
              <span className="font-sans text-[12px] font-medium leading-[12px] tracking-[1.2px] text-accent">
                RAPID STANDARDS-ALIGNED SITE INSPECTION
              </span>
            </span>

            <h1 className="font-sans text-[32px] font-bold leading-[1.15] tracking-[-1px] text-white lg:text-[40px]">
              Verify Electrical &amp; Data Center Infrastructure in{" "}
              <span className="text-accent">Hours, Not Weeks</span>
            </h1>

            <p className="max-w-[560px] font-sans text-[16px] leading-[25.6px] text-ink-dim">
              Guided mobile capture with real-time AI preflight feedback. Get an instant provisional readiness assessment, backed by a Panda Cloud Professional Engineer review within 1 business day.
            </p>

            <div className="flex flex-wrap items-center gap-[16px] pt-[8px]">
              <Link
                href="/inspections/new"
                className="rounded-full bg-accent px-[28px] py-[13px] font-sans text-[14px] font-bold leading-[20px] tracking-[0.7px] text-accent-fg transition-all duration-200 hover:-translate-y-[2px] hover:drop-shadow-[0px_0px_20px_rgba(0,242,255,0.45)]"
              >
                START AI-ASSISTED INSPECTION →
              </Link>

              <a
                href="#what-to-prepare"
                className="rounded-full border border-line-strong px-[28px] py-[13px] font-sans text-[14px] font-bold leading-[20px] tracking-[0.7px] text-ink transition-colors hover:border-accent hover:text-accent"
              >
                SEE WHAT TO PREPARE
              </a>
            </div>

            <p className="font-mono text-[11px] text-ink-mute">
              Free US Pilot Program &bull; Non-invasive visual capture &bull; Zero electrical testing required
            </p>
          </Reveal>

          {/* Hero Visual Feature Panel */}
          <Reveal delay={120} className="relative">
            <SpotlightCard
              tilt
              className="card-highlight flex flex-col gap-[20px] rounded-card border border-line-card bg-surface p-[32px] backdrop-blur-card"
            >
              <div className="flex items-center justify-between border-b border-line pb-[16px]">
                <div className="flex items-center gap-[10px]">
                  <span className="size-[10px] rounded-full bg-emerald-400 animate-pulse" />
                  <span className="font-mono text-[12px] font-bold uppercase tracking-[1px] text-ink">
                    AI Provisional Readiness
                  </span>
                </div>
                <span className="rounded-full border border-accent/40 bg-accent-soft px-[10px] py-[3px] font-mono text-[11px] font-semibold text-accent">
                  P95 &le; 5 MIN
                </span>
              </div>

              <div className="space-y-[12px]">
                <div className="flex items-center justify-between rounded-field border border-line bg-deep/80 p-[14px]">
                  <div className="flex items-center gap-[10px]">
                    <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-accent border border-accent/30 rounded px-[6px] py-[2px] bg-accent-soft">POWER</span>
                    <span className="font-sans text-[13px] text-ink">Primary Switchgear &amp; Transformer</span>
                  </div>
                  <span className="font-mono text-[11px] text-emerald-400 font-semibold">VERIFIED</span>
                </div>

                <div className="flex items-center justify-between rounded-field border border-line bg-deep/80 p-[14px]">
                  <div className="flex items-center gap-[10px]">
                    <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-accent border border-accent/30 rounded px-[6px] py-[2px] bg-accent-soft">BACKUP</span>
                    <span className="font-sans text-[13px] text-ink">UPS Topology &amp; N+1 Redundancy</span>
                  </div>
                  <span className="font-mono text-[11px] text-emerald-400 font-semibold">VERIFIED</span>
                </div>

                <div className="flex items-center justify-between rounded-field border border-line bg-deep/80 p-[14px]">
                  <div className="flex items-center gap-[10px]">
                    <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-accent border border-accent/30 rounded px-[6px] py-[2px] bg-accent-soft">HVAC</span>
                    <span className="font-sans text-[13px] text-ink">CRAC/CRAH Containment</span>
                  </div>
                  <span className="font-mono text-[11px] text-emerald-400 font-semibold">VERIFIED</span>
                </div>
              </div>

              <div className="border-t border-line pt-[16px] flex items-center justify-between font-mono text-[11px] text-ink-dim">
                <span>PE Review SLA: 1 Business Day</span>
                <span className="text-accent">Ready for Load</span>
              </div>
            </SpotlightCard>
          </Reveal>
        </section>
      </ViewportSection>

      {/* 3-Stage Process */}
      <ViewportSection>
        <section className="flex flex-col gap-[36px]">
          <Reveal className="text-center max-w-[720px] mx-auto">
            <h2 className="font-sans text-[28px] font-semibold leading-[36px] tracking-[-0.6px] text-white">
              How Panda Cloud Inspection Works
            </h2>
            <p className="pt-[8px] font-sans text-[14px] leading-[22px] text-ink-dim">
              Transparent 3-stage journey combining instant in-field computer vision with licensed engineering review.
            </p>
          </Reveal>

          <div className="grid grid-cols-1 gap-[24px] md:grid-cols-3">
            <Reveal delay={60}>
              <SpotlightCard className="flex h-full flex-col gap-[16px] rounded-card border border-line-card bg-surface p-[28px]">
                <span className="inline-flex size-[40px] items-center justify-center rounded-field border border-accent/30 bg-accent-soft font-mono text-[14px] font-bold text-accent">
                  01
                </span>
                <h3 className="font-sans text-[18px] font-semibold text-white">
                  1. Guided Mobile Capture
                </h3>
                <p className="font-sans text-[13px] leading-[21px] text-ink-dim">
                  Follow an interactive site checklist. Upload photos and PDF logs. Real-time preflight immediately catches blurry nameplates or wrong angles before you leave the facility.
                </p>
                <span className="mt-auto font-mono text-[11px] text-accent">&bull; Optical Preflight (&le; 8s)</span>
              </SpotlightCard>
            </Reveal>

            <Reveal delay={120}>
              <SpotlightCard className="flex h-full flex-col gap-[16px] rounded-card border border-line-card bg-surface p-[28px]">
                <span className="inline-flex size-[40px] items-center justify-center rounded-field border border-purple-500/30 bg-purple-950/50 font-mono text-[14px] font-bold text-purple-300">
                  02
                </span>
                <h3 className="font-sans text-[18px] font-semibold text-white">
                  2. AI Provisional Synthesis
                </h3>
                <p className="font-sans text-[13px] leading-[21px] text-ink-dim">
                  Upon submission, our standards-aligned synthesis engine extracts nameplate parameters, evaluates UPS/generator topology, and generates a provisional readiness verdict.
                </p>
                <span className="mt-auto font-mono text-[11px] text-purple-300">&bull; Provisional Results (&le; 5 min)</span>
              </SpotlightCard>
            </Reveal>

            <Reveal delay={180}>
              <SpotlightCard className="flex h-full flex-col gap-[16px] rounded-card border border-line-card bg-surface p-[28px]">
                <span className="inline-flex size-[40px] items-center justify-center rounded-field border border-emerald-500/30 bg-emerald-950/50 font-mono text-[14px] font-bold text-emerald-300">
                  03
                </span>
                <h3 className="font-sans text-[18px] font-semibold text-white">
                  3. PE Reviewed Final Report
                </h3>
                <p className="font-sans text-[13px] leading-[21px] text-ink-dim">
                  A Panda Cloud Technical reviewer audits risk-bearing conclusions, confirms remediation priorities, and issues an immutable signed readiness report.
                </p>
                <span className="mt-auto font-mono text-[11px] text-emerald-300">&bull; 1 Business Day Turnaround</span>
              </SpotlightCard>
            </Reveal>
          </div>
        </section>
      </ViewportSection>

      {/* What to Prepare Section */}
      <ViewportSection id="what-to-prepare">
        <section className="flex flex-col gap-[32px]">
          <Reveal className="text-center max-w-[720px] mx-auto">
            <h2 className="font-sans text-[28px] font-semibold leading-[36px] tracking-[-0.6px] text-white">
              What to Prepare Before Your Inspection
            </h2>
            <p className="pt-[8px] font-sans text-[14px] leading-[22px] text-ink-dim">
              All visual evidence can be collected safely from outside electrical arc-flash safety boundaries.
            </p>
          </Reveal>

          <div className="grid grid-cols-1 gap-[16px] sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                title: "1. Primary Switchgear & Transformers",
                desc: "Main entrance nameplate, primary breaker rating placard, and service feeder layout.",
              },
              {
                title: "2. UPS & Power Conditioning",
                desc: "Front control LCD panel showing active inverter load, bypass switch, and online status.",
              },
              {
                title: "3. Battery Rooms & ESS",
                desc: "Battery bank arrangement, acid spill containment berm, and ventilation exhaust louvers.",
              },
              {
                title: "4. Backup Generators & ATS",
                desc: "Standby generator manufacturer placard, day-tank fuel gauge, and automatic transfer switch.",
              },
              {
                title: "5. Data Hall Cooling & CRACs",
                desc: "CRAC/CRAH units, supply/return temp readouts, and hot/cold aisle containment baffles.",
              },
              {
                title: "6. Fire Suppression & Documents",
                desc: "Clean agent cylinder pressure gauges and annual infrared thermography scan PDF.",
              },
            ].map((item, idx) => (
              <Reveal key={item.title} delay={idx * 50}>
                <div className="rounded-card border border-line-card bg-surface p-[24px]">
                  <h4 className="font-sans text-[15px] font-semibold text-accent mb-[6px]">
                    {item.title}
                  </h4>
                  <p className="font-sans text-[13px] leading-[20px] text-ink-dim">{item.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>
      </ViewportSection>

      {/* Comparison Table */}
      <ViewportSection>
        <section className="flex flex-col gap-[32px]">
          <Reveal className="text-center max-w-[720px] mx-auto">
            <h2 className="font-sans text-[28px] font-semibold leading-[36px] tracking-[-0.6px] text-white">
              Clear Service Boundary &amp; Comparison
            </h2>
            <p className="pt-[8px] font-sans text-[14px] leading-[22px] text-ink-dim">
              Understand how our rapid advisory assessment compares with formal third-party certifications.
            </p>
          </Reveal>

          <Reveal className="overflow-x-auto rounded-card border border-line-card bg-surface p-[24px]">
            <table className="w-full text-left border-collapse font-sans text-[13px]">
              <thead>
                <tr className="border-b border-line font-mono text-[11px] uppercase tracking-[1px] text-ink-dim">
                  <th className="py-[14px] px-[16px]">Capability / Deliverable</th>
                  <th className="py-[14px] px-[16px] text-accent">Panda Cloud AI Provisional</th>
                  <th className="py-[14px] px-[16px] text-emerald-300">Panda Cloud Reviewed Final</th>
                  <th className="py-[14px] px-[16px] text-ink-mute">Third-Party Certification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/60">
                <tr>
                  <td className="py-[14px] px-[16px] font-medium text-white">Turnaround Time</td>
                  <td className="py-[14px] px-[16px] font-mono text-ink-dim">&lt; 5 minutes</td>
                  <td className="py-[14px] px-[16px] font-mono text-ink-dim">1 business day</td>
                  <td className="py-[14px] px-[16px] font-mono text-ink-mute">4 to 12 weeks</td>
                </tr>
                <tr>
                  <td className="py-[14px] px-[16px] font-medium text-white">In-field Capture Feedback</td>
                  <td className="py-[14px] px-[16px] text-emerald-400 font-medium">Instant Preflight AI</td>
                  <td className="py-[14px] px-[16px] text-emerald-400 font-medium">Full History Audited</td>
                  <td className="py-[14px] px-[16px] text-ink-mute">Offline Report</td>
                </tr>
                <tr>
                  <td className="py-[14px] px-[16px] font-medium text-white">Reviewer Accountability</td>
                  <td className="py-[14px] px-[16px] text-amber-300">Provisional (AI)</td>
                  <td className="py-[14px] px-[16px] text-emerald-300">Panda Cloud Senior PE</td>
                  <td className="py-[14px] px-[16px] text-ink-dim">Accredited Registrar</td>
                </tr>
                <tr>
                  <td className="py-[14px] px-[16px] font-medium text-white">Scope &amp; Safety Level</td>
                  <td className="py-[14px] px-[16px] text-ink-dim">Non-invasive / Advisory</td>
                  <td className="py-[14px] px-[16px] text-ink-dim">Non-invasive / Advisory</td>
                  <td className="py-[14px] px-[16px] text-ink-dim">Invasive / Load Bank Testing</td>
                </tr>
                <tr>
                  <td className="py-[14px] px-[16px] font-medium text-white">Replaces AHJ or Building Permits?</td>
                  <td className="py-[14px] px-[16px] font-semibold text-rose-400">No</td>
                  <td className="py-[14px] px-[16px] font-semibold text-rose-400">No</td>
                  <td className="py-[14px] px-[16px] text-ink-mute">Separate jurisdiction</td>
                </tr>
              </tbody>
            </table>
          </Reveal>
        </section>
      </ViewportSection>

      {/* FAQ Section */}
      <ViewportSection>
        <Reveal>
          <FaqAccordion
            title="Frequently Asked Questions"
            subtitle="Everything you need to know about our standards-aligned rapid inspection."
            items={INSPECTION_FAQ}
          />
        </Reveal>
      </ViewportSection>

      {/* CTA Band */}
      <ViewportSection>
        <CtaBand
          title="Ready to Inspect Your Data Center Site?"
          subtitle="Create an inspection in under 2 minutes. Follow the mobile checklist on site and receive an instant provisional score."
          primary={{
            label: "START INSPECTION NOW",
            href: "/inspections/new",
          }}
        />
      </ViewportSection>
    </div>
  );
}
