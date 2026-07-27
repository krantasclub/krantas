"use client";

import { useEffect } from "react";
import type { Reel } from "@/lib/content";
import FacebookEmbed from "./FacebookEmbed";

// Uploaded clips and direct-file "url" reels are media we host ourselves,
// so they always play. Facebook reels play via Facebook's own fb-video
// widget (FacebookEmbed) — Facebook's actual supported embed method, and
// the most reliable option available, but Facebook can still refuse to
// embed a given post with no way for us to detect that from outside, so
// an "Open on Facebook" link stays visible as a fallback rather than
// silently failing. Any other link-out source (Instagram, TikTok, etc)
// never reaches this component — those still open on their own platform,
// since there's no equivalent supported embed for them here.
export default function ReelLightbox({ reel, onClose }: { reel: Reel; onClose: () => void }) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  const isFacebook = reel.source === "facebook";

  return (
    <div
      className="fixed inset-0 z-[80] bg-black/92 backdrop-blur-sm flex items-center justify-center p-4 sm:p-8"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        aria-label="Close"
        className="absolute top-4 right-4 sm:top-6 sm:right-6 w-10 h-10 rounded-full border border-[var(--ink)]/40 flex items-center justify-center text-[var(--ink)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors z-10"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M5 5l14 14M19 5 5 19" />
        </svg>
      </button>

      <div
        className="relative w-full max-w-[420px] aspect-[9/16] bg-black border border-[var(--line-strong)]"
        onClick={(e) => e.stopPropagation()}
      >
        {isFacebook ? (
          <>
            <FacebookEmbed url={reel.url} />
            <a
              href={reel.url}
              target="_blank"
              rel="noopener noreferrer"
              className="absolute left-3 right-3 bottom-3 flex items-center justify-center gap-2 border border-[var(--ink)]/30 bg-black/60 backdrop-blur-sm px-3 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--ink)]/85 hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors"
            >
              Open on Facebook ↗
            </a>
          </>
        ) : (
          <video
            className="absolute inset-0 w-full h-full object-contain"
            src={reel.url}
            poster={reel.thumbnailUrl}
            controls
            autoPlay
            playsInline
            loop
          />
        )}
      </div>
    </div>
  );
}
