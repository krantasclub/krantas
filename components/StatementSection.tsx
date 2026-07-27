"use client";

import { useEffect, useRef, useState } from "react";

// A deliberately text-only beat between the two card carousels (Sets
// and Gallery). Its job is pacing, not content density — a place for
// the eye (and the scroll) to rest. The background drifts at a
// different rate than the page scroll (classic parallax), which is
// the same trick Hero already uses via useScrollY, just subtler here.
//
// The text itself is tied directly to scroll position (not a
// one-shot IntersectionObserver reveal) so it visibly slides down
// from above as the section scrolls into view, and slides back up
// out of sight if the user scrolls back up past it — recomputed from
// scrollY on every render, so there's no "already played" state to
// get stuck in.
const ENTRY_VH = 95; // reveal starts once the section's top has scrolled to this far down the viewport (just entering)
const EXIT_VH = 30; // reveal finishes once the section's top reaches this far down the viewport (comfortably in view)
const LINE_STAGGER_PX = 60; // how far apart (in scroll px) each line's reveal starts
const SLIDE_DISTANCE_PX = 140; // how far each line travels — big enough to read as emerging from above

export default function StatementSection() {
  const ref = useRef<HTMLElement | null>(null);
  const [rectTop, setRectTop] = useState<number | null>(null);

  useEffect(() => {
    let raf = 0;
    let ticking = false;

    function measure() {
      if (ref.current) setRectTop(ref.current.getBoundingClientRect().top);
      ticking = false;
    }
    function onScrollOrResize() {
      if (ticking) return;
      ticking = true;
      raf = requestAnimationFrame(measure);
    }

    onScrollOrResize();
    window.addEventListener("scroll", onScrollOrResize, { passive: true });
    window.addEventListener("resize", onScrollOrResize);
    return () => {
      window.removeEventListener("scroll", onScrollOrResize);
      window.removeEventListener("resize", onScrollOrResize);
      cancelAnimationFrame(raf);
    };
  }, []);

  const viewportH = typeof window !== "undefined" ? window.innerHeight : 800;

  // getBoundingClientRect is always relative to the current viewport,
  // so this is exact regardless of ancestor positioning/layout —
  // unlike offsetTop, which depends on the nearest positioned
  // ancestor and can be off if that changes upstream. Defaults to
  // "fully below the viewport" until the first measurement lands, so
  // nothing flashes fully-revealed before JS has run.
  const top = rectTop ?? viewportH;

  const entryPoint = (viewportH * ENTRY_VH) / 100;
  const exitPoint = (viewportH * EXIT_VH) / 100;
  const revealSpan = Math.max(1, entryPoint - exitPoint);

  // Only start moving once the section is roughly in view, so the
  // parallax offset doesn't jump around from a huge scrollY at page load.
  const localScroll = Math.max(0, entryPoint - top);
  const driftSlow = localScroll * 0.06;
  const driftFast = localScroll * 0.12;

  function lineStyle(index: number) {
    const raw = (entryPoint - top - index * LINE_STAGGER_PX) / revealSpan;
    const p = Math.min(1, Math.max(0, raw));
    const eased = 1 - Math.pow(1 - p, 2);
    return {
      opacity: eased,
      transform: `translateY(${(1 - eased) * -SLIDE_DISTANCE_PX}px)`,
      transition:
        "transform 0.5s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.5s ease-out",
    };
  }

  return (
    <section
      ref={ref}
      id="statement"
      className="relative bg-[var(--bg-raised)] px-5 sm:px-8 py-24 sm:py-36 overflow-hidden border-y border-[var(--line)]"
    >
      {/* Parallax backdrop: two soft beams + a faint oversized word,
          all drifting slower than scroll for depth. */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div
          className="absolute -left-[10%] top-0 w-[55%] h-full opacity-[0.16]"
          style={{
            transform: `translateY(${driftSlow}px)`,
            background:
              "radial-gradient(closest-side, var(--marine-light), transparent 70%)",
            filter: "blur(40px)",
          }}
        />
        <div
          className="absolute -right-[8%] bottom-0 w-[45%] h-[70%] opacity-[0.14]"
          style={{
            transform: `translateY(${-driftFast}px)`,
            background:
              "radial-gradient(closest-side, var(--accent), transparent 70%)",
            filter: "blur(48px)",
          }}
        />
        <div
          className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-center select-none"
          style={{
            transform: `translate(0, calc(-50% + ${driftSlow * 0.5}px))`,
          }}
        >
          <span className="font-display text-[26vw] leading-none text-[var(--ink)]/[0.035] whitespace-nowrap">
            KRANTAS
          </span>
        </div>
      </div>

      <div className="relative max-w-3xl mx-auto text-center">
        <p className="eyebrow mb-6" style={lineStyle(0)}>
          Build by the water. Driven by the sound.
        </p>
        <p
          className="font-display text-3xl sm:text-5xl lg:text-6xl leading-[1.05] text-balance"
          style={lineStyle(1)}
        >
          Powerful sound, industrial surroundings, and people who come for the
          music
        </p>
        <p
          className="mt-8 sm:mt-10 max-w-xl mx-auto text-sm sm:text-base text-[var(--ink)]/70"
          style={lineStyle(2)}
        >
          Rather than chasin trends, we invest in resident artists, immersive
          sound, and nights that evolve naturally - from the first record to the
          final track.
        </p>
      </div>
    </section>
  );
}
