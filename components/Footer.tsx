import Image from "next/image";
import Link from "next/link";
import WaveDivider from "./WaveDivider";
import TicketButtons from "./TicketButtons";

const EXPLORE_LINKS = [
  { label: "Releases", href: "/releases" },
  { label: "Artists", href: "/artists" },
  { label: "Events", href: "/events" },
  { label: "Radio", href: "/radio" },
  { label: "Store", href: "/store" },
];

const CLUB_LINKS = [
  { label: "About Krantas", href: "/about" },
  { label: "Lost & found", href: "/lost-and-found" },
  { label: "Contact", href: "/contact" },
  { label: "Book us", href: "/book-us" },
];

// Shared hover treatment for every footer link: text shifts to the
// accent orange and an underline in the same color draws in beneath
// it — same sodium-light accent used for hovers everywhere else on
// the site, just paired with a visible underline here since footer
// links sit in plain text lists rather than nav pills.
const linkHover =
  "hover:text-[var(--accent)] hover:underline decoration-[var(--accent)] underline-offset-4 transition-colors";

export default function Footer() {
  return (
    <footer className="relative bg-[var(--bg)]">
      <WaveDivider fill="var(--bg-raised)" />

      <div className="bg-[var(--bg-raised)] text-[var(--ink)] px-5 sm:px-8 pt-2 pb-10 sm:pb-14 border-t border-[var(--line)]">
        <div className="max-w-[1600px] mx-auto pt-8 sm:pt-12">
          <div className="grid grid-cols-1 md:grid-cols-[1.4fr_1fr_1fr_1fr] gap-10 sm:gap-8">
            <div>
              <div className="flex items-center gap-3">
                <Image
                  src="/logo-round.webp"
                  alt="Krantas"
                  width={96}
                  height={96}
                  loading="lazy"
                  className="h-11 w-11 sm:h-12 sm:w-12 rounded-full shadow-[0_6px_16px_rgba(0,0,0,0.45)]"
                />
                <p className="font-display text-3xl sm:text-4xl leading-none">
                  KRANTAS
                </p>
              </div>
              <p className="mt-3 max-w-xs text-sm text-[var(--ink)]/70">
                Naktinis klubas Klaipėdoje. Underground music by the shore —
                techno, breaks and bass since the tide turned.
              </p>
              <div className="mt-5">
                <TicketButtons variant="block" />
              </div>
            </div>

            <div>
              <p className="eyebrow mb-4">Explore</p>
              <ul className="space-y-2.5">
                {EXPLORE_LINKS.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className={`text-sm ${linkHover}`}>
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="eyebrow mb-4">Club</p>
              <ul className="space-y-2.5">
                {CLUB_LINKS.map((l) => (
                  <li key={l.label}>
                    {l.href.startsWith("/") ? (
                      <Link href={l.href} className={`text-sm ${linkHover}`}>
                        {l.label}
                      </Link>
                    ) : (
                      <a href={l.href} className={`text-sm ${linkHover}`}>
                        {l.label}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="eyebrow mb-4">Find us</p>
              <address className="not-italic text-sm space-y-1 text-[var(--ink)]/85">
                <p>Naujoji Uosto g. 3</p>
                <p>92120 Klaipėda, Lithuania</p>
                <p className="pt-2">
                  <a href="tel:+37060294076" className={linkHover}>
                    +370 602 94076
                  </a>
                </p>
                <p>
                  <a href="mailto:info@krantasclub.lt" className={linkHover}>
                    info@krantasclub.lt
                  </a>
                </p>
              </address>
            </div>
          </div>

          <div className="mt-12 sm:mt-16 pt-6 border-t border-[var(--line)] flex flex-wrap items-center justify-between gap-4">
            <p className="font-mono text-xs text-[var(--ink)]/60">
              © {new Date().getFullYear()} Krantas. All rights reserved.
            </p>
            <div className="flex gap-5 font-mono text-xs uppercase tracking-[0.12em] text-[var(--ink)]/70">
              <a
                href="https://instagram.com/krantas_club"
                target="_blank"
                rel="noopener noreferrer"
                className={linkHover}
              >
                Instagram
              </a>
              <a
                href="https://www.facebook.com/krantasclub"
                target="_blank"
                rel="noopener noreferrer"
                className={linkHover}
              >
                Facebook
              </a>
              <a
                href="https://wa.me/37060294076"
                target="_blank"
                rel="noopener noreferrer"
                className={linkHover}
              >
                WhatsApp
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
