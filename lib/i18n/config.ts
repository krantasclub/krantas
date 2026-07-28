// ── i18n config ─────────────────────────────────────────────────────────
// This is a lightweight, no-routing i18n setup: it swaps hardcoded UI
// strings (nav, footer, form labels, admin chrome) client-side via a
// React context, persisted in a cookie so the right language renders on
// the next visit. It deliberately does NOT touch anything that comes out
// of Supabase (about copy, event descriptions, artist bios, product
// names, etc.) — that content is single-language, admin-owned, and
// translating it here would fight with whatever the admin actually types
// into /admin. If you want the CMS content itself to be bilingual later,
// that's a bigger job (extra columns per field, admin UI for both
// languages) — this only covers the surrounding chrome.
export type Locale = "lt" | "en";
export const locales: Locale[] = ["lt", "en"];
export const defaultLocale: Locale = "lt";
export const LOCALE_COOKIE = "krantas_locale";

export function isLocale(value: string | undefined | null): value is Locale {
  return value === "lt" || value === "en";
}
