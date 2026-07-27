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

type TrackSource = "upload" | "youtube" | "url";

type Track = {
  id: string;
  name: string;
  source: TrackSource;
  url: string;
};

type Row = {
  id?: string;
  sort_order: number;
  title: string;
  artist: string;
  type: string;
  release_date: string; // YYYY-MM-DD
  description: string;
  logo_url: string;
  external_url: string;
  color_from: string;
  color_to: string;
  tracks: Track[];
};

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function newTrackId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `t-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

const EMPTY: Omit<Row, "sort_order"> = {
  title: "",
  artist: "",
  type: "EP",
  release_date: todayISO(),
  description: "",
  logo_url: "",
  external_url: "",
  color_from: "#12494b",
  color_to: "#0a0c0d",
  tracks: [],
};

const RELEASE_TYPES = ["Single", "EP", "Album", "Remix EP", "Compilation"];

const inp = "bg-transparent border-0 border-b border-[rgba(236,231,221,0.3)] text-[#ece7dd] py-1.5 text-sm outline-none w-full focus:border-[#ff8a1e] transition-colors font-mono";
const lbl = "block text-[9px] tracking-[0.28em] uppercase text-[#9aa19d] mb-1";

const AUDIO_BUCKET = "audio";

// Cover art: goes through /api/upload (server-side, converted to WebP,
// stored in the existing "events" bucket) — same path artists' portraits
// and event posters already use.
async function uploadLogo(file: File): Promise<string> {
  const body = new FormData();
  body.append("file", file);
  body.append("prefix", "release-");
  const res = await fetch("/api/upload", { method: "POST", body });
  const json = await res.json();
  if (!res.ok || json.error) throw new Error(json.error ?? "Upload failed");
  const url = json.url as string;
  await new Promise<void>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = () => reject(new Error("Image uploaded, but it failed to load back. Check the \"events\" bucket is public in Supabase Storage."));
    img.src = url;
  });
  return url;
}

// Track audio: uploaded straight from the browser to the "audio" Storage
// bucket, same as /admin/radio — keeps full DJ-set-length files out of the
// serverless function body-size limit.
async function uploadTrackAudio(file: File): Promise<string> {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "mp3";
  const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const { error } = await supabase.storage
    .from(AUDIO_BUCKET)
    .upload(path, file, { contentType: file.type || undefined, cacheControl: "3600", upsert: false });
  if (error) throw new Error(error.message);
  const { data } = supabase.storage.from(AUDIO_BUCKET).getPublicUrl(path);
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

export default function ReleasesAdmin() {
  const [rows, setRows] = useState<Row[]>([]);
  const [fetching, setFetching] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState<number | null>(null);
  const [uploadingTrack, setUploadingTrack] = useState<string | null>(null); // `${rowIdx}-${trackIdx}`
  const logoInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const trackInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => {
    supabase
      .from("releases")
      .select("*")
      .order("sort_order")
      .then(({ data, error: err }) => {
        if (err) setError(err.message);
        if (data) {
          setRows(
            (data as (Row & { description: string | null; logo_url: string | null; external_url: string | null; tracks: Track[] | null })[]).map((d) => ({
              ...d,
              description: d.description ?? "",
              logo_url: d.logo_url ?? "",
              external_url: d.external_url ?? "",
              tracks: d.tracks ?? [],
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
      ({ error: err } = await supabase.from("releases").update(payload).eq("id", row.id));
    } else {
      const { data, error: ie } = await supabase.from("releases").insert(payload).select().single();
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
    if (!confirm("Delete this release?")) return;
    await supabase.from("releases").delete().eq("id", id);
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

  // ── Cover art ──────────────────────────────────────────────────────────

  async function handleLogoUpload(idx: number, file: File) {
    setUploadingLogo(idx);
    setError(null);
    try {
      const url = await uploadLogo(file);
      update(idx, "logo_url", url);
      await saveRow({ ...rows[idx], logo_url: url });
    } catch (e: unknown) {
      setError((e as Error).message);
    } finally {
      setUploadingLogo(null);
    }
  }

  // ── Tracks ─────────────────────────────────────────────────────────────

  function updateTracks(idx: number, next: Track[]) {
    setRows((rs) => rs.map((r, i) => (i === idx ? { ...r, tracks: next } : r)));
  }

  function addTrack(idx: number) {
    const row = rows[idx];
    updateTracks(idx, [...row.tracks, { id: newTrackId(), name: "", source: "url", url: "" }]);
  }

  function updateTrack(idx: number, trackIdx: number, field: keyof Track, val: string) {
    const row = rows[idx];
    const nextTracks = row.tracks.map((t, i) => (i === trackIdx ? { ...t, [field]: val } : t));
    updateTracks(idx, nextTracks);
  }

  function removeTrack(idx: number, trackIdx: number) {
    const row = rows[idx];
    updateTracks(idx, row.tracks.filter((_, i) => i !== trackIdx));
  }

  function moveTrack(idx: number, trackIdx: number, dir: -1 | 1) {
    const row = rows[idx];
    const next = [...row.tracks];
    const j = trackIdx + dir;
    if (j < 0 || j >= next.length) return;
    [next[trackIdx], next[j]] = [next[j], next[trackIdx]];
    updateTracks(idx, next);
  }

  function validateAndUploadTrack(idx: number, trackIdx: number, file: File) {
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
    const key = `${idx}-${trackIdx}`;
    setUploadingTrack(key);
    setError(null);
    uploadTrackAudio(file)
      .then(async (url) => {
        const row = rows[idx];
        const nextTracks = row.tracks.map((t, i) => (i === trackIdx ? { ...t, source: "upload" as TrackSource, url } : t));
        updateTracks(idx, nextTracks);
        await saveRow({ ...row, tracks: nextTracks });
      })
      .catch((e: unknown) => setError((e as Error).message))
      .finally(() => setUploadingTrack(null));
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
      <div className="max-w-[820px] mx-auto">
        <div className="flex items-center gap-3 mb-10">
          <Link href="/admin" className="text-[11px] tracking-[0.22em] uppercase text-[#ff8a1e]">← Back</Link>
          <span className="text-[rgba(236,231,221,0.3)]">/</span>
          <span className="font-display text-2xl tracking-[0.08em] uppercase text-[#ece7dd]">Releases</span>
        </div>

        {error && <ErrorBox message={error} onDismiss={() => setError(null)} />}

        <p className="text-xs text-[#9aa19d] mb-6 leading-relaxed">
          The label discography shown on the <strong className="text-[#ece7dd]">Releases</strong> page. Use the
          arrows to reorder — newest at the top is the usual convention. Each release can have a cover, a
          description and a tracklist: every track is either uploaded directly, pasted in as a YouTube link, or
          any other URL (Bandcamp, SoundCloud, etc).
        </p>

        <div className="flex flex-col gap-4">
          {rows.map((row, idx) => (
            <div key={row.id ?? idx} className="bg-[#12181a] border border-[rgba(236,231,221,0.14)] p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex flex-col gap-1 shrink-0">
                  <button
                    onClick={() => move(idx, -1)}
                    disabled={idx === 0}
                    className="w-6 h-6 flex items-center justify-center border border-[rgba(236,231,221,0.3)] text-[#9aa19d] hover:text-[#ece7dd] hover:border-[#ff8a1e] disabled:opacity-30 disabled:cursor-not-allowed"
                    aria-label="Move up"
                  >
                    ↑
                  </button>
                  <button
                    onClick={() => move(idx, 1)}
                    disabled={idx === rows.length - 1}
                    className="w-6 h-6 flex items-center justify-center border border-[rgba(236,231,221,0.3)] text-[#9aa19d] hover:text-[#ece7dd] hover:border-[#ff8a1e] disabled:opacity-30 disabled:cursor-not-allowed"
                    aria-label="Move down"
                  >
                    ↓
                  </button>
                </div>

                <div
                  onClick={() => logoInputRefs.current[idx]?.click()}
                  title="Click to upload cover art"
                  className="relative w-16 h-16 shrink-0 overflow-hidden border border-dashed border-[rgba(236,231,221,0.3)] cursor-pointer flex items-center justify-center"
                  style={
                    row.logo_url
                      ? { backgroundImage: `url(${row.logo_url})`, backgroundSize: "cover", backgroundPosition: "center", borderStyle: "solid" }
                      : { background: `linear-gradient(155deg, ${row.color_from}, ${row.color_to})` }
                  }
                >
                  {!row.logo_url && <span className="text-sm opacity-40 text-[#ece7dd]">+</span>}
                  {uploadingLogo === idx && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-[9px] text-[#ece7dd]">…</div>
                  )}
                </div>
                <input
                  ref={(el) => { logoInputRefs.current[idx] = el; }}
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
                    handleLogoUpload(idx, f);
                    e.target.value = "";
                  }}
                />

                <div className="grid sm:grid-cols-2 gap-4 flex-1">
                  <div>
                    <label className={lbl}>Title</label>
                    <input className={inp} value={row.title} onChange={(e) => update(idx, "title", e.target.value)} placeholder="Flare EP" />
                  </div>
                  <div>
                    <label className={lbl}>Artist</label>
                    <input className={inp} value={row.artist} onChange={(e) => update(idx, "artist", e.target.value)} placeholder="Halogenix" />
                  </div>
                </div>
              </div>

              {row.logo_url && (
                <div className="pl-9 -mt-2 mb-4">
                  <button
                    onClick={() => update(idx, "logo_url", "")}
                    className="text-[10px] tracking-[0.16em] uppercase text-[#9aa19d] hover:text-[#e5837f]"
                  >
                    Remove cover
                  </button>
                </div>
              )}

              <div className="grid sm:grid-cols-3 gap-4 mb-4 pl-9">
                <div>
                  <label className={lbl}>Type</label>
                  <select
                    className={`${inp} appearance-none`}
                    value={row.type}
                    onChange={(e) => update(idx, "type", e.target.value)}
                  >
                    {RELEASE_TYPES.map((t) => (
                      <option key={t} value={t} className="bg-[#12181a]">{t}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={lbl}>Release date</label>
                  <input type="date" className={inp} value={row.release_date} onChange={(e) => update(idx, "release_date", e.target.value)} />
                </div>
                <div>
                  <label className={lbl}>External link (Bandcamp, Spotify...)</label>
                  <input className={inp} value={row.external_url} onChange={(e) => update(idx, "external_url", e.target.value)} placeholder="https://..." />
                </div>
              </div>

              <div className="pl-9 mb-4">
                <label className={lbl}>Description</label>
                <textarea
                  className={`${inp} resize-none`}
                  rows={2}
                  value={row.description}
                  onChange={(e) => update(idx, "description", e.target.value)}
                  placeholder="Four-track dive into halftime and dub — mixed and mastered at..."
                />
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

              {/* ── Tracklist ──────────────────────────────────────────── */}
              <div className="pl-9 mb-2">
                <label className={lbl}>Tracklist</label>
                <div className="flex flex-col gap-2">
                  {row.tracks.map((track, trackIdx) => {
                    const uploadKey = `${idx}-${trackIdx}`;
                    const inputKey = uploadKey;
                    return (
                      <div key={track.id} className="border border-[rgba(236,231,221,0.14)] bg-[#0a0c0d] p-3">
                        <div className="flex items-start gap-2">
                          <div className="flex flex-col gap-1 shrink-0 pt-1">
                            <button
                              onClick={() => moveTrack(idx, trackIdx, -1)}
                              disabled={trackIdx === 0}
                              className="w-5 h-5 flex items-center justify-center border border-[rgba(236,231,221,0.3)] text-[#9aa19d] hover:text-[#ece7dd] hover:border-[#ff8a1e] disabled:opacity-30 disabled:cursor-not-allowed text-[10px]"
                              aria-label="Move track up"
                            >
                              ↑
                            </button>
                            <button
                              onClick={() => moveTrack(idx, trackIdx, 1)}
                              disabled={trackIdx === row.tracks.length - 1}
                              className="w-5 h-5 flex items-center justify-center border border-[rgba(236,231,221,0.3)] text-[#9aa19d] hover:text-[#ece7dd] hover:border-[#ff8a1e] disabled:opacity-30 disabled:cursor-not-allowed text-[10px]"
                              aria-label="Move track down"
                            >
                              ↓
                            </button>
                          </div>

                          <div className="flex-1 min-w-0">
                            <input
                              className={inp}
                              value={track.name}
                              onChange={(e) => updateTrack(idx, trackIdx, "name", e.target.value)}
                              placeholder="Track title"
                            />

                            <div className="flex items-center gap-1 mt-2 mb-2">
                              {(["upload", "youtube", "url"] as TrackSource[]).map((s) => (
                                <button
                                  key={s}
                                  onClick={() => updateTrack(idx, trackIdx, "source", s)}
                                  className={`text-[9px] tracking-[0.14em] uppercase px-2 py-1 border transition-colors ${
                                    track.source === s
                                      ? "border-[#ff8a1e] text-[#ff8a1e]"
                                      : "border-[rgba(236,231,221,0.3)] text-[#9aa19d] hover:text-[#ece7dd]"
                                  }`}
                                >
                                  {s === "upload" ? "Upload" : s === "youtube" ? "YouTube" : "Other URL"}
                                </button>
                              ))}
                            </div>

                            {track.source === "upload" ? (
                              <>
                                <input
                                  ref={(el) => { trackInputRefs.current[inputKey] = el; }}
                                  type="file"
                                  accept="audio/mpeg,audio/mp4,audio/aac,audio/wav,audio/x-wav,audio/ogg,audio/flac,.mp3,.m4a,.aac,.wav,.ogg,.flac"
                                  className="hidden"
                                  onChange={(e) => {
                                    const f = e.target.files?.[0];
                                    if (!f) return;
                                    validateAndUploadTrack(idx, trackIdx, f);
                                    e.target.value = "";
                                  }}
                                />
                                <div className="flex items-center gap-2 flex-wrap">
                                  <button
                                    onClick={() => trackInputRefs.current[inputKey]?.click()}
                                    disabled={uploadingTrack === uploadKey}
                                    className="border border-[rgba(236,231,221,0.3)] text-[#9aa19d] hover:text-[#ece7dd] hover:border-[#ff8a1e] text-[10px] tracking-[0.16em] uppercase px-3 py-1.5 disabled:opacity-40"
                                  >
                                    {uploadingTrack === uploadKey ? "Uploading..." : track.url ? "Replace file" : "Upload file"}
                                  </button>
                                  {track.url && <audio controls src={track.url} className="h-8 max-w-[220px]" />}
                                </div>
                              </>
                            ) : (
                              <input
                                className={inp}
                                value={track.url}
                                onChange={(e) => updateTrack(idx, trackIdx, "url", e.target.value)}
                                placeholder={track.source === "youtube" ? "https://youtube.com/watch?v=..." : "https://..."}
                              />
                            )}
                          </div>

                          <button
                            onClick={() => removeTrack(idx, trackIdx)}
                            aria-label="Remove track"
                            className="shrink-0 text-[#9aa19d] hover:text-[#e5837f] text-sm leading-none px-1"
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  <button
                    onClick={() => addTrack(idx)}
                    className="border border-dashed border-[rgba(236,231,221,0.3)] w-full py-2.5 text-[10px] tracking-[0.18em] uppercase text-[#9aa19d] hover:text-[#ece7dd] hover:border-[#ff8a1e] transition-colors"
                  >
                    + Add track
                  </button>
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
          ))}

          <button
            onClick={() => setRows((rs) => [...rs, { ...EMPTY, sort_order: rs.length }])}
            className="border border-dashed border-[rgba(236,231,221,0.3)] w-full py-4 text-[11px] tracking-[0.2em] uppercase text-[#9aa19d] hover:text-[#ece7dd] hover:border-[#ff8a1e] transition-colors"
          >
            + Add release
          </button>
        </div>
      </div>
    </div>
  );
}
