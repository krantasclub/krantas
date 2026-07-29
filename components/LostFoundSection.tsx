"use client";

import { useState, type FormEvent } from "react";
import SectionHeading from "./SectionHeading";
import Reveal from "./Reveal";
import { useLanguage } from "./LanguageProvider";

const INPUT_CLS =
  "w-full bg-transparent border-0 border-b border-[var(--line-strong)] text-[var(--ink)] py-2 text-sm outline-none focus:border-[var(--accent)] transition-colors placeholder:text-[var(--ink-dim)]";
const LABEL_CLS = "block font-mono text-[9px] uppercase tracking-[0.16em] text-[var(--ink-dim)] mb-1.5";

export default function LostFoundSection() {
  const { t } = useLanguage();
  const [itemDescription, setItemDescription] = useState("");
  const [dateLost, setDateLost] = useState("");
  const [location, setLocation] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/lost-found", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemDescription, dateLost: dateLost || null, location, name, email, phone }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Something went wrong — try again.");
      setDone(true);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong — try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="relative bg-[var(--bg)] px-5 sm:px-8 py-20 sm:py-28">
      <div className="max-w-[1600px] mx-auto">
        <SectionHeading eyebrow={t("sections.lostFoundEyebrow")} title={t("sections.lostFoundTitle")} note={t("sections.lostFoundNote")} />

        <div className="grid gap-12 sm:gap-16 md:grid-cols-[1.1fr_0.9fr] items-start">
          <Reveal>
            {done ? (
              <div className="border border-[var(--accent)]/50 px-5 py-5 max-w-lg">
                <p className="font-mono text-xs uppercase tracking-[0.16em] text-[var(--accent)] mb-1.5">
                  Report logged
                </p>
                <p className="font-body text-sm text-[var(--ink)]/85 leading-relaxed">
                  Thanks, {name.split(" ")[0]} — check your inbox for a confirmation. If your item turns up, we&apos;ll
                  reach out.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="max-w-lg">
                <div className="mb-4">
                  <label className={LABEL_CLS}>What did you lose</label>
                  <input
                    required
                    className={INPUT_CLS}
                    value={itemDescription}
                    onChange={(e) => setItemDescription(e.target.value)}
                    placeholder="e.g. Black leather jacket, iPhone with a blue case..."
                  />
                </div>

                <div className="grid sm:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className={LABEL_CLS}>Date lost (optional)</label>
                    <input type="date" className={INPUT_CLS} value={dateLost} onChange={(e) => setDateLost(e.target.value)} />
                  </div>
                  <div>
                    <label className={LABEL_CLS}>Where in the venue (optional)</label>
                    <input className={INPUT_CLS} value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Main floor, bar, cloakroom..." />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4 mb-5">
                  <div>
                    <label className={LABEL_CLS}>Name</label>
                    <input required className={INPUT_CLS} value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
                  </div>
                  <div>
                    <label className={LABEL_CLS}>Email</label>
                    <input required type="email" className={INPUT_CLS} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className={LABEL_CLS}>Phone (optional)</label>
                    <input className={INPUT_CLS} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+370..." />
                  </div>
                </div>

                {error && (
                  <p className="font-mono text-xs text-[#e5837f] mb-4 border border-[#7a1f2b]/50 px-3 py-2">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 border border-[var(--accent)] text-[var(--accent)] font-mono text-xs tracking-[0.18em] uppercase px-5 py-3 hover:bg-[var(--accent)] hover:text-[#12100c] transition-colors disabled:opacity-50"
                >
                  {submitting ? "Sending..." : "Report item →"}
                </button>
              </form>
            )}
          </Reveal>

          <Reveal delay={120}>
            <div className="border border-[var(--line)] p-6 sm:p-8">
              <p className="eyebrow mb-4">{t("sections.lostFoundHowItWorks")}</p>
              <ul className="space-y-3 text-sm text-[var(--ink)]/85 leading-relaxed">
                <li>Found items are kept behind the bar for 30 days.</li>
                <li>We&apos;ll email or call you if something matching your report is handed in.</li>
                <li>
                  In a hurry? You can also reach us directly at{" "}
                  <a href="mailto:info@krantasclub.lt" className="hover:text-[var(--accent)] transition-colors">
                    info@krantasclub.lt
                  </a>{" "}
                  or{" "}
                  <a href="tel:+37060294076" className="hover:text-[var(--accent)] transition-colors">
                    +370 602 94076
                  </a>
                  .
                </li>
              </ul>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
