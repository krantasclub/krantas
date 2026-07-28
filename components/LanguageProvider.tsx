"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { LOCALE_COOKIE, type Locale } from "@/lib/i18n/config";
import { translations, type TranslationShape } from "@/lib/i18n/translations";

type LanguageContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  /** Dot-path lookup, e.g. t("footer.explore"). Returns the path itself
   *  if the key is missing, so a typo shows up as visibly wrong text
   *  instead of silently rendering blank. */
  t: (path: string) => string;
  /** For values that need interpolation (e.g. contact.messageSentBody). */
  dict: TranslationShape;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

function lookup(path: string, dict: TranslationShape): unknown {
  return path.split(".").reduce<unknown>((acc, key) => {
    if (acc && typeof acc === "object" && key in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, dict);
}

export function LanguageProvider({
  children,
  initialLocale,
}: {
  children: React.ReactNode;
  initialLocale: Locale;
}) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    // 1 year, readable by the root layout on the next request so the
    // server-rendered first paint already matches — avoids a flash of
    // the wrong language for returning visitors.
    document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=31536000; SameSite=Lax`;
  }, []);

  const dict = translations[locale];

  const t = useCallback(
    (path: string) => {
      const value = lookup(path, dict);
      return typeof value === "string" ? value : path;
    },
    [dict]
  );

  const value = useMemo(() => ({ locale, setLocale, t, dict }), [locale, setLocale, t, dict]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return ctx;
}
