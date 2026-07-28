import Image from "next/image";
import { sponsors } from "@/lib/content";

// Static (non-scrolling) sponsor wall. Logos are black-background
// JPGs; mix-blend-mode: screen drops the black so only the glow
// shows — but blend modes only see backdrops within the same
// stacking context, and a moving `transform` (like a marquee
// animation) creates a new one that isolates children from the
// section's own background. So this strip is intentionally static:
// that's what actually makes the black boxes disappear, not just a
// style preference.
export default function ProductsMarquee() {
  // Repeat enough that the row wraps into a full, dense wall of
  // logos rather than a couple of icons floating in empty space.
  const wall = [...sponsors, ...sponsors, ...sponsors, ...sponsors, ...sponsors, ...sponsors, ...sponsors, ...sponsors];

  return (
    <section
      aria-label="Sponsors"
      className="relative bg-[var(--accent)] border-y border-[#12100c]/20 overflow-hidden py-10 sm:py-16"
    >
      <div className="absolute inset-0 grain opacity-20 pointer-events-none" />

      <div className="relative max-w-[1600px] mx-auto flex flex-wrap items-center justify-center gap-x-10 sm:gap-x-16 gap-y-8 sm:gap-y-10 px-5 sm:px-8">
        {wall.map((s, i) => (
          <Image
            key={`${s.id}-${i}`}
            src={s.src}
            alt={s.name}
            width={s.width}
            height={s.height}
            className="h-20 sm:h-32 lg:h-40 w-auto object-contain mix-blend-screen"
            loading="lazy"
          />
        ))}
      </div>
    </section>
  );
}
