"use client";

import { useState } from "react";
import { isDirectReelUrl, type Reel } from "@/lib/content";
import Reveal from "./Reveal";
import ReelLightbox from "./ReelLightbox";

function CardFace({ reel }: { reel: Reel }) {
  return (
    <>
      <div className="absolute inset-0 grain opacity-40" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/5 to-black/20" />
      {reel.thumbnailUrl && (
        <img src={reel.thumbnailUrl} alt="" className="absolute inset-0 w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" loading="lazy" />
      )}

      <span className="absolute inset-0 flex items-center justify-center">
        <span className="w-11 h-11 sm:w-12 sm:h-12 rounded-full border border-[var(--ink)]/60 bg-black/30 backdrop-blur-sm flex items-center justify-center group-hover:bg-[var(--accent)] group-hover:border-[var(--accent)] transition-colors">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" className="text-[var(--ink)] group-hover:text-[#12100c] translate-x-[1px]">
            <path d="M8 5v14l11-7z" />
          </svg>
        </span>
      </span>

      <div className="absolute left-3 right-3 bottom-3 flex items-center justify-between gap-2">
        <span className="font-mono text-[10px] sm:text-[11px] uppercase tracking-[0.1em] text-[var(--ink)]/85">
          {reel.label}
        </span>
      </div>
    </>
  );
}

function ReelCard({ reel, index, onPlay }: { reel: Reel; index: number; onPlay: () => void }) {
  const playsHere = reel.source === "upload" || reel.source === "facebook" || (reel.source === "url" && isDirectReelUrl(reel.url));
  const style = { background: `linear-gradient(155deg, ${reel.from}, ${reel.to})` };

  return (
    <Reveal delay={(index % 4) * 70} className="w-[168px] sm:w-[220px]">
      {playsHere ? (
        <button
          type="button"
          onClick={onPlay}
          aria-label={`Play ${reel.label}`}
          className="group relative block w-full aspect-[3/4] overflow-hidden border border-[var(--line)] hover:border-[var(--accent)] transition-colors"
          style={style}
        >
          <CardFace reel={reel} />
        </button>
      ) : (
        <a
          href={reel.url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Watch ${reel.label}`}
          className="group relative block w-full aspect-[3/4] overflow-hidden border border-[var(--line)] hover:border-[var(--accent)] transition-colors"
          style={style}
        >
          <CardFace reel={reel} />
        </a>
      )}
    </Reveal>
  );
}

// A small, fixed set of reels — centered on the section rather than run
// through a horizontal scroller, with generous gaps between cards and a
// loose higher/lower zigzag (desktop only, so it doesn't cause overlap
// when the row wraps to two-per-line on narrow screens). Not currently
// mounted on any page — Reels live behind the sticky ReelsTab instead —
// but kept in sync with the same data shape and routing (uploads, direct
// files, and Facebook reels all play in the on-site lightbox; any other
// link-out source opens on its own platform) in case a homepage slot is
// wanted again later.
export default function ReelsSection({ initialReels }: { initialReels?: Reel[] }) {
  const reels = initialReels ?? [];
  const [playing, setPlaying] = useState<Reel | null>(null);

  if (reels.length === 0) return null;

  return (
    <section id="reels" className="relative bg-[var(--bg-raised)] px-5 sm:px-8 py-16 sm:py-24 border-y border-[var(--line)]">
      <div className="max-w-[1600px] mx-auto flex flex-wrap items-center justify-center gap-x-10 gap-y-16 sm:gap-x-20 sm:gap-y-24">
        {reels.map((r, i) => (
          <div
            key={r.id}
            className={i % 2 === 0 ? "sm:-translate-y-7" : "sm:translate-y-7"}
          >
            <ReelCard reel={r} index={i} onPlay={() => setPlaying(r)} />
          </div>
        ))}
      </div>

      {playing && <ReelLightbox reel={playing} onClose={() => setPlaying(null)} />}
    </section>
  );
}
