"use client";

import { useEffect } from "react";
import type { Poster } from "@/lib/content";
import { PAYSERA_URL } from "@/lib/tickets";

export default function EventModal({
  ev,
  past = false,
  onClose,
}: {
  ev: Poster;
  past?: boolean;
  onClose: () => void;
}) {
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

  const timeLine = ev.startTime ? (ev.endTime ? `${ev.startTime}–${ev.endTime}` : `From ${ev.startTime}`) : null;
  const paragraphs = (ev.description ?? "").split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);

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
        className="w-full max-w-[900px] max-h-[88vh] overflow-y-auto bg-[var(--bg)] border border-[var(--line-strong)] flex flex-col sm:flex-row"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className={`relative w-full sm:w-[320px] shrink-0 aspect-[4/3] sm:aspect-auto ${past ? "grayscale opacity-70" : ""}`}
          style={
            ev.imageUrl
              ? { backgroundImage: `url(${ev.imageUrl})`, backgroundSize: "cover", backgroundPosition: "center" }
              : { background: `linear-gradient(155deg, ${ev.from}, ${ev.to})` }
          }
        >
          <div className="absolute inset-0 grain opacity-50" />
        </div>

        <div className="p-6 sm:p-8 flex-1 min-w-0">
          <p className="font-mono text-[11px] sm:text-xs uppercase tracking-[0.16em] text-[var(--accent)] mb-3">
            {past ? "Past · " : ""}
            {ev.date}
            {timeLine ? ` · ${timeLine}` : ""}
          </p>

          <h2 className="font-display text-3xl sm:text-4xl leading-[0.95] text-[var(--ink)] mb-2">
            {ev.headline}
          </h2>

          {ev.sub && <p className="text-sm sm:text-base text-[var(--ink)]/80 mb-3">{ev.sub}</p>}

          <p className="font-mono text-xs uppercase tracking-[0.14em] text-[var(--ink-dim)] mb-4">
            {ev.venueLine}
          </p>

          {ev.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-5">
              {ev.tags.map((t) => (
                <span
                  key={t}
                  className="font-mono text-[10px] uppercase tracking-[0.1em] border border-[var(--ink)]/30 text-[var(--ink)]/70 px-1.5 py-0.5"
                >
                  {t}
                </span>
              ))}
            </div>
          )}

          {paragraphs.length > 0 && (
            <div className="space-y-3 mb-6 pt-4 border-t border-[var(--line)]">
              {paragraphs.map((p, i) => (
                <p key={i} className="font-body text-sm leading-relaxed text-[var(--ink-dim)] whitespace-pre-line">
                  {p}
                </p>
              ))}
            </div>
          )}

          {!past && (
            <a
              href={ev.ticketUrl || PAYSERA_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex w-fit items-center gap-2 border border-[var(--accent)] text-[var(--accent)] font-mono text-xs tracking-[0.18em] uppercase px-5 py-3 hover:bg-[var(--accent)] hover:text-[#12100c] transition-colors"
            >
              Get tickets →
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
