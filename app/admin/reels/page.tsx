"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import {
  MAX_VIDEO_BYTES,
  MAX_VIDEO_MB,
  ALLOWED_VIDEO_TYPES,
  ALLOWED_VIDEO_EXT,
} from "@/lib/upload-limits";

type ReelSource = "upload" | "facebook" | "url";

type Row = {
  id?: string;
  sort_order: number;
  label: string;
  source: ReelSource;
  reel_url: string;
  thumbnail_url: string;
  color_from: string;
  color_to: string;
};

const EMPTY: Omit<Row, "sort_order"> = {
  label: "",
  source: "facebook",
  reel_url: "",
  thumbnail_url: "",
  color_from: "#12494b",
  color_to: "#0a0c0d",
};

const REEL_BUCKET = "reels";

const inp = "bg-transparent border-0 border-b border-[rgba(236,231,221,0.3)] text-[#ece7dd] py-1.5 text-sm outline-none w-full focus:border-[#ff8a1e] transition-colors font-mono";
const lbl = "block text-[9px] tracking-[0.28em] uppercase text-[#9aa19d] mb-1";

// A Facebook reel link looks like facebook.com/reel/<id> or
// facebook.com/<page>/videos/<id> — just a loose sanity check, not
// full validation, so we don't block legitimate variants.
function looksLikeFacebookUrl(url: string): boolean {
  return /facebook\.com|fb\.watch/i.test(url.trim());
}

// Cover/thumbnail images: goes through /api/upload (server-side, converted
// to WebP, stored in the existing "events" bucket) — same path video
// thumbnails and event posters already use.
async function uploadThumbnail(file: File): Promise<string> {
  const body = new FormData();
  body.append("file", file);
  body.append("prefix", "reel-thumb-");
  const res = await fetch("/api/upload", { method: "POST", body });
  const json = await res.json();
  if (!res.ok || json.error) throw new Error(json.error ?? "Upload failed");
  return json.url as string;
}

// Auto-fetches a thumbnail by reading the reel page's og:image meta tag
// server-side (see app/api/reel-thumbnail/route.ts) — works for Facebook,
// Instagram, TikTok and most other hosts that publish a share preview
// image, no manual screenshot needed. Falls through to a clear error if
// the page can't be reached or doesn't publish one.
async function autoFetchThumbnail(url: string): Promise<string> {
  const res = await fetch("/api/reel-thumbnail", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });
  const json = await res.json();
  if (!res.ok || json.error) throw new Error(json.error ?? "Couldn't fetch a thumbnail");
  return json.url as string;
}

// Reel file: uploaded straight from the browser to the "reels" Storage
// bucket, same reasoning as /admin/videos — keeps large clips out of
// the serverless function body-size limit.
async function uploadReelFile(file: File): Promise<string> {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "mp4";
  const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const { error } = await supabase.storage
    .from(REEL_BUCKET)
    .upload(path, file, { contentType: file.type || undefined, cacheControl: "3600", upsert: false });
  if (error) throw new Error(error.message);
  const { data } = supabase.storage.from(REEL_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

// Grabs a frame from an uploaded file (client-side, via a hidden <video> +
// <canvas>) so admins don't have to screenshot anything themselves. Seeks a
// touch past the very start so the frame isn't just a black flash-in. Runs
// entirely in the browser — nothing is uploaded to generate this preview.
// Returns null (silently) if capture fails for any reason; the card just
// falls back to showing the video itself as its own "poster" instead.
async function captureVideoThumbnail(file: File): Promise<File | null> {
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

    // Big/slow files shouldn't hang the upload — bail out after a few
    // seconds and just skip the auto-thumbnail.
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
          (blob) => finish(blob ? new File([blob], "thumb.jpg", { type: "image/jpeg" }) : null),
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

function ErrorBox({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  return (
    <div className="bg-[#2a1210] border border-[#7a1f2b]/60 px-4 py-3.5 mb-5 flex items-start justify-between gap-3">
      <div className="text-xs text-[#e5837f] leading-relaxed font-mono">
        <strong>Error:</strong> {message}
      </div>
      <button onClick={onDismiss} className="bg-transparent border-0 cursor-pointer text-[#e5837f] text-base leading-none shrink-0">×</button>
    </div>
  );
}

function toPayload(r: Row) {
  const payload: Partial<Row> = { ...r };
  delete payload.id;
  return payload;
}

export default function ReelsAdmin() {
  const [rows, setRows] = useState<Row[]>([]);
  const [fetching, setFetching] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploadingThumb, setUploadingThumb] = useState<number | null>(null);
  const [autoFetchingThumb, setAutoFetchingThumb] = useState<number | null>(null);
  const [uploadingReel, setUploadingReel] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<"order" | "label">("order");
  const thumbInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const reelInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    supabase
      .from("reels")
      .select("*")
      .order("sort_order")
      .then(({ data, error: err }) => {
        if (err) setError(err.message);
        if (data) {
          setRows(
            (data as (Row & { thumbnail_url: string | null })[]).map((d) => ({
              ...d,
              thumbnail_url: d.thumbnail_url ?? "",
            }))
          );
        }
        setFetching(false);
      });
  }, []);

  async function saveRow(row: Row) {
    const key = row.id ?? "new";
    setSaving(key);
    setError(null);
    const payload = toPayload(row);
    let err;
    if (row.id) {
      ({ error: err } = await supabase.from("reels").update(payload).eq("id", row.id));
    } else {
      const { data, error: ie } = await supabase.from("reels").insert(payload).select().single();
      err = ie;
      if (data) setRows((rs) => rs.map((r) => (r === row ? { ...r, id: data.id } : r)));
    }
    if (err) {
      setError(err.message);
      setSaving(null);
      return;
    }
    setSaved(key);
    setTimeout(() => setSaved(null), 2000);
    setSaving(null);
  }

  async function deleteRow(id: string) {
    if (!confirm("Delete this reel?")) return;
    await supabase.from("reels").delete().eq("id", id);
    setRows((rs) => rs.filter((r) => r.id !== id));
  }

  function update(idx: number, field: keyof Row, val: string | number) {
    setRows((rs) => rs.map((r, i) => (i === idx ? { ...r, [field]: val } : r)));
  }

  function move(idx: number, dir: -1 | 1) {
    setRows((rs) => {
      const next = [...rs];
      const j = idx + dir;
      if (j < 0 || j >= next.length) return rs;
      [next[idx], next[j]] = [next[j], next[idx]];
      return next.map((r, i) => ({ ...r, sort_order: i }));
    });
  }

  function handleThumbUpload(idx: number, file: File) {
    setUploadingThumb(idx);
    setError(null);
    uploadThumbnail(file)
      .then(async (url) => {
        update(idx, "thumbnail_url", url);
        await saveRow({ ...rows[idx], thumbnail_url: url });
      })
      .catch((e: unknown) => setError((e as Error).message))
      .finally(() => setUploadingThumb(null));
  }

  function handleAutoFetchThumb(idx: number) {
    const row = rows[idx];
    if (!row.reel_url) return;
    setAutoFetchingThumb(idx);
    setError(null);
    autoFetchThumbnail(row.reel_url)
      .then(async (url) => {
        update(idx, "thumbnail_url", url);
        await saveRow({ ...rows[idx], thumbnail_url: url });
      })
      .catch((e: unknown) => setError((e as Error).message))
      .finally(() => setAutoFetchingThumb(null));
  }

  function validateAndUploadReel(idx: number, file: File) {
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
    const typeOk = ALLOWED_VIDEO_TYPES.includes(file.type) || ALLOWED_VIDEO_EXT.includes(ext);
    if (!typeOk) {
      setError(`Unsupported file type "${file.type || ext.toUpperCase()}". Use MP4, WebM, MOV or OGG.`);
      return;
    }
    if (file.size > MAX_VIDEO_BYTES) {
      setError(`File too large (max ${MAX_VIDEO_MB} MB). Try a smaller export or a lower bitrate.`);
      return;
    }
    setUploadingReel(idx);
    setError(null);
    Promise.all([uploadReelFile(file), captureVideoThumbnail(file)])
      .then(async ([url, thumbFile]) => {
        let thumbnail_url = rows[idx].thumbnail_url;
        if (thumbFile && !thumbnail_url) {
          try {
            thumbnail_url = await uploadThumbnail(thumbFile);
          } catch {
            // Non-fatal — the card just falls back to showing the clip
            // itself as its own preview if the auto-thumbnail upload fails.
          }
        }
        const row = { ...rows[idx], reel_url: url, source: "upload" as ReelSource, thumbnail_url };
        setRows((rs) => rs.map((r, i) => (i === idx ? row : r)));
        await saveRow(row);
      })
      .catch((e: unknown) => setError((e as Error).message))
      .finally(() => setUploadingReel(null));
  }

  if (fetching) {
    return (
      <div className="min-h-screen bg-[#0a0c0d] flex items-center justify-center font-mono text-[#9aa19d] text-sm">
        Loading...
      </div>
    );
  }

  // Sorting the on-screen list by label is a view-only convenience — it
  // doesn't touch sort_order, so switching back to "Manual order" always
  // shows the real Reels-tab order untouched.
  const displayRows = [...rows.map((r, i) => ({ r, i }))].sort((a, b) => {
    if (sortBy === "label") return a.r.label.localeCompare(b.r.label) || a.i - b.i;
    return a.i - b.i;
  });

  return (
    <div className="min-h-screen bg-[#0a0c0d] px-6 py-14 font-mono">
      <div className="max-w-[820px] mx-auto">
        <div className="flex items-center gap-3 mb-10">
          <Link href="/admin" className="text-[11px] tracking-[0.22em] uppercase text-[#ff8a1e]">← Back</Link>
          <span className="text-[rgba(236,231,221,0.3)]">/</span>
          <span className="font-display text-2xl tracking-[0.08em] uppercase text-[#ece7dd]">Reels</span>
        </div>

        {error && <ErrorBox message={error} onDismiss={() => setError(null)} />}

        <p className="text-xs text-[#9aa19d] mb-6 leading-relaxed">
          Clips shown in the sticky <strong className="text-[#ece7dd]">Reels</strong> tab on the right edge of
          the site. Each reel can be uploaded directly, pasted in as a Facebook reel link, or any other URL
          (Instagram, TikTok, a direct file link). Uploads, direct file links, and Facebook reels all play in a
          lightbox on the site itself when clicked — Facebook reels use Facebook&apos;s own embed widget, which
          only works when the poster hasn&apos;t disabled embedding (common for some personal posts); those show
          an &quot;Open on Facebook&quot; link as a fallback instead. Any other URL (Instagram, TikTok, etc) opens
          on its own site, since there&apos;s no equivalent embed available for those here. Use &quot;Auto-fetch
          thumbnail&quot; to pull a preview image straight from the link, or upload one manually. Use the arrows
          to set the order reels appear in; the sort buttons below just change how this list is displayed while
          you edit, they don&apos;t change the tab order.
        </p>

        <div className="flex items-center gap-2 mb-6">
          <span className={lbl + " mb-0"}>View sorted by:</span>
          {(["order", "label"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setSortBy(s)}
              className={`text-[10px] tracking-[0.14em] uppercase px-2.5 py-1.5 border transition-colors ${
                sortBy === s
                  ? "border-[#ff8a1e] text-[#ff8a1e]"
                  : "border-[rgba(236,231,221,0.3)] text-[#9aa19d] hover:text-[#ece7dd]"
              }`}
            >
              {s === "order" ? "Manual order" : "Label"}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-4">
          {displayRows.map(({ r: row, i: idx }) => {
            const uploadKey = idx;
            return (
              <div key={row.id ?? idx} className="bg-[#12181a] border border-[rgba(236,231,221,0.14)] p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex flex-col gap-1 shrink-0">
                    <button
                      onClick={() => move(idx, -1)}
                      disabled={idx === 0 || sortBy !== "order"}
                      title={sortBy !== "order" ? "Switch to Manual order to reorder" : undefined}
                      className="w-6 h-6 flex items-center justify-center border border-[rgba(236,231,221,0.3)] text-[#9aa19d] hover:text-[#ece7dd] hover:border-[#ff8a1e] disabled:opacity-30 disabled:cursor-not-allowed"
                      aria-label="Move up"
                    >
                      ↑
                    </button>
                    <button
                      onClick={() => move(idx, 1)}
                      disabled={idx === rows.length - 1 || sortBy !== "order"}
                      title={sortBy !== "order" ? "Switch to Manual order to reorder" : undefined}
                      className="w-6 h-6 flex items-center justify-center border border-[rgba(236,231,221,0.3)] text-[#9aa19d] hover:text-[#ece7dd] hover:border-[#ff8a1e] disabled:opacity-30 disabled:cursor-not-allowed"
                      aria-label="Move down"
                    >
                      ↓
                    </button>
                  </div>

                  <div
                    onClick={() => thumbInputRefs.current[idx]?.click()}
                    title="Click to upload a custom thumbnail"
                    className="relative w-16 h-16 shrink-0 overflow-hidden border border-dashed border-[rgba(236,231,221,0.3)] cursor-pointer flex items-center justify-center"
                    style={
                      row.thumbnail_url
                        ? { backgroundImage: `url(${row.thumbnail_url})`, backgroundSize: "cover", backgroundPosition: "center", borderStyle: "solid" }
                        : { background: `linear-gradient(155deg, ${row.color_from}, ${row.color_to})` }
                    }
                  >
                    {!row.thumbnail_url && <span className="text-sm opacity-40 text-[#ece7dd]">+</span>}
                    {uploadingThumb === idx && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-[9px] text-[#ece7dd]">…</div>
                    )}
                  </div>
                  <input
                    ref={(el) => { thumbInputRefs.current[idx] = el; }}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (!f) return;
                      const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"];
                      if (!allowed.includes(f.type)) {
                        setError(`Unsupported file type "${f.type || f.name.split(".").pop()?.toUpperCase()}". Use JPG, PNG, WebP, GIF or AVIF.`);
                        e.target.value = "";
                        return;
                      }
                      handleThumbUpload(idx, f);
                      e.target.value = "";
                    }}
                  />

                  <div className="flex-1">
                    <label className={lbl}>Label</label>
                    <input className={inp} value={row.label} onChange={(e) => update(idx, "label", e.target.value)} placeholder="Reel — 05" />
                  </div>
                </div>

                {row.thumbnail_url && (
                  <div className="pl-9 -mt-2 mb-4">
                    <button
                      onClick={() => update(idx, "thumbnail_url", "")}
                      className="text-[10px] tracking-[0.16em] uppercase text-[#9aa19d] hover:text-[#e5837f]"
                    >
                      Remove custom thumbnail
                    </button>
                  </div>
                )}

                {/* ── Reel source ────────────────────────────────────────── */}
                <div className="pl-9 mb-4">
                  <label className={lbl}>Reel source</label>
                  <div className="flex items-center gap-1 mb-2">
                    {(["upload", "facebook", "url"] as ReelSource[]).map((s) => (
                      <button
                        key={s}
                        onClick={() => update(idx, "source", s)}
                        className={`text-[9px] tracking-[0.14em] uppercase px-2 py-1 border transition-colors ${
                          row.source === s
                            ? "border-[#ff8a1e] text-[#ff8a1e]"
                            : "border-[rgba(236,231,221,0.3)] text-[#9aa19d] hover:text-[#ece7dd]"
                        }`}
                      >
                        {s === "upload" ? "Upload" : s === "facebook" ? "Facebook URL" : "Other URL"}
                      </button>
                    ))}
                  </div>

                  {row.source === "upload" ? (
                    <>
                      <input
                        ref={(el) => { reelInputRefs.current[idx] = el; }}
                        type="file"
                        accept="video/mp4,video/webm,video/ogg,video/quicktime,.mp4,.webm,.ogg,.mov,.m4v"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (!f) return;
                          validateAndUploadReel(idx, f);
                          e.target.value = "";
                        }}
                      />
                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          onClick={() => reelInputRefs.current[idx]?.click()}
                          disabled={uploadingReel === uploadKey}
                          className="border border-[rgba(236,231,221,0.3)] text-[#9aa19d] hover:text-[#ece7dd] hover:border-[#ff8a1e] text-[10px] tracking-[0.16em] uppercase px-3 py-1.5 disabled:opacity-40"
                        >
                          {uploadingReel === uploadKey ? "Uploading..." : row.reel_url ? "Replace file" : "Upload file"}
                        </button>
                        {row.reel_url && <video controls src={row.reel_url} className="h-24 max-w-[140px]" />}
                      </div>
                      <p className="text-[10px] text-[#6b716e] mt-1.5">Max {MAX_VIDEO_MB} MB — MP4, WebM, MOV or OGG. A thumbnail is grabbed from the clip automatically; upload one above to override it.</p>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center gap-2">
                        <input
                          className={inp}
                          value={row.reel_url}
                          onChange={(e) => update(idx, "reel_url", e.target.value)}
                          onBlur={() => {
                            // Auto-fetch as soon as a link is pasted in, so
                            // admins don't have to remember to press the
                            // button — it only fires if there's no
                            // thumbnail yet, so it won't clobber one that
                            // was already set (auto-fetched or uploaded).
                            if (row.reel_url && !row.thumbnail_url) handleAutoFetchThumb(idx);
                          }}
                          placeholder={row.source === "facebook" ? "https://www.facebook.com/reel/..." : "https://..."}
                        />
                        <button
                          onClick={() => handleAutoFetchThumb(idx)}
                          disabled={!row.reel_url || autoFetchingThumb === idx}
                          title="Fetch a thumbnail automatically from this link's preview image"
                          className="shrink-0 whitespace-nowrap border border-[rgba(236,231,221,0.3)] text-[#9aa19d] hover:text-[#ece7dd] hover:border-[#ff8a1e] text-[9px] tracking-[0.14em] uppercase px-2.5 py-1.5 disabled:opacity-40"
                        >
                          {autoFetchingThumb === idx ? "Fetching…" : "Auto-fetch thumbnail"}
                        </button>
                      </div>
                      {row.source === "facebook" && row.reel_url && !looksLikeFacebookUrl(row.reel_url) && (
                        <p className="text-[10px] text-[#e5837f] mt-1.5">Doesn&apos;t look like a Facebook link — double check it&apos;s from facebook.com or fb.watch.</p>
                      )}
                      {row.source === "url" && (
                        <p className="text-[10px] text-[#6b716e] mt-1.5">
                          A direct file link (ending .mp4, .webm, .mov) plays inline; anything else (Instagram, TikTok, etc) plays inside the site via an embed where the host allows it.
                        </p>
                      )}
                    </>
                  )}
                </div>

                <div className="grid sm:grid-cols-2 gap-4 mb-5 pl-9">
                  <div>
                    <label className={lbl}>Card gradient — from</label>
                    <div className="flex items-center gap-2">
                      <input type="color" value={row.color_from} onChange={(e) => update(idx, "color_from", e.target.value)} className="w-8 h-8 bg-transparent border border-[rgba(236,231,221,0.3)] cursor-pointer" />
                      <input className={inp} value={row.color_from} onChange={(e) => update(idx, "color_from", e.target.value)} />
                    </div>
                  </div>
                  <div>
                    <label className={lbl}>Card gradient — to</label>
                    <div className="flex items-center gap-2">
                      <input type="color" value={row.color_to} onChange={(e) => update(idx, "color_to", e.target.value)} className="w-8 h-8 bg-transparent border border-[rgba(236,231,221,0.3)] cursor-pointer" />
                      <input className={inp} value={row.color_to} onChange={(e) => update(idx, "color_to", e.target.value)} />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-4 mt-4 border-t border-[rgba(236,231,221,0.14)]">
                  <button
                    onClick={() => saveRow(row)}
                    disabled={saving === (row.id ?? "new")}
                    className="bg-[#ff8a1e] text-[#12100c] text-[10px] tracking-[0.16em] uppercase px-4 py-2 disabled:opacity-50"
                  >
                    {saved === (row.id ?? "new") ? "✓ Saved" : "Save"}
                  </button>
                  {row.id && (
                    <button
                      onClick={() => deleteRow(row.id!)}
                      className="border border-[#7a1f2b]/60 text-[#e5837f] text-[10px] tracking-[0.16em] uppercase px-4 py-2"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          <button
            onClick={() => setRows((rs) => [...rs, { ...EMPTY, sort_order: rs.length }])}
            className="border border-dashed border-[rgba(236,231,221,0.3)] w-full py-4 text-[11px] tracking-[0.2em] uppercase text-[#9aa19d] hover:text-[#ece7dd] hover:border-[#ff8a1e] transition-colors"
          >
            + Add reel
          </button>
        </div>
      </div>
    </div>
  );
}
