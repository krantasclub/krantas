"use client";

import { useState } from "react";
import { events as fallbackEvents, type Poster } from "@/lib/content";
import { PAYSERA_URL, RA_URL } from "@/lib/tickets";
import Reveal from "./Reveal";
import SectionHeading from "./SectionHeading";
import TicketButtons from "./TicketButtons";
import EventModal from "./EventModal";

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function EventCard({ ev, index, past = false, onOpen }: { ev: Poster; index: number; past?: boolean; onOpen: (ev: Poster) => void }) {
  return (
    <Reveal delay={(index % 3) * 80}>
      <button
        onClick={() => onOpen(ev)}
        className={`group relative block w-full text-left aspect-[3/4] overflow-hidden border border-[var(--line)] transition-colors ${
          past ? "grayscale opacity-55 hover:opacity-80" : "hover:border-[var(--accent)]"
        }`}
        style={
          ev.imageUrl
            ? { backgroundImage: `url(${ev.imageUrl})`, backgroundSize: "cover", backgroundPosition: "center" }
            : { background: `linear-gradient(155deg, ${ev.from}, ${ev.to})` }
        }
      >
        <div className="absolute inset-0 grain opacity-60" />
        {ev.imageUrl && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-black/40" />
        )}

        <div className="absolute top-3 left-3 right-3 flex items-start justify-between font-mono text-[10px] sm:text-xs uppercase tracking-[0.14em] text-[var(--ink)]/85">
          <span className="border border-[var(--ink)]/40 px-2 py-1">
            {ev.day} {ev.month}
          </span>
          <span className="text-right">{past ? "Past" : ev.venueLine}</span>
        </div>

        <div className="absolute inset-x-0 bottom-0 p-3 sm:p-4">
          <h3 className="font-display text-2xl sm:text-3xl md:text-4xl leading-[0.9] text-[var(--ink)] group-hover:text-[var(--accent)] transition-colors">
            {ev.headline}
          </h3>
          {ev.sub && (
            <p className="mt-1 text-[11px] sm:text-xs text-[var(--ink)]/75">{ev.sub}</p>
          )}
          <div className="mt-2 sm:mt-3 flex flex-wrap gap-1.5">
            {ev.tags.map((t) => (
              <span
                key={t}
                className="font-mono text-[9px] sm:text-[10px] uppercase tracking-[0.1em] border border-[var(--ink)]/30 text-[var(--ink)]/70 px-1.5 py-0.5"
              >
                {t}
              </span>
            ))}
          </div>
        </div>

        {!past && (
          <div className="absolute inset-0 border-2 border-transparent group-hover:border-[var(--accent)]/50 transition-colors pointer-events-none" />
        )}
      </button>
    </Reveal>
  );
}

export default function EventsSection({ initialPosters }: { initialPosters?: Poster[] }) {
  const [posters] = useState<Poster[]>(initialPosters ?? fallbackEvents);
  const [selected, setSelected] = useState<{ ev: Poster; past: boolean } | null>(null);

  const today = todayISO();
  const upcoming = posters
    .filter((p) => p.eventDate >= today)
    .sort((a, b) => a.eventDate.localeCompare(b.eventDate));
  const past = posters
    .filter((p) => p.eventDate < today)
    .sort((a, b) => b.eventDate.localeCompare(a.eventDate));

  const featured = upcoming.find((p) => p.featured);
  const gridUpcoming = featured ? upcoming.filter((p) => p.id !== featured.id) : upcoming;

  return (
    <section id="events" className="relative bg-[var(--bg)] px-5 sm:px-8 py-20 sm:py-28">
      <div className="max-w-[1600px] mx-auto">
        <SectionHeading
          eyebrow="What's on"
          title="Upcoming Events"
          note="Doors 23:00 · Klaipėda seafront district"
        />

        <Reveal>
          <div className="mb-10 sm:mb-14 flex flex-wrap items-center justify-between gap-4 border border-[var(--line)] px-5 py-4 sm:px-6 sm:py-5">
            <p className="font-mono text-[11px] sm:text-xs uppercase tracking-[0.16em] text-[var(--ink-dim)]">
              Get tickets via
            </p>
            <TicketButtons variant="nav" paysera={PAYSERA_URL} ra={RA_URL} />
            <div className="md:hidden w-full">
              <TicketButtons variant="nav-mobile" paysera={PAYSERA_URL} ra={RA_URL} />
            </div>
          </div>
        </Reveal>

        {featured && (
          <Reveal className="mb-10 sm:mb-14">
            <div
              onClick={() => setSelected({ ev: featured, past: false })}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter") setSelected({ ev: featured, past: false });
              }}
              className="group relative grid sm:grid-cols-2 border border-[var(--accent)] overflow-hidden cursor-pointer"
            >
              <div
                className="relative aspect-[4/3] sm:aspect-auto"
                style={
                  featured.imageUrl
                    ? { backgroundImage: `url(${featured.imageUrl})`, backgroundSize: "cover", backgroundPosition: "center" }
                    : { background: `linear-gradient(155deg, ${featured.from}, ${featured.to})` }
                }
              >
                <div className="absolute inset-0 grain opacity-60" />
              </div>
              <div className="p-6 sm:p-10 flex flex-col justify-center bg-[var(--bg-raised)]">
                <p className="eyebrow mb-3 text-[var(--accent)]">Featured · {featured.date}</p>
                <h3 className="font-display text-4xl sm:text-5xl leading-[0.9] text-[var(--ink)] group-hover:text-[var(--accent)] transition-colors">
                  {featured.headline}
                </h3>
                {featured.sub && (
                  <p className="mt-2 text-sm text-[var(--ink)]/75">{featured.sub}</p>
                )}
                <p className="mt-3 font-mono text-xs text-[var(--ink-dim)] uppercase tracking-[0.14em]">
                  {featured.venueLine}
                </p>
                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <a
                    href={featured.ticketUrl || PAYSERA_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex w-fit items-center gap-2 border border-[var(--accent)] text-[var(--accent)] font-mono text-xs tracking-[0.18em] uppercase px-5 py-3 hover:bg-[var(--accent)] hover:text-[#12100c] transition-colors"
                  >
                    Get tickets →
                  </a>
                  <span className="font-mono text-xs tracking-[0.18em] uppercase text-[var(--ink-dim)] group-hover:text-[var(--accent)] transition-colors">
                    Details →
                  </span>
                </div>
              </div>
            </div>
          </Reveal>
        )}

        {gridUpcoming.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-5">
            {gridUpcoming.map((ev, i) => (
              <EventCard key={ev.id} ev={ev} index={i} onOpen={(ev) => setSelected({ ev, past: false })} />
            ))}
          </div>
        )}

        {gridUpcoming.length === 0 && !featured && (
          <p className="font-mono text-sm text-[var(--ink-dim)]">
            No upcoming events right now — check back soon.
          </p>
        )}

        {past.length > 0 && (
          <div className="mt-16 sm:mt-24">
            <SectionHeading eyebrow="Archive" title="Past Events" />
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-5">
              {past.map((ev, i) => (
                <EventCard key={ev.id} ev={ev} index={i} past onOpen={(ev) => setSelected({ ev, past: true })} />
              ))}
            </div>
          </div>
        )}
      </div>

      {selected && (
        <EventModal ev={selected.ev} past={selected.past} onClose={() => setSelected(null)} />
      )}
    </section>
  );
}
