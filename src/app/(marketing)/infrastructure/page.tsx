import Link from "next/link";
import { AssetPlaceholder } from "@/components/marketing/AssetPlaceholder";
import { ViewportSection } from "@/components/marketing/ViewportSection";
import { ContactForm } from "@/components/marketing/sections/ContactForm";
import { CtaBand } from "@/components/marketing/sections/CtaBand";
import { FaqAccordion } from "@/components/marketing/sections/FaqAccordion";
import { AnimatedBackdrop } from "@/components/motion/AnimatedBackdrop";
import { Reveal } from "@/components/motion/Reveal";
import { EmptyState } from "@/components/ui/states";
import { INFRA_FAQ, INFRA_HERO, INVENTORY, type InventoryItem } from "@/config/infrastructure";
import { cn } from "@/lib/cn";

// No approved public inventory operation exists in the pinned contract yet.
// Fail closed instead of presenting design samples as live database records.
const inventoryItems: InventoryItem[] = [];

/**
 * Infrastructure — Figma node 2:701, transcribed from an exported screenshot
 * because the file's MCP quota was exhausted. See config/infrastructure.ts for
 * the strings that still need confirming.
 *
 * Structure: two-column hero with a preview panel → "Available Infrastructure"
 * table with filter/export controls. FAQ, contact form and CTA band are the
 * same additions applied to the other marketing pages.
 */
export default function InfrastructurePage() {
  return (
    <div className="mx-auto flex w-full max-w-[1440px] flex-col px-[24px] lg:px-[64px]">
      {/* Hero */}
      <ViewportSection>
        <section className="relative grid grid-cols-1 items-center gap-[48px] lg:grid-cols-2">
          <AnimatedBackdrop stars />

          <Reveal className="relative flex flex-col items-start gap-[24px]">
            <span className="inline-flex items-center gap-[8px] rounded-full border border-accent/30 bg-accent-soft px-[13px] py-[6px]">
              <span aria-hidden className="pulse-dot size-[8px] rounded-full bg-accent" />
              <span className="font-sans text-[12px] font-medium leading-[12px] tracking-[1.2px] text-accent">
                {INFRA_HERO.badge}
              </span>
            </span>

            <h1 className="font-sans text-[32px] font-bold leading-[1.15] tracking-[-1px] text-white lg:text-[40px]">
              {INFRA_HERO.titleLead}
              <span className="text-accent">{INFRA_HERO.titleAccent}</span>
              {INFRA_HERO.titleTail}
            </h1>

            <p className="max-w-[560px] font-sans text-[16px] leading-[25.6px] text-ink-dim">
              {INFRA_HERO.body}
            </p>

            <div className="flex flex-wrap items-center gap-[16px] pt-[8px]">
              <Link
                href={INFRA_HERO.primaryCta.href}
                className="rounded-full bg-accent px-[28px] py-[13px] font-sans text-[14px] font-bold leading-[20px] tracking-[0.7px] text-accent-fg transition-all duration-200 hover:-translate-y-[2px] hover:drop-shadow-[0px_0px_20px_rgba(0,242,255,0.45)]"
              >
                {INFRA_HERO.primaryCta.label}
              </Link>

              <Link
                href={INFRA_HERO.secondaryCta.href}
                className="rounded-full border border-line-strong px-[28px] py-[13px] font-sans text-[14px] font-bold leading-[20px] tracking-[0.7px] text-ink transition-colors hover:border-accent hover:text-accent"
              >
                {INFRA_HERO.secondaryCta.label}
              </Link>
            </div>
          </Reveal>

          <Reveal delay={120} className="relative">
            <AssetPlaceholder
              node="2:701 preview"
              label="Inventory preview panel"
              src="/assets/visuals/infrastructure-inventory.png"
              alt="Organized enterprise data center equipment inventory in a staging facility"
              priority
              className="aspect-[16/10] max-h-[46svh] w-full rounded-card opacity-80"
            />
          </Reveal>
        </section>
      </ViewportSection>

      {/* Available Infrastructure table */}
      <ViewportSection id="inventory">
        <section className="flex flex-col gap-[24px]">
          <Reveal className="flex flex-col items-start justify-between gap-[16px] md:flex-row md:items-end">
            <div>
              <h2 className="font-sans text-[28px] font-semibold leading-[36px] tracking-[-0.6px] text-white">
                {INVENTORY.title}
              </h2>
              <p className="pt-[8px] font-sans text-[14px] leading-[22px] text-ink-dim">
                {INVENTORY.subtitle}
              </p>
            </div>

            {/* Presentational only — the design shows these controls but the
                table is a fixed four-row catalogue with nothing to filter yet.
                Wire to a real endpoint when the inventory becomes dynamic. */}
            <div className="flex items-center gap-[12px]">
              <button
                type="button"
                className="rounded-full border border-line-soft px-[16px] py-[8px] font-sans text-[12px] font-medium leading-[12px] tracking-[1.2px] text-ink-dim transition-colors hover:border-accent hover:text-accent"
              >
                {INVENTORY.actions.filter}
              </button>
              <button
                type="button"
                className="rounded-full border border-line-soft px-[16px] py-[8px] font-sans text-[12px] font-medium leading-[12px] tracking-[1.2px] text-ink-dim transition-colors hover:border-accent hover:text-accent"
              >
                {INVENTORY.actions.export}
              </button>
            </div>
          </Reveal>

          <EmptyState
            title="Infrastructure inventory is being connected"
            message="Components, specifications, availability and lead times will appear after the backend publishes the approved inventory operation."
            action={<Link href="#enquiry" className="text-accent hover:underline">Request a quote</Link>}
          />

          {inventoryItems.length > 0 ? (
          <Reveal delay={80} className="overflow-x-auto">
            <table className="w-full min-w-[860px] overflow-hidden rounded-card border border-line-hair bg-card">
              <thead>
                <tr className="border-b border-line-soft bg-panel-head">
                  {[
                    INVENTORY.columns.component,
                    INVENTORY.columns.specs,
                    INVENTORY.columns.leadTime,
                    INVENTORY.columns.action,
                  ].map((heading, index) => (
                    <th
                      key={heading}
                      scope="col"
                      className={cn(
                        "px-[24px] py-[16px] font-sans text-[11px] font-medium uppercase leading-[12px] tracking-[1.2px] text-ink-mute",
                        index === 3 ? "text-right" : "text-left",
                      )}
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {inventoryItems.map((item, index) => (
                  <tr
                    key={item.id}
                    data-circuit-attract
                    className={cn(
                      "transition-colors hover:bg-white/[0.02]",
                      index < inventoryItems.length - 1 && "border-b border-line-soft",
                    )}
                  >
                    <th scope="row" className="px-[24px] py-[20px] text-left">
                      <span className="flex items-center gap-[12px]">
                        <span
                          aria-hidden
                          className="grid size-[36px] shrink-0 place-items-center rounded-field border border-accent/25 bg-accent-soft"
                        >
                          <span className="size-[12px] rounded-[3px] border-2 border-accent" />
                        </span>
                        <span className="flex flex-col">
                          <span className="font-sans text-[15px] font-medium leading-[22px] text-white">
                            {item.name}
                          </span>
                          <span className="font-sans text-[12px] leading-[18px] text-ink-dim">
                            {item.category}
                          </span>
                        </span>
                      </span>
                    </th>

                    <td className="px-[24px] py-[20px]">
                      <span className="flex flex-wrap items-center gap-[8px]">
                        {item.specs.map((spec) => (
                          <span
                            key={spec}
                            className="rounded-field border border-line-soft bg-white/[0.03] px-[9px] py-[5px] font-mono text-[11px] leading-[14px] text-ink-bright"
                          >
                            {spec}
                          </span>
                        ))}
                      </span>
                    </td>

                    <td className="px-[24px] py-[20px]">
                      <span
                        className={cn(
                          "inline-flex items-center gap-[8px] font-sans text-[13px] leading-[20px]",
                          item.availability === "fast" && "text-accent",
                          item.availability === "standard" && "text-ink",
                          item.availability === "long" && "text-ink-dim",
                        )}
                      >
                        <span
                          aria-hidden
                          className={cn(
                            "size-[6px] rounded-full",
                            item.availability === "fast" && "pulse-dot bg-accent",
                            item.availability === "standard" && "bg-ink",
                            item.availability === "long" && "bg-ink-faint",
                          )}
                        />
                        {item.leadTime}
                      </span>
                    </td>

                    <td className="px-[24px] py-[20px] text-right">
                      <Link
                        href="#enquiry"
                        className="inline-flex rounded-full border border-accent/40 px-[16px] py-[8px] font-sans text-[12px] font-medium leading-[12px] tracking-[1.2px] text-accent transition-colors hover:border-accent hover:bg-accent-soft"
                      >
                        {INVENTORY.ctaLabel}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Reveal>
          ) : null}
        </section>
      </ViewportSection>

      {/* --- Additions, consistent with the other marketing pages. --- */}

      <ViewportSection>
        <FaqAccordion title="Procurement questions" items={INFRA_FAQ} />
      </ViewportSection>

      <ViewportSection id="enquiry">
        <ContactForm
          title="Request a component quote"
          subtitle="Tell us what you need and the target date — we'll come back with pricing and a committed lead time."
          defaultInterests={["infrastructure"]}
        />
      </ViewportSection>

      <ViewportSection>
        <CtaBand
          title="Everything behind the rack, from one supply chain"
          subtitle="Transformers, cooling, networking and racks with lead times you can plan against."
          primary={{ label: "Request a quote", href: "#enquiry" }}
          secondary={{ label: "Explore sites", href: "/energy-land" }}
        />
      </ViewportSection>
    </div>
  );
}
