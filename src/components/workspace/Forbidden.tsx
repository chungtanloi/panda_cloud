import Link from "next/link";
import type { User } from "@/models/auth";
import { homeForUser } from "@/config/access";

export function Forbidden({ user }: { user: User | null }) {
  return <main className="grid min-h-screen place-items-center bg-base p-6 font-sans"><section className="max-w-lg rounded-[32px] border border-line bg-surface p-10 text-center backdrop-blur-card"><p className="text-label font-bold uppercase text-accent">403 Forbidden</p><h1 className="mt-4 text-3xl font-semibold text-ink">This workspace is not available to your account.</h1><p className="mt-3 text-sm leading-6 text-ink-dim">Frontend permissions protect the experience. The backend must independently enforce authorization on every endpoint.</p>{user ? <Link className="mt-7 inline-flex rounded-full bg-accent px-6 py-3 text-xs font-bold uppercase tracking-wider text-accent-fg" href={homeForUser(user)}>Go to my workspace</Link> : null}</section></main>;
}
