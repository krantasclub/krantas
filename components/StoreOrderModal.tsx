"use client";

import { useEffect, useState } from "react";
import type { Merch } from "@/lib/content";
import StoreLockerSelector, { type LockerPoint } from "./StoreLockerSelector";
import { useLanguage } from "./LanguageProvider";

const INPUT_CLS =
  "w-full bg-transparent border-0 border-b border-[var(--line-strong)] text-[var(--ink)] py-2 text-sm outline-none focus:border-[var(--accent)] transition-colors placeholder:text-[var(--ink-dim)]";
const LABEL_CLS = "block font-mono text-[9px] uppercase tracking-[0.16em] text-[var(--ink-dim)] mb-1.5";

const DELIVERY_METHODS = [
  { id: "pickup", label: "Pickup at a show" },
  { id: "address", label: "Delivery address" },
  { id: "locker", label: "DPD parcel locker" },
] as const;

export default function StoreOrderModal({ product, onClose }: { product: Merch; onClose: () => void }) {
  const { t } = useLanguage();
  const [size, setSize] = useState(product.sizes?.[0] ?? "");
  const [quantity, setQuantity] = useState(1);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [deliveryMethod, setDeliveryMethod] = useState<(typeof DELIVERY_METHODS)[number]["id"]>("address");
  const [address, setAddress] = useState("");
  const [locker, setLocker] = useState<LockerPoint | null>(null);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (product.sizes && product.sizes.length > 0 && !size) {
      setError("Please choose a size.");
      return;
    }
    if (deliveryMethod === "locker" && !locker) {
      setError("Please choose a DPD parcel locker.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/store/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          size: size || null,
          quantity,
          customerName: name,
          customerEmail: email,
          customerPhone: phone,
          deliveryMethod,
          shippingAddress: deliveryMethod === "address" ? address : null,
          lockerId: deliveryMethod === "locker" ? locker?.id : null,
          lockerLabel:
            deliveryMethod === "locker" && locker
              ? `${locker.name}, ${locker.street}, ${locker.city} ${locker.postalCode}`
              : null,
          notes,
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
    <div
      className="fixed inset-0 z-[70] bg-black/92 backdrop-blur-sm flex items-center justify-center p-4 sm:p-8"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        aria-label="Close"
        className="absolute top-4 right-4 sm:top-6 sm:right-6 w-10 h-10 rounded-full border border-[var(--ink)]/40 flex items-center justify-center text-[var(--ink)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M5 5l14 14M19 5 5 19" />
        </svg>
      </button>

      <div
        className="w-full max-w-[860px] max-h-[88vh] overflow-y-auto bg-[var(--bg)] border border-[var(--line-strong)] flex flex-col sm:flex-row"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="relative w-full sm:w-[300px] shrink-0 aspect-[4/5] sm:aspect-auto"
          style={
            product.imageUrl
              ? { backgroundImage: `url(${product.imageUrl})`, backgroundSize: "cover", backgroundPosition: "center" }
              : { background: `linear-gradient(155deg, ${product.from}, ${product.to})` }
          }
        >
          <div className="absolute inset-0 grain opacity-50" />
        </div>

        <div className="p-6 sm:p-8 flex-1 min-w-0">
          <h2 className="font-display text-3xl sm:text-4xl leading-[0.95] text-[var(--ink)] mb-1.5">
            {product.name}
          </h2>
          <p className="font-mono text-sm text-[var(--accent)] mb-4">{product.price}</p>

          {product.description && (
            <p className="font-body text-sm leading-relaxed text-[var(--ink-dim)] mb-6">
              {product.description}
            </p>
          )}

          {product.soldOut ? (
            <p className="font-mono text-xs uppercase tracking-[0.16em] text-[var(--ink-dim)] border border-[var(--line-strong)] px-4 py-3 inline-block">
              {t("sections.storeSoldOut")}
            </p>
          ) : done ? (
            <div className="border border-[var(--accent)]/50 px-4 py-4">
              <p className="font-mono text-xs uppercase tracking-[0.16em] text-[var(--accent)] mb-1.5">
                Order received
              </p>
              <p className="font-body text-sm text-[var(--ink)]/85 leading-relaxed">
                Thanks, {name.split(" ")[0]} — check your inbox for a confirmation. We&apos;ll be in touch to
                sort out payment and delivery.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="pt-4 border-t border-[var(--line)]">
              {product.sizes && product.sizes.length > 0 && (
                <div className="mb-4">
                  <label className={LABEL_CLS}>Size</label>
                  <div className="flex flex-wrap gap-2">
                    {product.sizes.map((s) => (
                      <button
                        type="button"
                        key={s}
                        onClick={() => setSize(s)}
                        className={`font-mono text-xs uppercase tracking-[0.08em] px-3 py-1.5 border transition-colors ${
                          size === s
                            ? "border-[var(--accent)] text-[var(--accent)]"
                            : "border-[var(--line-strong)] text-[var(--ink-dim)] hover:text-[var(--ink)]"
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="mb-4">
                <label className={LABEL_CLS}>Quantity</label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="w-8 h-8 border border-[var(--line-strong)] text-[var(--ink)] hover:border-[var(--accent)] hover:text-[var(--accent)]"
                  >
                    −
                  </button>
                  <span className="font-mono text-sm text-[var(--ink)] w-6 text-center">{quantity}</span>
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.min(20, q + 1))}
                    className="w-8 h-8 border border-[var(--line-strong)] text-[var(--ink)] hover:border-[var(--accent)] hover:text-[var(--accent)]"
                  >
                    +
                  </button>
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
                <div className="sm:col-span-2">
                  <label className={LABEL_CLS}>Phone (optional)</label>
                  <input className={INPUT_CLS} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+370..." />
                </div>
              </div>

              <div className="mb-4">
                <label className={LABEL_CLS}>Delivery</label>
                <div className="flex flex-wrap gap-2">
                  {DELIVERY_METHODS.map((m) => (
                    <button
                      type="button"
                      key={m.id}
                      onClick={() => {
                        setDeliveryMethod(m.id);
                        if (m.id !== "locker") setLocker(null);
                      }}
                      className={`font-mono text-xs uppercase tracking-[0.08em] px-3 py-1.5 border transition-colors ${
                        deliveryMethod === m.id
                          ? "border-[var(--accent)] text-[var(--accent)]"
                          : "border-[var(--line-strong)] text-[var(--ink-dim)] hover:text-[var(--ink)]"
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>

                {deliveryMethod === "address" && (
                  <div className="mt-3">
                    <label className={LABEL_CLS}>Delivery address</label>
                    <input className={INPUT_CLS} value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Street, city, postal code" />
                  </div>
                )}

                {deliveryMethod === "locker" && <StoreLockerSelector value={locker} onChange={setLocker} />}

                {deliveryMethod === "pickup" && (
                  <p className="mt-2 font-mono text-[11px] leading-relaxed text-[var(--ink-dim)]">
                    We&apos;ll hold it for you at the next Krantas night — we&apos;ll email to confirm.
                  </p>
                )}
              </div>

              <div className="mb-5">
                <label className={LABEL_CLS}>Notes (optional)</label>
                <textarea
                  className={`${INPUT_CLS} resize-none`}
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Anything else we should know?"
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
                {submitting ? "Placing order..." : "Place order →"}
              </button>
              <p className="mt-3 font-mono text-[10px] text-[var(--ink-dim)] leading-relaxed">
                No payment is taken here — we&apos;ll follow up by email to arrange it.
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
