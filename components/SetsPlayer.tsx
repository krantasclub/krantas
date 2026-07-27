"use client";

import { useEffect, useRef, useState } from "react";
import { radioEpisodes as fallbackEpisodes, type RadioEpisode } from "@/lib/content";

/**
 * Persistent "listen while you browse" player. Lives in <Nav>, which
 * is mounted once in the root layout, so playback state (and the
 * <audio> element itself) survives client-side navigation between
 * pages instead of restarting on every route change.
 *
 * Tracks are managed in /admin/radio (uploaded straight to the
 * "audio" Supabase Storage bucket) — only episodes with a real
 * audioUrl end up in the playlist. `initialEpisodes` comes from a
 * server-side fetch in app/layout.tsx, so the real playlist (or the
 * hardcoded fallback, if nothing's been uploaded yet) is already
 * correct on first paint — no client fetch-and-swap here.
 */
export default function SetsPlayer({ initialEpisodes }: { initialEpisodes?: RadioEpisode[] }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [index, setIndex] = useState(0);
  const [errored, setErrored] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [episodes] = useState<RadioEpisode[]>(initialEpisodes ?? fallbackEpisodes);

  // Close the track list on an outside click or Escape, same as any
  // other dropdown — it's not a modal, so anything short of that
  // should just dismiss it.
  useEffect(() => {
    if (!menuOpen) return;
    function onPointerDown(e: PointerEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setMenuOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen]);

  const playlist = episodes.filter((e) => e.audioUrl);
  const current = playlist[index] ?? playlist[0];

  function toggle() {
    const audio = audioRef.current;
    if (!audio || !current) return;
    if (playing) {
      audio.pause();
    } else {
      setErrored(false);
      audio.play().catch(() => setErrored(true));
    }
  }

  function playNext() {
    setIndex((i) => (i + 1) % playlist.length);
  }

  // Jump straight to a specific track from the dropdown, rather than
  // stepping through with Next. Picking the track already playing just
  // resumes it if it's paused; picking a different one always starts
  // playback, since choosing a track from a list is a "play this" gesture.
  function playTrack(i: number) {
    setErrored(false);
    setMenuOpen(false);
    if (i === index) {
      const audio = audioRef.current;
      if (audio && !playing) audio.play().catch(() => setErrored(true));
      return;
    }
    setIndex(i);
    setPlaying(true);
  }

  // Auto-advance into the next track once a new index is picked while
  // we were already playing (e.g. after a track ends, or Skip is hit).
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !current || !playing) return;
    audio.play().catch(() => setErrored(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  if (!current) return null;

  return (
    <div
      ref={containerRef}
      className={`relative group flex items-center gap-2 sm:gap-2.5 rounded-full border pl-[3px] pr-2.5 sm:pr-3.5 py-[3px] transition-colors ${
        playing
          ? "border-[var(--accent)]/60 bg-[var(--accent)]/10"
          : "border-[var(--ink)]/30 hover:border-[var(--accent)]"
      }`}
    >
      <audio
        ref={audioRef}
        src={current.audioUrl}
        preload="none"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => playNext()}
        onError={() => setErrored(true)}
      />

      <button
        onClick={toggle}
        aria-label={playing ? "Pause Krantas set" : "Play Krantas set"}
        title={errored ? "Couldn't load this set" : current.title}
        className={`shrink-0 w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center transition-colors ${
          playing
            ? "bg-[var(--accent)] text-[#12100c]"
            : "bg-transparent text-[var(--ink)] border border-[var(--ink)]/40 group-hover:border-[var(--accent)] group-hover:text-[var(--accent)]"
        }`}
      >
        {playing ? (
          <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M6 5h4v14H6zM14 5h4v14h-4z" />
          </svg>
        ) : (
          <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" className="translate-x-[1px]" aria-hidden="true">
            <path d="M8 5v14l11-7z" />
          </svg>
        )}
      </button>

      <button
        onClick={toggle}
        className="hidden sm:flex flex-col items-start leading-tight max-w-[110px] lg:max-w-[150px] text-left"
      >
        <span
          className={`font-mono text-[8px] uppercase tracking-[0.16em] ${
            playing ? "text-[var(--accent)]" : "text-[var(--ink-dim)]"
          }`}
        >
          {errored ? "Unavailable" : playing ? "On air" : "Krantas Sets"}
        </span>
        <span className="font-mono text-[10px] uppercase tracking-[0.02em] text-[var(--ink)] truncate w-full">
          {current.title}
        </span>
      </button>

      {playlist.length > 1 && (
        <button
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Choose a set"
          aria-expanded={menuOpen}
          title="Choose a set"
          className={`shrink-0 w-5 h-5 flex items-center justify-center transition-colors ${
            menuOpen ? "text-[var(--accent)]" : "text-[var(--ink-dim)] hover:text-[var(--accent)]"
          }`}
        >
          <svg
            width="10"
            height="10"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`transition-transform ${menuOpen ? "rotate-180" : ""}`}
            aria-hidden="true"
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>
      )}

      {playing && (
        <>
          <span className="hidden sm:block text-[var(--accent)]">
            <span className="eq-bars" aria-hidden="true">
              <span />
              <span />
              <span />
            </span>
          </span>
          {playlist.length > 1 && (
            <button
              onClick={() => playNext()}
              aria-label="Next set"
              title="Next set"
              className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[var(--ink-dim)] hover:text-[var(--accent)] transition-colors"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M6 5v14l8-7-8-7zm10 0v14h2V5h-2z" />
              </svg>
            </button>
          )}
        </>
      )}

      {menuOpen && playlist.length > 1 && (
        <div
          role="listbox"
          aria-label="Choose a set"
          className="absolute top-full right-0 mt-2 w-64 max-h-80 overflow-y-auto bg-[var(--bg-raised)] border border-[var(--line)] rounded-lg shadow-xl z-50 p-1"
        >
          {playlist.map((ep, i) => (
            <button
              key={ep.id}
              role="option"
              aria-selected={i === index}
              onClick={() => playTrack(i)}
              className={`w-full flex items-center gap-2.5 px-2 py-1.5 rounded text-left transition-colors ${
                i === index ? "bg-[var(--accent)]/15" : "hover:bg-white/5"
              }`}
            >
              <span
                className="w-8 h-8 rounded shrink-0 overflow-hidden"
                style={
                  ep.imageUrl
                    ? { backgroundImage: `url(${ep.imageUrl})`, backgroundSize: "cover", backgroundPosition: "center" }
                    : { background: `linear-gradient(155deg, ${ep.from}, ${ep.to})` }
                }
              />
              <span className="flex flex-col items-start leading-tight min-w-0">
                <span
                  className={`font-mono text-[8px] uppercase tracking-[0.14em] ${
                    i === index ? "text-[var(--accent)]" : "text-[var(--ink-dim)]"
                  }`}
                >
                  S{ep.season} · E{ep.episode}
                </span>
                <span className="font-mono text-[10px] uppercase tracking-[0.02em] text-[var(--ink)] truncate w-full">
                  {ep.title}
                </span>
              </span>
              {i === index && playing && (
                <span className="ml-auto shrink-0 text-[var(--accent)]">
                  <span className="eq-bars" aria-hidden="true">
                    <span />
                    <span />
                    <span />
                  </span>
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
