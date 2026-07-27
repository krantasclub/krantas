import { stats as fallbackStats, type Stat } from "@/lib/content";
import Reveal from "./Reveal";

// Deliberately small — a single-line beat between two visual-heavy
// sections (Gallery, Reels), not a full section with its own
// eyebrow/heading. Sits on --bg-deep so it reads as a pause rather
// than another block of content competing with what's above/below it.
export default function StatsStrip({ stats = fallbackStats }: { stats?: Stat[] }) {
  return (
    <section className="relative bg-[var(--bg-deep)] px-5 sm:px-8 py-8 sm:py-10 border-y border-[var(--line)]">
      <Reveal>
        <div className="max-w-[1600px] mx-auto grid grid-cols-2 sm:grid-cols-4 gap-y-6 gap-x-4 sm:gap-x-8">
          {stats.map((s, i) => (
            <div
              key={s.id}
              className={`flex flex-col items-center text-center ${
                i >= 2 ? "pt-6 border-t border-[var(--line)] sm:pt-0 sm:border-t-0" : ""
              } ${i % 4 !== 0 ? "sm:border-l sm:border-[var(--line)]" : ""}`}
            >
              <span className="font-display text-3xl sm:text-4xl lg:text-5xl text-[var(--accent)] leading-none">
                {s.value}
              </span>
              <span className="mt-2 font-mono text-[10px] sm:text-[11px] uppercase tracking-[0.14em] text-[var(--ink-dim)]">
                {s.label}
              </span>
            </div>
          ))}
        </div>
      </Reveal>
    </section>
  );
}
