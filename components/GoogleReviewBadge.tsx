"use client";

import { GOOGLE_RATING, GOOGLE_WRITE_REVIEW_URL } from "@/lib/reviews";

const STAR_PATH = "M12 2.5l2.95 6.6 7.2.66-5.44 4.83 1.63 7.08L12 17.9l-6.34 3.77 1.63-7.08L1.85 9.76l7.2-.66L12 2.5z";

// Row of 5 stars supporting partial fills (4.5 -> 4 full + 1 half). Each
// star is drawn twice: a dim outline underneath, and a clipped, solid
// copy on top whose width is set by that star's leftover fraction.
function StarRow({ rating, size = 12 }: { rating: number; size?: number }) {
  return (
    <div className="flex items-center gap-[1px] text-yellow-400">
      {Array.from({ length: 5 }).map((_, i) => {
        const fraction = Math.max(0, Math.min(1, rating - i));
        return (
          <div key={i} className="relative shrink-0" style={{ width: size, height: size }}>
            <svg
              width={size}
              height={size}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="absolute inset-0 opacity-40"
              aria-hidden="true"
            >
              <path d={STAR_PATH} />
            </svg>
            {fraction > 0 && (
              <div className="absolute inset-0 overflow-hidden" style={{ width: `${fraction * 100}%` }}>
                <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d={STAR_PATH} />
                </svg>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// Bare, background-free "stars · rating" link straight out to Google's
// write-review dialog (GOOGLE_WRITE_REVIEW_URL) — one click, no in-page
// modal, no box or logo around it. Meant to be dropped inline next to
// other copy (the Hero tagline row, the mobile nav panel) rather than
// floated as its own fixed element, so it takes a className for
// positioning/color and inherits text color via currentColor on the stars.
export default function GoogleReviewBadge({
  className = "",
  label = "Review",
  labelMode = "responsive",
}: {
  className?: string;
  label?: string;
  /** "responsive": hidden on mobile, shown from sm: up. "always": always shown. "none": rating number only. */
  labelMode?: "responsive" | "always" | "none";
}) {
  return (
    <a
      href={GOOGLE_WRITE_REVIEW_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-1.5 text-[var(--accent)] hover:text-[var(--ink)] transition-colors ${className}`}
    >
      <StarRow rating={GOOGLE_RATING} />
      <span className="font-mono text-[11px] sm:text-xs tracking-[0.1em]">
        {GOOGLE_RATING.toFixed(1)}
        {labelMode === "always" && ` · ${label}`}
        {labelMode === "responsive" && <span className="hidden sm:inline"> · {label}</span>}
      </span>
    </a>
  );
}
