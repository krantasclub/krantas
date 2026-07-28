"use client";

import { useLanguage } from "./LanguageProvider";

export default function LanguageSwitch({ className = "" }: { className?: string }) {
  const { locale, setLocale } = useLanguage();

  return (
    <div
      className={`inline-flex items-center font-mono text-[10px] tracking-[0.14em] uppercase border border-[var(--line-strong)] rounded-full overflow-hidden ${className}`}
      role="group"
      aria-label="Language"
    >
      {(["lt", "en"] as const).map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => setLocale(l)}
          aria-pressed={locale === l}
          className={`px-2.5 py-1 transition-colors ${
            locale === l
              ? "bg-[var(--accent)] text-[#12100c]"
              : "text-[var(--ink)]/70 hover:text-[var(--accent)]"
          }`}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
