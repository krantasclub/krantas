"use client";

import { useState } from "react";
import { artists as fallbackArtists, type Artist } from "@/lib/content";
import Reveal from "./Reveal";
import { useLanguage } from "./LanguageProvider";
import SectionHeading from "./SectionHeading";
import ArtistModal from "./ArtistModal";

function ArtistCard({ a, index, onOpen }: { a: Artist; index: number; onOpen: (a: Artist) => void }) {
  return (
    <Reveal delay={(index % 4) * 70}>
      <button onClick={() => onOpen(a)} className="group block w-full text-left">
        <div
          className="relative aspect-[4/5] overflow-hidden border border-[var(--line)] group-hover:border-[var(--accent)] transition-colors"
          style={
            a.imageUrl
              ? { backgroundImage: `url(${a.imageUrl})`, backgroundSize: "cover", backgroundPosition: "center" }
              : { background: `linear-gradient(155deg, ${a.from}, ${a.to})` }
          }
        >
          <div className="absolute inset-0 grain opacity-50" />
          {a.imageUrl && (
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />
          )}

          {a.role && (
            <span className="absolute top-3 left-3 font-mono text-[9px] uppercase tracking-[0.14em] text-[var(--ink)]/80 border border-[var(--ink)]/40 px-2 py-1">
              {a.role}
            </span>
          )}

          <div className="absolute inset-x-0 bottom-0 p-3 sm:p-4">
            <h3 className="font-body font-light uppercase tracking-tight text-2xl sm:text-3xl leading-[0.95] text-[var(--ink)] group-hover:text-[var(--accent)] transition-colors">
              {a.name}
            </h3>
          </div>
        </div>

        {a.bio && (
          <p className="mt-3 font-body text-sm leading-relaxed text-[var(--ink-dim)] line-clamp-3">
            {a.bio}
          </p>
        )}
      </button>
    </Reveal>
  );
}

// Photo-card roster used only on the dedicated /artists page. The
// homepage keeps the compact text line-up (ArtistsSection.tsx).
export default function ArtistsGrid({ initialRoster }: { initialRoster?: Artist[] }) {
  const { t } = useLanguage();
  const [roster] = useState<Artist[]>(initialRoster ?? fallbackArtists);
  const [selected, setSelected] = useState<Artist | null>(null);

  return (
    <section id="artists" className="relative bg-[var(--bg)] px-5 sm:px-8 py-14 sm:py-20">
      <div className="max-w-[1600px] mx-auto">
        <SectionHeading eyebrow={t("sections.artistsEyebrow")} title={t("sections.artistsTitle")} note={t("sections.artistsNote")} />

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5 sm:gap-8">
          {roster.map((a, i) => (
            <ArtistCard key={a.id} a={a} index={i} onOpen={setSelected} />
          ))}
        </div>
      </div>

      {selected && <ArtistModal artist={selected} onClose={() => setSelected(null)} />}
    </section>
  );
}
