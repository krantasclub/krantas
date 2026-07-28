"use client";
import { useEffect, useRef, useState } from "react";
import NextImage from "next/image";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type AboutRow = {
  eyebrow: string;
  heading: string;
  subheading: string;
  body: string;
  image_url: string;
};

type StatRow = { id?: string; sort_order: number; value: string; label: string };

const EMPTY_ABOUT: AboutRow = { eyebrow: "", heading: "", subheading: "", body: "", image_url: "" };
const EMPTY_STAT: Omit<StatRow, "sort_order"> = { value: "", label: "" };

const inp =
  "bg-transparent border-0 border-b border-[rgba(236,231,221,0.3)] text-[#ece7dd] py-1.5 text-sm outline-none w-full focus:border-[#ff8a1e] transition-colors font-mono";
const textarea =
  "bg-[#0a0c0d] border border-[rgba(236,231,221,0.2)] text-[#ece7dd] p-3 text-sm outline-none w-full focus:border-[#ff8a1e] transition-colors font-mono resize-y";
const lbl = "block text-[9px] tracking-[0.28em] uppercase text-[#9aa19d] mb-1";
const hint = "text-[11px] text-[#5f6663] mt-1 leading-relaxed";
const card = "bg-[#12181a] border border-[rgba(236,231,221,0.14)] p-5";

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
    img.onerror = () =>
      reject(new Error('Image uploaded, but it failed to load back. Check the "events" bucket is public in Supabase Storage.'));
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
      <button onClick={onDismiss} className="bg-transparent border-0 cursor-pointer text-[#e5837f] text-base leading-none shrink-0">
        ×
      </button>
    </div>
  );
}

export default function AboutAdmin() {
  // ---- About story ----
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [about, setAbout] = useState<AboutRow>(EMPTY_ABOUT);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // ---- Stats strip ----
  const [stats, setStats] = useState<StatRow[]>([]);
  const [statsFetching, setStatsFetching] = useState(true);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [statSaving, setStatSaving] = useState<string | null>(null);
  const [statSaved, setStatSaved] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from("about_page")
      .select("*")
      .eq("id", 1)
      .maybeSingle()
      .then(({ data, error: err }) => {
        if (err) setError(err.message);
        else if (data)
          setAbout({
            eyebrow: data.eyebrow ?? "",
            heading: data.heading ?? "",
            subheading: data.subheading ?? "",
            body: data.body ?? "",
            image_url: data.image_url ?? "",
          });
        setFetching(false);
      });

    supabase
      .from("site_stats")
      .select("*")
      .order("sort_order")
      .then(({ data, error: err }) => {
        if (err) setStatsError(err.message);
        else if (data) setStats(data as StatRow[]);
        setStatsFetching(false);
      });
  }, []);

  async function handleFile(file: File) {
    setUploading(true);
    setError(null);
    try {
      const url = await uploadViaApi(file, "about/");
      setAbout((a) => ({ ...a, image_url: url }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function save() {
    setSaving(true);
    setError(null);
    const { error: err } = await supabase
      .from("about_page")
      .update({ ...about, updated_at: new Date().toISOString() })
      .eq("id", 1);
    if (err) {
      setError(err.message);
    } else {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
    setSaving(false);
  }

  function updateStat(idx: number, field: keyof StatRow, val: string | number) {
    setStats((rs) => rs.map((r, i) => (i === idx ? { ...r, [field]: val } : r)));
  }

  async function saveStat(row: StatRow) {
    const key = row.id ?? "new";
    setStatSaving(key);
    setStatsError(null);
    const payload = { sort_order: row.sort_order, value: row.value, label: row.label };
    let err;
    if (row.id) {
      ({ error: err } = await supabase.from("site_stats").update(payload).eq("id", row.id));
    } else {
      const { data, error: ie } = await supabase.from("site_stats").insert(payload).select().single();
      err = ie;
      if (data) setStats((rs) => rs.map((r) => (r === row ? { ...r, id: data.id } : r)));
    }
    if (err) {
      setStatsError(err.message);
      setStatSaving(null);
      return;
    }
    setStatSaved(key);
    setTimeout(() => setStatSaved(null), 2000);
    setStatSaving(null);
  }

  async function removeStat(id: string) {
    if (!confirm("Delete this stat?")) return;
    await supabase.from("site_stats").delete().eq("id", id);
    setStats((rs) => rs.filter((r) => r.id !== id));
  }

  if (fetching || statsFetching) {
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
          <span className="font-display text-2xl tracking-[0.08em] uppercase text-[#ece7dd]">About page</span>
        </div>

        {error && <ErrorBox message={error} onDismiss={() => setError(null)} />}

        <div className={card + " mb-8"}>
          <p className="text-xs text-[#9aa19d] mb-5 leading-relaxed">
            This copy is shown on the public <code>/about</code> page, top of the page first — the small label,
            then the big headline, then the line underneath it. Leave a field blank to fall back to the
            placeholder text.
          </p>

          <div className="flex flex-col gap-4 mb-5">
            <div>
              <label className={lbl}>Eyebrow — small label above the headline</label>
              <input
                className={inp}
                value={about.eyebrow}
                onChange={(e) => setAbout({ ...about, eyebrow: e.target.value })}
                placeholder="Our story"
              />
            </div>
            <div>
              <label className={lbl}>Heading — the big headline</label>
              <input
                className={inp}
                value={about.heading}
                onChange={(e) => setAbout({ ...about, heading: e.target.value })}
                placeholder="Underground music by the shore"
              />
            </div>
            <div>
              <label className={lbl}>Subheading — small line under the headline</label>
              <input
                className={inp}
                value={about.subheading}
                onChange={(e) => setAbout({ ...about, subheading: e.target.value })}
                placeholder="Built by the water. Driven by the sound."
              />
              <p className={hint}>
                Together these three read as: “{about.eyebrow || "Our story"}” /{" "}
                “{about.heading || "Underground music by the shore"}” /{" "}
                “{about.subheading || "Built by the water. Driven by the sound."}”
              </p>
            </div>
          </div>

          <div className="mb-5">
            <label className={lbl}>Body — separate paragraphs with a blank line</label>
            <textarea
              className={textarea}
              rows={10}
              value={about.body}
              onChange={(e) => setAbout({ ...about, body: e.target.value })}
              placeholder="Tell the Krantas story here..."
            />
          </div>

          <div className="mb-5">
            <label className={lbl}>Photo (optional)</label>
            {about.image_url && (
              <div className="relative w-full max-w-[220px] aspect-[4/5] mb-3 overflow-hidden border border-[rgba(236,231,221,0.2)]">
                <NextImage src={about.image_url} alt="" fill sizes="220px" className="object-cover" />
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFile(file);
                e.target.value = "";
              }}
            />
            <div className="flex items-center gap-3">
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="border border-[rgba(236,231,221,0.3)] text-[#ece7dd] text-[10px] tracking-[0.16em] uppercase px-4 py-2 disabled:opacity-50"
              >
                {uploading ? "Uploading..." : about.image_url ? "Replace photo" : "Upload photo"}
              </button>
              {about.image_url && (
                <button
                  onClick={() => setAbout({ ...about, image_url: "" })}
                  className="border border-[#7a1f2b]/60 text-[#e5837f] text-[10px] tracking-[0.16em] uppercase px-4 py-2"
                >
                  Remove
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center justify-end pt-3 border-t border-[rgba(236,231,221,0.14)]">
            <button
              onClick={save}
              disabled={saving}
              className="bg-[#ff8a1e] text-[#12100c] text-[10px] tracking-[0.16em] uppercase px-4 py-2 disabled:opacity-50"
            >
              {saved ? "✓ Saved" : "Save"}
            </button>
          </div>
        </div>

        {/* ---- Stats strip — lives at the bottom of the About page, so it's edited here too ---- */}
        <div className="flex items-center gap-3 mb-4">
          <span className="font-display text-lg tracking-[0.08em] uppercase text-[#ece7dd]">Stats strip</span>
        </div>

        {statsError && <ErrorBox message={statsError} onDismiss={() => setStatsError(null)} />}

        <p className="text-xs text-[#9aa19d] mb-5 leading-relaxed">
          These figures show in the strip at the bottom of the About page (e.g. <span className="text-[#ece7dd]">150+</span> /{" "}
          <span className="text-[#ece7dd]">Events</span>). An empty list falls back to placeholder numbers.
        </p>

        <div className="flex flex-col gap-3">
          {stats.map((row, idx) => (
            <div key={row.id ?? idx} className={card}>
              <div className="grid sm:grid-cols-2 gap-3 mb-3">
                <div>
                  <label className={lbl}>Value</label>
                  <input className={inp} value={row.value} onChange={(e) => updateStat(idx, "value", e.target.value)} placeholder="150+" />
                </div>
                <div>
                  <label className={lbl}>Label</label>
                  <input className={inp} value={row.label} onChange={(e) => updateStat(idx, "label", e.target.value)} placeholder="Events" />
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[rgba(236,231,221,0.14)]">
                <button
                  onClick={() => saveStat(row)}
                  disabled={statSaving === (row.id ?? "new")}
                  className="bg-[#ff8a1e] text-[#12100c] text-[10px] tracking-[0.16em] uppercase px-4 py-2 disabled:opacity-50"
                >
                  {statSaved === (row.id ?? "new") ? "✓ Saved" : "Save"}
                </button>
                {row.id && (
                  <button
                    onClick={() => removeStat(row.id!)}
                    className="border border-[#7a1f2b]/60 text-[#e5837f] text-[10px] tracking-[0.16em] uppercase px-4 py-2"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))}
          <button
            onClick={() => setStats((rs) => [...rs, { ...EMPTY_STAT, sort_order: rs.length }])}
            className="border border-dashed border-[rgba(236,231,221,0.3)] w-full py-3 text-[11px] tracking-[0.2em] uppercase text-[#9aa19d] hover:text-[#ece7dd] hover:border-[#ff8a1e] transition-colors"
          >
            + Add stat
          </button>
        </div>
      </div>
    </div>
  );
}
