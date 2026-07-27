// app/api/reel-thumbnail/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import {
  IMAGE_OUTPUT_EXT, IMAGE_OUTPUT_TYPE, WEBP_QUALITY, POSTER_MAX_WIDTH,
} from "@/lib/upload-limits";

// sharp needs the Node.js runtime (it can't run on the edge runtime).
export const runtime = "nodejs";

// Verify the caller is a logged-in admin — same guard as /api/upload.
async function requireUser() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll() { /* route handler: no cookie mutation needed */ },
      },
    },
  );
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

// Service role client — bypasses RLS, runs only on the server.
function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  if (!url || !key) throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY env var");
  return createClient(url, key, { auth: { persistSession: false } });
}

const BUCKET = "events";
const FETCH_TIMEOUT_MS = 8000;

function isFacebookUrl(url: string): boolean {
  return /facebook\.com|fb\.watch/i.test(url);
}

// Facebook's public video oEmbed endpoint returns a `thumbnail_url`
// directly — no HTML scraping needed, and it works for public reels
// without an app access token. This is tried first for facebook.com/
// fb.watch links since it's far more reliable than parsing meta tags
// out of Facebook's page HTML (which for reels is largely rendered by
// client-side JS and often doesn't carry an og:image at all in the raw
// response).
async function fetchFacebookThumbnail(url: string): Promise<string | null> {
  const oembedUrl = `https://www.facebook.com/plugins/video/oembed.json/?url=${encodeURIComponent(url)}`;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    const res = await fetch(oembedUrl, { signal: controller.signal });
    clearTimeout(timeout);
    if (!res.ok) return null;
    const json = (await res.json()) as { thumbnail_url?: string };
    return json.thumbnail_url ?? null;
  } catch {
    return null;
  }
}

// Pulls the first usable preview image out of a page's <meta> tags.
// Checked in priority order — secure_url first (https, always safe to
// hotlink-fetch), then plain og:image, then the Twitter Card fallback
// most non-Facebook hosts (Instagram, TikTok, etc) also set.
function extractImageUrl(html: string): string | null {
  const patterns = [
    /<meta[^>]+property=["']og:image:secure_url["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i,
    // Some pages put content before property/name — try the reverse order too.
    /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i,
  ];
  for (const re of patterns) {
    const match = html.match(re);
    if (match?.[1]) return match[1].replace(/&amp;/g, "&");
  }
  return null;
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { url } = (await req.json()) as { url?: string };
    if (!url || !/^https?:\/\//i.test(url)) {
      return NextResponse.json({ error: "A valid http(s) URL is required." }, { status: 400 });
    }

    // 1. For Facebook links, try the oEmbed endpoint first — it returns a
    //    thumbnail_url directly and doesn't depend on Facebook's page HTML
    //    carrying an og:image tag (reels often don't, since that page is
    //    largely client-rendered).
    let imageUrl: string | null = null;
    if (isFacebookUrl(url)) {
      imageUrl = await fetchFacebookThumbnail(url);
    }

    // 2. Fall back to scraping og:image / twitter:image out of the page's
    //    HTML — this is the only option for non-Facebook hosts, and a
    //    backup for Facebook links the oEmbed endpoint doesn't recognize.
    if (!imageUrl) {
      let html: string;
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
        const pageRes = await fetch(url, {
          signal: controller.signal,
          headers: {
            "User-Agent": "Mozilla/5.0 (compatible; KrantasThumbnailBot/1.0; +https://krantas.lt)",
            "Accept": "text/html",
          },
        });
        clearTimeout(timeout);
        if (!pageRes.ok) {
          return NextResponse.json(
            { error: `Couldn't load that page (status ${pageRes.status}). It may require login, or block automated requests.` },
            { status: 422 },
          );
        }
        html = await pageRes.text();
      } catch {
        return NextResponse.json(
          { error: "Couldn't reach that URL — check the link, or upload a thumbnail manually." },
          { status: 422 },
        );
      }
      imageUrl = extractImageUrl(html);
    }

    if (!imageUrl) {
      return NextResponse.json(
        { error: "No preview image found for that link — the reel may be private, or the host doesn't publish one. Try uploading a thumbnail manually." },
        { status: 404 },
      );
    }

    // Download the actual preview image.
    let input: Buffer;
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
      const imgRes = await fetch(imageUrl, { signal: controller.signal });
      clearTimeout(timeout);
      if (!imgRes.ok) {
        return NextResponse.json({ error: `Couldn't download the preview image (status ${imgRes.status}).` }, { status: 422 });
      }
      input = Buffer.from(await imgRes.arrayBuffer());
    } catch {
      return NextResponse.json({ error: "Couldn't download the preview image." }, { status: 422 });
    }

    if (input.length === 0) {
      return NextResponse.json({ error: "Preview image came back empty — try uploading a thumbnail manually." }, { status: 422 });
    }

    let buffer: Buffer;
    try {
      const sharp = (await import("sharp")).default;
      buffer = await sharp(input)
        .rotate()
        .resize({ width: POSTER_MAX_WIDTH, withoutEnlargement: true, fit: "inside" })
        .webp({ quality: WEBP_QUALITY })
        .toBuffer();
      if (buffer.length < 100) {
        return NextResponse.json({ error: "Couldn't process that preview image — try uploading a thumbnail manually." }, { status: 422 });
      }
    } catch {
      return NextResponse.json({ error: "Couldn't process that preview image — try uploading a thumbnail manually." }, { status: 422 });
    }

    const contentType = IMAGE_OUTPUT_TYPE;
    const ext = IMAGE_OUTPUT_EXT;
    const path = `reel-thumb-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const supabase = adminClient();
    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(path, buffer, { contentType, cacheControl: "3600", upsert: false });

    if (error) {
      return NextResponse.json({ error: `Supabase storage error: ${error.message}` }, { status: 500 });
    }

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
    return NextResponse.json({ url: data.publicUrl });
  } catch (e: unknown) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
