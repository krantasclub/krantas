"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type Row = {
  id?: string;
  sort_order: number;
  headline: string;
  sub: string;
  event_date: string;
  start_time: string;
  end_time: string;
  venue_line: string;
  tags: string; // comma-separated in the UI, stored as text[] in Supabase
  color_from: string;
  color_to: string;
  image_url: string;
  description: string;
  ticket_url: string;
  featured: boolean;
};

type EventDbRow = Omit<Row, "tags"> & { tags: string[] | string | null };

const EMPTY: Omit<Row, "sort_order"> = {
  headline: "",
  sub: "",
  event_date: "",
  start_time: "",
  end_time: "",
  venue_line: "Krantas \\\\ Main Floor",
  tags: "",
  color_from: "#12494b",
  color_to: "#0a0c0d",
  image_url: "",
  description: "",
  ticket_url: "",
  featured: false,
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

// Row → payload sent to Supabase (tags becomes a real array)
function toPayload(r: Row) {
  const payload: Partial<Row> = { ...r };
  delete payload.id;
  return {
    ...payload,
    tags: r.tags.split(",").map((t) => t.trim()).filter(Boolean),
  };
}

export default function EventsAdmin() {
  const [rows, setRows] = useState<Row[]>([]);
  const [fetching, setFetching] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState<number | null>(null);
  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    supabase
      .from("events")
      .select("*")
      .order("event_date")
      .then(({ data, error: err }) => {
        if (err) setError(err.message);
        if (data) {
          setRows(
            (data as EventDbRow[]).map((d) => ({
              ...d,
              tags: Array.isArray(d.tags) ? d.tags.join(", ") : d.tags ?? "",
              start_time: d.start_time ?? "",
              end_time: d.end_time ?? "",
              description: d.description ?? "",
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
      ({ error: err } = await supabase.from("events").update(payload).eq("id", row.id));
    } else {
      const { data, error: ie } = await supabase.from("events").insert(payload).select().single();
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
    if (!confirm("Delete this event?")) return;
    await supabase.from("events").delete().eq("id", id);
    setRows((rs) => rs.filter((r) => r.id !== id));
  }

  function update(idx: number, field: keyof Row, val: string | number | boolean) {
    setRows((rs) => rs.map((r, i) => (i === idx ? { ...r, [field]: val } : r)));
  }

  async function handleFileUpload(idx: number, file: File) {
    setUploading(idx);
    setError(null);
    try {
      const url = await uploadViaApi(file, "poster-");
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
      <div className="max-w-[760px] mx-auto">
        <div className="flex items-center gap-3 mb-10">
          <Link href="/admin" className="text-[11px] tracking-[0.22em] uppercase text-[#ff8a1e]">← Back</Link>
          <span className="text-[rgba(236,231,221,0.3)]">/</span>
          <span className="font-display text-2xl tracking-[0.08em] uppercase text-[#ece7dd]">Events</span>
        </div>

        {error && <ErrorBox message={error} onDismiss={() => setError(null)} />}

        <p className="text-xs text-[#9aa19d] mb-6 leading-relaxed">
          Events with a date in the future show under <strong className="text-[#ece7dd]">Upcoming</strong>,
          past dates automatically move to the <strong className="text-[#ece7dd]">Archive</strong> — this is
          fully automatic based on the date, nothing to toggle. Mark one upcoming event as{" "}
          <strong className="text-[#ff8a1e]">Featured</strong> to highlight it at the top of the events page.
          Clicking a poster on the site opens a popup with the full description, time and a tickets button —
          just like a Facebook event page. Leave the ticket link blank to fall back to the Paysera search page.
          Upload poster art to replace the gradient card background — the gradient still shows for events
          without one.
        </p>

        <div className="flex flex-col gap-4">
          {rows.map((row, idx) => (
            <div key={row.id ?? idx} className="bg-[#12181a] border border-[rgba(236,231,221,0.14)] p-5">
              <div className="flex items-center gap-4 mb-5 pb-5 border-b border-[rgba(236,231,221,0.14)]">
                <div
                  onClick={() => fileInputRefs.current[idx]?.click()}
                  title="Click to upload poster art"
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
                  <label className={lbl}>Poster art (optional)</label>
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

              <div className="grid sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className={lbl}>Headline</label>
                  <input className={inp} value={row.headline} onChange={(e) => update(idx, "headline", e.target.value)} placeholder="Riptide" />
                </div>
                <div>
                  <label className={lbl}>Subline (lineup)</label>
                  <input className={inp} value={row.sub} onChange={(e) => update(idx, "sub", e.target.value)} placeholder="Waeys · Rueben · Lgnius" />
                </div>
                <div>
                  <label className={lbl}>Date</label>
                  <input type="date" className={inp} value={row.event_date} onChange={(e) => update(idx, "event_date", e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={lbl}>Start time (optional)</label>
                    <input type="time" className={inp} value={row.start_time} onChange={(e) => update(idx, "start_time", e.target.value)} />
                  </div>
                  <div>
                    <label className={lbl}>End time (optional)</label>
                    <input type="time" className={inp} value={row.end_time} onChange={(e) => update(idx, "end_time", e.target.value)} />
                  </div>
                </div>
                <div>
                  <label className={lbl}>Venue line</label>
                  <input className={inp} value={row.venue_line} onChange={(e) => update(idx, "venue_line", e.target.value)} placeholder="Krantas \\ Main Floor" />
                </div>
                <div>
                  <label className={lbl}>Tags (comma-separated)</label>
                  <input className={inp} value={row.tags} onChange={(e) => update(idx, "tags", e.target.value)} placeholder="techno, live" />
                </div>
                <div>
                  <label className={lbl}>Ticket link (optional)</label>
                  <input className={inp} value={row.ticket_url} onChange={(e) => update(idx, "ticket_url", e.target.value)} placeholder="https://tickets.paysera.com/..." />
                </div>
                <div>
                  <label className={lbl}>Fallback gradient — from</label>
                  <div className="flex items-center gap-2">
                    <input type="color" value={row.color_from} onChange={(e) => update(idx, "color_from", e.target.value)} className="w-8 h-8 bg-transparent border border-[rgba(236,231,221,0.3)] cursor-pointer" />
                    <input className={inp} value={row.color_from} onChange={(e) => update(idx, "color_from", e.target.value)} />
                  </div>
                </div>
                <div>
                  <label className={lbl}>Fallback gradient — to</label>
                  <div className="flex items-center gap-2">
                    <input type="color" value={row.color_to} onChange={(e) => update(idx, "color_to", e.target.value)} className="w-8 h-8 bg-transparent border border-[rgba(236,231,221,0.3)] cursor-pointer" />
                    <input className={inp} value={row.color_to} onChange={(e) => update(idx, "color_to", e.target.value)} />
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <label className={lbl}>Full description (optional — shown in the popup when a visitor clicks the poster)</label>
                <textarea
                  className={`${inp} resize-none`}
                  rows={6}
                  value={row.description}
                  onChange={(e) => update(idx, "description", e.target.value)}
                  placeholder={"Paste the full write-up here — same as a Facebook event description. Line breaks are kept, and pasting the Lithuanian text followed by an \"EN\" section works fine too."}
                />
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-[rgba(236,231,221,0.14)]">
                <label className="flex items-center gap-2 text-xs text-[#ece7dd] cursor-pointer select-none">
                  <input type="checkbox" checked={row.featured} onChange={(e) => update(idx, "featured", e.target.checked)} className="accent-[#ff8a1e]" />
                  Featured
                </label>
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
            + Add event
          </button>
        </div>
      </div>
    </div>
  );
}
