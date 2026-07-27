"use client";

import { useState } from "react";
import { artists as fallbackArtists, type Artist } from "@/lib/content";
import Reveal from "./Reveal";
import ArtistModal from "./ArtistModal";

export default function ArtistsSection({ initialRoster }: { initialRoster?: Artist[] }) {
  const [roster] = useState<Artist[]>(initialRoster ?? fallbackArtists);
  const [selected, setSelected] = useState<Artist | null>(null);

  return (
    <section id="artists" className="relative bg-[var(--bg-raised)] px-5 sm:px-8 py-14 sm:py-20 border-y border-[var(--line)]">
      <div className="max-w-[1600px] mx-auto">
        <Reveal>
          <div className="flex flex-wrap gap-x-8 gap-y-5 sm:gap-x-12 sm:gap-y-7">
            {roster.map((a) => (
              <button
                key={a.id}
                onClick={() => setSelected(a)}
                className="group relative inline-block leading-none"
              >
                <span className="font-body font-light uppercase tracking-tight text-2xl sm:text-4xl lg:text-[2.75rem] text-[var(--ink)] group-hover:text-[var(--accent)] transition-colors">
                  {a.name}
                </span>
                {a.role && (
                  <span className="absolute -top-2.5 -right-3 sm:-top-3 sm:-right-4 font-mono text-[8px] sm:text-[9px] uppercase tracking-[0.04em] text-[var(--ink-dim)]">
                    {a.role}
                  </span>
                )}
              </button>
            ))}
          </div>
        </Reveal>
      </div>

      {selected && <ArtistModal artist={selected} onClose={() => setSelected(null)} />}
    </section>
  );
}
