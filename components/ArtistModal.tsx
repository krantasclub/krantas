"use client";

import { useEffect } from "react";
import type { Artist } from "@/lib/content";

function normalizeInstagram(v: string) {
  if (/^https?:\/\//i.test(v)) return v;
  return `https://instagram.com/${v.replace(/^@/, "")}`;
}
function normalizeSoundcloud(v: string) {
  if (/^https?:\/\//i.test(v)) return v;
  return `https://soundcloud.com/${v.replace(/^@/, "")}`;
}
function normalizeFacebook(v: string) {
  if (/^https?:\/\//i.test(v)) return v;
  return `https://facebook.com/${v}`;
}
function normalizeWebsite(v: string) {
  if (/^https?:\/\//i.test(v)) return v;
  return `https://${v}`;
}

const LINK_CLS =
  "inline-flex items-center gap-2 border border-[var(--ink)]/30 px-3.5 py-2 font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--ink)]/85 hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors";

export default function ArtistModal({ artist, onClose }: { artist: Artist; onClose: () => void }) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const bioText = artist.bioLong || artist.bio;
  const hasLinks =
    artist.instagram || artist.soundcloud || artist.facebook || artist.website || artist.contactEmail;

  return (
    <div
      className="fixed inset-0 z-[70] bg-black/92 backdrop-blur-sm flex items-center justify-center p-4 sm:p-8"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        aria-label="Close"
        className="absolute top-4 right-4 sm:top-6 sm:right-6 w-10 h-10 rounded-full border border-[var(--ink)]/40 flex items-center justify-center text-[var(--ink)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M5 5l14 14M19 5 5 19" />
        </svg>
      </button>

      <div
        className="w-full max-w-[820px] max-h-[88vh] overflow-y-auto bg-[var(--bg)] border border-[var(--line-strong)] flex flex-col sm:flex-row"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="relative w-full sm:w-[280px] shrink-0 aspect-[4/5] sm:aspect-auto"
          style={
            artist.imageUrl
              ? { backgroundImage: `url(${artist.imageUrl})`, backgroundSize: "cover", backgroundPosition: "center" }
              : { background: `linear-gradient(155deg, ${artist.from}, ${artist.to})` }
          }
        >
          <div className="absolute inset-0 grain opacity-50" />
        </div>

        <div className="p-6 sm:p-8 flex-1">
          {artist.role && (
            <span className="inline-block font-mono text-[9px] uppercase tracking-[0.14em] text-[var(--ink)]/80 border border-[var(--ink)]/40 px-2 py-1 mb-3">
              {artist.role}
            </span>
          )}
          <h2 className="font-body font-light uppercase tracking-tight text-4xl sm:text-5xl leading-[0.95] text-[var(--ink)] mb-4">
            {artist.name}
          </h2>

          {bioText && (
            <p className="font-body text-sm sm:text-base leading-relaxed text-[var(--ink-dim)] mb-6">
              {bioText}
            </p>
          )}

          {hasLinks && (
            <div className="flex flex-wrap gap-2.5 pt-4 border-t border-[var(--line)]">
              {artist.instagram && (
                <a href={normalizeInstagram(artist.instagram)} target="_blank" rel="noopener noreferrer" className={LINK_CLS}>
                  Instagram
                </a>
              )}
              {artist.soundcloud && (
                <a href={normalizeSoundcloud(artist.soundcloud)} target="_blank" rel="noopener noreferrer" className={LINK_CLS}>
                  SoundCloud
                </a>
              )}
              {artist.facebook && (
                <a href={normalizeFacebook(artist.facebook)} target="_blank" rel="noopener noreferrer" className={LINK_CLS}>
                  Facebook
                </a>
              )}
              {artist.website && (
                <a href={normalizeWebsite(artist.website)} target="_blank" rel="noopener noreferrer" className={LINK_CLS}>
                  Website
                </a>
              )}
              {artist.contactEmail && (
                <a href={`mailto:${artist.contactEmail}`} className={LINK_CLS}>
                  Contact
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
