import { PAYSERA_URL, RA_URL } from "@/lib/tickets";

/**
 * Two outbound ticket/venue links — Paysera (box office) and RA
 * (club page / listings). Both read "Tickets" as the primary label,
 * with a small "on Paysera" / "on RA" line underneath so it's clear
 * where each one goes. We don't have a Facebook Events integration,
 * so this is the canonical "where to get tickets" pair used across
 * the site: nav, footer, and the events page.
 */
export default function TicketButtons({
  variant = "nav",
  paysera = PAYSERA_URL,
  ra = RA_URL,
  onNavigate,
}: {
  variant?: "nav" | "nav-mobile" | "block";
  paysera?: string;
  ra?: string;
  onNavigate?: () => void;
}) {
  if (variant === "block") {
    return (
      <div className="flex flex-wrap gap-3">
        <a
          href={paysera}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex flex-col items-center gap-0.5 border border-[var(--accent)] bg-[var(--accent)] text-[#12100c] px-5 py-2.5 hover:bg-transparent hover:text-[var(--accent)] transition-colors"
        >
          <span className="font-mono text-xs tracking-[0.18em] uppercase leading-none">Tickets</span>
          <span className="font-mono text-[9px] tracking-[0.12em] uppercase leading-none opacity-70">on Paysera</span>
        </a>
        <a
          href={ra}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex flex-col items-center gap-0.5 border border-[var(--ink)]/40 text-[var(--ink)] px-5 py-2.5 hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors"
        >
          <span className="font-mono text-xs tracking-[0.18em] uppercase leading-none">Tickets</span>
          <span className="font-mono text-[9px] tracking-[0.12em] uppercase leading-none opacity-70">on RA</span>
        </a>
      </div>
    );
  }

  if (variant === "nav-mobile") {
    return (
      <div className="mt-4 mb-2 grid grid-cols-2 gap-2">
        <a
          href={paysera}
          target="_blank"
          rel="noopener noreferrer"
          onClick={onNavigate}
          className="flex flex-col items-center gap-0.5 border border-[var(--accent)] text-[var(--accent)] py-2.5"
        >
          <span className="font-mono text-xs tracking-[0.14em] uppercase leading-none">Tickets</span>
          <span className="font-mono text-[9px] tracking-[0.1em] uppercase leading-none opacity-70">on Paysera</span>
        </a>
        <a
          href={ra}
          target="_blank"
          rel="noopener noreferrer"
          onClick={onNavigate}
          className="flex flex-col items-center gap-0.5 border border-[var(--ink)]/40 text-[var(--ink)] py-2.5"
        >
          <span className="font-mono text-xs tracking-[0.14em] uppercase leading-none">Tickets</span>
          <span className="font-mono text-[9px] tracking-[0.1em] uppercase leading-none opacity-70">on RA</span>
        </a>
      </div>
    );
  }

  // "nav" — compact pair for the desktop header
  return (
    <div className="hidden md:flex items-center gap-2">
      <a
        href={paysera}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex flex-col items-center gap-0.5 border border-[var(--accent)] text-[var(--accent)] px-4 py-1.5 hover:bg-[var(--accent)] hover:text-[#12100c] transition-colors"
      >
        <span className="font-mono text-xs tracking-[0.18em] uppercase leading-none">Tickets</span>
        <span className="font-mono text-[8.5px] tracking-[0.1em] uppercase leading-none opacity-70">on Paysera</span>
      </a>
      <a
        href={ra}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex flex-col items-center gap-0.5 border border-[var(--ink)]/40 text-[var(--ink)]/85 px-4 py-1.5 hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors"
      >
        <span className="font-mono text-xs tracking-[0.18em] uppercase leading-none">Tickets</span>
        <span className="font-mono text-[8.5px] tracking-[0.1em] uppercase leading-none opacity-70">on RA</span>
      </a>
    </div>
  );
}
