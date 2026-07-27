"use client";

import { useCallback, useEffect, useState } from "react";
import { galleryImages as fallbackGalleryImages, type GalleryImage } from "@/lib/content";
import Reveal from "./Reveal";

function Strip({
  images,
  direction,
  tilt,
  onSelect,
}: {
  images: GalleryImage[];
  direction: "left" | "right";
  tilt: number;
  onSelect: (id: string) => void;
}) {
  // Duplicate the row twice so the animation can loop seamlessly at -50%.
  const loop = [...images, ...images];
  return (
    <div className="overflow-hidden" style={{ transform: `rotate(${tilt}deg)` }}>
      <div className={direction === "left" ? "gallery-track-left" : "gallery-track-right"}>
        {loop.map((img, i) => (
          <button
            key={`${img.id}-${i}`}
            onClick={() => onSelect(img.id)}
            aria-label={`Open ${img.alt}`}
            className="relative shrink-0 w-[260px] sm:w-[340px] aspect-video mx-2.5 sm:mx-4 overflow-hidden border border-[var(--line)] shadow-[0_10px_30px_rgba(0,0,0,0.45)] hover:border-[var(--accent)] transition-colors cursor-zoom-in"
          >
            <img
              src={img.src}
              alt={img.alt}
              className="w-full h-full object-cover grayscale-[15%]"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
          </button>
        ))}
      </div>
    </div>
  );
}

function Lightbox({
  index,
  images,
  onClose,
  onPrev,
  onNext,
}: {
  index: number;
  images: GalleryImage[];
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  const img = images[index];

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") onPrev();
      if (e.key === "ArrowRight") onNext();
    }
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose, onPrev, onNext]);

  return (
    <div
      className="fixed inset-0 z-[70] bg-black/92 backdrop-blur-sm flex items-center justify-center p-4 sm:p-8"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        aria-label="Close gallery"
        className="absolute top-4 right-4 sm:top-6 sm:right-6 w-10 h-10 rounded-full border border-[var(--ink)]/40 flex items-center justify-center text-[var(--ink)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M5 5l14 14M19 5 5 19" />
        </svg>
      </button>

      <button
        onClick={(e) => {
          e.stopPropagation();
          onPrev();
        }}
        aria-label="Previous image"
        className="absolute left-2 sm:left-6 w-11 h-11 sm:w-12 sm:h-12 rounded-full border border-[var(--ink)]/40 flex items-center justify-center text-[var(--ink)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors bg-black/30"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M15.5 4.5 8 12l7.5 7.5 1.4-1.4L10.8 12l6.1-6.1z" />
        </svg>
      </button>

      <button
        onClick={(e) => {
          e.stopPropagation();
          onNext();
        }}
        aria-label="Next image"
        className="absolute right-2 sm:right-6 w-11 h-11 sm:w-12 sm:h-12 rounded-full border border-[var(--ink)]/40 flex items-center justify-center text-[var(--ink)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors bg-black/30"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M8.5 4.5 16 12l-7.5 7.5-1.4-1.4L13.2 12 7.1 5.9z" />
        </svg>
      </button>

      <div className="max-w-[92vw] max-h-[85vh]" onClick={(e) => e.stopPropagation()}>
        <img
          src={img.src}
          alt={img.alt}
          className="max-w-[92vw] max-h-[85vh] w-auto h-auto object-contain border border-[var(--line-strong)]"
        />
        <p className="mt-3 text-center font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--ink-dim)]">
          {img.alt} — {index + 1} / {images.length}
        </p>
      </div>
    </div>
  );
}

export default function GallerySection({ initialImages }: { initialImages?: GalleryImage[] }) {
  const images = initialImages && initialImages.length > 0 ? initialImages : fallbackGalleryImages;
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const openById = useCallback((id: string) => {
    const idx = images.findIndex((g) => g.id === id);
    if (idx >= 0) setLightboxIndex(idx);
  }, [images]);

  const prev = useCallback(() => {
    setLightboxIndex((i) => (i === null ? null : (i - 1 + images.length) % images.length));
  }, [images]);

  const next = useCallback(() => {
    setLightboxIndex((i) => (i === null ? null : (i + 1) % images.length));
  }, [images]);

  return (
    <section id="gallery" className="relative bg-[var(--bg)] px-5 sm:px-8 py-20 sm:py-28 overflow-hidden">
      <Reveal>
        <div className="max-w-[1600px] mx-auto">
          <div className="flex justify-end px-0 sm:px-2 mb-5 sm:mb-7">
            <button
              onClick={() => setLightboxIndex(0)}
              className="font-mono text-[11px] sm:text-xs uppercase tracking-[0.14em] border border-[var(--line-strong)] px-4 py-2.5 hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors"
            >
              View full gallery
            </button>
          </div>

          <div className="flex flex-col gap-5 sm:gap-7">
            <Strip images={images} direction="left" tilt={-1.2} onSelect={openById} />
            <Strip images={[...images].reverse()} direction="right" tilt={1.2} onSelect={openById} />
          </div>
        </div>
      </Reveal>

      {lightboxIndex !== null && (
        <Lightbox
          index={lightboxIndex}
          images={images}
          onClose={() => setLightboxIndex(null)}
          onPrev={prev}
          onNext={next}
        />
      )}
    </section>
  );
}
