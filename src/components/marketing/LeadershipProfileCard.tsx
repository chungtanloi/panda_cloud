"use client";

import Image from "next/image";
import type { LeadershipProfile } from "@/config/about";
import { SpotlightCard } from "@/components/motion/SpotlightCard";

export function LeadershipProfileCard({ profile }: { profile: LeadershipProfile }) {
  return (
    <SpotlightCard className="card-highlight flex h-full flex-col overflow-hidden rounded-card border border-line-hair bg-card">
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-deep">
        <Image
          src={profile.portraitSrc}
          alt={profile.portraitAlt}
          fill
          sizes="(min-width: 1024px) 30vw, (min-width: 640px) 50vw, 100vw"
          className="object-cover transition-transform duration-700 hover:scale-[1.025]"
        />
        <span aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />
      </div>

      <div className="relative flex flex-1 flex-col p-[25px] lg:p-[29px]">
        <p className="font-mono text-[11px] font-semibold uppercase tracking-[1.2px] text-accent">
          {profile.role}
        </p>
        <h3 className="pt-[12px] font-sans text-[24px] font-semibold leading-[31px] text-white">
          {profile.name}
        </h3>
        <p className="pt-[8px] font-sans text-[14px] font-medium leading-[22px] text-ink">
          {profile.headline}
        </p>
        <p className="pt-[20px] font-sans text-[14px] leading-[23px] text-ink-dim">
          {profile.biography}
        </p>

        {profile.credential ? (
          <p className="mt-[20px] border-l-2 border-accent pl-[14px] font-sans text-[12px] leading-[19px] text-ink-faint">
            {profile.credential}
          </p>
        ) : null}

        <ul className="mt-[22px] flex flex-wrap gap-[8px]" aria-label={`${profile.name} focus areas`}>
          {profile.focusAreas.map((area) => (
            <li
              key={area}
              className="rounded-full border border-accent-line bg-accent-soft px-[10px] py-[6px] font-mono text-[10px] font-semibold uppercase leading-[10px] tracking-[0.8px] text-accent"
            >
              {area}
            </li>
          ))}
        </ul>

        <div className="mt-auto pt-[26px]">
          <a
            href={profile.linkedinUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-[44px] items-center rounded-full border border-line-strong px-[18px] font-sans text-[13px] font-bold tracking-[0.5px] text-ink transition-colors hover:border-accent hover:text-accent"
          >
            View LinkedIn profile
          </a>
        </div>
      </div>
    </SpotlightCard>
  );
}
