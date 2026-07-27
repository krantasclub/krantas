"use client";

import { useState, type FormEvent } from "react";
import SectionHeading from "./SectionHeading";
import Reveal from "./Reveal";

const INPUT_CLS =
  "w-full bg-transparent border-0 border-b border-[var(--line-strong)] text-[var(--ink)] py-2 text-sm outline-none focus:border-[var(--accent)] transition-colors placeholder:text-[var(--ink-dim)]";
const LABEL_CLS = "block font-mono text-[9px] uppercase tracking-[0.16em] text-[var(--ink-dim)] mb-1.5";

export default function ContactSection() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone, subject, message }),
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
        <SectionHeading eyebrow="Get in touch" title="Contact" note="Questions, press, guest lists — drop us a line." />

        <div className="grid gap-12 sm:gap-16 md:grid-cols-[1.1fr_0.9fr] items-start">
          <Reveal>
            {done ? (
              <div className="border border-[var(--accent)]/50 px-5 py-5 max-w-lg">
                <p className="font-mono text-xs uppercase tracking-[0.16em] text-[var(--accent)] mb-1.5">
                  Message sent
                </p>
                <p className="font-body text-sm text-[var(--ink)]/85 leading-relaxed">
                  Thanks, {name.split(" ")[0]} — check your inbox for a confirmation. We&apos;ll get back to you soon.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="max-w-lg">
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
                    <label className={LABEL_CLS}>Subject (optional)</label>
                    <input className={INPUT_CLS} value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="What's this about?" />
                  </div>
                </div>

                <div className="mb-5">
                  <label className={LABEL_CLS}>Message</label>
                  <textarea
                    required
                    className={`${INPUT_CLS} resize-none`}
                    rows={5}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Tell us what's up..."
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
                  {submitting ? "Sending..." : "Send message →"}
                </button>
              </form>
            )}
          </Reveal>

          <Reveal delay={120}>
            <div className="border border-[var(--line)] p-6 sm:p-8">
              <p className="eyebrow mb-4">Find us</p>
              <address className="not-italic space-y-1 text-sm text-[var(--ink)]/85">
                <p>Naujoji Uosto g. 3</p>
                <p>92120 Klaipėda, Lithuania</p>
                <p className="pt-3">
                  <a href="tel:+37060294076" className="hover:text-[var(--accent)] transition-colors">
                    +370 602 94076
                  </a>
                </p>
                <p>
                  <a href="mailto:info@krantasclub.lt" className="hover:text-[var(--accent)] transition-colors">
                    info@krantasclub.lt
                  </a>
                </p>
              </address>

              <p className="eyebrow mt-6 mb-3">Follow</p>
              <div className="flex flex-wrap gap-x-5 gap-y-2 font-mono text-xs uppercase tracking-[0.12em] text-[var(--ink)]/70">
                <a href="https://instagram.com/krantas_club" target="_blank" rel="noopener noreferrer" className="hover:text-[var(--accent)] transition-colors">
                  Instagram
                </a>
                <a href="https://www.facebook.com/krantasclub" target="_blank" rel="noopener noreferrer" className="hover:text-[var(--accent)] transition-colors">
                  Facebook
                </a>
                <a href="https://wa.me/37060294076" target="_blank" rel="noopener noreferrer" className="hover:text-[var(--accent)] transition-colors">
                  WhatsApp
                </a>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
