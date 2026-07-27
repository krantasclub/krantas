"use client";

import { useRef } from "react";
import { useScrollY } from "@/hooks/useScrollY";
import Reveal from "./Reveal";

// Second text-only beat, mirroring StatementSection's pacing role but
// placed later in the flow (Gallery → here → Location) so the page
// doesn't run straight from one card grid into another. Same parallax
// treatment, different backdrop shape and copy, so the two don't read
// as duplicates of each other.
export default function AftertasteSection() {
  const ref = useRef<HTMLElement | null>(null);
  const scrollY = useScrollY();

  const el = ref.current;
  const sectionTop = el ? el.offsetTop : 0;
  const localScroll = Math.max(0, scrollY - sectionTop + 600);
  const driftSlow = localScroll * 0.05;
  const driftFast = localScroll * 0.1;

  return (
    <section
      ref={ref}
      id="aftertaste"
      className="relative bg-[var(--bg-raised)] px-5 sm:px-8 py-24 sm:py-36 overflow-hidden border-y border-[var(--line)]"
    >
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div
          className="absolute -right-[12%] top-0 w-[50%] h-full opacity-[0.14]"
          style={{
            transform: `translateY(${driftFast}px)`,
            background:
              "radial-gradient(closest-side, var(--accent-dim), transparent 70%)",
            filter: "blur(44px)",
          }}
        />
        <div
          className="absolute -left-[8%] bottom-0 w-[42%] h-[65%] opacity-[0.15]"
          style={{
            transform: `translateY(${-driftSlow}px)`,
            background:
              "radial-gradient(closest-side, var(--marine-light), transparent 70%)",
            filter: "blur(48px)",
          }}
        />
      </div>

      <div className="relative max-w-3xl mx-auto text-center">
        <Reveal>
          <p className="eyebrow mb-6">You had to be there</p>
        </Reveal>
        <Reveal delay={80}>
          <p className="font-display text-3xl sm:text-5xl lg:text-6xl leading-[1.05] text-balance">
            No livestream, no aftermovie cut for the algorithm —
            just whoever was on the floor and what they remember.
          </p>
        </Reveal>
        <Reveal delay={160}>
          <p className="mt-8 sm:mt-10 max-w-xl mx-auto text-sm sm:text-base text-[var(--ink)]/70">
            Clips still surface here and there — pull the tab on the
            right if you want a look before the next one.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
