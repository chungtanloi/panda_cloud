import { Footer } from "@/components/layout/Footer";
import { TopNavBar } from "@/components/layout/TopNavBar";
import { DemoPresenterDrawer } from "@/components/inspection/DemoPresenterDrawer";

/**
 * Shared chrome for every public page — Figma frames 1:2, 2:2, 2:218, 2:379,
 * 2:531 and 2:700 all compose the same TopNavBar and Footer.
 */
export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <TopNavBar />
      <main className="flex-1">{children}</main>
      <Footer />
      <DemoPresenterDrawer />
    </div>
  );
}
