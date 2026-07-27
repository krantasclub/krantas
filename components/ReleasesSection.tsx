"use client";

import { useState } from "react";
import { releases as fallbackReleases, getYouTubeId, type Release, type ReleaseTrack } from "@/lib/content";
import Reveal from "./Reveal";
import SectionHeading from "./SectionHeading";

function TrackRow({ track }: { track: ReleaseTrack }) {
  if (track.source === "youtube") {
    const ytId = getYouTubeId(track.url);
    if (ytId) {
      return (
        <div className="py-3">
          <p className="font-mono text-xs uppercase tracking-[0.08em] text-[var(--ink)]/85 mb-2">{track.name}</p>
          <div className="aspect-video w-full max-w-md overflow-hidden border border-[var(--line)]">
            <iframe
              className="w-full h-full"
              src={`https://www.youtube-nocookie.com/embed/${ytId}`}
              title={track.name}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      );
    }
  }

  if (track.source === "upload" && track.url) {
    return (
      <div className="flex items-center justify-between gap-4 py-2.5">
        <p className="font-mono text-xs uppercase tracking-[0.08em] text-[var(--ink)]/85 truncate">{track.name}</p>
        <audio controls src={track.url} className="h-8 max-w-[200px] shrink-0" />
      </div>
    );
  }

  return (
    <a
      href={track.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex items-center justify-between gap-4 py-2.5"
    >
      <p className="font-mono text-xs uppercase tracking-[0.08em] text-[var(--ink)]/85 group-hover:text-[var(--accent)] transition-colors truncate">
        {track.name}
      </p>
      <span className="shrink-0 text-[var(--ink-dim)] group-hover:text-[var(--accent)] transition-colors">↗</span>
    </a>
  );
}

export default function ReleasesSection({ initialItems }: { initialItems?: Release[] }) {
  // Seeded with data already fetched server-side (see app/releases/page.tsx).
  // A genuinely empty Supabase table comes through as `[]` here and renders
  // the "coming soon" empty state below — `fallbackReleases` is only used
  // as a last-resort safety net if this component is ever rendered without
  // the prop at all.
  const [items] = useState<Release[]>(initialItems ?? fallbackReleases);
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <section id="releases" className="relative bg-[var(--bg)] px-5 sm:px-8 py-20 sm:py-28">
      <div className="max-w-[1600px] mx-auto">
        <SectionHeading eyebrow="On the label" title="Releases" note="Krantas Recordings" />

        <div className="border-t border-[var(--line)]">
          {items.length === 0 && (
            <div className="py-16 sm:py-24 text-center">
              <p className="font-display text-2xl sm:text-3xl text-[var(--ink)]/80">
                Releases coming soon
              </p>
              <p className="mt-3 font-mono text-xs sm:text-sm uppercase tracking-[0.12em] text-[var(--ink-dim)]">
                Nothing on the label yet — check back shortly.
              </p>
            </div>
          )}

          {items.map((r, i) => {
            const hasDetail = Boolean(r.description || (r.tracks && r.tracks.length > 0) || r.externalUrl);
            const open = openId === r.id;
            return (
              <Reveal key={r.id} delay={(i % 4) * 60}>
                <div className="border-b border-[var(--line)]">
                  <button
                    onClick={() => hasDetail && setOpenId(open ? null : r.id)}
                    aria-expanded={hasDetail ? open : undefined}
                    className="group w-full flex items-center gap-4 sm:gap-6 py-4 sm:py-5 hover:bg-[var(--bg-raised)] transition-colors px-2 -mx-2 text-left disabled:cursor-default"
                  >
                    <div
                      className="shrink-0 w-14 h-14 sm:w-20 sm:h-20 border border-[var(--line)] bg-cover bg-center"
                      style={
                        r.logoUrl
                          ? { backgroundImage: `url(${r.logoUrl})` }
                          : { background: `linear-gradient(155deg, ${r.from}, ${r.to})` }
                      }
                    />
                    <div className="min-w-0 flex-1">
                      <h3 className="font-display text-xl sm:text-3xl leading-tight truncate group-hover:text-[var(--accent)] transition-colors">
                        {r.title}
                      </h3>
                      <p className="font-mono text-[11px] sm:text-xs uppercase tracking-[0.12em] text-[var(--ink-dim)] mt-1">
                        {r.artist}
                      </p>
                    </div>
                    <div className="hidden sm:block font-mono text-xs uppercase tracking-[0.12em] text-[var(--ink-dim)] shrink-0">
                      {r.type}
                    </div>
                    <div className="font-mono text-xs uppercase tracking-[0.12em] text-[var(--ink-dim)] shrink-0">
                      {r.date}
                    </div>
                    <span
                      className={`shrink-0 text-[var(--ink-dim)] group-hover:text-[var(--accent)] transition-transform ${
                        hasDetail && open ? "rotate-180" : ""
                      } ${hasDetail ? "" : "group-hover:translate-x-1 transition-all"}`}
                    >
                      {hasDetail ? "⌄" : "→"}
                    </span>
                  </button>

                  {hasDetail && open && (
                    <div className="px-2 -mx-2 pb-6 pl-[4.5rem] sm:pl-[6.5rem]">
                      {r.description && (
                        <p className="font-mono text-xs sm:text-sm text-[var(--ink)]/80 leading-relaxed mb-3 max-w-2xl">
                          {r.description}
                        </p>
                      )}
                      {r.externalUrl && (
                        <a
                          href={r.externalUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-block font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--accent)] mb-2"
                        >
                          Listen ↗
                        </a>
                      )}
                      {r.tracks && r.tracks.length > 0 && (
                        <div className="divide-y divide-[var(--line)] max-w-md">
                          {r.tracks.map((t) => (
                            <TrackRow key={t.id} track={t} />
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
