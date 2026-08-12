import Link from "next/link";
import { BrandMark } from "@/components/layout/BrandMark";
import { Footer } from "@/components/layout/Footer";
import { ContactForm } from "@/components/marketing/sections/ContactForm";
import { AnimatedBackdrop } from "@/components/motion/AnimatedBackdrop";
import { LEAD_FORM } from "@/config/lead";

/**
 * Submit Request — the shared lead intake screen, transcribed from
 * `Submit.png`.
 *
 * Reached from "Get Started" and the various Request Quote / Talk to Team CTAs.
 * Uses the full variant of the shared lead form, and hands off to the Request
 * Received confirmation on success.
 */
export default function SubmitRequestPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex w-full items-center px-[24px] py-[20px] lg:px-[40px]">
        <Link href="/" className="flex items-center gap-[8px]">
          <BrandMark className="h-[16px] w-[22px]" />
          <span className="font-sans text-[16px] font-semibold leading-[24px] text-white">
            Cloud Panda
          </span>
        </Link>
      </header>

      <main className="relative mx-auto flex w-full max-w-[1000px] flex-1 flex-col px-[24px] py-[32px] lg:px-[40px]">
        <AnimatedBackdrop stars />

        <div className="relative">
          <ContactForm
            variant="full"
            eyebrow={LEAD_FORM.badge}
            title={LEAD_FORM.title}
            subtitle={LEAD_FORM.body}
            redirectTo={(reference) => `/requests/${encodeURIComponent(reference)}`}
          />
        </div>
      </main>

      <Footer />
    </div>
  );
}
