export type Poster = {
  id: string;
  headline: string;
  sub?: string;
  date: string;
  day: string;
  month: string;
  venueLine: string;
  tags: string[];
  from: string;
  to: string;
  // Real calendar date (YYYY-MM-DD) — drives the past/upcoming split
  // and the "Featured" pick when there's no Supabase data yet.
  eventDate: string;
  featured?: boolean;
  ticketUrl?: string;
  imageUrl?: string;
  // e.g. "23:55" — shown alongside the date in the detail popup.
  startTime?: string;
  endTime?: string;
  // Full write-up shown in the detail popup when a poster is clicked.
  description?: string;
};

// Placeholder line-up — shown only as a fallback until real events
// are added in /admin/events (backed by Supabase).
export const events: Poster[] = [
  {
    id: "riptide",
    headline: "Riptide",
    sub: "Waeys · Rueben · Lgnius",
    date: "SAT 09 AUG",
    day: "09",
    month: "AUG",
    venueLine: "Krantas \\\\ Main Floor",
    tags: ["techno", "live"],
    from: "#12494b",
    to: "#0a0c0d",
    eventDate: "2026-08-09",
    featured: true,
  },
  {
    id: "low-tide",
    headline: "Low Tide",
    sub: "Sorza b2b Thys",
    date: "FRI 22 AUG",
    day: "22",
    month: "AUG",
    venueLine: "Krantas \\\\ Warehouse",
    tags: ["breaks", "b2b"],
    from: "#ff8a1e",
    to: "#241407",
    eventDate: "2026-08-22",
  },
  {
    id: "undertow",
    headline: "Undertow",
    sub: "Ternion Sound · Visla",
    date: "SAT 06 SEP",
    day: "06",
    month: "SEP",
    venueLine: "Krantas \\\\ Main Floor",
    tags: ["dnb", "system"],
    from: "#7a1f2b",
    to: "#0a0c0d",
    eventDate: "2026-09-06",
  },
  {
    id: "salt-run",
    headline: "Salt Run",
    sub: "gyrofield · IMANU",
    date: "SAT 20 SEP",
    day: "20",
    month: "SEP",
    venueLine: "Krantas \\\\ Main Floor",
    tags: ["bass", "special guest"],
    from: "#2c7a7d",
    to: "#081312",
    eventDate: "2026-09-20",
  },
  {
    id: "hull",
    headline: "Hull",
    sub: "Resident Night — VIER",
    date: "FRI 03 OCT",
    day: "03",
    month: "OCT",
    venueLine: "Krantas \\\\ Warehouse",
    tags: ["residents", "free entry"],
    from: "#5a5145",
    to: "#0a0c0d",
    eventDate: "2026-10-03",
  },
  {
    id: "flare",
    headline: "Flare",
    sub: "Halogenix · Node",
    date: "SAT 18 OCT",
    day: "18",
    month: "OCT",
    venueLine: "Krantas \\\\ Main Floor",
    tags: ["dnb", "closing"],
    from: "#a85a17",
    to: "#1a0e04",
    eventDate: "2026-10-18",
  },
];

export type Artist = {
  id: string;
  name: string;
  // Short tag shown next to the name on the roster — doubles as a
  // genre/role label since we don't track nationality.
  role: string;
  from: string;
  to: string;
  // Optional portrait — falls back to the gradient card when unset.
  imageUrl?: string;
  // Short bio shown on the artist card, 1-3 sentences.
  bio?: string;
  // Longer bio shown in the artist popup when a card is clicked.
  // Falls back to `bio` when unset.
  bioLong?: string;
  instagram?: string;
  soundcloud?: string;
  facebook?: string;
  website?: string;
  contactEmail?: string;
};

// Placeholder roster — shown only as a fallback until the real
// line-up is added in /admin/artists (backed by Supabase).
export const artists: Artist[] = [
  { id: "kasekas", name: "Kasekas", role: "Techno", from: "#12494b", to: "#0a0c0d", bio: "Klaipėda-rooted selector running hypnotic, low-slung techno sets built for a long night on the main floor." },
  { id: "yara", name: "Yara", role: "House", from: "#ff8a1e", to: "#241407", bio: "Warm, groove-first house DJ known for sunrise sets and crate-dug disco edits." },
  { id: "neko", name: "Neko", role: "Breaks", from: "#7a1f2b", to: "#0a0c0d", bio: "Breakbeat and UK garage crossover — swung rhythms with a rave-era energy." },
  { id: "vilka-mini", name: "Vilka Mini", role: "Dub Techno", from: "#2c7a7d", to: "#081312", bio: "Deep, dubbed-out techno drawing on the Basic Channel lineage — built for the small hours." },
  { id: "skitchy", name: "SKITCHY", role: "Bass", from: "#5a5145", to: "#0a0c0d", bio: "Heavy sub-driven bass sets spanning dubstep, UK bass and halftime." },
  { id: "gazpacho", name: "Gazpacho", role: "Live PA", from: "#a85a17", to: "#1a0e04", bio: "Modular live PA act blending analog synthesis with driving four-to-the-floor rhythms." },
  { id: "gabraiser", name: "gabraiser", role: "Hard Groove", from: "#12494b", to: "#081312", bio: "Relentless hard groove and gabber-adjacent techno for the peak-time crowd." },
  { id: "hi-tech", name: "Hi-Tech", role: "Techno", from: "#7a1f2b", to: "#1a0e04", bio: "Precision-tooled, industrial-leaning techno with a hardware-first approach." },
  { id: "ekkolection", name: "Ekkolection", role: "B2B Collective", from: "#2c7a7d", to: "#0a0c0d", bio: "Rotating back-to-back collective of Baltic selectors trading tracks across genres." },
  { id: "alyga-soft", name: "Alyga SOFT", role: "Selector / Radio", from: "#ff8a1e", to: "#0a0c0d", bio: "Krantas Radio resident with an ear for ambient, downtempo and left-field electronica." },
];

// A single track in a release's tracklist. "upload" tracks point at a file
// in the "audio" Supabase Storage bucket (same bucket radio_episodes uses);
// "youtube" / "url" tracks just store whatever link was pasted in — no file
// on our own storage at all.
export type ReleaseTrack = {
  id: string;
  name: string;
  source: "upload" | "youtube" | "url";
  url: string;
};

export type Release = {
  id: string;
  title: string;
  artist: string;
  date: string;
  type: string;
  from: string;
  to: string;
  description?: string;
  logoUrl?: string;
  externalUrl?: string;
  tracks?: ReleaseTrack[];
};

export const releases: Release[] = [
  { id: "flare-ep", title: "Flare EP", artist: "Halogenix", date: "18 OCT 26", type: "EP", from: "#a85a17", to: "#1a0e04" },
  { id: "undertow-single", title: "Undertow", artist: "Ternion Sound", date: "02 OCT 26", type: "Single", from: "#7a1f2b", to: "#0a0c0d" },
  { id: "low-water", title: "Low Water", artist: "Sorza", date: "19 SEP 26", type: "Single", from: "#2c7a7d", to: "#081312" },
  { id: "moorings", title: "Moorings LP", artist: "Kaspar E.", date: "05 SEP 26", type: "Album", from: "#12494b", to: "#0a0c0d" },
  { id: "riptide-remixes", title: "Riptide (Remixes)", artist: "Vera Tallo", date: "22 AUG 26", type: "Remix EP", from: "#ff8a1e", to: "#241407" },
  { id: "salt-run-ep", title: "Salt Run EP", artist: "gyrofield, IMANU", date: "08 AUG 26", type: "EP", from: "#5a5145", to: "#0a0c0d" },
];

// Pulls a YouTube video ID out of any common URL shape (watch?v=, youtu.be/,
// shorts/, or a bare 11-char ID pasted directly) so a "youtube" track can be
// embedded without asking the admin to hand-extract the ID themselves.
export function getYouTubeId(url: string): string | null {
  const trimmed = url.trim();
  if (/^[\w-]{11}$/.test(trimmed)) return trimmed;
  const match = trimmed.match(
    /(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([\w-]{11})/
  );
  return match ? match[1] : null;
}

// Videos shown in the homepage "Krantas Sets" showcase — backed by the
// /admin/videos control panel. Each video is either uploaded directly
// (lives in the "videos" Supabase Storage bucket), pasted in as a YouTube
// link, or any other URL (Vimeo, Facebook reel, a direct .mp4 link, etc).
// `genre` and `artist` are free text and drive the filter pills on the
// homepage — leave either blank to leave a video out of that filter.
export type VideoSource = "upload" | "youtube" | "url";

export type Video = {
  id: string;
  title: string;
  artist?: string;
  genre?: string;
  source: VideoSource;
  // The uploaded file URL, the pasted YouTube link, or any other pasted URL.
  videoUrl: string;
  // Optional custom thumbnail (uploaded via /admin/videos). YouTube videos
  // fall back to i.ytimg.com when this is unset; upload/url videos with no
  // thumbnail just show the gradient card until played.
  thumbnailUrl?: string;
  from: string;
  to: string;
};

// Fallback showcase — shown only until real videos are added in
// /admin/videos (backed by Supabase). Same four sets as before, now
// tagged with a genre/artist so the filter pills have something to show.
export const videos: Video[] = [
  { id: "set-01", title: "Krantas Set — Vol. 01", artist: "Kasekas", genre: "Techno", source: "youtube", videoUrl: "https://youtu.be/drLTQJlpOAg", from: "#12494b", to: "#0a0c0d" },
  { id: "set-02", title: "Krantas Set — Vol. 02", artist: "Yara", genre: "House", source: "youtube", videoUrl: "https://youtu.be/_xtvbbRCeGU", from: "#ff8a1e", to: "#1a0e04" },
  { id: "set-03", title: "Krantas Set — Vol. 03", artist: "Neko", genre: "Breaks", source: "youtube", videoUrl: "https://youtu.be/NPavCcsSgnY", from: "#7a1f2b", to: "#0a0c0d" },
  { id: "set-04", title: "Krantas Set — Vol. 04", artist: "Vilka Mini", genre: "Dub Techno", source: "youtube", videoUrl: "https://youtu.be/qoJaDPSAZlA", from: "#2c7a7d", to: "#081312" },
];

// A "url" (or occasionally "upload") video whose link points straight at a
// playable file gets rendered with a native <video> tag instead of a
// link-out card — this is how we tell the difference.
export function isDirectVideoUrl(url: string): boolean {
  return /\.(mp4|webm|ogg|mov|m4v)(\?.*)?$/i.test(url.trim());
}

// Reels shown in the sticky "Reels" tab (components/ReelsTab.tsx) —
// backed by the /admin/reels control panel. Each reel is either uploaded
// directly (lives in the "reels" Supabase Storage bucket, plays inline),
// pasted in as a Facebook Reel link, or any other URL (Instagram, TikTok,
// a direct .mp4 link, etc). Facebook's reel embeds are unreliable in an
// iframe (many reels block embedding outright and just render black), so
// facebook/non-direct-file links render as branded link-out cards instead;
// uploads and direct file URLs play inline, same trick VideosSection uses.
export type ReelSource = "upload" | "facebook" | "url";

export type Reel = {
  id: string;
  source: ReelSource;
  // The uploaded file URL, the pasted Facebook reel link, or any other
  // pasted URL.
  url: string;
  label: string;
  // Optional custom thumbnail (uploaded via /admin/reels). Link-out cards
  // fall back to the gradient below when unset.
  thumbnailUrl?: string;
  from: string;
  to: string;
};

// Fallback set — shown only until real reels are added in /admin/reels
// (backed by Supabase).
export const reels: Reel[] = [
  { id: "reel-01", source: "facebook", url: "https://www.facebook.com/reel/965696269364482", label: "Reel — 01", from: "#12494b", to: "#0a0c0d" },
  { id: "reel-02", source: "facebook", url: "https://www.facebook.com/reel/672450154668794", label: "Reel — 02", from: "#ff8a1e", to: "#1a0e04" },
  { id: "reel-03", source: "facebook", url: "https://www.facebook.com/reel/1507442676710425", label: "Reel — 03", from: "#7a1f2b", to: "#0a0c0d" },
  { id: "reel-04", source: "facebook", url: "https://www.facebook.com/reel/2998278950308843", label: "Reel — 04", from: "#2c7a7d", to: "#081312" },
];

// A reel's `url` (upload or "url" source) that points straight at a
// playable file gets rendered with a native <video> tag instead of a
// link-out card — reuses the same test VideosSection uses.
export const isDirectReelUrl = isDirectVideoUrl;

// Sponsor / partner logos. Source files are black-background JPGs
// (or a transparent-ish PNG for Pioneer, cropped to just the mark) —
// see ProductsMarquee and the reveal section on the homepage for how
// mix-blend-mode: screen is used to drop the black so only the logo
// glows against the section's own dark background.
export type Sponsor = {
  id: string;
  name: string;
  src: string;
  // Intrinsic pixel dimensions of the source file — required by
  // next/image to reserve the right aspect ratio (prevents layout
  // shift) even though the logo is actually rendered much smaller via
  // CSS max-height/max-width + object-contain.
  width: number;
  height: number;
  // Marks the headline partner — sorted first in the logo wall.
  primary?: boolean;
  // Very wide/thin wordmark logos (Pioneer, Ableton, Traktor) need a
  // width-led box to read at a comparable size to the squarer marks
  // (Jägermeister, Red Bull) — see PartnersRevealSection's LogoWall.
  wide?: boolean;
};

export const sponsors: Sponsor[] = [
  { id: "hor", name: "HOR", src: "/sponsors/hor-mark.webp", width: 397, height: 115, primary: true },
  { id: "pioneer", name: "Pioneer DJ", src: "/sponsors/pioneer-mark.webp", width: 483, height: 70, wide: true },
  { id: "jagermeister", name: "Jägermeister", src: "/sponsors/jagermeister-mark.webp", width: 509, height: 350 },
  { id: "ableton", name: "Ableton", src: "/sponsors/ableton-mark.webp", width: 391, height: 70, wide: true },
  { id: "redbull", name: "Red Bull", src: "/sponsors/redbull-mark.webp", width: 553, height: 393 },
  { id: "traktor", name: "Traktor", src: "/sponsors/traktor-mark.webp", width: 602, height: 89, wide: true },
];

export type GalleryImage = { id: string; src: string; alt: string };

export const galleryImages: GalleryImage[] = [
  { id: "venue-1", src: "/gallery/venue-1.webp", alt: "DJ set at Krantas" },
  { id: "venue-2", src: "/gallery/venue-2.webp", alt: "Bar at Krantas" },
  { id: "venue-3", src: "/gallery/venue-3.webp", alt: "Crowd on the dancefloor at Krantas" },
];

export type RadioEpisode = {
  id: string;
  season: string;
  episode: string;
  title: string;
  from: string;
  to: string;
  // Direct link to a playable mp3/stream. Drop files into
  // /public/radio (e.g. /radio/s04e12.mp3) or point at an external
  // host — episodes without one are skipped by the header "sets"
  // player and the Radio page play button.
  audioUrl?: string;
  // Optional cover art — shown instead of the color_from/color_to
  // gradient wherever there's room for a real thumbnail (episode grid,
  // featured card, header player dropdown). Falls back to the gradient
  // when not set.
  imageUrl?: string;
};

export const radioEpisodes: RadioEpisode[] = [
  { id: "s04e12", season: "04", episode: "12", title: "Silt live from the boiler room", from: "#12494b", to: "#0a0c0d", audioUrl: "/radio/s04e12.mp3" },
  { id: "s04e11", season: "04", episode: "11", title: "Molo — salt & static", from: "#ff8a1e", to: "#1a0e04", audioUrl: "/radio/s04e11.mp3" },
  { id: "s04e10", season: "04", episode: "10", title: "Guest mix: Flotila collective", from: "#7a1f2b", to: "#0a0c0d", audioUrl: "/radio/s04e10.mp3" },
  { id: "s04e09", season: "04", episode: "09", title: "Kaspar E. — low end theory", from: "#2c7a7d", to: "#081312", audioUrl: "/radio/s04e09.mp3" },
];

// ── Live broadcast ──────────────────────────────────────────────────────
// Backs the "LIVE NOW" state on the Radio page. `kind` decides how the
// Listen control behaves, since it's still open which broadcast setup
// gets used:
//   "audio" → streamUrl is a direct, browser-playable stream (Icecast/
//             Shoutcast mount, or a stream link from a host like Zeno.fm,
//             Radio.co, Radiojar) — played inline with an <audio> tag.
//   "embed" → streamUrl is an embeddable player page (Mixcloud Live,
//             YouTube Live, Twitch) — shown in an <iframe>.
//   "link"  → streamUrl just opens in a new tab — the fallback for
//             anything that can't be embedded or streamed directly.
export type RadioLiveStatus = {
  isLive: boolean;
  showTitle?: string;
  djName?: string;
  streamUrl?: string;
  kind: "audio" | "embed" | "link";
};

export const radioLiveFallback: RadioLiveStatus = {
  isLive: false,
  kind: "audio",
};

// Past on-air sessions, most recent first — shown on the Radio page in
// place of the off-air message once at least one exists.
export type RadioLiveHistoryEntry = {
  id: string;
  showTitle?: string;
  djName?: string;
  startedAt: string;
};

export const radioLiveHistoryFallback: RadioLiveHistoryEntry[] = [];

export type RadioLink = {
  id: string;
  label: string;
  url: string;
};

export const radioLinks: RadioLink[] = [
  { id: "soundcloud", label: "Soundcloud", url: "#" },
  { id: "apple-podcasts", label: "Apple Podcasts", url: "#" },
  { id: "spotify", label: "Spotify", url: "#" },
  { id: "demos", label: "Demos", url: "#" },
  { id: "patreon", label: "Patreon", url: "#" },
];

export type RadioScheduleSlot = {
  id: string;
  dayLabel: string;
  timeLabel: string;
  showTitle: string;
  djName?: string;
};

export const radioSchedule: RadioScheduleSlot[] = [
  { id: "tue", dayLabel: "Tuesdays", timeLabel: "20:00 EET", showTitle: "Krantas Radio — Selectors", djName: "Alyga SOFT" },
  { id: "fri", dayLabel: "Fridays", timeLabel: "22:00 EET", showTitle: "Boiler Room Warmup", djName: "Silt" },
];

export type Merch = {
  id: string;
  name: string;
  price: string;
  from: string;
  to: string;
  imageUrl?: string;
  description?: string;
  // Size options, e.g. ["S", "M", "L", "XL"] — omit for one-size items.
  sizes?: string[];
  soldOut?: boolean;
  // Raw amount backing `price`, used by the order form/API.
  priceCents?: number;
  currency?: string;
};

export const merch: Merch[] = [
  { id: "tee-tide", name: "T-shirt: Tide Line", price: "€32", from: "#12494b", to: "#0a0c0d" },
  { id: "hoodie-hull", name: "Hoodie: Hull", price: "€68", from: "#0a0c0d", to: "#1a1a1a" },
  { id: "cap-buoy", name: "Cap: Buoy Mark", price: "€24", from: "#ff8a1e", to: "#241407" },
  { id: "tote-krantas", name: "Tote: Krantas Wordmark", price: "€16", from: "#ece7dd", to: "#c9c2b3" },
  { id: "vinyl-flare", name: '12" Vinyl: Flare EP', price: "€19", from: "#7a1f2b", to: "#0a0c0d" },
  { id: "longsleeve-undertow", name: "Longsleeve: Undertow", price: "€45", from: "#2c7a7d", to: "#081312" },
];

// ── About page ──────────────────────────────────────────────────────────
// Backs the /about page, editable from /admin/about. `body` holds one or
// more paragraphs separated by a blank line — see AboutSection for how
// that's split back out for rendering.
export type AboutContent = {
  eyebrow: string;
  heading: string;
  subheading: string;
  body: string;
  imageUrl?: string;
};

// Placeholder story — shown only until real copy is saved in
// /admin/about (backed by Supabase).
export const aboutFallback: AboutContent = {
  eyebrow: "Our story",
  heading: "Underground music in Klaipėda, by the shore",
  subheading: "Built by the water in Klaipėda. Driven by the sound.",
  body: `Krantas opened as a home for the sounds we couldn't find anywhere else on the coast — techno, breaks and bass played loud, on a system built for it, in a room that doesn't pretend to be anything other than a warehouse by the port.

Rather than chasing trends, we invest in resident artists, immersive sound, and nights that evolve naturally — from the first record to the final track. Every booking and every corner of the room is shaped by the same idea: the music comes first.

Years on, Krantas is still run by the same small crew that started it, still based in Klaipėda, and still building nights around DJs and live acts we'd want to hear ourselves.`,
};

// Backs the scrolling strip below the header and the text-only
// "statement" section between the Videos and Gallery carousels on the
// homepage, editable from /admin/homepage.
export type HomepageContent = {
  marqueeText: string;
  statementEyebrow: string;
  statementHeading: string;
  statementBody: string;
  // Optional admin-uploaded replacement for the hero background video (see
  // /admin/homepage). Empty string means "use the bundled /hero.webm +
  // /hero.mp4 footage" — Hero.tsx treats an empty string the same as
  // undefined.
  heroVideoUrl: string;
  heroVideoType: string;
  heroPosterUrl: string;
};

// Placeholder copy — shown only until real text is saved in
// /admin/homepage (backed by Supabase).
export const homepageContentFallback: HomepageContent = {
  marqueeText: "Riptide · 09 Aug — doors 23:00, Krantas main floor",
  statementEyebrow: "Build by the water. Driven by the sound.",
  statementHeading: "Powerful sound, industrial surroundings, and people who come for the music",
  statementBody:
    "Rather than chasin trends, we invest in resident artists, immersive sound, and nights that evolve naturally - from the first record to the final track.",
  heroVideoUrl: "",
  heroVideoType: "",
  heroPosterUrl: "",
};

export type Stat = {
  id: string;
  value: string;
  label: string;
};

export const stats: Stat[] = [
  {
    id: "events",
    value: "150+",
    label: "Events",
  },
  {
    id: "artists",
    value: "300+",
    label: "Artists",
  },
  {
    id: "years",
    value: "10+",
    label: "Years Running",
  },
  {
    id: "visitors",
    value: "50K+",
    label: "Visitors",
  },
];
