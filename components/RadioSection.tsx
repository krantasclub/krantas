"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { RadioData } from "@/lib/data";
import {
  radioEpisodes as fallbackEpisodes,
  radioLiveFallback,
  radioLiveHistoryFallback,
  radioLinks as fallbackLinks,
  radioSchedule as fallbackSchedule,
  type RadioLiveStatus,
} from "@/lib/content";
import Reveal from "./Reveal";
import SectionHeading from "./SectionHeading";
import AudioVisualizer, {
  VisualModePicker,
  FullscreenButton,
  useIsFullscreen,
  getStoredVisualMode,
  type VisualMode,
} from "./AudioVisualizer";

// The live on-air status is the one piece of radio data that's still
// fetched client-side (polled every 30s) — everything else (episodes,
// links, schedule, live history) is now fetched server-side in
// app/radio/page.tsx and handed down via `initialData`, so the page never
// flashes the fallback content on load the way the old all-client-side
// fetch did.
type LiveRow = {
  is_live: boolean;
  show_title: string | null;
  dj_name: string | null;
  stream_url: string | null;
  stream_kind: "audio" | "embed" | "link";
};

function rowToLive(r: LiveRow): RadioLiveStatus {
  return {
    isLive: r.is_live,
    showTitle: r.show_title ?? undefined,
    djName: r.dj_name ?? undefined,
    streamUrl: r.stream_url ?? undefined,
    kind: r.stream_kind,
  };
}

function formatSessionDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

// LIVE status is polled rather than fetched once, so the banner (and the
// on-air light) update for anyone already sitting on the page when a show
// starts or ends — no realtime subscription needed for something that
// changes a couple of times a day.
const LIVE_POLL_MS = 30_000;

function LiveNowPlayer({
  live,
  onAudioReady,
  onPlayingChange,
}: {
  live: RadioLiveStatus;
  onAudioReady?: (el: HTMLAudioElement | null) => void;
  onPlayingChange?: (playing: boolean) => void;
}) {
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (live.kind !== "audio" || !live.streamUrl) {
      onAudioReady?.(null);
      onPlayingChange?.(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [live.kind, live.streamUrl]);

  if (!live.streamUrl) {
    return (
      <div className="font-mono text-xs uppercase tracking-[0.14em] text-[var(--ink)]/70">
        On air now — stream link coming shortly
      </div>
    );
  }

  if (live.kind === "embed") {
    return (
      <div className="w-full max-w-[520px] aspect-video border border-[var(--ink)]/30 bg-black/20">
        <iframe
          src={live.streamUrl}
          title="Live broadcast"
          allow="autoplay"
          className="w-full h-full"
        />
      </div>
    );
  }

  if (live.kind === "link") {
    return (
      <a
        href={live.streamUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-3 font-mono text-xs uppercase tracking-[0.14em] border border-[var(--ink)]/50 px-5 py-3 hover:bg-[var(--ink)] hover:text-[#12100c] transition-colors"
      >
        Listen live ↗
      </a>
    );
  }

  return (
    <div className="flex items-center gap-4">
      <button
        aria-label={playing ? "Pause live stream" : "Play live stream"}
        onClick={() => {
          const el = audioRef.current;
          if (!el) return;
          if (playing) {
            el.pause();
          } else {
            el.play().catch(() => {});
          }
        }}
        className="shrink-0 w-14 h-14 sm:w-20 sm:h-20 rounded-full border border-[var(--ink)]/50 flex items-center justify-center hover:bg-[var(--ink)] hover:text-[#12100c] transition-colors"
      >
        {playing ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M6 5h4v14H6zM14 5h4v14h-4z" />
          </svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M8 5v14l11-7z" />
          </svg>
        )}
      </button>
      <audio
        ref={(el) => {
          audioRef.current = el;
          onAudioReady?.(el);
        }}
        src={live.streamUrl}
        preload="none"
        crossOrigin="anonymous"
        onPlaying={() => {
          setPlaying(true);
          onPlayingChange?.(true);
        }}
        onPause={() => {
          setPlaying(false);
          onPlayingChange?.(false);
        }}
        onEnded={() => {
          setPlaying(false);
          onPlayingChange?.(false);
        }}
      />
    </div>
  );
}

export default function RadioSection({ initialData }: { initialData?: RadioData }) {
  const [episodes] = useState(initialData?.episodes ?? fallbackEpisodes);
  const [live, setLive] = useState<RadioLiveStatus>(initialData?.live ?? radioLiveFallback);
  const [links] = useState(initialData?.links ?? fallbackLinks);
  const [schedule] = useState(initialData?.schedule ?? fallbackSchedule);
  const [liveHistory] = useState(initialData?.liveHistory ?? radioLiveHistoryFallback);

  // Visual style for the audio-reactive canvas that fills the big card in
  // place of a flat thumbnail — a shared, remembered preference rather than
  // per-track, since it's about how the viewer likes to watch, not the track.
  const [visualMode, setVisualMode] = useState<VisualMode>(() => getStoredVisualMode());

  const [liveAudioEl, setLiveAudioEl] = useState<HTMLAudioElement | null>(null);
  const [livePlaying, setLivePlaying] = useState(false);

  const featuredAudioRef = useRef<HTMLAudioElement | null>(null);
  const [featuredAudioEl, setFeaturedAudioEl] = useState<HTMLAudioElement | null>(null);
  const [featuredPlaying, setFeaturedPlaying] = useState(false);

  // Each big card can go fullscreen on its own — the Fullscreen API tracks
  // this per-element via `document.fullscreenElement`, so each card needs
  // its own ref and its own hook instance rather than one shared flag.
  const liveCardRef = useRef<HTMLDivElement | null>(null);
  const featuredCardRef = useRef<HTMLDivElement | null>(null);
  const liveFullscreen = useIsFullscreen(liveCardRef);
  const featuredFullscreen = useIsFullscreen(featuredCardRef);

  useEffect(() => {
    // Episodes/links/schedule/live-history are already seeded from the
    // server fetch (app/radio/page.tsx) — only the on-air status is polled
    // client-side, since it can change while someone is already on the page.
    let cancelled = false;
    function fetchLive() {
      supabase
        .from("radio_live")
        .select("*")
        .eq("id", 1)
        .maybeSingle()
        .then(({ data, error }) => {
          if (!cancelled && !error && data) setLive(rowToLive(data as LiveRow));
        });
    }
    fetchLive();
    const interval = setInterval(fetchLive, LIVE_POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  const featured = episodes[0];
  if (!featured) return null;

  return (
    <section id="radio" className="relative bg-[var(--bg)] px-5 sm:px-8 py-20 sm:py-28">
      <div className="max-w-[1600px] mx-auto">
        <SectionHeading
          eyebrow="Krantas Radio"
          title="Radio"
          note="New transmissions every second week"
        />

        {!live.isLive && (
          <div className="mb-3 font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--ink)]/50">
            {liveHistory.length > 0 ? (
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                <span className="text-[var(--ink)]/70">Off air · Recent:</span>
                {liveHistory.map((h, i) => (
                  <span key={h.id} className="normal-case tracking-normal text-[var(--ink)]/80">
                    {formatSessionDate(h.startedAt)} — {h.showTitle || "Untitled set"}
                    {h.djName ? ` · ${h.djName}` : ""}
                    {i < liveHistory.length - 1 ? "," : ""}
                  </span>
                ))}
              </div>
            ) : (
              <span>
                Off air
                {schedule[0] &&
                  ` — next up: ${schedule[0].dayLabel}${schedule[0].timeLabel ? ` · ${schedule[0].timeLabel}` : ""}${
                    schedule[0].showTitle ? ` · ${schedule[0].showTitle}` : ""
                  }`}
              </span>
            )}
          </div>
        )}

        <Reveal>
          {live.isLive ? (
            <div
              ref={liveCardRef}
              className={`relative overflow-hidden border border-[var(--accent)] flex items-end p-6 sm:p-10 ${
                liveFullscreen ? "w-screen h-screen" : "aspect-[16/9] sm:aspect-[21/9]"
              }`}
              style={{ background: "#000" }}
            >
              <div className="absolute inset-0 grain opacity-50" />
              {live.kind === "audio" && live.streamUrl && (
                <AudioVisualizer
                  audioEl={liveAudioEl}
                  playing={livePlaying}
                  mode={visualMode}
                  className="mix-blend-screen opacity-90"
                />
              )}
              <div className="absolute top-6 left-6 sm:top-10 sm:left-10 flex items-center gap-2 font-mono text-xs tracking-[0.16em] uppercase text-[var(--accent)]">
                <span className="w-2 h-2 rounded-full bg-[var(--accent)] animate-pulse" />
                Live now
              </div>
              {live.kind === "audio" && live.streamUrl && (
                <div className="absolute top-6 right-6 sm:top-10 sm:right-10 flex items-center gap-2">
                  <VisualModePicker value={visualMode} onChange={setVisualMode} />
                  <FullscreenButton targetRef={liveCardRef} isFullscreen={liveFullscreen} />
                </div>
              )}
              <div className="relative z-10 flex flex-col gap-4 sm:gap-6">
                <div>
                  <h3 className="font-display text-2xl sm:text-5xl leading-[0.9] text-[var(--ink)]">
                    {live.showTitle || "On air"}
                  </h3>
                  {live.djName && (
                    <p className="mt-2 font-mono text-xs sm:text-sm uppercase tracking-[0.14em] text-[var(--ink)]/70">
                      {live.djName}
                    </p>
                  )}
                </div>
                <LiveNowPlayer
                  live={live}
                  onAudioReady={setLiveAudioEl}
                  onPlayingChange={setLivePlaying}
                />
              </div>
            </div>
          ) : (
            <div
              ref={featuredCardRef}
              className={`relative overflow-hidden border border-[var(--line)] flex items-end p-6 sm:p-10 ${
                featuredFullscreen ? "w-screen h-screen" : "aspect-[16/9] sm:aspect-[21/9]"
              }`}
              style={{
                background:
                  featured.audioUrl && featuredPlaying
                    ? "#000"
                    : featured.imageUrl
                      ? `url(${featured.imageUrl}) center / cover`
                      : `linear-gradient(160deg, ${featured.from}, ${featured.to})`,
              }}
            >
              <div className="absolute inset-0 grain opacity-50" />
              {featured.imageUrl && !(featured.audioUrl && featuredPlaying) && (
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
              )}
              {featured.audioUrl && (
                <AudioVisualizer
                  audioEl={featuredAudioEl}
                  playing={featuredPlaying}
                  mode={visualMode}
                  className="mix-blend-screen opacity-90"
                />
              )}
              <div className="absolute top-6 left-6 sm:top-10 sm:left-10 font-mono text-xs tracking-[0.16em] uppercase text-[var(--ink)]/70">
                Season {featured.season} · Episode {featured.episode}
              </div>
              {featured.audioUrl && (
                <div className="absolute top-6 right-6 sm:top-10 sm:right-10 flex items-center gap-2">
                  <VisualModePicker value={visualMode} onChange={setVisualMode} />
                  <FullscreenButton targetRef={featuredCardRef} isFullscreen={featuredFullscreen} />
                </div>
              )}
              <div className="relative z-10 flex items-center gap-4 sm:gap-6">
                <button
                  aria-label={featuredPlaying ? "Pause latest episode" : "Play latest episode"}
                  disabled={!featured.audioUrl}
                  onClick={() => {
                    const el = featuredAudioRef.current;
                    if (!el) return;
                    if (featuredPlaying) el.pause();
                    else el.play().catch(() => {});
                  }}
                  className="shrink-0 w-14 h-14 sm:w-20 sm:h-20 rounded-full border border-[var(--ink)]/50 flex items-center justify-center hover:bg-[var(--ink)] hover:text-[#12100c] transition-colors disabled:opacity-40 disabled:pointer-events-none"
                >
                  {featuredPlaying ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <path d="M6 5h4v14H6zM14 5h4v14h-4z" />
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  )}
                </button>
                <h3 className="font-display text-2xl sm:text-5xl leading-[0.9] text-[var(--ink)]">
                  {featured.title}
                </h3>
              </div>
              {featured.audioUrl && (
                <audio
                  key={featured.id}
                  ref={(el) => {
                    featuredAudioRef.current = el;
                    setFeaturedAudioEl(el);
                  }}
                  src={featured.audioUrl}
                  preload="none"
                  crossOrigin="anonymous"
                  onPlaying={() => setFeaturedPlaying(true)}
                  onPause={() => setFeaturedPlaying(false)}
                  onEnded={() => setFeaturedPlaying(false)}
                  className="hidden"
                />
              )}
            </div>
          )}
        </Reveal>

        <div className="mt-4 sm:mt-6 flex gap-2 sm:gap-3 flex-wrap">
          {links.map((l) => (
            <a
              key={l.id}
              href={l.url}
              target={l.url.startsWith("http") ? "_blank" : undefined}
              rel={l.url.startsWith("http") ? "noopener noreferrer" : undefined}
              className="font-mono text-[11px] sm:text-xs uppercase tracking-[0.14em] border border-[var(--line-strong)] px-4 py-2.5 hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors"
            >
              {l.label}
            </a>
          ))}
        </div>

        {schedule.length > 0 && (
          <div className="mt-10 sm:mt-12 flex flex-col gap-2 max-w-[560px]">
            <div className="font-mono text-[10px] uppercase tracking-[0.28em] text-[var(--ink)]/50 mb-1">
              Broadcast schedule
            </div>
            {schedule.map((s) => (
              <div
                key={s.id}
                className="flex items-baseline justify-between gap-4 border-b border-[var(--line)] py-2.5 font-mono text-xs sm:text-sm"
              >
                <span className="text-[var(--ink)]/60 uppercase tracking-[0.1em] shrink-0">
                  {s.dayLabel} · {s.timeLabel}
                </span>
                <span className="text-[var(--ink)] text-right">
                  {s.showTitle}
                  {s.djName ? ` — ${s.djName}` : ""}
                </span>
              </div>
            ))}
          </div>
        )}

        <div className="mt-14 sm:mt-16 overflow-x-auto -mx-5 sm:mx-0 px-5 sm:px-0">
          <div className="flex gap-3 sm:gap-5 w-max">
            {episodes.map((ep, i) => (
              <Reveal key={ep.id} delay={i * 60}>
                <a
                  href="#"
                  className="group block w-[220px] sm:w-[260px] aspect-square relative overflow-hidden border border-[var(--line)] hover:border-[var(--accent)] transition-colors"
                  style={
                    ep.imageUrl
                      ? { backgroundImage: `url(${ep.imageUrl})`, backgroundSize: "cover", backgroundPosition: "center" }
                      : { background: `linear-gradient(150deg, ${ep.from}, ${ep.to})` }
                  }
                >
                  <div className="absolute inset-0 grain opacity-50" />
                  {ep.imageUrl && (
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/5 to-transparent" />
                  )}
                  <div className="absolute top-3 left-3 font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--ink)]/70">
                    S{ep.season} · E{ep.episode}
                  </div>
                  <div className="absolute inset-x-0 bottom-0 p-3">
                    <p className="font-display text-lg leading-tight text-[var(--ink)] group-hover:text-[var(--accent)] transition-colors">
                      {ep.title}
                    </p>
                  </div>
                </a>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
