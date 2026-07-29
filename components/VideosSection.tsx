"use client";

import { useMemo, useRef, useState } from "react";
import Image from "next/image";
import { videos as fallbackVideos, getYouTubeId, isDirectVideoUrl, type Video } from "@/lib/content";
import Reveal from "./Reveal";
import { useLanguage } from "./LanguageProvider";

function PlayGlyph() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-[var(--ink)] group-hover:text-[#12100c] translate-x-[1px]" aria-hidden="true">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

function VideoCard({
  video,
  index,
  active,
  onPlay,
}: {
  video: Video;
  index: number;
  active: boolean;
  onPlay: () => void;
}) {
  const youtubeId = video.source === "youtube" ? getYouTubeId(video.videoUrl) : null;
  const isFile = video.source === "upload" || (video.source === "url" && isDirectVideoUrl(video.videoUrl));
  const isLinkOut = !youtubeId && !isFile;

  return (
    <Reveal delay={(index % 4) * 70} className="shrink-0 w-full sm:w-[340px] snap-center sm:snap-start">
      <div className="group">
        <div
          className="relative aspect-video overflow-hidden border border-[var(--line)] group-hover:border-[var(--accent)] transition-colors"
          style={{ background: `linear-gradient(155deg, ${video.from}, ${video.to})` }}
        >
          {isLinkOut ? (
            <a
              href={video.videoUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Watch ${video.title}`}
              className="absolute inset-0 w-full h-full"
            >
              {video.thumbnailUrl && (
                <Image
                  src={video.thumbnailUrl}
                  alt=""
                  fill
                  sizes="340px"
                  className="object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                  loading="lazy"
                />
              )}
              <div className="absolute inset-0 grain opacity-40" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-black/30" />
              <span className="absolute inset-0 flex items-center justify-center">
                <span className="w-12 h-12 sm:w-14 sm:h-14 rounded-full border border-[var(--ink)]/60 bg-black/30 backdrop-blur-sm flex items-center justify-center group-hover:bg-[var(--accent)] group-hover:border-[var(--accent)] transition-colors">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--ink)] group-hover:text-[#12100c]" aria-hidden="true">
                    <path d="M7 17 17 7M9 7h8v8" />
                  </svg>
                </span>
              </span>
            </a>
          ) : active ? (
            youtubeId ? (
              <iframe
                className="absolute inset-0 w-full h-full"
                src={`https://www.youtube-nocookie.com/embed/${youtubeId}?autoplay=1&rel=0`}
                title={video.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <video
                className="absolute inset-0 w-full h-full object-cover"
                src={video.videoUrl}
                poster={video.thumbnailUrl}
                controls
                autoPlay
              />
            )
          ) : (
            <button onClick={onPlay} aria-label={`Play ${video.title}`} className="absolute inset-0 w-full h-full">
              {video.thumbnailUrl ? (
                <Image
                  src={video.thumbnailUrl}
                  alt=""
                  fill
                  sizes="340px"
                  className="object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                  loading="lazy"
                />
              ) : youtubeId ? (
                <Image
                  src={`https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`}
                  alt=""
                  fill
                  sizes="340px"
                  className="object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                  loading="lazy"
                />
              ) : isFile ? (
                // No thumbnail on file — show the video itself, seeked a
                // touch past the start so the "poster" isn't a black frame.
                <video
                  className="absolute inset-0 w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                  src={video.videoUrl}
                  muted
                  playsInline
                  preload="metadata"
                  onLoadedMetadata={(e) => {
                    const v = e.currentTarget;
                    try {
                      v.currentTime = Math.min(0.5, (v.duration || 1) / 4);
                    } catch {
                      /* some browsers throw on a not-yet-seekable video — harmless */
                    }
                  }}
                />
              ) : null}
              <div className="absolute inset-0 grain opacity-40" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-black/30" />
              <span className="absolute inset-0 flex items-center justify-center">
                <span className="w-12 h-12 sm:w-14 sm:h-14 rounded-full border border-[var(--ink)]/60 bg-black/30 backdrop-blur-sm flex items-center justify-center group-hover:bg-[var(--accent)] group-hover:border-[var(--accent)] transition-colors">
                  <PlayGlyph />
                </span>
              </span>
            </button>
          )}
        </div>
        <p className="mt-3 font-mono text-xs sm:text-sm uppercase tracking-[0.06em] text-[var(--ink)]/85 group-hover:text-[var(--accent)] transition-colors">
          {video.title}
        </p>
        {(video.artist || video.genre) && (
          <p className="mt-0.5 font-mono text-[10px] sm:text-[11px] uppercase tracking-[0.08em] text-[var(--ink-dim)]">
            {[video.artist, video.genre].filter(Boolean).join(" · ")}
          </p>
        )}
      </div>
    </Reveal>
  );
}

function FilterPill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`font-mono text-[10px] sm:text-[11px] uppercase tracking-[0.1em] px-3 py-1.5 border rounded-full transition-colors whitespace-nowrap ${
        active
          ? "border-[var(--accent)] text-[var(--accent)]"
          : "border-[var(--ink)]/30 text-[var(--ink-dim)] hover:text-[var(--ink)] hover:border-[var(--ink)]/60"
      }`}
    >
      {children}
    </button>
  );
}

export default function VideosSection({ initialItems }: { initialItems?: Video[] }) {
  const { t } = useLanguage();
  const [items] = useState<Video[]>(initialItems ?? fallbackVideos);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [genre, setGenre] = useState<string | null>(null);
  const [artist, setArtist] = useState<string | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);

  const genres = useMemo(
    () => Array.from(new Set(items.map((v) => v.genre).filter((g): g is string => !!g))),
    [items]
  );
  const artists = useMemo(
    () => Array.from(new Set(items.map((v) => v.artist).filter((a): a is string => !!a))),
    [items]
  );

  const filtered = items.filter(
    (v) => (!genre || v.genre === genre) && (!artist || v.artist === artist)
  );

  function scrollByCards(dir: -1 | 1) {
    const el = trackRef.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>("[data-video-card]");
    const step = (card?.offsetWidth ?? 300) + 24; // card width + gap
    el.scrollBy({ left: dir * step, behavior: "smooth" });
  }

  return (
    <section id="sets" className="relative bg-[var(--bg)] px-5 sm:px-8 py-14 sm:py-20 border-y border-[var(--line)]">
      <div className="max-w-[1600px] mx-auto">
        {(genres.length > 0 || artists.length > 0) && (
          <div className="flex flex-wrap items-center gap-2 mb-6 sm:mb-8">
            {genres.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5">
                <FilterPill active={genre === null} onClick={() => setGenre(null)}>{t("sections.videosAllGenres")}</FilterPill>
                {genres.map((g) => (
                  <FilterPill key={g} active={genre === g} onClick={() => setGenre(genre === g ? null : g)}>
                    {g}
                  </FilterPill>
                ))}
              </div>
            )}
            {artists.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 sm:ml-4">
                <FilterPill active={artist === null} onClick={() => setArtist(null)}>{t("sections.videosAllArtists")}</FilterPill>
                {artists.map((a) => (
                  <FilterPill key={a} active={artist === a} onClick={() => setArtist(artist === a ? null : a)}>
                    {a}
                  </FilterPill>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="flex items-center justify-end gap-2 mb-5 sm:mb-7">
          <button
            onClick={() => scrollByCards(-1)}
            aria-label="Previous videos"
            className="w-9 h-9 rounded-full border border-[var(--ink)]/40 flex items-center justify-center hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M15.5 4.5 8 12l7.5 7.5 1.4-1.4L10.8 12l6.1-6.1z" />
            </svg>
          </button>
          <button
            onClick={() => scrollByCards(1)}
            aria-label="Next videos"
            className="w-9 h-9 rounded-full border border-[var(--ink)]/40 flex items-center justify-center hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M8.5 4.5 16 12l-7.5 7.5-1.4-1.4L13.2 12 7.1 5.9z" />
            </svg>
          </button>
        </div>

        {filtered.length === 0 ? (
          <p className="font-mono text-xs text-[var(--ink-dim)] py-8 text-center">No videos match those filters.</p>
        ) : (
          <div
            ref={trackRef}
            className="flex gap-5 sm:gap-8 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {filtered.map((v, i) => (
              <div key={v.id} data-video-card className="shrink-0 w-full sm:w-[340px]">
                <VideoCard video={v} index={i} active={playingId === v.id} onPlay={() => setPlayingId(v.id)} />
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
