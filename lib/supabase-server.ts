import { createClient } from "@supabase/supabase-js";

// Server-only Supabase client for reading public content (releases,
// artists, events, radio, store) inside Server Components / page
// data-fetching. Using this instead of the browser client (lib/supabase.ts)
// means the data is already resolved when the HTML is rendered, so pages
// never flash the hardcoded fallback content before swapping to the real
// rows the way the old client-side `useEffect` fetches did.
//
// No auth/session handling is needed here — these are anon-key, RLS-gated
// public reads, so a plain client (not @supabase/ssr's cookie-aware one) is
// enough.
export const supabaseServer = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: { persistSession: false },
  }
);
