import { supabaseServer } from "./supabase-server";
import {
  events as fallbackEvents,
  artists as fallbackArtists,
  releases as fallbackReleases,
  videos as fallbackVideos,
  radioEpisodes as fallbackEpisodes,
  radioLiveFallback,
  radioLiveHistoryFallback,
  radioLinks as fallbackLinks,
  radioSchedule as fallbackSchedule,
  merch as fallbackMerch,
  galleryImages as fallbackGalleryImages,
  aboutFallback,
  type AboutContent,
  stats as fallbackStats,
  type Stat,
  type Poster,
  type Artist,
  type Release,
  type ReleaseTrack,
  type Video,
  type Reel,
  type RadioEpisode,
  type RadioLiveStatus,
  type RadioLiveHistoryEntry,
  type RadioLink,
  type RadioScheduleSlot,
  type Merch,
  type GalleryImage,
} from "./content";
import { formatPrice } from "./store";

// ---------------------------------------------------------------------------
// These run server-side (in Server Components) so the first HTML sent to the
// browser already contains the real Supabase data instead of the hardcoded
// placeholders from lib/content.ts. Each function keeps the exact same
// "fallback unless we got real, non-empty rows" behaviour the old
// client-side useEffect fetches had — nothing else about the data changes,
// only when/where the fetch happens.
// ---------------------------------------------------------------------------

const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
const WEEKDAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

// ---- Releases ---------------------------------------------------------

type ReleaseRow = {
  id: string;
  sort_order: number;
  title: string;
  artist: string;
  type: string;
  release_date: string;
  description: string | null;
  logo_url: string | null;
  external_url: string | null;
  color_from: string;
  color_to: string;
  tracks: ReleaseTrack[] | null;
};

function rowToRelease(r: ReleaseRow): Release {
  const d = new Date(`${r.release_date}T12:00:00`);
  return {
    id: r.id,
    title: r.title,
    artist: r.artist,
    type: r.type,
    date: `${String(d.getDate()).padStart(2, "0")} ${MONTHS[d.getMonth()]} ${String(d.getFullYear()).slice(-2)}`,
    from: r.color_from,
    to: r.color_to,
    description: r.description ?? undefined,
    logoUrl: r.logo_url ?? undefined,
    externalUrl: r.external_url ?? undefined,
    tracks: r.tracks ?? undefined,
  };
}

export async function getReleases(): Promise<Release[]> {
  const { data, error } = await supabaseServer
    .from("releases")
    .select("*")
    .order("sort_order", { ascending: true });
  // A genuinely empty table means "no releases added yet" — show the real
  // empty state rather than the placeholder content. Only fall back to the
  // hardcoded list if the fetch itself failed (bad env vars, network blip,
  // etc.), so a broken connection doesn't just show an empty page.
  if (error) return fallbackReleases;
  return (data as ReleaseRow[] | null)?.map(rowToRelease) ?? [];
}

// ---- Artists ------------------------------------------------------------

type ArtistRow = {
  id: string;
  sort_order: number;
  name: string;
  role: string | null;
  color_from: string;
  color_to: string;
  image_url: string | null;
  bio: string | null;
  bio_long: string | null;
  instagram: string | null;
  soundcloud: string | null;
  facebook: string | null;
  website: string | null;
  contact_email: string | null;
};

function rowToArtist(r: ArtistRow): Artist {
  return {
    id: r.id,
    name: r.name,
    role: r.role ?? "",
    from: r.color_from,
    to: r.color_to,
    imageUrl: r.image_url ?? undefined,
    bio: r.bio ?? undefined,
    bioLong: r.bio_long ?? undefined,
    instagram: r.instagram ?? undefined,
    soundcloud: r.soundcloud ?? undefined,
    facebook: r.facebook ?? undefined,
    website: r.website ?? undefined,
    contactEmail: r.contact_email ?? undefined,
  };
}

export async function getArtists(): Promise<Artist[]> {
  const { data, error } = await supabaseServer
    .from("artists")
    .select("*")
    .order("sort_order", { ascending: true });
  if (!error && data && data.length > 0) {
    return (data as ArtistRow[]).map(rowToArtist);
  }
  return fallbackArtists;
}

// ---- Events ---------------------------------------------------------------

type EventRow = {
  id: string;
  sort_order: number;
  headline: string;
  sub: string | null;
  event_date: string;
  start_time: string | null;
  end_time: string | null;
  venue_line: string;
  tags: string[] | null;
  color_from: string;
  color_to: string;
  image_url: string | null;
  description: string | null;
  ticket_url: string | null;
  featured: boolean;
};

function rowToPoster(r: EventRow): Poster {
  const d = new Date(`${r.event_date}T12:00:00`);
  return {
    id: r.id,
    headline: r.headline,
    sub: r.sub ?? undefined,
    date: `${WEEKDAYS[d.getDay()]} ${String(d.getDate()).padStart(2, "0")} ${MONTHS[d.getMonth()]}`,
    day: String(d.getDate()).padStart(2, "0"),
    month: MONTHS[d.getMonth()],
    venueLine: r.venue_line,
    tags: r.tags ?? [],
    from: r.color_from,
    to: r.color_to,
    eventDate: r.event_date,
    featured: r.featured,
    ticketUrl: r.ticket_url ?? undefined,
    imageUrl: r.image_url ?? undefined,
    startTime: r.start_time ?? undefined,
    endTime: r.end_time ?? undefined,
    description: r.description ?? undefined,
  };
}

export async function getEvents(): Promise<Poster[]> {
  const { data, error } = await supabaseServer
    .from("events")
    .select("*")
    .order("event_date", { ascending: true });
  if (!error && data && data.length > 0) {
    return (data as EventRow[]).map(rowToPoster);
  }
  return fallbackEvents;
}

// ---- Store ----------------------------------------------------------------

type ProductRow = {
  id: string;
  sort_order: number;
  name: string;
  price_cents: number;
  currency: string;
  description: string | null;
  image_url: string | null;
  color_from: string;
  color_to: string;
  sizes: string[] | null;
  sold_out: boolean;
};

function rowToMerch(r: ProductRow): Merch {
  return {
    id: r.id,
    name: r.name,
    price: formatPrice(r.price_cents, r.currency),
    from: r.color_from,
    to: r.color_to,
    imageUrl: r.image_url ?? undefined,
    description: r.description ?? undefined,
    sizes: r.sizes && r.sizes.length > 0 ? r.sizes : undefined,
    soldOut: r.sold_out,
    priceCents: r.price_cents,
    currency: r.currency,
  };
}

export async function getProducts(): Promise<Merch[]> {
  const { data, error } = await supabaseServer
    .from("products")
    .select("*")
    .order("sort_order", { ascending: true });
  if (!error && data && data.length > 0) {
    return (data as ProductRow[]).map(rowToMerch);
  }
  return fallbackMerch;
}

// ---- Videos -----------------------------------------------------------

type VideoRow = {
  id: string;
  sort_order: number;
  title: string;
  artist: string | null;
  genre: string | null;
  source: Video["source"];
  video_url: string;
  thumbnail_url: string | null;
  color_from: string;
  color_to: string;
};

function rowToVideo(r: VideoRow): Video {
  return {
    id: r.id,
    title: r.title,
    artist: r.artist || undefined,
    genre: r.genre || undefined,
    source: r.source,
    videoUrl: r.video_url,
    thumbnailUrl: r.thumbnail_url || undefined,
    from: r.color_from,
    to: r.color_to,
  };
}

export async function getVideos(): Promise<Video[]> {
  const { data, error } = await supabaseServer
    .from("videos")
    .select("*")
    .order("sort_order", { ascending: true });
  if (!error && data && data.length > 0) {
    return (data as VideoRow[]).map(rowToVideo);
  }
  return fallbackVideos;
}

// ---- Reels --------------------------------------------------------------

type ReelRow = {
  id: string;
  sort_order: number;
  label: string;
  source: Reel["source"];
  reel_url: string;
  thumbnail_url: string | null;
  color_from: string;
  color_to: string;
};

function rowToReel(r: ReelRow): Reel {
  return {
    id: r.id,
    source: r.source,
    url: r.reel_url,
    label: r.label,
    thumbnailUrl: r.thumbnail_url || undefined,
    from: r.color_from,
    to: r.color_to,
  };
}

export async function getReels(): Promise<Reel[]> {
  const { data, error } = await supabaseServer
    .from("reels")
    .select("*")
    .order("sort_order", { ascending: true });
  if (!error && data && data.length > 0) {
    return (data as ReelRow[]).map(rowToReel);
  }
  // Unlike other sections, an empty reels table means "coming soon" is
  // the honest state to show — not the same static placeholder set every
  // time, which reads as real content. See components/ReelsTab.tsx.
  return [];
}

// ---- Gallery ------------------------------------------------------------

type GalleryRow = {
  id: string;
  sort_order: number;
  image_url: string;
  alt: string | null;
};

function rowToGalleryImage(r: GalleryRow): GalleryImage {
  return {
    id: r.id,
    src: r.image_url,
    alt: r.alt || "Krantas",
  };
}

export async function getGalleryImages(): Promise<GalleryImage[]> {
  const { data, error } = await supabaseServer
    .from("gallery_images")
    .select("*")
    .order("sort_order", { ascending: true });
  if (!error && data && data.length > 0) {
    return (data as GalleryRow[]).map(rowToGalleryImage);
  }
  return fallbackGalleryImages;
}

// ---- Radio ------------------------------------------------------------

type EpisodeRow = {
  id: string;
  sort_order: number;
  season: string;
  episode: string;
  title: string;
  color_from: string;
  color_to: string;
  audio_url: string | null;
  image_url: string | null;
};

function rowToEpisode(r: EpisodeRow): RadioEpisode {
  return {
    id: r.id,
    season: r.season,
    episode: r.episode,
    title: r.title,
    from: r.color_from,
    to: r.color_to,
    audioUrl: r.audio_url ?? undefined,
    imageUrl: r.image_url ?? undefined,
  };
}

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

type LinkRow = { id: string; label: string; url: string };
type ScheduleRow = { id: string; day_label: string; time_label: string; show_title: string; dj_name: string | null };
type HistoryRow = { id: string; show_title: string | null; dj_name: string | null; started_at: string };

export type RadioData = {
  episodes: RadioEpisode[];
  live: RadioLiveStatus;
  links: RadioLink[];
  schedule: RadioScheduleSlot[];
  liveHistory: RadioLiveHistoryEntry[];
};

export async function getRadioEpisodes(): Promise<RadioEpisode[]> {
  const { data, error } = await supabaseServer
    .from("radio_episodes")
    .select("*")
    .order("sort_order", { ascending: true });
  if (!error && data && data.length > 0) {
    return (data as EpisodeRow[]).map(rowToEpisode);
  }
  return fallbackEpisodes;
}

export async function getRadioData(): Promise<RadioData> {
  const [episodes, liveRes, linksRes, scheduleRes, historyRes] = await Promise.all([
    getRadioEpisodes(),
    supabaseServer.from("radio_live").select("*").eq("id", 1).maybeSingle(),
    supabaseServer.from("radio_links").select("*").order("sort_order", { ascending: true }),
    supabaseServer.from("radio_schedule").select("*").order("sort_order", { ascending: true }),
    supabaseServer
      .from("radio_live_history")
      .select("*")
      .not("ended_at", "is", null)
      .order("started_at", { ascending: false })
      .limit(3),
  ]);

  const live =
    !liveRes.error && liveRes.data ? rowToLive(liveRes.data as LiveRow) : radioLiveFallback;

  const links =
    !linksRes.error && linksRes.data && linksRes.data.length > 0
      ? (linksRes.data as LinkRow[]).map((r) => ({ id: r.id, label: r.label, url: r.url }))
      : fallbackLinks;

  const schedule =
    !scheduleRes.error && scheduleRes.data
      ? (scheduleRes.data as ScheduleRow[]).map((r) => ({
          id: r.id,
          dayLabel: r.day_label,
          timeLabel: r.time_label,
          showTitle: r.show_title,
          djName: r.dj_name ?? undefined,
        }))
      : fallbackSchedule;

  const liveHistory =
    !historyRes.error && historyRes.data
      ? (historyRes.data as HistoryRow[]).map((r) => ({
          id: r.id,
          showTitle: r.show_title ?? undefined,
          djName: r.dj_name ?? undefined,
          startedAt: r.started_at,
        }))
      : radioLiveHistoryFallback;

  return { episodes, live, links, schedule, liveHistory };
}

// ---- About page -----------------------------------------------------------

type AboutRow = {
  eyebrow: string | null;
  heading: string | null;
  subheading: string | null;
  body: string | null;
  image_url: string | null;
};

function rowToAbout(r: AboutRow): AboutContent {
  return {
    eyebrow: r.eyebrow || aboutFallback.eyebrow,
    heading: r.heading || aboutFallback.heading,
    subheading: r.subheading || aboutFallback.subheading,
    body: r.body || aboutFallback.body,
    imageUrl: r.image_url ?? undefined,
  };
}

export async function getAboutContent(): Promise<AboutContent> {
  const { data, error } = await supabaseServer
    .from("about_page")
    .select("*")
    .eq("id", 1)
    .maybeSingle();
  if (error || !data) return aboutFallback;
  return rowToAbout(data as AboutRow);
}

// ---- Site stats strip -------------------------------------------------

type StatRow = { id: string; value: string; label: string };

export async function getStats(): Promise<Stat[]> {
  const { data, error } = await supabaseServer
    .from("site_stats")
    .select("*")
    .order("sort_order", { ascending: true });
  if (!error && data && data.length > 0) {
    return (data as StatRow[]).map((r) => ({ id: r.id, value: r.value, label: r.label }));
  }
  return fallbackStats;
}
