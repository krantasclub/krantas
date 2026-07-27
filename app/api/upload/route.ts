// app/api/upload/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import {
  MAX_IMAGE_BYTES, MAX_IMAGE_MB,
  IMAGE_OUTPUT_EXT, IMAGE_OUTPUT_TYPE, WEBP_QUALITY, POSTER_MAX_WIDTH,
} from "@/lib/upload-limits";

// sharp needs the Node.js runtime (it can't run on the edge runtime).
export const runtime = "nodejs";

// Verify the caller is a logged-in admin. The proxy matcher excludes /api,
// so this endpoint must guard itself — otherwise anyone could upload to storage.
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

// Service role client — bypasses RLS, runs only on the server
function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  if (!url || !key) throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY env var");
  return createClient(url, key, { auth: { persistSession: false } });
}

const BUCKET = "events";

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const form = await req.formData();
    const file = form.get("file") as File | null;
    const prefix = (form.get("prefix") as string | null) ?? "";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const ext_hint = file.name.split(".").pop()?.toLowerCase() ?? "";
    const type = file.type || (
      ["jpg", "jpeg"].includes(ext_hint) ? "image/jpeg" :
      ext_hint === "png"  ? "image/png"  :
      ext_hint === "webp" ? "image/webp" :
      ext_hint === "gif"  ? "image/gif"  :
      ext_hint === "avif" ? "image/avif" :
      ""
    );
    const isImage = type.startsWith("image/");

    if (!isImage) {
      return NextResponse.json(
        { error: `Unsupported file type "${type || ext_hint || "unknown"}". Allowed: JPG, PNG, WebP, GIF, AVIF.` },
        { status: 415 },
      );
    }

    if (file.size > MAX_IMAGE_BYTES) {
      return NextResponse.json(
        { error: `Image too large (max ${MAX_IMAGE_MB} MB)` },
        { status: 413 },
      );
    }

    const input = Buffer.from(await file.arrayBuffer());
    if (input.length === 0) {
      return NextResponse.json(
        { error: "File is empty — try uploading again." },
        { status: 400 },
      );
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
        return NextResponse.json(
          { error: `WebP conversion returned an empty file (${file.type}). Try JPG or PNG.` },
          { status: 422 },
        );
      }
    } catch (sharpErr: unknown) {
      const detail = sharpErr instanceof Error ? sharpErr.message : String(sharpErr);
      return NextResponse.json(
        { error: `Failed to convert image to WebP (${type}): ${detail}. Try JPG or PNG.` },
        { status: 422 },
      );
    }

    const contentType = IMAGE_OUTPUT_TYPE;
    const ext = IMAGE_OUTPUT_EXT;
    const path = `${prefix}${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const supabase = adminClient();
    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(path, buffer, { contentType, cacheControl: "3600", upsert: false });

    if (error) {
      return NextResponse.json(
        { error: `Supabase storage error: ${error.message}` },
        { status: 500 },
      );
    }

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
    return NextResponse.json({ url: data.publicUrl });
  } catch (e: unknown) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
