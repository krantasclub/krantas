"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type HomepageRow = {
  marquee_text: string;
  statement_eyebrow: string;
  statement_heading: string;
  statement_body: string;
};

const EMPTY: HomepageRow = {
  marquee_text: "",
  statement_eyebrow: "",
  statement_heading: "",
  statement_body: "",
};

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
