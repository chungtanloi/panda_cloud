import Link from "next/link";
import type { AuthProfile } from "@/models/auth";
import { homeForProfile } from "@/config/access";

export function Forbidden({ profile }: { profile: AuthProfile | null }) {
  return <main className="grid min-h-screen place-items-center bg-base p-6 font-sans"><section className="max-w-lg rounded-[32px] border border-line bg-surface p-10 text-center backdrop-blur-card"><p className="text-label font-bold uppercase text-accent">403 · Access unavailable</p><h1 className="mt-4 text-3xl font-semibold text-ink">You don’t have access to this workspace.</h1><p className="mt-3 text-sm leading-6 text-ink-dim">Your account is signed in, but this role cannot open the requested workspace. Contact your administrator if you need access.</p><div className="mt-7 flex flex-wrap justify-center gap-3">{profile ? <Link className="inline-flex rounded-full bg-accent px-6 py-3 text-xs font-bold uppercase tracking-wider text-accent-fg" href={homeForProfile(profile)}>Go to my workspace</Link> : null}<Link className="inline-flex rounded-full border border-line-strong px-6 py-3 text-xs font-bold uppercase tracking-wider text-ink" href="/">Return to Panda Cloud</Link><a className="inline-flex rounded-full border border-line-strong px-6 py-3 text-xs font-bold uppercase tracking-wider text-ink" href="mailto:support@pandacloud.ai">Contact support</a></div></section></main>;
}
