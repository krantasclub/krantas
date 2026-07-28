"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { isDirectReelUrl, type Reel } from "@/lib/content";
import ReelLightbox from "./ReelLightbox";

// Shared visual chrome for a reel card — the only difference between
// the two variants below is what happens on click/tap.
function CardFace({ reel }: { reel: Reel }) {
  return (
    <>
      <div className="absolute inset-0 grain opacity-40" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/5 to-black/20" />
      {reel.thumbnailUrl && (
        <Image
          src={reel.thumbnailUrl}
          alt=""
          fill
          sizes="(max-width: 640px) 168px, 220px"
          className="object-cover opacity-90 group-hover:opacity-100 transition-opacity"
          loading="lazy"
        />
      )}

      <span className="absolute inset-0 flex items-center justify-center">
        <span className="w-11 h-11 sm:w-12 sm:h-12 rounded-full border border-[var(--ink)]/60 bg-black/30 backdrop-blur-sm flex items-center justify-center group-hover:bg-[var(--accent)] group-hover:border-[var(--accent)] transition-colors">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" className="text-[var(--ink)] group-hover:text-[#12100c] translate-x-[1px]" aria-hidden="true">
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

// Uploads and direct-file "url" reels are media we host ourselves, so
// clicking plays them right here (native <video> in the lightbox).
// Facebook reels also open in the lightbox, played via Facebook's own
// fb-video embed widget — see ReelLightbox/FacebookEmbed. Any other
// link-out source (Instagram, TikTok, etc) opens on its own platform
// instead, since there's no equivalent supported embed for those here.
function ReelCard({ reel, onPlay }: { reel: Reel; onPlay: () => void }) {
  const playsHere = reel.source === "upload" || reel.source === "facebook" || (reel.source === "url" && isDirectReelUrl(reel.url));
  const style = { background: `linear-gradient(155deg, ${reel.from}, ${reel.to})` };

  if (playsHere) {
    return (
      <button
        type="button"
        onClick={onPlay}
        aria-label={`Play ${reel.label}`}
        className="group relative block aspect-[3/4] w-full overflow-hidden border border-[var(--line)] hover:border-[var(--accent)] transition-colors"
        style={style}
      >
        <CardFace reel={reel} />
      </button>
    );
  }

  return (
    <a
      href={reel.url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Watch ${reel.label}`}
      className="group relative block aspect-[3/4] w-full overflow-hidden border border-[var(--line)] hover:border-[var(--accent)] transition-colors"
      style={style}
    >
      <CardFace reel={reel} />
    </a>
  );
}

// A tab fixed to the right edge of the viewport, vertically centered,
// that stays put while scrolling. Clicking it slides a panel in from
// the right holding the reel cards. The card grid inside the panel is
// its own scroll container (overflow-y-auto below the sticky header),
// so any number of reels stays reachable without growing the panel —
// it just scrolls, same idea as a long nav list.
export default function ReelsTab({ initialReels }: { initialReels?: Reel[] }) {
  const reels = initialReels ?? [];
  const [open, setOpen] = useState(false);
  const [playing, setPlaying] = useState<Reel | null>(null);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKeyDown);

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  function close() {
    setOpen(false);
    setPlaying(null);
  }

  return (
    <>
      {/* Trigger — fixed to the viewport, so it tracks scroll on its own. */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open reels"
        aria-expanded={open}
        className={`fixed right-0 top-1/2 -translate-y-1/2 z-40 flex flex-col items-center gap-2 border border-[var(--line)] border-r-0 bg-[var(--bg-raised)] px-2.5 py-4 sm:px-3 sm:py-5 transition-all duration-300 hover:bg-[var(--bg)] hover:border-[var(--accent)] ${
          open ? "translate-x-full opacity-0 pointer-events-none" : "translate-x-0 opacity-100"
        }`}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="text-[var(--accent)]" aria-hidden="true">
          <path d="M8 5v14l11-7z" />
        </svg>
        <span
          className="font-mono text-[10px] sm:text-[11px] uppercase tracking-[0.2em] text-[var(--ink)]/85"
          style={{ writingMode: "vertical-rl" }}
        >
          Reels
        </span>
      </button>

      {/* Backdrop */}
      <div
        onClick={close}
        aria-hidden="true"
        className={`fixed inset-0 z-40 bg-black/70 backdrop-blur-sm transition-opacity duration-300 ${
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      />

      {/* Panel — sticky header stays put; the reel grid below it is the
          part that scrolls, so a long list never overflows the viewport. */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Reels"
        className={`fixed top-0 right-0 z-50 h-full w-full sm:w-[420px] bg-[var(--bg-raised)] border-l border-[var(--line)] flex flex-col transition-transform duration-500 ease-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="sticky top-0 flex items-center justify-between px-5 sm:px-6 py-5 border-b border-[var(--line)] bg-[var(--bg-raised)] shrink-0">
          <span className="eyebrow">Reels</span>
          <button
            type="button"
            onClick={close}
            aria-label="Close reels"
            className="w-9 h-9 flex items-center justify-center border border-[var(--line)] hover:border-[var(--accent)] transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--ink)]" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        {reels.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:gap-4 p-5 sm:p-6 overflow-y-auto flex-1 overscroll-contain">
            {reels.map((r) => (
              <ReelCard key={r.id} reel={r} onPlay={() => setPlaying(r)} />
            ))}
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center px-6 text-center">
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-[var(--ink)]/50">
              Coming soon
            </p>
          </div>
        )}
      </aside>

      {playing && <ReelLightbox reel={playing} onClose={() => setPlaying(null)} />}
    </>
  );
}
