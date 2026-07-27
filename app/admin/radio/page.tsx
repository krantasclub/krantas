"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import {
  MAX_AUDIO_BYTES,
  MAX_AUDIO_MB,
  ALLOWED_AUDIO_TYPES,
  ALLOWED_AUDIO_EXT,
} from "@/lib/upload-limits";

type Row = {
  id?: string;
  sort_order: number;
  season: string;
  episode: string;
  title: string;
  color_from: string;
  color_to: string;
  audio_url: string;
  image_url: string;
};

const EMPTY: Omit<Row, "sort_order"> = {
  season: "04",
  episode: "01",
  title: "",
  color_from: "#12494b",
  color_to: "#0a0c0d",
  audio_url: "",
  image_url: "",
};

const inp = "bg-transparent border-0 border-b border-[rgba(236,231,221,0.3)] text-[#ece7dd] py-1.5 text-sm outline-none w-full focus:border-[#ff8a1e] transition-colors font-mono";
const lbl = "block text-[9px] tracking-[0.28em] uppercase text-[#9aa19d] mb-1";

const BUCKET = "audio";
const IMAGE_ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"];

// Cover art: goes through /api/upload (server-side, converted to WebP,
// stored in the "events" bucket) — same path artists' portraits, event
// posters, and release covers already use.
async function uploadCover(file: File): Promise<string> {
  const body = new FormData();
  body.append("file", file);
  body.append("prefix", "radio-");
  const res = await fetch("/api/upload", { method: "POST", body });
  const json = await res.json();
  if (!res.ok || json.error) throw new Error(json.error ?? "Upload failed");
  return json.url as string;
}

// Audio goes straight from the browser to Supabase Storage rather than
// through /api/upload — a serverless function's request-body limit
// (a few MB) would reject anything but the shortest clip, whereas
// Storage's direct upload path handles a full DJ set fine. This does
// mean the "audio" bucket needs its own storage RLS policies (see
// supabase/schema.sql) letting a logged-in admin write to it.
async function uploadTrack(file: File, onProgress: (pct: number) => void): Promise<string> {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "mp3";
  const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  // supabase-js doesn't expose upload progress on the standard client,
  // so we show an indeterminate state instead of faking a percentage.
  onProgress(0);
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { contentType: file.type || undefined, cacheControl: "3600", upsert: false });
  onProgress(100);

  if (error) throw new Error(error.message);
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
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

export default function RadioAdmin() {
  const [rows, setRows] = useState<Row[]>([]);
  const [fetching, setFetching] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState<number | null>(null);
  const [uploadingCover, setUploadingCover] = useState<number | null>(null);
  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const coverInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    supabase
      .from("radio_episodes")
      .select("*")
      .order("sort_order")
      .then(({ data, error: err }) => {
        if (err) setError(err.message);
        if (data) setRows(data as Row[]);
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
      ({ error: err } = await supabase.from("radio_episodes").update(payload).eq("id", row.id));
    } else {
      const { data, error: ie } = await supabase.from("radio_episodes").insert(payload).select().single();
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
    if (!confirm("Delete this track?")) return;
    await supabase.from("radio_episodes").delete().eq("id", id);
    setRows((rs) => rs.filter((r) => r.id !== id));
  }

  function update(idx: number, field: keyof Row, val: string | number) {
    setRows((rs) => rs.map((r, i) => (i === idx ? { ...r, [field]: val } : r)));
  }

  async function handleFileUpload(idx: number, file: File) {
    setUploading(idx);
    setError(null);
    try {
      const url = await uploadTrack(file, () => {});
      update(idx, "audio_url", url);
      await saveRow({ ...rows[idx], audio_url: url });
    } catch (e: unknown) {
      setError((e as Error).message);
    } finally {
      setUploading(null);
    }
  }

  async function handleCoverUpload(idx: number, file: File) {
    if (!IMAGE_ALLOWED.includes(file.type)) {
      setError(`Unsupported file type "${file.type || file.name.split(".").pop()?.toUpperCase()}". Use JPG, PNG, WebP, GIF or AVIF.`);
      return;
    }
    setUploadingCover(idx);
    setError(null);
    try {
      const url = await uploadCover(file);
      update(idx, "image_url", url);
      await saveRow({ ...rows[idx], image_url: url });
    } catch (e: unknown) {
      setError((e as Error).message);
    } finally {
      setUploadingCover(null);
    }
  }

  function validateAndUpload(idx: number, file: File) {
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
    const typeOk = ALLOWED_AUDIO_TYPES.includes(file.type) || ALLOWED_AUDIO_EXT.includes(ext);
    if (!typeOk) {
      setError(`Unsupported file type "${file.type || ext.toUpperCase()}". Use MP3, WAV, M4A, AAC, OGG or FLAC.`);
      return;
    }
    if (file.size > MAX_AUDIO_BYTES) {
      setError(`File too large (max ${MAX_AUDIO_MB} MB). Try a lower bitrate export.`);
      return;
    }
    handleFileUpload(idx, file);
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
        <div className="flex items-center gap-3 mb-10">
          <Link href="/admin" className="text-[11px] tracking-[0.22em] uppercase text-[#ff8a1e]">← Back</Link>
          <span className="text-[rgba(236,231,221,0.3)]">/</span>
          <span className="font-display text-2xl tracking-[0.08em] uppercase text-[#ece7dd]">Radio</span>
          <Link
            href="/admin/radio/live"
            className="ml-auto text-[10px] tracking-[0.16em] uppercase border border-[rgba(236,231,221,0.3)] text-[#9aa19d] hover:text-[#ece7dd] hover:border-[#ff8a1e] px-3 py-1.5"
          >
            Live desk →
          </Link>
        </div>

        {error && <ErrorBox message={error} onDismiss={() => setError(null)} />}

        <p className="text-xs text-[#9aa19d] mb-6 leading-relaxed">
          Tracks uploaded here fill both the <strong className="text-[#ece7dd]">Radio</strong> page grid and
          the <strong className="text-[#ff8a1e]">Krantas Sets</strong> play button in the header — only tracks
          with audio attached show up in the header player, in this order. Accepted formats: MP3, WAV, M4A, AAC,
          OGG, FLAC — max {MAX_AUDIO_MB} MB per file.
        </p>

        <div className="flex flex-col gap-4">
          {rows.map((row, idx) => (
            <div key={row.id ?? idx} className="bg-[#12181a] border border-[rgba(236,231,221,0.14)] p-5">
              <div className="flex items-center gap-4 mb-5 pb-5 border-b border-[rgba(236,231,221,0.14)]">
                <div
                  onClick={() => coverInputRefs.current[idx]?.click()}
                  title="Click to upload cover art"
                  className="relative w-16 h-16 shrink-0 overflow-hidden border border-dashed border-[rgba(236,231,221,0.3)] cursor-pointer flex items-center justify-center"
                  style={
                    row.image_url
                      ? { backgroundImage: `url(${row.image_url})`, backgroundSize: "cover", backgroundPosition: "center", borderStyle: "solid" }
                      : { background: `linear-gradient(155deg, ${row.color_from}, ${row.color_to})` }
                  }
                >
                  {!row.image_url && (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="text-[#ece7dd]/70" aria-hidden="true">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  )}
                  {uploadingCover === idx && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-[9px] text-[#ece7dd]">…</div>
                  )}
                </div>
                <input
                  ref={(el) => { coverInputRefs.current[idx] = el; }}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (!f) return;
                    handleCoverUpload(idx, f);
                    e.target.value = "";
                  }}
                />
                <div className="flex-1">
                  <label className={lbl}>Track audio</label>
                  <input
                    ref={(el) => { fileInputRefs.current[idx] = el; }}
                    type="file"
                    accept="audio/mpeg,audio/mp4,audio/aac,audio/wav,audio/x-wav,audio/ogg,audio/flac,.mp3,.m4a,.aac,.wav,.ogg,.flac"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (!f) return;
                      validateAndUpload(idx, f);
                      e.target.value = "";
                    }}
                  />
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={() => fileInputRefs.current[idx]?.click()}
                      disabled={uploading === idx}
                      className="border border-[rgba(236,231,221,0.3)] text-[#9aa19d] hover:text-[#ece7dd] hover:border-[#ff8a1e] text-[10px] tracking-[0.16em] uppercase px-3 py-1.5 disabled:opacity-40"
                    >
                      {uploading === idx ? "Uploading..." : row.audio_url ? "Replace" : "Upload"}
                    </button>
                    {row.audio_url && (
                      <>
                        <audio controls src={row.audio_url} className="h-8 max-w-[220px]" />
                        <button
                          onClick={() => update(idx, "audio_url", "")}
                          className="text-[10px] tracking-[0.16em] uppercase text-[#9aa19d] hover:text-[#e5837f]"
                        >
                          Remove
                        </button>
                      </>
                    )}
                  </div>
                  {row.image_url && (
                    <button
                      onClick={() => update(idx, "image_url", "")}
                      className="mt-2 text-[10px] tracking-[0.16em] uppercase text-[#9aa19d] hover:text-[#e5837f]"
                    >
                      Remove cover
                    </button>
                  )}
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4 mb-4">
                <div className="sm:col-span-2">
                  <label className={lbl}>Title</label>
                  <input className={inp} value={row.title} onChange={(e) => update(idx, "title", e.target.value)} placeholder="Silt live from the boiler room" />
                </div>
                <div>
                  <label className={lbl}>Season</label>
                  <input className={inp} value={row.season} onChange={(e) => update(idx, "season", e.target.value)} placeholder="04" />
                </div>
                <div>
                  <label className={lbl}>Episode</label>
                  <input className={inp} value={row.episode} onChange={(e) => update(idx, "episode", e.target.value)} placeholder="12" />
                </div>
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

              <div className="flex items-center justify-end pt-3 border-t border-[rgba(236,231,221,0.14)]">
                <div className="flex gap-2">
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
            </div>
          ))}

          <button
            onClick={() => setRows((rs) => [...rs, { ...EMPTY, sort_order: rs.length }])}
            className="border border-dashed border-[rgba(236,231,221,0.3)] w-full py-4 text-[11px] tracking-[0.2em] uppercase text-[#9aa19d] hover:text-[#ece7dd] hover:border-[#ff8a1e] transition-colors"
          >
            + Add track
          </button>
        </div>
      </div>
    </div>
  );
}
