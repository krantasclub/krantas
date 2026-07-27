"use client";

import { useEffect, useRef, useState } from "react";

export type VisualMode = "tunnel" | "plasma" | "radial" | "aura";

export const VISUAL_MODES: { id: VisualMode; label: string }[] = [
  { id: "tunnel", label: "Tunnel" },
  { id: "plasma", label: "Plasma" },
  { id: "radial", label: "Radial" },
  { id: "aura", label: "Aura" },
];

const STORAGE_KEY = "krantas:radio-visual";
const DEFAULT_MODE: VisualMode = "tunnel";

export function getStoredVisualMode(): VisualMode {
  if (typeof window === "undefined") return DEFAULT_MODE;
  const v = window.localStorage.getItem(STORAGE_KEY);
  return (VISUAL_MODES.some((m) => m.id === v) ? v : DEFAULT_MODE) as VisualMode;
}

export function storeVisualMode(mode: VisualMode) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, mode);
}

// One shared analyser rig per <audio> element. createMediaElementSource can
// only ever be called once on a given element (a second call throws), so we
// cache the rig on the element itself — this lets the visualizer survive
// remounts (e.g. Reveal / conditional rendering) without blowing up.
type Rig = { ctx: AudioContext; analyser: AnalyserNode };
const rigs = new WeakMap<HTMLMediaElement, Rig>();

function getRig(el: HTMLMediaElement): Rig | null {
  const cached = rigs.get(el);
  if (cached) return cached;
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    const source = ctx.createMediaElementSource(el);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.82;
    source.connect(analyser);
    analyser.connect(ctx.destination);
    const rig = { ctx, analyser };
    rigs.set(el, rig);
    return rig;
  } catch {
    // Most likely a CORS-tainted source (cross-origin stream without the
    // right Access-Control-Allow-Origin header). Audio still plays fine
    // natively — we just can't draw it, so the gradient stays as-is.
    return null;
  }
}

// HSL → RGB, 0-1 ranges in, 0-255 ints out. Used everywhere below instead of
// canvas's `hsl(...)` fillStyle strings — string-parsing a color on every
// pixel/shape adds up fast once plasma is doing it per-cell, 60 times a second.
function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  h = ((h % 360) + 360) % 360;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0, g = 0, b = 0;
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255)];
}

function bandAverage(freqData: Uint8Array, from: number, to: number): number {
  let sum = 0;
  const start = Math.floor(freqData.length * from);
  const end = Math.max(start + 1, Math.floor(freqData.length * to));
  for (let i = start; i < end; i++) sum += freqData[i];
  return sum / (end - start) / 255;
}

export default function AudioVisualizer({
  audioEl,
  playing,
  mode,
  className = "",
}: {
  audioEl: HTMLAudioElement | null;
  playing: boolean;
  mode: VisualMode;
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const plasmaCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const blobsRef = useRef<
    { cx: number; cy: number; baseR: number; phase: number[]; speed: number; hue: number; vx: number; vy: number; pupil: boolean }[]
    | null
  >(null);
  const smoothRef = useRef({ bass: 0, mid: 0, treble: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !audioEl) return;

    const rig = getRig(audioEl);
    if (!rig) return;

    if (playing && rig.ctx.state === "suspended") {
      rig.ctx.resume().catch(() => {});
    }

    const ctx2d = canvas.getContext("2d");
    if (!ctx2d) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const resize = () => {
      const { width, height } = canvas.getBoundingClientRect();
      canvas.width = Math.max(1, Math.floor(width * dpr));
      canvas.height = Math.max(1, Math.floor(height * dpr));
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const bufferLength = rig.analyser.frequencyBinCount;
    const freqData = new Uint8Array(bufferLength);
    const timeData = new Uint8Array(bufferLength);

    if (!blobsRef.current) {
      // A handful of hand-drawn-looking amoeba outlines drifting around a
      // central sweeping ring — echoes the VJ-loop reference (a big neon
      // ellipse with smaller organic blob outlines floating past it).
      blobsRef.current = Array.from({ length: 7 }, (_, i) => ({
        cx: 0.15 + Math.random() * 0.7,
        cy: 0.15 + Math.random() * 0.7,
        baseR: 0.08 + Math.random() * 0.09,
        phase: [Math.random() * Math.PI * 2, Math.random() * Math.PI * 2, Math.random() * Math.PI * 2],
        speed: 0.3 + Math.random() * 0.4,
        hue: (i / 7) * 360,
        vx: (Math.random() - 0.5) * 0.00035,
        vy: (Math.random() - 0.5) * 0.00035,
        pupil: Math.random() > 0.5,
      }));
    }

    // Low-res buffer the plasma is computed onto, then scaled up — computing
    // full-resolution per-pixel sine math every frame would choke the main
    // thread, but a small grid stretched with image smoothing gives the same
    // soft, blobby look real plasma effects have.
    if (!plasmaCanvasRef.current) {
      plasmaCanvasRef.current = document.createElement("canvas");
      plasmaCanvasRef.current.width = 72;
      plasmaCanvasRef.current.height = 40;
    }
    const plasmaCanvas = plasmaCanvasRef.current;
    const plasmaCtx = plasmaCanvas.getContext("2d");
    const plasmaImage = plasmaCtx?.createImageData(plasmaCanvas.width, plasmaCanvas.height);

    const start = performance.now();

    function draw() {
      const w = canvas!.width;
      const h = canvas!.height;
      const t = (performance.now() - start) / 1000;

      if (!playing) {
        ctx2d!.clearRect(0, 0, w, h);
        rafRef.current = requestAnimationFrame(draw);
        return;
      }

      rig!.analyser.getByteFrequencyData(freqData);
      rig!.analyser.getByteTimeDomainData(timeData);

      const bass = bandAverage(freqData, 0, 0.12);
      const mid = bandAverage(freqData, 0.12, 0.5);
      const treble = bandAverage(freqData, 0.5, 1);
      // Smoothed versions damp frame-to-frame jitter for anything driving
      // rotation speed or hue drift, so the motion reads as flowing rather
      // than twitchy — the raw bands still get used directly for size/pulse.
      const sm = smoothRef.current;
      sm.bass += (bass - sm.bass) * 0.15;
      sm.mid += (mid - sm.mid) * 0.15;
      sm.treble += (treble - sm.treble) * 0.15;

      const hueTime = (t * 24) % 360;

      if (mode === "tunnel") {
        ctx2d!.clearRect(0, 0, w, h);
        const cx = w / 2;
        const cy = h / 2;
        const maxR = Math.hypot(w, h) * 0.58;
        const rings = 16;
        const sides = 6;
        const rot = t * (0.25 + sm.treble * 0.9);
        ctx2d!.lineJoin = "round";
        for (let i = rings; i >= 0; i--) {
          const depth = i / rings;
          // Cubic easing pulls rings toward the center for a perspective feel.
          const eased = depth * depth * depth;
          const pulse = 1 + sm.bass * 0.5 * (1 - depth);
          const size = maxR * (0.05 + eased * 0.95) * pulse;
          const hue = (hueTime + i * 26 + t * 10) % 360;
          const angle = rot * (1 - depth * 0.4) + depth * 2.2;
          const [r, g, b] = hslToRgb(hue, 0.85, 0.58);
          ctx2d!.beginPath();
          for (let s = 0; s <= sides; s++) {
            const a = angle + (s / sides) * Math.PI * 2;
            const px = cx + Math.cos(a) * size;
            const py = cy + Math.sin(a) * size * (h / w > 1 ? 1 : 1);
            if (s === 0) ctx2d!.moveTo(px, py);
            else ctx2d!.lineTo(px, py);
          }
          ctx2d!.closePath();
          ctx2d!.strokeStyle = `rgba(${r},${g},${b},${0.85 - depth * 0.55})`;
          ctx2d!.lineWidth = Math.max(1, h * 0.006 * (1 - depth * 0.6));
          ctx2d!.shadowColor = `rgba(${r},${g},${b},0.9)`;
          ctx2d!.shadowBlur = h * 0.02 * (1 - depth * 0.5);
          ctx2d!.stroke();
        }
        ctx2d!.shadowBlur = 0;
      } else if (mode === "plasma" && plasmaCtx && plasmaImage) {
        const pw = plasmaCanvas.width;
        const ph = plasmaCanvas.height;
        const data = plasmaImage.data;
        const speed = 0.6 + sm.mid * 1.4;
        for (let y = 0; y < ph; y++) {
          for (let x = 0; x < pw; x++) {
            const nx = x / pw;
            const ny = y / ph;
            const v =
              Math.sin(nx * 8 + t * speed) +
              Math.sin(ny * 8 - t * speed * 1.3) +
              Math.sin((nx + ny) * 8 + t * speed * 0.7 + sm.bass * 5) +
              Math.sin(Math.hypot(nx - 0.5, ny - 0.5) * 14 - t * speed * 1.6);
            const hue = ((v + 4) / 8) * 260 + hueTime + sm.treble * 60;
            const [r, g, b] = hslToRgb(hue, 0.9, 0.5 + sm.bass * 0.1);
            const idx = (y * pw + x) * 4;
            data[idx] = r;
            data[idx + 1] = g;
            data[idx + 2] = b;
            data[idx + 3] = 255;
          }
        }
        plasmaCtx.putImageData(plasmaImage, 0, 0);
        ctx2d!.imageSmoothingEnabled = true;
        ctx2d!.clearRect(0, 0, w, h);
        ctx2d!.globalAlpha = 0.95;
        ctx2d!.drawImage(plasmaCanvas, 0, 0, pw, ph, 0, 0, w, h);
        ctx2d!.globalAlpha = 1;
      } else if (mode === "radial") {
        ctx2d!.clearRect(0, 0, w, h);
        const cx = w / 2;
        const cy = h / 2;
        const maxR = Math.min(w, h) * 0.46;
        const rings = 5;
        for (let r = 0; r < rings; r++) {
          const idx = Math.floor((r / rings) * bufferLength * 0.7);
          const v = freqData[idx] / 255;
          const radius = maxR * (0.2 + r * 0.17) + v * maxR * 0.25;
          const hue = (hueTime + r * 46) % 360;
          const [cr, cg, cb] = hslToRgb(hue, 0.85, 0.6);
          ctx2d!.beginPath();
          ctx2d!.arc(cx, cy, Math.max(1, radius), 0, Math.PI * 2);
          ctx2d!.lineWidth = Math.max(1, h * 0.005) * (1 + sm.bass);
          ctx2d!.strokeStyle = `rgba(${cr},${cg},${cb},${0.4 + v * 0.5})`;
          ctx2d!.shadowColor = `rgba(${cr},${cg},${cb},0.8)`;
          ctx2d!.shadowBlur = h * 0.015;
          ctx2d!.stroke();
        }
        ctx2d!.shadowBlur = 0;
        const [pr, pg, pb] = hslToRgb(hueTime + 180, 0.9, 0.65);
        ctx2d!.beginPath();
        ctx2d!.arc(cx, cy, maxR * 0.16 * (1 + sm.bass * 0.9), 0, Math.PI * 2);
        ctx2d!.fillStyle = `rgb(${pr},${pg},${pb})`;
        ctx2d!.globalAlpha = 0.85;
        ctx2d!.fill();
        ctx2d!.globalAlpha = 1;
      } else if (mode === "aura") {
        ctx2d!.clearRect(0, 0, w, h);
        const cx = w / 2;
        const cy = h / 2;
        const minDim = Math.min(w, h);

        // The big sweeping ring, drawn as several overlapping strokes of
        // decreasing width/increasing alpha toward the center of the band
        // so it reads as a soft glowing ribbon rather than a hard line.
        const ringRot = t * (0.18 + sm.treble * 0.5);
        const rx = w * (0.42 + sm.bass * 0.06);
        const ry = minDim * (0.16 + sm.bass * 0.05);
        const ringHue = (hueTime + 300) % 360;
        for (let layer = 0; layer < 5; layer++) {
          const spread = layer / 4;
          const [r, g, b] = hslToRgb(ringHue + spread * 20, 0.85, 0.62 + spread * 0.15);
          ctx2d!.beginPath();
          ctx2d!.ellipse(cx, cy, rx, ry, ringRot, 0, Math.PI * 2);
          ctx2d!.strokeStyle = `rgba(${r},${g},${b},${0.5 - spread * 0.35})`;
          ctx2d!.lineWidth = minDim * 0.05 * (1 - spread * 0.7);
          ctx2d!.stroke();
        }
        ctx2d!.shadowBlur = 0;

        // Small organic blob outlines drifting past the ring — radius wobbles
        // per-angle from a few summed sine waves so each one reads as a hand
        // drawn amoeba rather than a perfect circle.
        for (const blob of blobsRef.current!) {
          blob.cx += blob.vx * (1 + sm.mid * 4);
          blob.cy += blob.vy * (1 + sm.mid * 4);
          if (blob.cx < 0.05 || blob.cx > 0.95) blob.vx *= -1;
          if (blob.cy < 0.05 || blob.cy > 0.95) blob.vy *= -1;
          blob.hue += 0.15 + sm.treble * 0.6;

          const bx = blob.cx * w;
          const by = blob.cy * h;
          const wobble = 0.12 + sm.mid * 0.22;
          const baseRadius = (blob.baseR + sm.bass * 0.05) * minDim;
          const segments = 28;
          const [r, g, b] = hslToRgb(blob.hue, 0.85, 0.62);

          ctx2d!.beginPath();
          for (let s = 0; s <= segments; s++) {
            const a = (s / segments) * Math.PI * 2;
            const wob =
              1 +
              wobble * Math.sin(a * 2 + blob.phase[0] + t * blob.speed) +
              wobble * 0.6 * Math.sin(a * 3 - blob.phase[1] + t * blob.speed * 1.4) +
              wobble * 0.4 * Math.sin(a * 5 + blob.phase[2] + t * blob.speed * 0.7);
            const px = bx + Math.cos(a) * baseRadius * wob;
            const py = by + Math.sin(a) * baseRadius * wob;
            if (s === 0) ctx2d!.moveTo(px, py);
            else ctx2d!.lineTo(px, py);
          }
          ctx2d!.closePath();
          ctx2d!.strokeStyle = `rgba(${r},${g},${b},0.75)`;
          ctx2d!.lineWidth = Math.max(1, minDim * 0.006);
          ctx2d!.shadowColor = `rgba(${r},${g},${b},0.9)`;
          ctx2d!.shadowBlur = minDim * 0.02;
          ctx2d!.stroke();

          if (blob.pupil) {
            ctx2d!.beginPath();
            ctx2d!.arc(bx, by, baseRadius * 0.22, 0, Math.PI * 2);
            ctx2d!.fillStyle = `rgba(${r},${g},${b},0.6)`;
            ctx2d!.fill();
          }
        }
        ctx2d!.shadowBlur = 0;
      }

      rafRef.current = requestAnimationFrame(draw);
    }

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      ro.disconnect();
    };
  }, [audioEl, playing, mode]);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 w-full h-full pointer-events-none ${className}`}
      aria-hidden="true"
    />
  );
}

export function VisualModePicker({
  value,
  onChange,
  className = "",
}: {
  value: VisualMode;
  onChange: (m: VisualMode) => void;
  className?: string;
}) {
  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {VISUAL_MODES.map((m) => (
        <button
          key={m.id}
          type="button"
          aria-label={`Visual: ${m.label}`}
          aria-pressed={value === m.id}
          onClick={() => {
            onChange(m.id);
            storeVisualMode(m.id);
          }}
          className={`font-mono text-[9px] uppercase tracking-[0.12em] px-2 py-1 border transition-colors ${
            value === m.id
              ? "border-[var(--accent)] text-[var(--accent)] bg-black/30"
              : "border-[var(--ink)]/25 text-[var(--ink)]/55 hover:text-[var(--ink)] hover:border-[var(--ink)]/50 bg-black/20"
          }`}
        >
          {m.label}
        </button>
      ))}
    </div>
  );
}

// Tracks whether `targetRef`'s element is the current fullscreen element.
// Fullscreen state lives on `document`, not on the element, so this has to
// be driven by the fullscreenchange event rather than local component state.
export function useIsFullscreen(targetRef: React.RefObject<HTMLElement | null>) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  useEffect(() => {
    const onChange = () => {
      setIsFullscreen(!!document.fullscreenElement && document.fullscreenElement === targetRef.current);
    };
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, [targetRef]);
  return isFullscreen;
}

export function FullscreenButton({
  targetRef,
  isFullscreen,
  className = "",
}: {
  targetRef: React.RefObject<HTMLElement | null>;
  isFullscreen: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      aria-label={isFullscreen ? "Exit fullscreen" : "View fullscreen"}
      onClick={() => {
        if (isFullscreen) {
          document.exitFullscreen?.().catch(() => {});
        } else {
          targetRef.current?.requestFullscreen?.().catch(() => {});
        }
      }}
      className={`w-8 h-8 flex items-center justify-center border border-[var(--ink)]/25 text-[var(--ink)]/70 hover:text-[var(--ink)] hover:border-[var(--ink)]/50 bg-black/20 transition-colors ${className}`}
    >
      {isFullscreen ? (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 4v3a2 2 0 0 1-2 2H4M15 4v3a2 2 0 0 0 2 2h3M4 15h3a2 2 0 0 1 2 2v3M15 20v-3a2 2 0 0 1 2-2h3" />
        </svg>
      ) : (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 9V6a2 2 0 0 1 2-2h3M15 4h3a2 2 0 0 1 2 2v3M20 15v3a2 2 0 0 1-2 2h-3M9 20H6a2 2 0 0 1-2-2v-3" />
        </svg>
      )}
    </button>
  );
}
