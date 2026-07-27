"use client";

import { useRef } from "react";
import { useScrollY } from "@/hooks/useScrollY";
import { sponsors } from "@/lib/content";

// A set-piece beat between Gallery and Location: instead of another
// text block, this is a panel that grows taller in normal document
// flow as it scrolls into view — no `position: sticky`, no reserved
// full-viewport block sitting there dark before anything happens.
// It starts at 0 height right where Gallery ends, and only starts
// growing once its top edge actually crosses into the viewport from
// the bottom — so the reveal is tied to something the user can see
// happening, not a pinned scroll-jack.
// The panel's final height needs to comfortably fit the logo wall at
// every breakpoint, including the two-row wrap that happens on narrow
// phones. Sized generously enough on mobile that nothing gets clipped
// by the section's `overflow-hidden`.
const TARGET_HEIGHT_VH = 42; // desktop/tablet — one row, fits easily
const TARGET_HEIGHT_VH_MOBILE = 70; // phones — logos wrap to a few rows
const GROW_DISTANCE_VH = 45; // how much scrolling the grow animation takes

// Logo source files are tightly cropped to their mark with a
// transparent background, but their proportions vary wildly — some
// are near-square emblems (Jägermeister, Red Bull), others are very
// wide, thin wordmarks (Pioneer, Ableton, Traktor). Capping *only*
// height (the old approach) makes those wordmarks look small next to
// the emblems, because their actual ink/stroke weight is much
// thinner even at the same cap-height. Capping both height AND width
// lets the wordmarks grow to use the extra horizontal room they have
// — which is what actually brings them up to a comparable visual
// size — while the height cap still keeps the squarer marks in
// check. The headline partner (HOR) sits alone above the rest, and
// Red Bull is pulled out to sit at the far right on desktop (mobile
// keeps it inline with the wrapped group, since there's no "right
// edge" worth pinning to on a narrow screen).
function LogoWall() {
  const primary = sponsors.find((s) => s.primary);
  const redbull = sponsors.find((s) => s.id === "redbull");
  const rest = [...sponsors.filter((s) => !s.primary && s.id !== "redbull")].sort(
    (a, b) => Number(!!a.wide) - Number(!!b.wide)
  );
  const logoClass =
    "max-h-9 sm:max-h-14 lg:max-h-16 max-w-[110px] sm:max-w-[170px] lg:max-w-[190px] w-auto h-auto object-contain";

  return (
    <div className="relative flex flex-col items-center gap-6 sm:gap-8 px-6 sm:px-10 w-full max-w-6xl mx-auto">
      {primary && (
        <img
          src={primary.src}
          alt={primary.name}
          className="max-h-10 sm:max-h-16 lg:max-h-20 max-w-[140px] sm:max-w-[220px] lg:max-w-[260px] w-auto h-auto object-contain"
        />
      )}
      <div className="flex flex-wrap lg:flex-nowrap items-center justify-center gap-x-6 gap-y-6 sm:gap-x-10 sm:gap-y-8 lg:gap-x-8 w-full">
        {rest.map((s) => (
          <img key={s.id} src={s.src} alt={s.name} className={logoClass} />
        ))}
        {redbull && (
          <img src={redbull.src} alt={redbull.name} className={logoClass} />
        )}
      </div>
    </div>
  );
}

export default function PartnersRevealSection() {
  const ref = useRef<HTMLElement | null>(null);
  const scrollY = useScrollY();

  const el = ref.current;
  const sectionTop = el ? el.offsetTop : 0;
  const viewportH = typeof window !== "undefined" ? window.innerHeight : 800;
  const isMobile = typeof window !== "undefined" ? window.innerWidth < 640 : false;
  const targetHeightVh = isMobile ? TARGET_HEIGHT_VH_MOBILE : TARGET_HEIGHT_VH;

  // progress 0 the instant the section's top edge is at the bottom
  // of the viewport (first pixel visible), progress 1 once the user
  // has scrolled GROW_DISTANCE_VH worth of viewport height past that.
  // Kept short enough that growth finishes while the panel is still
  // well within view, instead of only reaching full size once the
  // user has already scrolled it out of sight.
  const startScrollY = sectionTop - viewportH;
  const growSpan = (viewportH * GROW_DISTANCE_VH) / 100;
  const raw = (scrollY - startScrollY) / Math.max(1, growSpan);
  const progress = Math.min(1, Math.max(0, raw));

  // Eased so growth front-loads (feels like it's being pulled up)
  // and settles gently rather than a linear crawl.
  const eased = 1 - Math.pow(1 - progress, 2);

  const panelHeightVh = eased * targetHeightVh;
  const radius = 40 - eased * 40; // 40px rounded bottom edge → 0 once fully grown
  const logoOpacity = 0.15 + eased * 0.85;

  return (
    <section
      ref={ref}
      id="partners"
      aria-label="Partners"
      className="relative bg-[var(--bg)] overflow-hidden"
      style={{
        height: `${panelHeightVh}vh`,
        borderBottomLeftRadius: `${radius}px`,
        borderBottomRightRadius: `${radius}px`,
      }}
    >
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 90% at 50% 30%, var(--bg-raised), var(--bg-deep) 75%)",
        }}
      >
        <div className="absolute inset-0 grain opacity-30" aria-hidden="true" />
        <div
          className="absolute -left-[10%] -top-[15%] w-[60%] h-[70%]"
          style={{
            background:
              "radial-gradient(closest-side, var(--marine-light), transparent 65%)",
            opacity: 0.12,
            filter: "blur(10px)",
          }}
          aria-hidden="true"
        />
        <div
          className="absolute -right-[12%] -bottom-[10%] w-[55%] h-[60%]"
          style={{
            background:
              "radial-gradient(closest-side, var(--accent), transparent 65%)",
            opacity: 0.1,
            filter: "blur(10px)",
          }}
          aria-hidden="true"
        />

        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ opacity: logoOpacity }}
        >
          <LogoWall />
        </div>
      </div>
    </section>
  );
}
