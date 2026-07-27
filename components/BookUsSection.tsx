"use client";

import { useState, type FormEvent } from "react";
import SectionHeading from "./SectionHeading";
import Reveal from "./Reveal";

const INPUT_CLS =
  "w-full bg-transparent border-0 border-b border-[var(--line-strong)] text-[var(--ink)] py-2 text-sm outline-none focus:border-[var(--accent)] transition-colors placeholder:text-[var(--ink-dim)]";
const LABEL_CLS = "block font-mono text-[9px] uppercase tracking-[0.16em] text-[var(--ink-dim)] mb-1.5";

const REQUEST_TYPES = [
  { id: "dj_booking", label: "DJ / artist booking" },
  { id: "private_event", label: "Private event" },
  { id: "other", label: "Something else" },
] as const;

export default function BookUsSection() {
  const [requestType, setRequestType] = useState<(typeof REQUEST_TYPES)[number]["id"]>("dj_booking");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [guestCount, setGuestCount] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/book-us", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestType,
          name,
          email,
          phone,
          eventDate: eventDate || null,
          guestCount: guestCount ? Number(guestCount) : null,
          message,
        }),
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
        <SectionHeading
          eyebrow="Play here / hire us"
          title="Book us"
          note="Booking a set, a residency, or hiring the room for a private event — tell us about it."
        />

        <div className="max-w-2xl">
          <Reveal>
            {done ? (
              <div className="border border-[var(--accent)]/50 px-5 py-5">
                <p className="font-mono text-xs uppercase tracking-[0.16em] text-[var(--accent)] mb-1.5">
                  Request received
                </p>
                <p className="font-body text-sm text-[var(--ink)]/85 leading-relaxed">
                  Thanks, {name.split(" ")[0]} — check your inbox for a confirmation. We&apos;ll follow up soon.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div className="mb-5">
                  <label className={LABEL_CLS}>What&apos;s this about</label>
                  <div className="flex flex-wrap gap-2">
                    {REQUEST_TYPES.map((t) => (
                      <button
                        type="button"
                        key={t.id}
                        onClick={() => setRequestType(t.id)}
                        className={`font-mono text-xs uppercase tracking-[0.08em] px-3 py-1.5 border transition-colors ${
                          requestType === t.id
                            ? "border-[var(--accent)] text-[var(--accent)]"
                            : "border-[var(--line-strong)] text-[var(--ink-dim)] hover:text-[var(--ink)]"
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className={LABEL_CLS}>Name</label>
                    <input required className={INPUT_CLS} value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
                  </div>
                  <div>
                    <label className={LABEL_CLS}>Email</label>
                    <input required type="email" className={INPUT_CLS} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
                  </div>
                  <div>
                    <label className={LABEL_CLS}>Phone (optional)</label>
                    <input className={INPUT_CLS} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+370..." />
                  </div>
                  <div>
                    <label className={LABEL_CLS}>Preferred date (optional)</label>
                    <input type="date" className={INPUT_CLS} value={eventDate} onChange={(e) => setEventDate(e.target.value)} />
                  </div>
                  {requestType === "private_event" && (
                    <div>
                      <label className={LABEL_CLS}>Guest count (optional)</label>
                      <input
                        type="number"
                        min={0}
                        className={INPUT_CLS}
                        value={guestCount}
                        onChange={(e) => setGuestCount(e.target.value)}
                        placeholder="150"
                      />
                    </div>
                  )}
                </div>

                <div className="mb-5">
                  <label className={LABEL_CLS}>
                    {requestType === "dj_booking" ? "Tell us about your sound, links, availability" : "Tell us about the event"}
                  </label>
                  <textarea
                    required
                    className={`${INPUT_CLS} resize-none`}
                    rows={5}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder={
                      requestType === "dj_booking"
                        ? "Genre, mixes/Soundcloud link, past shows, dates you're free..."
                        : "Type of event, rough date, headcount, anything else we should know..."
                    }
                  />
                </div>

                {error && (
                  <p className="font-mono text-xs text-[#e5837f] mb-4 border border-[#7a1f2b]/50 px-3 py-2">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 border border-[var(--accent)] text-[var(--accent)] font-mono text-xs tracking-[0.18em] uppercase px-5 py-3 hover:bg-[var(--accent)] hover:text-[#12100c] transition-colors disabled:opacity-50"
                >
                  {submitting ? "Sending..." : "Send request →"}
                </button>
                <p className="mt-3 font-mono text-[10px] text-[var(--ink-dim)] leading-relaxed">
                  We reply to every enquiry, usually within a few days.
                </p>
              </form>
            )}
          </Reveal>
        </div>
      </div>
    </section>
  );
}
