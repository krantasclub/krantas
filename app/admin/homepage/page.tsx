"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import {
  MAX_HERO_VIDEO_BYTES,
  MAX_HERO_VIDEO_MB,
  ALLOWED_VIDEO_TYPES,
  ALLOWED_VIDEO_EXT,
} from "@/lib/upload-limits";

type HomepageRow = {
  marquee_text: string;
  statement_eyebrow: string;
  statement_heading: string;
  statement_body: string;
  hero_video_url: string;
  hero_video_type: string;
  hero_poster_url: string;
  hide_artists: boolean;
};

const EMPTY: HomepageRow = {
  marquee_text: "",
  statement_eyebrow: "",
  statement_heading: "",
  statement_body: "",
  hero_video_url: "",
  hero_video_type: "",
  hero_poster_url: "",
  hide_artists: false,
};

// Same "videos" Storage bucket the Videos admin page uses for filmed sets —
// keeps every large media upload in one place.
const VIDEO_BUCKET = "videos";

// Video file itself: uploaded straight from the browser to Storage, same
// reasoning as app/admin/videos/page.tsx — keeps large files out of the
// Next.js function body-size limit. Callers must check MAX_HERO_VIDEO_BYTES
// first; this only enforces the type.
async function uploadHeroVideoFile(file: File): Promise<string> {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "mp4";
  const path = `hero-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const { error } = await supabase.storage
    .from(VIDEO_BUCKET)
    .upload(path, file, { contentType: file.type || undefined, cacheControl: "3600", upsert: false });
  if (error) throw new Error(error.message);
  const { data } = supabase.storage.from(VIDEO_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

// Poster/fallback image: goes through /api/upload (server-side, converted
// to WebP + resized) — same path video thumbnails already use, so it stays
// small no matter how big the source frame is.
async function uploadHeroPoster(file: File): Promise<string> {
  const body = new FormData();
  body.append("file", file);
  body.append("prefix", "hero-poster-");
  const res = await fetch("/api/upload", { method: "POST", body });
  const json = await res.json();
  if (!res.ok || json.error) throw new Error(json.error ?? "Poster upload failed");
  return json.url as string;
}

// Grabs a frame from the uploaded clip (client-side, via a hidden <video> +
// <canvas>) so admins don't have to make their own poster image — it's
// shown while the real video loads, and to anyone with autoplay blocked.
// Runs entirely in the browser; returns null (silently) on any failure, in
// which case the previous/default poster is just kept as-is.
async function captureVideoFrame(file: File): Promise<File | null> {
  return new Promise((resolve) => {
    const objectUrl = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.muted = true;
    video.playsInline = true;
    video.preload = "metadata";
    video.src = objectUrl;

    let settled = false;
    const finish = (result: File | null) => {
      if (settled) return;
      settled = true;
      URL.revokeObjectURL(objectUrl);
      resolve(result);
    };

    // Don't let a slow/odd file hang the save — skip the auto-poster.
    const timeout = setTimeout(() => finish(null), 6000);

    video.onloadedmetadata = () => {
      try {
        video.currentTime = Math.min(1, (video.duration || 2) / 4);
      } catch {
        clearTimeout(timeout);
        finish(null);
      }
    };
    video.onseeked = () => {
      clearTimeout(timeout);
      try {
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        if (canvas.width === 0 || canvas.height === 0) {
          finish(null);
          return;
        }
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          finish(null);
          return;
        }
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(
          (blob) => finish(blob ? new File([blob], "hero-frame.jpg", { type: "image/jpeg" }) : null),
          "image/jpeg",
          0.85
        );
      } catch {
        finish(null);
      }
    };
    video.onerror = () => {
      clearTimeout(timeout);
      finish(null);
    };
  });
}

const inp =
  "bg-transparent border-0 border-b border-[rgba(236,231,221,0.3)] text-[#ece7dd] py-1.5 text-sm outline-none w-full focus:border-[#ff8a1e] transition-colors font-mono";
const textarea =
  "bg-[#0a0c0d] border border-[rgba(236,231,221,0.2)] text-[#ece7dd] p-3 text-sm outline-none w-full focus:border-[#ff8a1e] transition-colors font-mono resize-y";
const lbl = "block text-[9px] tracking-[0.28em] uppercase text-[#9aa19d] mb-1";
const hint = "text-[11px] text-[#5f6663] mt-1 leading-relaxed";
const card = "bg-[#12181a] border border-[rgba(236,231,221,0.14)] p-5";

function ErrorBox({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  return (
    <div className="bg-[#2a1210] border border-[#7a1f2b]/60 px-4 py-3.5 mb-5 flex items-start justify-between gap-3">
      <div className="text-xs text-[#e5837f] leading-relaxed font-mono">
        <strong>Error:</strong> {message}
      </div>
      <button onClick={onDismiss} className="bg-transparent border-0 cursor-pointer text-[#e5837f] text-base leading-none shrink-0">
        ×
      </button>
    </div>
  );
}

export default function HomepageAdmin() {
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [row, setRow] = useState<HomepageRow>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploadingHero, setUploadingHero] = useState(false);

  useEffect(() => {
    supabase
      .from("homepage_content")
      .select("*")
      .eq("id", 1)
      .maybeSingle()
      .then(({ data, error: err }) => {
        if (err) setError(err.message);
        else if (data)
          setRow({
            marquee_text: data.marquee_text ?? "",
            statement_eyebrow: data.statement_eyebrow ?? "",
            statement_heading: data.statement_heading ?? "",
            statement_body: data.statement_body ?? "",
            hero_video_url: data.hero_video_url ?? "",
            hero_video_type: data.hero_video_type ?? "",
            hero_poster_url: data.hero_poster_url ?? "",
            hide_artists: data.hide_artists ?? false,
          });
        setFetching(false);
      });
  }, []);

  async function save() {
    setSaving(true);
    setError(null);
    const { error: err } = await supabase
      .from("homepage_content")
      .update({ ...row, updated_at: new Date().toISOString() })
      .eq("id", 1);
    if (err) {
      setError(err.message);
    } else {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
    setSaving(false);
  }

  async function handleHeroVideoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file later
    if (!file) return;

    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
    if (!ALLOWED_VIDEO_TYPES.includes(file.type) && !ALLOWED_VIDEO_EXT.includes(ext)) {
      setError(`Unsupported file type. Allowed: ${ALLOWED_VIDEO_EXT.join(", ").toUpperCase()}`);
      return;
    }
    if (file.size > MAX_HERO_VIDEO_BYTES) {
      setError(
        `Video too large (max ${MAX_HERO_VIDEO_MB} MB) — this loops on every visitor's first load, so compress it ` +
          `first (shorter clip, lower bitrate, strip the audio track) and try again.`
      );
      return;
    }

    setUploadingHero(true);
    setError(null);
    try {
      // Video upload and poster-frame capture don't depend on each other,
      // so run them together instead of waiting on one before starting
      // the other.
      const [videoUrl, frameFile] = await Promise.all([
        uploadHeroVideoFile(file),
        captureVideoFrame(file),
      ]);
      let posterUrl = row.hero_poster_url;
      if (frameFile) {
        try {
          posterUrl = await uploadHeroPoster(frameFile);
        } catch {
          // Keep whatever poster was already set — the video itself still
          // works fine without an auto-captured poster.
        }
      }
      setRow((r) => ({ ...r, hero_video_url: videoUrl, hero_video_type: file.type || "", hero_poster_url: posterUrl }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploadingHero(false);
    }
  }

  function resetHeroVideo() {
    setRow((r) => ({ ...r, hero_video_url: "", hero_video_type: "", hero_poster_url: "" }));
  }

  if (fetching) {
    return (
      <div className="min-h-screen bg-[#0a0c0d] flex items-center justify-center font-mono text-[#9aa19d] text-sm">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0c0d] px-6 py-14 font-mono">
      <div className="max-w-[760px] mx-auto">
        <div className="flex items-center gap-3 mb-10 flex-wrap">
          <Link href="/admin" className="text-[11px] tracking-[0.22em] uppercase text-[#ff8a1e]">
            ← Control panel
          </Link>
          <span className="text-[rgba(236,231,221,0.3)]">/</span>
          <span className="font-display text-2xl tracking-[0.08em] uppercase text-[#ece7dd]">Homepage</span>
        </div>

        {error && <ErrorBox message={error} onDismiss={() => setError(null)} />}

        <div className={card + " mb-8"}>
          <p className="text-xs text-[#9aa19d] mb-5 leading-relaxed">
            Hides the artist roster across the whole site: the &quot;Artists&quot; link disappears from the header,
            the line-up on the homepage is skipped, the Artists page itself redirects home, and the &quot;Which
            artist&quot; picker on the Book us form is left off.
          </p>
          <label className="inline-flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              className="w-4 h-4 accent-[#ff8a1e]"
              checked={row.hide_artists}
              onChange={(e) => setRow({ ...row, hide_artists: e.target.checked })}
            />
            <span className="text-xs text-[#ece7dd] tracking-[0.04em]">Hide artists site-wide</span>
          </label>
        </div>

        <div className={card + " mb-8"}>
          <p className="text-xs text-[#9aa19d] mb-5 leading-relaxed">
            The orange scrolling strip shown just below the header on the homepage. Leave blank to fall back to the
            placeholder text.
          </p>
          <div>
            <label className={lbl}>Strip text</label>
            <input
              className={inp}
              value={row.marquee_text}
              onChange={(e) => setRow({ ...row, marquee_text: e.target.value })}
              placeholder="Riptide · 09 Aug — doors 23:00, Krantas main floor"
            />
            <p className={hint}>Repeats across the strip, separated by a ◆.</p>
          </div>
        </div>

        <div className={card + " mb-8"}>
          <p className="text-xs text-[#9aa19d] mb-5 leading-relaxed">
            The looping video behind the KRANTAS title at the very top of the homepage. It autoplays muted for every
            visitor, so keep it short and compressed — a heavy file slows down the whole page. Leave empty to use
            the built-in venue footage.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 items-start">
            <div className="w-full sm:w-56 aspect-video bg-black overflow-hidden border border-[rgba(236,231,221,0.14)] shrink-0">
              {row.hero_video_url ? (
                <video
                  key={row.hero_video_url}
                  src={row.hero_video_url}
                  poster={row.hero_poster_url || "/hero-poster.webp"}
                  className="w-full h-full object-cover"
                  muted
                  loop
                  playsInline
                  autoPlay
                />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element -- static preview of the bundled fallback asset
                <img src="/hero-poster.webp" alt="Default hero footage" className="w-full h-full object-cover" />
              )}
            </div>

            <div className="flex-1 flex flex-col gap-2">
              <label
                className={`inline-flex items-center gap-2 bg-[#1a2224] border border-[rgba(236,231,221,0.2)] text-[#ece7dd] text-[10px] tracking-[0.16em] uppercase px-4 py-2.5 w-fit transition-colors ${
                  uploadingHero ? "opacity-60" : "cursor-pointer hover:border-[#ff8a1e]"
                }`}
              >
                {uploadingHero ? "Uploading..." : row.hero_video_url ? "Replace video" : "Upload video"}
                <input
                  type="file"
                  accept={ALLOWED_VIDEO_TYPES.join(",")}
                  className="hidden"
                  disabled={uploadingHero}
                  onChange={handleHeroVideoChange}
                />
              </label>
              {row.hero_video_url && (
                <button
                  onClick={resetHeroVideo}
                  disabled={uploadingHero}
                  className="text-[10px] tracking-[0.16em] uppercase text-[#9aa19d] hover:text-[#e5837f] transition-colors w-fit disabled:opacity-50"
                >
                  Reset to default footage
                </button>
              )}
              <p className={hint}>
                Max {MAX_HERO_VIDEO_MB} MB — MP4, WebM, MOV or OGG. A poster frame is captured automatically and
                shown while the video loads (and to anyone with autoplay blocked). For best performance: 1080p or
                smaller, no audio track, a short loop (10–20s) at a moderate bitrate.
              </p>
            </div>
          </div>
        </div>

        <div className={card + " mb-8"}>
          <p className="text-xs text-[#9aa19d] mb-5 leading-relaxed">
            The text-only section between the Sets and Gallery carousels on the homepage — small label, then the big
            line, then the paragraph underneath it.
          </p>

          <div className="flex flex-col gap-4">
            <div>
              <label className={lbl}>Small label — above the big line</label>
              <input
                className={inp}
                value={row.statement_eyebrow}
                onChange={(e) => setRow({ ...row, statement_eyebrow: e.target.value })}
                placeholder="Build by the water. Driven by the sound."
              />
            </div>
            <div>
              <label className={lbl}>Big line</label>
              <textarea
                className={textarea}
                rows={2}
                value={row.statement_heading}
                onChange={(e) => setRow({ ...row, statement_heading: e.target.value })}
                placeholder="Powerful sound, industrial surroundings, and people who come for the music"
              />
            </div>
            <div>
              <label className={lbl}>Paragraph — underneath the big line</label>
              <textarea
                className={textarea}
                rows={4}
                value={row.statement_body}
                onChange={(e) => setRow({ ...row, statement_body: e.target.value })}
                placeholder="Rather than chasing trends, we invest in resident artists, immersive sound, and nights that evolve naturally - from the first record to the final track."
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end">
          <button
            onClick={save}
            disabled={saving}
            className="bg-[#ff8a1e] text-[#12100c] text-[10px] tracking-[0.16em] uppercase px-4 py-2 disabled:opacity-50"
          >
            {saved ? "✓ Saved" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
