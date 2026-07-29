"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useScrollY } from "@/hooks/useScrollY";
import type { RadioEpisode } from "@/lib/content";
import { useLanguage } from "./LanguageProvider";
import LanguageSwitch from "./LanguageSwitch";
import TicketButtons from "./TicketButtons";
import SetsPlayer from "./SetsPlayer";
import GoogleReviewBadge from "./GoogleReviewBadge";

export default function Nav({
  initialEpisodes,
  hideArtists,
}: {
  initialEpisodes?: RadioEpisode[];
  hideArtists?: boolean;
}) {
  const scrollY = useScrollY();
  const pathname = usePathname();
  const { t } = useLanguage();
  const isHome = pathname === "/";
  // On inner pages there's no hero to sit over, so the header is
  // solid right away, same as visionrecordings.nl.
  const solid = !isHome || scrollY > 64;
  const [open, setOpen] = useState(false);

  // Hrefs are fixed routes (not translated — the URLs don't change per
  // language, only the visible label does).
  const allLinks = [
    { key: "releases", href: "/releases" },
    { key: "artists", href: "/artists" },
    { key: "events", href: "/events" },
    { key: "radio", href: "/radio" },
    { key: "store", href: "/store" },
  ] as const;
  // Client-editable in /admin/homepage — lets the club run without a
  // public artist roster (Artists link, homepage line-up, Book us picker).
  const links = hideArtists ? allLinks.filter((l) => l.key !== "artists") : allLinks;

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-colors duration-500 ${
        solid || open
          ? "bg-[var(--bg)]/95 backdrop-blur border-b border-[var(--line)]"
          : "bg-gradient-to-b from-black/60 to-transparent border-b border-transparent"
      }`}
    >
      <div className="max-w-[1600px] mx-auto flex items-center justify-between px-5 sm:px-8 h-16 sm:h-20">
        <Link href="/" className="flex items-center gap-2.5">
          <Image
            src="/logo-round.webp"
            alt="Krantas"
            width={88}
            height={88}
            priority
            className="h-10 w-10 sm:h-11 sm:w-11 rounded-full shadow-[0_2px_10px_rgba(0,0,0,0.55),0_0_0_1px_rgba(236,231,221,0.12)]"
          />
          <span className="font-display text-2xl sm:text-3xl tracking-wide">
            KRANTAS
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-8 font-mono text-xs tracking-[0.18em] uppercase">
          {links.map((l) => {
            const active = pathname === l.href;
            return (
              <Link
                key={l.href}
                href={l.href}
                aria-current={active ? "page" : undefined}
                className={`relative py-2 transition-colors after:content-[''] after:absolute after:left-0 after:-bottom-0.5 after:h-px after:bg-[var(--accent)] after:transition-all ${
                  active
                    ? "text-[var(--ink)] after:w-full"
                    : "text-[var(--ink)]/85 hover:text-[var(--accent)] after:w-0 hover:after:w-full"
                }`}
              >
                {t(`nav.${l.key}`)}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-4 sm:gap-5">
          <LanguageSwitch className="hidden md:inline-flex" />
          <SetsPlayer initialEpisodes={initialEpisodes} />
          <TicketButtons variant="nav" />
        </div>

        <button
          onClick={() => setOpen((o) => !o)}
          className="md:hidden relative w-9 h-9 flex flex-col items-center justify-center gap-[6px]"
          aria-label={open ? t("nav.closeMenu") : t("nav.openMenu")}
          aria-expanded={open}
        >
          <span
            className={`block h-px w-6 bg-[var(--ink)] transition-transform duration-300 ${
              open ? "translate-y-[3.5px] rotate-45" : ""
            }`}
          />
          <span
            className={`block h-px w-6 bg-[var(--ink)] transition-transform duration-300 ${
              open ? "-translate-y-[3.5px] -rotate-45" : ""
            }`}
          />
        </button>
      </div>

      {/* mobile panel */}
      <div
        className={`md:hidden overflow-hidden transition-[max-height] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] bg-[var(--bg)] border-b border-[var(--line)] ${
          open ? "max-h-[420px]" : "max-h-0"
        }`}
      >
        <nav className="flex flex-col px-5 py-4 gap-1 font-mono text-sm tracking-[0.14em] uppercase">
          {links.map((l) => {
            const active = pathname === l.href;
            return (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                aria-current={active ? "page" : undefined}
                className={`py-3 border-b transition-colors ${
                  active
                    ? "text-[var(--ink)] border-[var(--accent)]"
                    : "text-[var(--ink)]/85 border-[var(--line)] hover:text-[var(--accent)] hover:border-[var(--accent)]"
                }`}
              >
                {t(`nav.${l.key}`)}
              </Link>
            );
          })}
          <LanguageSwitch className="mt-3 self-start" />
          <TicketButtons variant="nav-mobile" onNavigate={() => setOpen(false)} />
          <GoogleReviewBadge className="mt-3 py-1 justify-center" label="review" labelMode="always" />
        </nav>
      </div>
    </header>
  );
}
