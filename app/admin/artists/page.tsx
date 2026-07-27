"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type Row = {
  id?: string;
  sort_order: number;
  name: string;
  role: string;
  color_from: string;
  color_to: string;
  image_url: string;
  bio: string;
  bio_long: string;
  instagram: string;
  soundcloud: string;
  facebook: string;
  website: string;
  contact_email: string;
};

const EMPTY: Omit<Row, "sort_order"> = {
  name: "",
  role: "",
  color_from: "#12494b",
  color_to: "#0a0c0d",
  image_url: "",
  bio: "",
  bio_long: "",
  instagram: "",
  soundcloud: "",
  facebook: "",
  website: "",
  contact_email: "",
};

const inp = "bg-transparent border-0 border-b border-[rgba(236,231,221,0.3)] text-[#ece7dd] py-1.5 text-sm outline-none w-full focus:border-[#ff8a1e] transition-colors font-mono";
const lbl = "block text-[9px] tracking-[0.28em] uppercase text-[#9aa19d] mb-1";

async function uploadViaApi(file: File, prefix = ""): Promise<string> {
  const body = new FormData();
  body.append("file", file);
  body.append("prefix", prefix);
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

export default function ArtistsAdmin() {
  const [rows, setRows] = useState<Row[]>([]);
  const [fetching, setFetching] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState<number | null>(null);
  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    supabase
      .from("artists")
      .select("*")
      .order("sort_order")
      .then(({ data, error: err }) => {
        if (err) setError(err.message);
        if (data) {
          type Nullable = { [K in keyof Row]: Row[K] extends string ? string | null : Row[K] };
          setRows(
            (data as Nullable[]).map((d) => ({
              ...d,
              image_url: d.image_url ?? "",
              bio: d.bio ?? "",
              bio_long: d.bio_long ?? "",
              instagram: d.instagram ?? "",
              soundcloud: d.soundcloud ?? "",
              facebook: d.facebook ?? "",
              website: d.website ?? "",
              contact_email: d.contact_email ?? "",
            } as Row))
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
      ({ error: err } = await supabase.from("artists").update(payload).eq("id", row.id));
    } else {
      const { data, error: ie } = await supabase.from("artists").insert(payload).select().single();
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
    if (!confirm("Remove this artist from the roster?")) return;
    await supabase.from("artists").delete().eq("id", id);
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

  async function handleFileUpload(idx: number, file: File) {
    setUploading(idx);
    setError(null);
    try {
      const url = await uploadViaApi(file, "artist-");
      update(idx, "image_url", url);
      // Auto-save immediately after a successful upload
      await saveRow({ ...rows[idx], image_url: url });
    } catch (e: unknown) {
      setError((e as Error).message);
    } finally {
      setUploading(null);
    }
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
      <div className="max-w-[720px] mx-auto">
        <div className="flex items-center gap-3 mb-10">
          <Link href="/admin" className="text-[11px] tracking-[0.22em] uppercase text-[#ff8a1e]">← Back</Link>
          <span className="text-[rgba(236,231,221,0.3)]">/</span>
          <span className="font-display text-2xl tracking-[0.08em] uppercase text-[#ece7dd]">Artists</span>
        </div>

        {error && <ErrorBox message={error} onDismiss={() => setError(null)} />}

        <p className="text-xs text-[#9aa19d] mb-6 leading-relaxed">
          This is the roster shown on the homepage and the <strong className="text-[#ece7dd]">Artists</strong> page,
          as photo cards (portrait + name + genre tag + short bio). Use the arrows to reorder — the list on the
          site follows this order top to bottom, left to right. Cards without a photo fall back to the gradient.
          Clicking a card on the site opens a popup with the long bio and any social/contact links you add below.
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
                <div className="grid sm:grid-cols-2 gap-4 flex-1">
                  <div>
                    <label className={lbl}>Name</label>
                    <input className={inp} value={row.name} onChange={(e) => update(idx, "name", e.target.value)} placeholder="Kasekas" />
                  </div>
                  <div>
                    <label className={lbl}>Tag (genre / role)</label>
                    <input className={inp} value={row.role} onChange={(e) => update(idx, "role", e.target.value)} placeholder="Techno" />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 mb-4 pl-9">
                <div
                  onClick={() => fileInputRefs.current[idx]?.click()}
                  title="Click to upload a portrait"
                  className="relative w-16 h-16 shrink-0 overflow-hidden border border-dashed border-[rgba(236,231,221,0.3)] cursor-pointer flex items-center justify-center"
                  style={
                    row.image_url
                      ? { backgroundImage: `url(${row.image_url})`, backgroundSize: "cover", backgroundPosition: "center", borderStyle: "solid" }
                      : { background: `linear-gradient(155deg, ${row.color_from}, ${row.color_to})` }
                  }
                >
                  {!row.image_url && <span className="text-sm opacity-40 text-[#ece7dd]">+</span>}
                  {uploading === idx && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-[9px] text-[#ece7dd]">…</div>
                  )}
                </div>
                <div className="flex-1">
                  <label className={lbl}>Portrait (optional)</label>
                  <input
                    ref={(el) => { fileInputRefs.current[idx] = el; }}
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
                      handleFileUpload(idx, f);
                      e.target.value = "";
                    }}
                  />
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => fileInputRefs.current[idx]?.click()}
                      disabled={uploading === idx}
                      className="border border-[rgba(236,231,221,0.3)] text-[#9aa19d] hover:text-[#ece7dd] hover:border-[#ff8a1e] text-[10px] tracking-[0.16em] uppercase px-3 py-1.5 disabled:opacity-40"
                    >
                      {uploading === idx ? "Uploading..." : row.image_url ? "Replace" : "Upload"}
                    </button>
                    {row.image_url && (
                      <button
                        onClick={() => update(idx, "image_url", "")}
                        className="text-[10px] tracking-[0.16em] uppercase text-[#9aa19d] hover:text-[#e5837f]"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="pl-9 mb-4">
                <label className={lbl}>Bio (shown under the card, keep it to 1-3 sentences)</label>
                <textarea
                  className={`${inp} resize-none`}
                  rows={2}
                  value={row.bio}
                  onChange={(e) => update(idx, "bio", e.target.value)}
                  placeholder="Klaipėda-rooted selector running hypnotic, low-slung techno sets..."
                />
              </div>

              <div className="pl-9 mb-4">
                <label className={lbl}>Long bio (optional — shown in the popup when a visitor clicks the card; falls back to the short bio above)</label>
                <textarea
                  className={`${inp} resize-none`}
                  rows={4}
                  value={row.bio_long}
                  onChange={(e) => update(idx, "bio_long", e.target.value)}
                  placeholder="Full artist bio, history, style, notable sets..."
                />
              </div>

              <div className="pl-9 mb-4">
                <div className={lbl}>Social & contact (optional — shown as buttons in the popup)</div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className={lbl}>Instagram</label>
                    <input className={inp} value={row.instagram} onChange={(e) => update(idx, "instagram", e.target.value)} placeholder="@handle or full URL" />
                  </div>
                  <div>
                    <label className={lbl}>SoundCloud</label>
                    <input className={inp} value={row.soundcloud} onChange={(e) => update(idx, "soundcloud", e.target.value)} placeholder="username or full URL" />
                  </div>
                  <div>
                    <label className={lbl}>Facebook</label>
                    <input className={inp} value={row.facebook} onChange={(e) => update(idx, "facebook", e.target.value)} placeholder="page name or full URL" />
                  </div>
                  <div>
                    <label className={lbl}>Website</label>
                    <input className={inp} value={row.website} onChange={(e) => update(idx, "website", e.target.value)} placeholder="artistname.com" />
                  </div>
                  <div>
                    <label className={lbl}>Contact email</label>
                    <input className={inp} type="email" value={row.contact_email} onChange={(e) => update(idx, "contact_email", e.target.value)} placeholder="booking@artist.com" />
                  </div>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4 mb-4 pl-9">
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

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[rgba(236,231,221,0.14)]">
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
            + Add artist
          </button>
        </div>
      </div>
    </div>
  );
}
