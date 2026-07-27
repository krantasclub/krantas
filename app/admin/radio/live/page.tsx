"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type LiveRow = {
  is_live: boolean;
  show_title: string;
  dj_name: string;
  stream_url: string;
  stream_kind: "audio" | "embed" | "link";
};

type LinkRow = { id?: string; sort_order: number; label: string; url: string };
type ScheduleRow = {
  id?: string;
  sort_order: number;
  day_label: string;
  time_label: string;
  show_title: string;
  dj_name: string;
};

const EMPTY_LIVE: LiveRow = { is_live: false, show_title: "", dj_name: "", stream_url: "", stream_kind: "audio" };
const EMPTY_LINK: Omit<LinkRow, "sort_order"> = { label: "", url: "" };
const EMPTY_SLOT: Omit<ScheduleRow, "sort_order"> = { day_label: "", time_label: "", show_title: "", dj_name: "" };

const inp =
  "bg-transparent border-0 border-b border-[rgba(236,231,221,0.3)] text-[#ece7dd] py-1.5 text-sm outline-none w-full focus:border-[#ff8a1e] transition-colors font-mono";
const lbl = "block text-[9px] tracking-[0.28em] uppercase text-[#9aa19d] mb-1";
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

export default function RadioLiveAdmin() {
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [live, setLive] = useState<LiveRow>(EMPTY_LIVE);
  const [savingLive, setSavingLive] = useState(false);
  const [savedLive, setSavedLive] = useState(false);

  const [links, setLinks] = useState<LinkRow[]>([]);
  const [savingLink, setSavingLink] = useState<string | null>(null);
  const [savedLink, setSavedLink] = useState<string | null>(null);

  const [schedule, setSchedule] = useState<ScheduleRow[]>([]);
  const [savingSlot, setSavingSlot] = useState<string | null>(null);
  const [savedSlot, setSavedSlot] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      supabase.from("radio_live").select("*").eq("id", 1).maybeSingle(),
      supabase.from("radio_links").select("*").order("sort_order"),
      supabase.from("radio_schedule").select("*").order("sort_order"),
    ]).then(([liveRes, linksRes, scheduleRes]) => {
      if (liveRes.error) setError(liveRes.error.message);
      else if (liveRes.data)
        setLive({
          is_live: liveRes.data.is_live,
          show_title: liveRes.data.show_title ?? "",
          dj_name: liveRes.data.dj_name ?? "",
          stream_url: liveRes.data.stream_url ?? "",
          stream_kind: liveRes.data.stream_kind ?? "audio",
        });

      if (linksRes.error) setError(linksRes.error.message);
      else if (linksRes.data) setLinks(linksRes.data as LinkRow[]);

      if (scheduleRes.error) setError(scheduleRes.error.message);
      else if (scheduleRes.data) setSchedule(scheduleRes.data as ScheduleRow[]);

      setFetching(false);
    });
  }, []);

  async function saveLive(next: LiveRow) {
    setSavingLive(true);
    setError(null);
    const { error: err } = await supabase
      .from("radio_live")
      .update({ ...next, updated_at: new Date().toISOString() })
      .eq("id", 1);
    if (err) {
      setError(err.message);
    } else {
      setSavedLive(true);
      setTimeout(() => setSavedLive(false), 2000);
    }
    setSavingLive(false);
  }

  // Flips the on-air flag and records the session in radio_live_history —
  // that log is what lets the public page show "recent lives" instead of
  // a bare off-air message once there's at least one past broadcast.
  async function toggleLive() {
    const goingLive = !live.is_live;
    const next = { ...live, is_live: goingLive };
    setLive(next);
    setSavingLive(true);
    setError(null);

    const { error: err } = await supabase
      .from("radio_live")
      .update({ ...next, updated_at: new Date().toISOString() })
      .eq("id", 1);
    if (err) {
      setError(err.message);
      setSavingLive(false);
      return;
    }

    if (goingLive) {
      const { error: histErr } = await supabase.from("radio_live_history").insert({
        show_title: next.show_title || null,
        dj_name: next.dj_name || null,
        started_at: new Date().toISOString(),
      });
      if (histErr) setError(histErr.message);
    } else {
      const { data: openRow } = await supabase
        .from("radio_live_history")
        .select("id")
        .is("ended_at", null)
        .order("started_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (openRow) {
        const { error: histErr } = await supabase
          .from("radio_live_history")
          .update({ ended_at: new Date().toISOString() })
          .eq("id", openRow.id);
        if (histErr) setError(histErr.message);
      }
    }

    setSavedLive(true);
    setTimeout(() => setSavedLive(false), 2000);
    setSavingLive(false);
  }

  // ── Links ────────────────────────────────────────────────────────────
  function updateLink(idx: number, field: keyof LinkRow, val: string | number) {
    setLinks((rs) => rs.map((r, i) => (i === idx ? { ...r, [field]: val } : r)));
  }

  async function saveLink(row: LinkRow) {
    const key = row.id ?? "new";
    setSavingLink(key);
    setError(null);
    const payload = { sort_order: row.sort_order, label: row.label, url: row.url };
    let err;
    if (row.id) {
      ({ error: err } = await supabase.from("radio_links").update(payload).eq("id", row.id));
    } else {
      const { data, error: ie } = await supabase.from("radio_links").insert(payload).select().single();
      err = ie;
      if (data) setLinks((rs) => rs.map((r) => (r === row ? { ...r, id: data.id } : r)));
    }
    if (err) {
      setError(err.message);
      setSavingLink(null);
      return;
    }
    setSavedLink(key);
    setTimeout(() => setSavedLink(null), 2000);
    setSavingLink(null);
  }

  async function deleteLink(id: string) {
    if (!confirm("Delete this link?")) return;
    await supabase.from("radio_links").delete().eq("id", id);
    setLinks((rs) => rs.filter((r) => r.id !== id));
  }

  // ── Schedule ─────────────────────────────────────────────────────────
  function updateSlot(idx: number, field: keyof ScheduleRow, val: string | number) {
    setSchedule((rs) => rs.map((r, i) => (i === idx ? { ...r, [field]: val } : r)));
  }

  async function saveSlot(row: ScheduleRow) {
    const key = row.id ?? "new";
    setSavingSlot(key);
    setError(null);
    const payload = {
      sort_order: row.sort_order,
      day_label: row.day_label,
      time_label: row.time_label,
      show_title: row.show_title,
      dj_name: row.dj_name,
    };
    let err;
    if (row.id) {
      ({ error: err } = await supabase.from("radio_schedule").update(payload).eq("id", row.id));
    } else {
      const { data, error: ie } = await supabase.from("radio_schedule").insert(payload).select().single();
      err = ie;
      if (data) setSchedule((rs) => rs.map((r) => (r === row ? { ...r, id: data.id } : r)));
    }
    if (err) {
      setError(err.message);
      setSavingSlot(null);
      return;
    }
    setSavedSlot(key);
    setTimeout(() => setSavedSlot(null), 2000);
    setSavingSlot(null);
  }

  async function deleteSlot(id: string) {
    if (!confirm("Delete this schedule slot?")) return;
    await supabase.from("radio_schedule").delete().eq("id", id);
    setSchedule((rs) => rs.filter((r) => r.id !== id));
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
          <Link href="/admin/radio" className="text-[11px] tracking-[0.22em] uppercase text-[#ff8a1e]">
            ← Radio
          </Link>
          <span className="text-[rgba(236,231,221,0.3)]">/</span>
          <span className="font-display text-2xl tracking-[0.08em] uppercase text-[#ece7dd]">Live desk</span>
        </div>

        {error && <ErrorBox message={error} onDismiss={() => setError(null)} />}

        {/* ── On-air toggle ────────────────────────────────────────── */}
        <div className={`${card} mb-8`}>
          <div className="flex items-center justify-between mb-5 pb-5 border-b border-[rgba(236,231,221,0.14)]">
            <div className="flex items-center gap-3">
              <span
                className={`w-2.5 h-2.5 rounded-full ${live.is_live ? "bg-[#e5837f] animate-pulse" : "bg-[#3a4143]"}`}
              />
              <span className="text-xs tracking-[0.18em] uppercase text-[#ece7dd]">
                {live.is_live ? "On air" : "Off air"}
              </span>
            </div>
            <button
              onClick={toggleLive}
              disabled={savingLive}
              className={`text-[10px] tracking-[0.16em] uppercase px-4 py-2 disabled:opacity-50 ${
                live.is_live
                  ? "border border-[#7a1f2b]/60 text-[#e5837f]"
                  : "bg-[#ff8a1e] text-[#12100c]"
              }`}
            >
              {live.is_live ? "Go off air" : "Go live"}
            </button>
          </div>

          <p className="text-xs text-[#9aa19d] mb-5 leading-relaxed">
            Toggling this flips the &ldquo;LIVE NOW&rdquo; banner on the Radio page. How the audio actually
            reaches listeners depends on the field below — pick whichever matches your broadcast setup.
          </p>

          <div className="grid sm:grid-cols-2 gap-4 mb-5">
            <div>
              <label className={lbl}>Show title</label>
              <input
                className={inp}
                value={live.show_title}
                onChange={(e) => setLive({ ...live, show_title: e.target.value })}
                placeholder="Krantas Radio — Selectors"
              />
            </div>
            <div>
              <label className={lbl}>DJ / host</label>
              <input
                className={inp}
                value={live.dj_name}
                onChange={(e) => setLive({ ...live, dj_name: e.target.value })}
                placeholder="Alyga SOFT"
              />
            </div>
            <div className="sm:col-span-2">
              <label className={lbl}>Stream source</label>
              <select
                className={`${inp} appearance-none`}
                value={live.stream_kind}
                onChange={(e) => setLive({ ...live, stream_kind: e.target.value as LiveRow["stream_kind"] })}
              >
                <option value="audio">Direct audio stream (Icecast/Shoutcast mount, Zeno.fm, Radio.co, Radiojar…)</option>
                <option value="embed">Embeddable player page (Mixcloud Live, YouTube Live, Twitch)</option>
                <option value="link">Plain link — opens in a new tab</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className={lbl}>Stream URL</label>
              <input
                className={inp}
                value={live.stream_url}
                onChange={(e) => setLive({ ...live, stream_url: e.target.value })}
                placeholder={
                  live.stream_kind === "audio"
                    ? "https://stream.example.com/live.mp3"
                    : live.stream_kind === "embed"
                    ? "https://player.mixcloud.com/widget/live/?feed=..."
                    : "https://example.com/listen"
                }
              />
            </div>
          </div>

          <div className="flex items-center justify-end pt-3 border-t border-[rgba(236,231,221,0.14)]">
            <button
              onClick={() => saveLive(live)}
              disabled={savingLive}
              className="bg-[#ff8a1e] text-[#12100c] text-[10px] tracking-[0.16em] uppercase px-4 py-2 disabled:opacity-50"
            >
              {savedLive ? "✓ Saved" : "Save"}
            </button>
          </div>
        </div>

        {/* ── Schedule ─────────────────────────────────────────────── */}
        <div className="mb-3 flex items-center justify-between">
          <span className="text-[11px] tracking-[0.2em] uppercase text-[#9aa19d]">Broadcast schedule</span>
        </div>
        <div className="flex flex-col gap-3 mb-8">
          {schedule.map((row, idx) => (
            <div key={row.id ?? idx} className={card}>
              <div className="grid sm:grid-cols-2 gap-3 mb-3">
                <div>
                  <label className={lbl}>Day</label>
                  <input className={inp} value={row.day_label} onChange={(e) => updateSlot(idx, "day_label", e.target.value)} placeholder="Tuesdays" />
                </div>
                <div>
                  <label className={lbl}>Time</label>
                  <input className={inp} value={row.time_label} onChange={(e) => updateSlot(idx, "time_label", e.target.value)} placeholder="20:00 EET" />
                </div>
                <div>
                  <label className={lbl}>Show title</label>
                  <input className={inp} value={row.show_title} onChange={(e) => updateSlot(idx, "show_title", e.target.value)} placeholder="Boiler Room Warmup" />
                </div>
                <div>
                  <label className={lbl}>DJ / host</label>
                  <input className={inp} value={row.dj_name} onChange={(e) => updateSlot(idx, "dj_name", e.target.value)} placeholder="Silt" />
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[rgba(236,231,221,0.14)]">
                <button
                  onClick={() => saveSlot(row)}
                  disabled={savingSlot === (row.id ?? "new")}
                  className="bg-[#ff8a1e] text-[#12100c] text-[10px] tracking-[0.16em] uppercase px-4 py-2 disabled:opacity-50"
                >
                  {savedSlot === (row.id ?? "new") ? "✓ Saved" : "Save"}
                </button>
                {row.id && (
                  <button
                    onClick={() => deleteSlot(row.id!)}
                    className="border border-[#7a1f2b]/60 text-[#e5837f] text-[10px] tracking-[0.16em] uppercase px-4 py-2"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))}
          <button
            onClick={() => setSchedule((rs) => [...rs, { ...EMPTY_SLOT, sort_order: rs.length }])}
            className="border border-dashed border-[rgba(236,231,221,0.3)] w-full py-3 text-[11px] tracking-[0.2em] uppercase text-[#9aa19d] hover:text-[#ece7dd] hover:border-[#ff8a1e] transition-colors"
          >
            + Add slot
          </button>
        </div>

        {/* ── Listen / social links ────────────────────────────────── */}
        <div className="mb-3 flex items-center justify-between">
          <span className="text-[11px] tracking-[0.2em] uppercase text-[#9aa19d]">Listen &amp; social links</span>
        </div>
        <div className="flex flex-col gap-3">
          {links.map((row, idx) => (
            <div key={row.id ?? idx} className={card}>
              <div className="grid sm:grid-cols-2 gap-3 mb-3">
                <div>
                  <label className={lbl}>Label</label>
                  <input className={inp} value={row.label} onChange={(e) => updateLink(idx, "label", e.target.value)} placeholder="Soundcloud" />
                </div>
                <div>
                  <label className={lbl}>URL</label>
                  <input className={inp} value={row.url} onChange={(e) => updateLink(idx, "url", e.target.value)} placeholder="https://soundcloud.com/..." />
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[rgba(236,231,221,0.14)]">
                <button
                  onClick={() => saveLink(row)}
                  disabled={savingLink === (row.id ?? "new")}
                  className="bg-[#ff8a1e] text-[#12100c] text-[10px] tracking-[0.16em] uppercase px-4 py-2 disabled:opacity-50"
                >
                  {savedLink === (row.id ?? "new") ? "✓ Saved" : "Save"}
                </button>
                {row.id && (
                  <button
                    onClick={() => deleteLink(row.id!)}
                    className="border border-[#7a1f2b]/60 text-[#e5837f] text-[10px] tracking-[0.16em] uppercase px-4 py-2"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))}
          <button
            onClick={() => setLinks((rs) => [...rs, { ...EMPTY_LINK, sort_order: rs.length }])}
            className="border border-dashed border-[rgba(236,231,221,0.3)] w-full py-3 text-[11px] tracking-[0.2em] uppercase text-[#9aa19d] hover:text-[#ece7dd] hover:border-[#ff8a1e] transition-colors"
          >
            + Add link
          </button>
        </div>
      </div>
    </div>
  );
}
