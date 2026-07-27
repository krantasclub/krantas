// lib/upload-limits.ts
// ─── Shared upload guards ─────────────────────────────────────────────────────
// Used by BOTH the client (instant feedback) and /api/upload (authoritative).
// Keep this in sync with your Supabase Storage bucket file-size limit
// (Supabase dashboard → Storage → "events" bucket → settings).

// Images are auto-converted to WebP on the server, so this is the pre-conversion
// cap on the original file the user picks.
export const MAX_IMAGE_BYTES = 15 * 1024 * 1024; // 15 MB
export const MAX_IMAGE_MB = Math.round(MAX_IMAGE_BYTES / (1024 * 1024));

// Output format every uploaded photo is converted to.
export const IMAGE_OUTPUT_EXT = "webp";
export const IMAGE_OUTPUT_TYPE = "image/webp";

// Event poster quality — cards render at aspect-[3/4], so this doesn't need
// to be full-viewport sharp, just crisp on a phone screen.
export const WEBP_QUALITY = 85;

// Posters are cropped to a 3:4 card, never shown at full source width —
// cap it so a big phone photo doesn't bloat storage for no visual gain.
export const POSTER_MAX_WIDTH = 1600; // px

// ─── Track / radio-episode audio uploads ───────────────────────────────────
// Unlike poster art, audio isn't converted server-side — it's uploaded
// straight from the browser to the "audio" Supabase Storage bucket (see
// app/admin/radio/page.tsx), so there's no Next.js function body-size limit
// to worry about. Keep this in sync with the "audio" bucket's file-size
// limit in the Supabase dashboard (Storage → audio → settings).
export const MAX_AUDIO_BYTES = 150 * 1024 * 1024; // 150 MB — enough for a long DJ set at a decent bitrate
export const MAX_AUDIO_MB = Math.round(MAX_AUDIO_BYTES / (1024 * 1024));

export const ALLOWED_AUDIO_TYPES = [
  "audio/mpeg",
  "audio/mp4",
  "audio/aac",
  "audio/wav",
  "audio/x-wav",
  "audio/ogg",
  "audio/flac",
  "audio/x-flac",
];
export const ALLOWED_AUDIO_EXT = ["mp3", "m4a", "aac", "wav", "ogg", "flac"];

// ─── Video uploads (filmed sets / clips shown on the homepage) ─────────────
// Uploaded straight from the browser to the "videos" Supabase Storage
// bucket (see app/admin/videos/page.tsx) — same reasoning as audio: keeps
// large files out of the Next.js function body-size limit.
export const MAX_VIDEO_BYTES = 500 * 1024 * 1024; // 500 MB
export const MAX_VIDEO_MB = Math.round(MAX_VIDEO_BYTES / (1024 * 1024));

export const ALLOWED_VIDEO_TYPES = [
  "video/mp4",
  "video/webm",
  "video/ogg",
  "video/quicktime",
];
export const ALLOWED_VIDEO_EXT = ["mp4", "webm", "ogg", "mov", "m4v"];

// Reel uploads (see app/admin/reels/page.tsx) go to their own "reels"
// Storage bucket, but share the same size/type limits as videos above —
// no separate constants needed.

