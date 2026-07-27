"use client";

import { useEffect, useRef, useState } from "react";
import { useScrollY } from "@/hooks/useScrollY";
import GoogleReviewBadge from "@/components/GoogleReviewBadge";

/**
 * ShoreGlow — a generative canvas backdrop used only if the real
 * venue footage fails to load. Sweeping light beams + soft color
 * blobs + an animated wave horizon, tuned to the same palette as
 * the video so the fallback doesn't feel like a downgrade.
 */
function ShoreGlow() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    let raf = 0;
    let w = 0;
    let h = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const blobs = [
      { x: 0.22, y: 0.28, r: 0.5, hue: "#ff8a1e", sx: 0.00009, sy: 0.00012, phase: 0 },
      { x: 0.78, y: 0.22, r: 0.46, hue: "#12494b", sx: 0.00008, sy: 0.0001, phase: 2.1 },
      { x: 0.5, y: 0.68, r: 0.55, hue: "#7a1f2b", sx: 0.00011, sy: 0.00009, phase: 4.2 },
      { x: 0.85, y: 0.75, r: 0.38, hue: "#2c7a7d", sx: 0.00009, sy: 0.00011, phase: 1.3 },
    ];

    const beams = [
      { x: 0.15, tilt: -0.55, width: 0.09, speed: 0.00006, phase: 0, hue: "#ff8a1eaa" },
      { x: 0.55, tilt: -0.4, width: 0.06, speed: 0.00005, phase: 2.4, hue: "#ece7dd66" },
      { x: 0.85, tilt: -0.6, width: 0.07, speed: 0.00007, phase: 4.1, hue: "#2c7a7d99" },
    ];

    const draw = (t: number) => {
      ctx.fillStyle = "#07090a";
      ctx.fillRect(0, 0, w, h);

      // color blobs
      ctx.globalCompositeOperation = "lighter";
      for (const b of blobs) {
        const bx = (b.x + Math.sin(t * b.sx + b.phase) * 0.1) * w;
        const by = (b.y + Math.cos(t * b.sy + b.phase) * 0.1) * h;
        const r = b.r * Math.max(w, h) * 0.5;
        const grad = ctx.createRadialGradient(bx, by, 0, bx, by, r);
        grad.addColorStop(0, b.hue + "cc");
        grad.addColorStop(1, b.hue + "00");
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(bx, by, r, 0, Math.PI * 2);
        ctx.fill();
      }

      // sweeping light beams, like a low sodium dock light rig
      for (const beam of beams) {
        const sway = Math.sin(t * beam.speed + beam.phase) * 0.12;
        const bx = (beam.x + sway) * w;
        ctx.save();
        ctx.translate(bx, 0);
        ctx.transform(1, 0, beam.tilt, 1, 0, 0);
        const grad = ctx.createLinearGradient(0, 0, 0, h);
        grad.addColorStop(0, beam.hue);
        grad.addColorStop(1, "#07090a00");
        ctx.fillStyle = grad;
        ctx.fillRect(-beam.width * w * 0.5, -h * 0.2, beam.width * w, h * 1.4);
        ctx.restore();
      }
      ctx.globalCompositeOperation = "source-over";

      // rippling shoreline horizon
      const horizonY = h * 0.64;
      ctx.beginPath();
      ctx.moveTo(0, h);
      ctx.lineTo(0, horizonY);
      const step = w / 24;
      for (let i = 0; i <= 24; i++) {
        const x = i * step;
        const y = horizonY + Math.sin(i * 0.6 + t * 0.0009) * 6;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(w, h);
      ctx.closePath();
      const shoreGrad = ctx.createLinearGradient(0, horizonY - 20, 0, h);
      shoreGrad.addColorStop(0, "#07090a");
      shoreGrad.addColorStop(1, "#07090af2");
      ctx.fillStyle = shoreGrad;
      ctx.fill();

      if (!prefersReduced) {
        raf = requestAnimationFrame(draw);
      }
    };

    raf = requestAnimationFrame(draw);
    if (prefersReduced) draw(0);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />;
}

/**
 * VenueReel — the real Krantas footage, looping muted in the
 * background. Respects prefers-reduced-motion by staying paused on
 * the poster frame instead of autoplaying, and falls back to
 * ShoreGlow if the file can't be loaded at all.
 */
function VenueReel() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [failed, setFailed] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    // Explicitly (re)load so the browser freshly evaluates the <source>
    // children rather than relying on whatever it picked on first paint —
    // matters most with Fast Refresh / cached 304 responses in dev.
    video.load();

    if (prefersReduced) {
      video.pause();
    } else {
      video.play().catch(() => {
        /* autoplay can be blocked before user interaction — poster still shows */
      });
    }

    // Reveal on whichever "it can actually show something" signal fires
    // first — different browsers are inconsistent about which of these
    // fires promptly, so don't bet the whole UI on just one of them.
    const reveal = () => setReady(true);
    video.addEventListener("loadeddata", reveal);
    video.addEventListener("canplay", reveal);
    video.addEventListener("playing", reveal);

    // Hard safety net: never let the video stay invisible forever because
    // one browser-specific event quirk didn't fire. Worst case, the poster
    // just gets replaced a bit early with whatever frame is buffered.
    const timeout = window.setTimeout(reveal, 2500);

    return () => {
      video.removeEventListener("loadeddata", reveal);
      video.removeEventListener("canplay", reveal);
      video.removeEventListener("playing", reveal);
      window.clearTimeout(timeout);
    };
  }, []);

  if (failed) {
    return <ShoreGlow />;
  }

  return (
    <div className="absolute inset-0">
      {/* Poster stays visible as its own layer so the video fades in on
          top of it, instead of the video's opacity hiding the poster
          (which is baked into the same element) and flashing to black. */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url(/hero-poster.jpg)" }}
      />
      <video
        ref={videoRef}
        className={`absolute inset-0 w-full h-full object-cover saturate-[1.08] hero-drift transition-opacity duration-700 ease-out ${
          ready ? "opacity-100" : "opacity-0"
        }`}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        onError={() => setFailed(true)}
      >
        <source src="/hero.webm" type="video/webm" />
        <source src="/hero.mp4" type="video/mp4" />
      </video>
    </div>
  );

}

export default function Hero() {
  const scrollY = useScrollY();
  const bgOffset = scrollY * 0.25;
  const textOffset = scrollY * 0.5;
  const opacity = Math.max(0, 1 - scrollY / 500);

  return (
    <section
      id="top"
      className="relative h-[100svh] min-h-[560px] w-full overflow-hidden bg-[#07090a]"
    >
      <div
        className="absolute inset-0"
        style={{ transform: `translateY(${bgOffset}px)` }}
      >
        <VenueReel />
        {/* Soft amber bloom over the light source, screened on top of the
            footage so the neon reads as a warm glow rather than a flat
            bright strip. */}
        <div
          className="absolute inset-0 mix-blend-screen opacity-60"
          style={{
            background:
              "radial-gradient(60% 40% at 55% 28%, rgba(255,138,30,0.35), transparent 70%)",
          }}
        />
        <div className="absolute inset-0 grain" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#07090a] via-transparent to-[#07090a]/30" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#07090a]/70 via-transparent to-[#07090a]/70" />
        {/* Deepened vignette so the smoothed shadow areas read as
            intentional mood lighting rather than a soft/blurry video. */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(120% 90% at 50% 50%, transparent 45%, rgba(6,7,7,0.55) 100%)",
          }}
        />
      </div>

      <div className="relative z-10 h-full flex flex-col justify-between px-5 sm:px-8 pt-24 sm:pt-28 pb-10">
        <div
          className="flex flex-col items-start gap-2 font-mono text-[11px] sm:text-xs tracking-[0.28em] uppercase text-[var(--ink)]/70"
          style={{ transform: `translateY(${textOffset * 0.4}px)`, opacity }}
        >
          <span className="max-w-xs">Klaipėda, Lithuania · Underground since the tide turned</span>
          <GoogleReviewBadge className="shrink-0 normal-case tracking-normal" />
        </div>

        <div
          style={{
            transform: `translateY(${textOffset}px)`,
            opacity,
          }}
        >
          <h1 className="font-display leading-[0.82] text-[19vw] sm:text-[13vw] lg:text-[10rem] xl:text-[11.5rem] text-[var(--ink)]">
            KRANTAS
          </h1>
          <div className="flex flex-wrap items-end justify-between gap-4 mt-4 sm:mt-6 border-t border-[var(--line-strong)] pt-4 sm:pt-6">
            <p className="max-w-md text-sm sm:text-base text-[var(--ink)]/80">
              A shoreline club for techno, breaks and bass. Sound system
              on the water, doors open past midnight.
            </p>
            <a
              href="/events"
              className="shrink-0 font-mono text-xs tracking-[0.2em] uppercase border border-[var(--accent)] text-[var(--accent)] px-5 py-3 hover:bg-[var(--accent)] hover:text-[#12100c] transition-colors"
            >
              Next night out →
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
