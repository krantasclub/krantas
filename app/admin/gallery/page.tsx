"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type Row = {
  id?: string;
  sort_order: number;
  image_url: string;
  alt: string;
};

const EMPTY: Omit<Row, "sort_order"> = {
  image_url: "",
  alt: "",
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

export default function GalleryAdmin() {
  const [rows, setRows] = useState<Row[]>([]);
  const [fetching, setFetching] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState<number | null>(null);
  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    supabase
      .from("gallery_images")
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
              alt: d.alt ?? "",
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
      ({ error: err } = await supabase.from("gallery_images").update(payload).eq("id", row.id));
    } else {
      const { data, error: ie } = await supabase.from("gallery_images").insert(payload).select().single();
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

  // Persists the current on-screen order to sort_order for every row —
  // used after drag-reordering or the up/down arrows so a page refresh
  // (or the homepage's own fetch) reflects the new order immediately.
  async function persistOrder(rs: Row[]) {
    const withIds = rs.filter((r) => r.id);
    await Promise.all(
      withIds.map((r) => supabase.from("gallery_images").update({ sort_order: r.sort_order }).eq("id", r.id!))
    );
  }

  async function deleteRow(id: string) {
    if (!confirm("Remove this photo from the gallery?")) return;
    await supabase.from("gallery_images").delete().eq("id", id);
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
      const reordered = next.map((r, i) => ({ ...r, sort_order: i }));
      persistOrder(reordered);
      return reordered;
    });
  }

  // Drag-and-drop reorder — grabbing a card and dropping it on another
  // moves it there directly, instead of clicking ↑/↓ repeatedly.
  const dragIdx = useRef<number | null>(null);
  function onDragStart(idx: number) {
    dragIdx.current = idx;
  }
  function onDragOver(e: React.DragEvent) {
    e.preventDefault();
  }
  function onDrop(idx: number) {
    const from = dragIdx.current;
    dragIdx.current = null;
    if (from === null || from === idx) return;
    setRows((rs) => {
      const next = [...rs];
      const [moved] = next.splice(from, 1);
      next.splice(idx, 0, moved);
      const reordered = next.map((r, i) => ({ ...r, sort_order: i }));
      persistOrder(reordered);
      return reordered;
    });
  }

  async function handleFileUpload(idx: number, file: File) {
    setUploading(idx);
    setError(null);
    try {
      const url = await uploadViaApi(file, "gallery-");
      update(idx, "image_url", url);
      // Auto-save immediately after a successful upload
      await saveRow({ ...rows[idx], image_url: url });
    } catch (e: unknown) {
      setError((e as Error).message);
    } finally {
      setUploading(null);
    }
  }

  async function addFromFiles(files: FileList) {
    setError(null);
    const startLen = rows.length;
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"];
    const toAdd = Array.from(files).filter((f) => {
      if (!allowed.includes(f.type)) {
        setError(`Unsupported file type "${f.type || f.name.split(".").pop()?.toUpperCase()}". Use JPG, PNG, WebP, GIF or AVIF.`);
        return false;
      }
      return true;
    });
    if (toAdd.length === 0) return;
    setRows((rs) => [...rs, ...toAdd.map((_, i) => ({ ...EMPTY, sort_order: startLen + i }))]);
    for (let i = 0; i < toAdd.length; i++) {
      await handleFileUpload(startLen + i, toAdd[i]);
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
          <span className="font-display text-2xl tracking-[0.08em] uppercase text-[#ece7dd]">Gallery</span>
        </div>

        {error && <ErrorBox message={error} onDismiss={() => setError(null)} />}

        <p className="text-xs text-[#9aa19d] mb-6 leading-relaxed">
          These are the photos in the two scrolling strips on the homepage <strong className="text-[#ece7dd]">Gallery</strong> section,
          and the full-screen lightbox they open into. Drag a card (or use the ↑/↓ arrows) to reorder — the site
          follows this order. Alt text is used for accessibility and shown as the caption in the lightbox.
        </p>

        <label className="flex flex-col items-center justify-center gap-2 border border-dashed border-[rgba(236,231,221,0.3)] hover:border-[#ff8a1e] transition-colors cursor-pointer py-8 mb-6 text-center">
          <span className="text-[11px] tracking-[0.2em] uppercase text-[#ece7dd]">+ Add photos</span>
          <span className="text-[10px] text-[#9aa19d]">Click to browse, or select multiple files at once</span>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
            multiple
            className="hidden"
            onChange={(e) => {
              const files = e.target.files;
              if (files && files.length > 0) addFromFiles(files);
              e.target.value = "";
            }}
          />
        </label>

        <div className="flex flex-col gap-4">
          {rows.map((row, idx) => (
            <div
              key={row.id ?? idx}
              draggable
              onDragStart={() => onDragStart(idx)}
              onDragOver={onDragOver}
              onDrop={() => onDrop(idx)}
              className="bg-[#12181a] border border-[rgba(236,231,221,0.14)] p-5 cursor-grab active:cursor-grabbing"
            >
              <div className="flex items-center gap-4">
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
                  onClick={() => fileInputRefs.current[idx]?.click()}
                  title="Click to replace this photo"
                  className="relative w-20 h-20 shrink-0 overflow-hidden border border-dashed border-[rgba(236,231,221,0.3)] cursor-pointer flex items-center justify-center bg-[#0a0c0d]"
                  style={
                    row.image_url
                      ? { backgroundImage: `url(${row.image_url})`, backgroundSize: "cover", backgroundPosition: "center", borderStyle: "solid" }
                      : undefined
                  }
                >
                  {!row.image_url && <span className="text-sm opacity-40 text-[#ece7dd]">+</span>}
                  {uploading === idx && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-[9px] text-[#ece7dd]">…</div>
                  )}
                </div>

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

                <div className="flex-1">
                  <label className={lbl}>Alt text (caption, shown in the lightbox)</label>
                  <input
                    className={inp}
                    value={row.alt}
                    onChange={(e) => update(idx, "alt", e.target.value)}
                    placeholder="Crowd on the dancefloor at Krantas"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 mt-4 border-t border-[rgba(236,231,221,0.14)]">
                <button
                  onClick={() => fileInputRefs.current[idx]?.click()}
                  disabled={uploading === idx}
                  className="border border-[rgba(236,231,221,0.3)] text-[#9aa19d] hover:text-[#ece7dd] hover:border-[#ff8a1e] text-[10px] tracking-[0.16em] uppercase px-3 py-1.5 disabled:opacity-40"
                >
                  {uploading === idx ? "Uploading..." : row.image_url ? "Replace photo" : "Upload"}
                </button>
                <button
                  onClick={() => saveRow(row)}
                  disabled={saving === (row.id ?? "new") || !row.image_url}
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

          {rows.length === 0 && (
            <p className="text-xs text-[#9aa19d] text-center py-6">No photos yet — add some above.</p>
          )}
        </div>
      </div>
    </div>
  );
}
