"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { WorkspacePage } from "@/components/workspace/WorkspacePage";
import { LoadingState } from "@/components/ui/states";
import { DealPicker } from "@/components/shared/DealPicker";

/**
 * Landing for a workspace whose records the backend only exposes per deal.
 *
 * ⚠ WHY THESE PAGES NO LONGER RENDER A LIST.
 *
 * The Legal and Compliance workspaces used to show a list page that could not
 * work without a `?dealId=`, and rendered `"Deal context required"` without it.
 * That is the state a Legal reviewer saw every time they opened their own
 * workspace from the sidebar: an empty screen with no route to any work.
 *
 * The cause is a real backend constraint, not a frontend oversight:
 *
 *   - NCNDA and KYC are exposed only as `GET /deals/{dealId}/ncnda` and
 *     `GET /deals/{dealId}/kyc`. There is no cross-deal list operation.
 *   - Legal and Compliance identities cannot enumerate deals either:
 *     `resolveKanbanScope` fails closed for those roles, so the sales board
 *     answers `REQUIRES_RESOURCE_SCOPE` → 403.
 *
 * So a real queue cannot be built from the frontend today, and pretending
 * otherwise by rendering an empty table is worse than saying so. This page
 * states the constraint, offers the two routes that do work, and keeps the
 * bookmarked-id drawer as an explicit fallback — the same pattern
 * `DealReadinessEntry` established.
 *
 * When a `dealId` is present the page redirects to `/deal-readiness/[dealId]`,
 * which is now the single canonical URL for NCNDA, KYC and Due Diligence on a
 * deal. Keeping a second layout over the same records meant two places to fix
 * every bug.
 */
export function DealScopedLanding({
  eyebrow,
  title,
  description,
  workstream,
  backendGap,
}: {
  eyebrow: string;
  title: string;
  description: string;
  /** Display name of the record type, e.g. "NCNDA agreements". */
  workstream: string;
  /** The endpoint the backend would need for a real queue. */
  backendGap: string;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const dealId = params.get("dealId")?.trim() ?? "";

  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    if (dealId) router.replace(`/deal-readiness/${encodeURIComponent(dealId)}`);
  }, [dealId, router]);

  if (dealId) {
    return (
      <WorkspacePage eyebrow={eyebrow} title={title} description={description}>
        <LoadingState label="Opening deal readiness" />
      </WorkspacePage>
    );
  }

  return (
    <WorkspacePage eyebrow={eyebrow} title={title} description={description}>
      <section className="max-w-3xl rounded-[24px] border border-accent/25 bg-accent/[0.04] p-6">
        <h2 className="text-lg font-semibold text-ink">{workstream} are opened from a deal</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-dim">
          Every {workstream.toLowerCase()} record belongs to one deal, and the backend exposes it
          only in that scope. Open the deal and this workstream is one of the three lanes on its
          readiness page.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href="/deal-readiness"
            className="rounded-full bg-accent px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-accent-fg"
          >
            Open deal readiness
          </Link>
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="rounded-full border border-accent px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-accent"
          >
            Find a deal
          </button>
        </div>
      </section>

      <section className="mt-5 max-w-3xl rounded-[20px] border border-line bg-surface-alt p-5">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-ink-mute">
          Waiting on the backend
        </p>
        <p className="mt-2 text-sm leading-6 text-ink-dim">
          A cross-deal queue for this workspace needs {backendGap}. Until one exists, this workspace
          has no list of its own work and depends on Sales or Manager sending a deal link. This is
          recorded as a gap rather than filled in with a fabricated list.
        </p>
      </section>

      {drawerOpen ? (
        <div
          className="fixed inset-0 z-[70] flex justify-end bg-black/60"
          role="dialog"
          aria-modal="true"
          aria-label="Open a deal"
        >
          <button className="flex-1" aria-label="Close" onClick={() => setDrawerOpen(false)} />
          <div className="h-full w-full max-w-md border-l border-line bg-surface p-6 pt-20">
            <h2 className="text-xl font-semibold text-ink">Open a deal</h2>
            <p className="mt-2 text-sm leading-6 text-ink-dim">
              Search for the deal this workstream belongs to. Selecting one opens its readiness
              page, where {workstream.toLowerCase()} sit alongside the other two lanes.
            </p>
            <div className="mt-6">
              {/*
                `DealPicker` calls the deal lookup and falls back to an identifier
                field on its own for roles the lookup rejects — which includes
                legal and compliance, the two that reach this page most. One code
                path covers both cases.
              */}
              <DealPicker
                autoFocus
                onSelect={(deal) =>
                  router.push(`/deal-readiness/${encodeURIComponent(deal.dealId)}`)
                }
              />
            </div>
          </div>
        </div>
      ) : null}
    </WorkspacePage>
  );
}
