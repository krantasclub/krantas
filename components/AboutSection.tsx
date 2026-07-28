import Image from "next/image";
import type { AboutContent, Stat } from "@/lib/content";
import Reveal from "./Reveal";
import StatsStrip from "./StatsStrip";

export default function AboutSection({ content, stats }: { content: AboutContent; stats: Stat[] }) {
  const paragraphs = content.body
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <>
      <section className="relative bg-[var(--bg)] px-5 sm:px-8 py-20 sm:py-28 border-b border-[var(--line)] overflow-hidden">
        <div
          className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-center select-none pointer-events-none"
          aria-hidden="true"
        >
          <span className="font-display text-[26vw] leading-none text-[var(--ink)]/[0.035] whitespace-nowrap">
            KRANTAS
          </span>
        </div>

        <div className="relative max-w-3xl mx-auto text-center">
          <Reveal>
            <p className="eyebrow mb-6">{content.eyebrow}</p>
          </Reveal>
          <Reveal delay={80}>
            <h1 className="font-display text-4xl sm:text-6xl lg:text-7xl leading-[1.02] text-balance">
              {content.heading}
            </h1>
          </Reveal>
          <Reveal delay={160}>
            <p className="mt-6 font-mono text-xs sm:text-sm uppercase tracking-[0.16em] text-[var(--accent)]">
              {content.subheading}
            </p>
          </Reveal>
        </div>
      </section>

      <section className="relative bg-[var(--bg)] px-5 sm:px-8 py-16 sm:py-24">
        <div className="max-w-[1600px] mx-auto grid gap-12 sm:gap-16 md:grid-cols-[1.1fr_0.9fr] items-start">
          <Reveal>
            <div className="max-w-2xl space-y-6 font-sans text-base sm:text-lg leading-relaxed text-[var(--ink)]/85">
              {paragraphs.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          </Reveal>

          {content.imageUrl && (
            <Reveal delay={120}>
              <div className="relative aspect-[4/5] w-full max-w-md mx-auto overflow-hidden border border-[var(--line)] shadow-[0_14px_34px_rgba(0,0,0,0.5)]">
                <Image
                  src={content.imageUrl}
                  alt={content.heading}
                  fill
                  sizes="(max-width: 768px) 90vw, 448px"
                  className="object-cover"
                  loading="lazy"
                />
              </div>
            </Reveal>
          )}
        </div>
      </section>

      <StatsStrip stats={stats} />
    </>
  );
}
