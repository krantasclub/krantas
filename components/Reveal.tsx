"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

// Safety net: if IntersectionObserver never fires (slow hydration, a
// blocked/failed script elsewhere on the page, or any other JS hiccup),
// content wrapped in Reveal would otherwise sit at opacity:0 forever —
// fully loaded but invisible, indistinguishable from a real bug. Same
// "worst case is a late reveal, never a permanent one" approach used for
// the hero video fallback in Hero.tsx.
const SAFETY_TIMEOUT_MS = 1800;

export default function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // No IntersectionObserver support (very old browser) — just show it.
    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true);
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -8% 0px" }
    );
    io.observe(el);

    // Hard fallback: whatever the reason the observer hasn't fired yet,
    // never let it stay invisible indefinitely.
    const timeout = window.setTimeout(() => setVisible(true), SAFETY_TIMEOUT_MS);

    return () => {
      io.disconnect();
      window.clearTimeout(timeout);
    };
  }, []);

  return (
    <div
      ref={ref}
      className={`reveal ${visible ? "is-visible" : ""} ${className}`}
      style={{ transitionDelay: visible ? `${delay}ms` : "0ms" }}
    >
      {children}
    </div>
  );
}
