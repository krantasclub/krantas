"use client";

import { useState } from "react";
import { merch as fallbackMerch, type Merch } from "@/lib/content";
import Reveal from "./Reveal";
import SectionHeading from "./SectionHeading";
import StoreOrderModal from "./StoreOrderModal";

export default function StoreSection({ initialProducts }: { initialProducts?: Merch[] }) {
  const [products] = useState<Merch[]>(initialProducts ?? fallbackMerch);
  const [selected, setSelected] = useState<Merch | null>(null);

  return (
    <section id="store" className="relative bg-[var(--bg-raised)] px-5 sm:px-8 py-20 sm:py-28">
      <div className="max-w-[1600px] mx-auto">
        <SectionHeading eyebrow="Take it home" title="Store" note="Merch drops restock monthly" />

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-5">
          {products.map((m, i) => {
            const dark = m.from === "#ece7dd";
            return (
              <Reveal key={m.id} delay={(i % 3) * 80}>
                <button
                  onClick={() => setSelected(m)}
                  className={`group relative block w-full text-left aspect-[4/5] overflow-hidden border border-[var(--line)] transition-colors ${
                    m.soldOut ? "opacity-60" : "hover:border-[var(--accent)]"
                  }`}
                  style={
                    m.imageUrl
                      ? { backgroundImage: `url(${m.imageUrl})`, backgroundSize: "cover", backgroundPosition: "center" }
                      : { background: `linear-gradient(155deg, ${m.from}, ${m.to})` }
                  }
                >
                  <div className="absolute inset-0 grain opacity-40" />
                  {m.imageUrl && (
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/5 to-transparent" />
                  )}

                  {m.soldOut && (
                    <span className="absolute top-3 left-3 font-mono text-[9px] uppercase tracking-[0.14em] text-[var(--ink)]/85 border border-[var(--ink)]/40 px-2 py-1">
                      Sold out
                    </span>
                  )}

                  <div className="absolute inset-x-0 bottom-0 p-3 sm:p-4 flex items-end justify-between gap-2">
                    <h3
                      className={`font-display text-lg sm:text-xl leading-tight ${
                        m.imageUrl ? "text-[var(--ink)]" : dark ? "text-[var(--paper-ink)]" : "text-[var(--ink)]"
                      } group-hover:text-[var(--accent)] transition-colors`}
                    >
                      {m.name}
                    </h3>
                    <span
                      className={`shrink-0 font-mono text-xs sm:text-sm ${
                        m.imageUrl ? "text-[var(--ink)]/80" : dark ? "text-[var(--paper-ink)]/70" : "text-[var(--ink)]/70"
                      }`}
                    >
                      {m.price}
                    </span>
                  </div>
                </button>
              </Reveal>
            );
          })}
        </div>
      </div>

      {selected && <StoreOrderModal product={selected} onClose={() => setSelected(null)} />}
    </section>
  );
}
