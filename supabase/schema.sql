-- Safe to run in the Supabase SQL editor any time — tables use
-- "create table if not exists" and every policy is dropped and
-- recreated, so re-running this after pulling new changes (like the
-- radio_episodes table below) won't error on things that already exist.

create table if not exists public.events (
  id           uuid primary key default gen_random_uuid(),
  sort_order   integer not null default 0,
  headline     text not null,
  sub          text,
  event_date   date not null,
  start_time   text,
  end_time     text,
  venue_line   text not null default 'Krantas \\ Main Floor',
  tags         text[] not null default '{}',
  color_from   text not null default '#12494b',
  color_to     text not null default '#0a0c0d',
  image_url    text,
  description  text,
  ticket_url   text,
  featured     boolean not null default false,
  created_at   timestamptz not null default now()
);

-- Already have an events table from before the detail-popup feature?
-- Uncomment and run just these lines:
-- alter table public.events add column if not exists start_time text;
-- alter table public.events add column if not exists end_time text;
-- alter table public.events add column if not exists description text;

alter table public.events enable row level security;

-- Anyone (including logged-out visitors) can read events, so the
-- public site can render Featured / Upcoming / Past without auth.
drop policy if exists "Public can read events" on public.events;
create policy "Public can read events"
  on public.events for select
  using (true);

-- Only logged-in admins (created via Supabase Auth) can write.
drop policy if exists "Authenticated can insert events" on public.events;
create policy "Authenticated can insert events"
  on public.events for insert
  to authenticated
  with check (true);

drop policy if exists "Authenticated can update events" on public.events;
create policy "Authenticated can update events"
  on public.events for update
  to authenticated
  using (true)
  with check (true);

drop policy if exists "Authenticated can delete events" on public.events;
create policy "Authenticated can delete events"
  on public.events for delete
  to authenticated
  using (true);

-- ── Artists roster ────────────────────────────────────────────────────────

create table if not exists public.artists (
  id           uuid primary key default gen_random_uuid(),
  sort_order   integer not null default 0,
  name         text not null,
  role         text,
  color_from   text not null default '#12494b',
  color_to     text not null default '#0a0c0d',
  image_url    text,
  bio          text,
  bio_long     text,
  instagram    text,
  soundcloud   text,
  facebook     text,
  website      text,
  contact_email text,
  created_at   timestamptz not null default now()
);

-- Running this on a database that already has the artists table from
-- before the card redesign? Uncomment and run just these lines:
-- alter table public.artists add column if not exists image_url text;
-- alter table public.artists add column if not exists bio text;
-- alter table public.artists add column if not exists bio_long text;
-- alter table public.artists add column if not exists instagram text;
-- alter table public.artists add column if not exists soundcloud text;
-- alter table public.artists add column if not exists facebook text;
-- alter table public.artists add column if not exists website text;
-- alter table public.artists add column if not exists contact_email text;

alter table public.artists enable row level security;

drop policy if exists "Public can read artists" on public.artists;
create policy "Public can read artists"
  on public.artists for select
  using (true);

drop policy if exists "Authenticated can insert artists" on public.artists;
create policy "Authenticated can insert artists"
  on public.artists for insert
  to authenticated
  with check (true);

drop policy if exists "Authenticated can update artists" on public.artists;
create policy "Authenticated can update artists"
  on public.artists for update
  to authenticated
  using (true)
  with check (true);

drop policy if exists "Authenticated can delete artists" on public.artists;
create policy "Authenticated can delete artists"
  on public.artists for delete
  to authenticated
  using (true);

-- ── Radio episodes / header player tracks ─────────────────────────────────
-- Backs both the Radio page grid and the persistent "Krantas Sets" player
-- that lives in the header (components/SetsPlayer.tsx). Rows without an
-- audio_url still render as a card but are skipped by the header player.

create table if not exists public.radio_episodes (
  id           uuid primary key default gen_random_uuid(),
  sort_order   integer not null default 0,
  season       text not null default '04',
  episode      text not null default '01',
  title        text not null,
  color_from   text not null default '#12494b',
  color_to     text not null default '#0a0c0d',
  audio_url    text,
  image_url    text,
  created_at   timestamptz not null default now()
);

-- Run this once by hand if radio_episodes already existed before image_url
-- was added — `create table if not exists` above won't add columns to a
-- table that's already there.
-- alter table public.radio_episodes add column if not exists image_url text;

alter table public.radio_episodes enable row level security;

drop policy if exists "Public can read radio episodes" on public.radio_episodes;
create policy "Public can read radio episodes"
  on public.radio_episodes for select
  using (true);

drop policy if exists "Authenticated can insert radio episodes" on public.radio_episodes;
create policy "Authenticated can insert radio episodes"
  on public.radio_episodes for insert
  to authenticated
  with check (true);

drop policy if exists "Authenticated can update radio episodes" on public.radio_episodes;
create policy "Authenticated can update radio episodes"
  on public.radio_episodes for update
  to authenticated
  using (true)
  with check (true);

drop policy if exists "Authenticated can delete radio episodes" on public.radio_episodes;
create policy "Authenticated can delete radio episodes"
  on public.radio_episodes for delete
  to authenticated
  using (true);

-- ── Releases (label discography) ──────────────────────────────────────────
-- Backs the Releases page. Each release can carry a cover/logo image (via
-- /api/upload → the existing "events" bucket, prefix "release-"), a
-- description, an optional external link (Bandcamp/Spotify/etc.), and a
-- tracklist stored as jsonb. Each entry in tracks[] looks like:
--   { id: string, name: string, source: "upload" | "youtube" | "url", url: string }
-- "upload" tracks live in the existing "audio" bucket (same one
-- radio_episodes uses), uploaded straight from the browser — so no new
-- storage bucket or RLS policy is needed here either.

create table if not exists public.releases (
  id           uuid primary key default gen_random_uuid(),
  sort_order   integer not null default 0,
  title        text not null,
  artist       text not null,
  type         text not null default 'EP',
  release_date date not null default current_date,
  description  text,
  logo_url     text,
  external_url text,
  color_from   text not null default '#12494b',
  color_to     text not null default '#0a0c0d',
  tracks       jsonb not null default '[]',
  created_at   timestamptz not null default now()
);

alter table public.releases enable row level security;

drop policy if exists "Public can read releases" on public.releases;
create policy "Public can read releases"
  on public.releases for select
  using (true);

drop policy if exists "Authenticated can insert releases" on public.releases;
create policy "Authenticated can insert releases"
  on public.releases for insert
  to authenticated
  with check (true);

drop policy if exists "Authenticated can update releases" on public.releases;
create policy "Authenticated can update releases"
  on public.releases for update
  to authenticated
  using (true)
  with check (true);

drop policy if exists "Authenticated can delete releases" on public.releases;
create policy "Authenticated can delete releases"
  on public.releases for delete
  to authenticated
  using (true);

-- ── Storage bucket for poster images ─────────────────────────────────────
-- Create this in the Supabase dashboard: Storage → New bucket → name it
-- "events" → toggle "Public bucket" ON (so getPublicUrl() works without
-- signed URLs). /api/upload writes here using the service role key, so no
-- storage RLS policies are required for the upload path itself.

-- ── Storage bucket for track audio ────────────────────────────────────────
-- Create this in the Supabase dashboard: Storage → New bucket → name it
-- "audio" → toggle "Public bucket" ON. Unlike poster art, audio files are
-- uploaded straight from the browser in /admin/radio (no server-side
-- conversion needed), so — unlike "events" — this bucket DOES need storage
-- RLS policies letting a logged-in admin write to it directly:

drop policy if exists "Public can read audio" on storage.objects;
create policy "Public can read audio"
  on storage.objects for select
  using (bucket_id = 'audio');

drop policy if exists "Authenticated can upload audio" on storage.objects;
create policy "Authenticated can upload audio"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'audio');

drop policy if exists "Authenticated can update audio" on storage.objects;
create policy "Authenticated can update audio"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'audio')
  with check (bucket_id = 'audio');

drop policy if exists "Authenticated can delete audio" on storage.objects;
create policy "Authenticated can delete audio"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'audio');

-- Also set a file-size limit on the "audio" bucket in the Supabase
-- dashboard (Storage → audio → settings) matching MAX_AUDIO_BYTES in
-- lib/upload-limits.ts, so rejections happen consistently client- and
-- server-side.


-- ── Radio: live broadcast status ───────────────────────────────────────────
-- Singleton row (fixed id = 1) the public Radio page polls for the
-- "LIVE NOW" state. stream_kind decides how the Listen control behaves,
-- since the actual broadcast setup (Icecast/Shoutcast, a hosted stream
-- like Zeno.fm/Radio.co/Radiojar, a live-platform embed, or nothing yet)
-- wasn't locked in when this was built:
--   'audio' → stream_url is a direct, browser-playable stream — played
--             inline with an <audio> tag.
--   'embed' → stream_url is an embeddable player page (Mixcloud Live,
--             YouTube Live, Twitch) — shown in an <iframe>.
--   'link'  → stream_url just opens in a new tab.
create table if not exists public.radio_live (
  id           int primary key default 1,
  is_live      boolean not null default false,
  show_title   text,
  dj_name      text,
  stream_url   text,
  stream_kind  text not null default 'audio' check (stream_kind in ('audio', 'embed', 'link')),
  updated_at   timestamptz not null default now(),
  constraint radio_live_singleton check (id = 1)
);

insert into public.radio_live (id) values (1) on conflict (id) do nothing;

alter table public.radio_live enable row level security;

drop policy if exists "Public can read radio live status" on public.radio_live;
create policy "Public can read radio live status"
  on public.radio_live for select
  using (true);

drop policy if exists "Authenticated can update radio live status" on public.radio_live;
create policy "Authenticated can update radio live status"
  on public.radio_live for update
  to authenticated
  using (true)
  with check (true);

-- ── Radio: listen / social links ───────────────────────────────────────────
-- The badge row under the featured player (Soundcloud, Spotify, etc.),
-- editable from the control panel instead of hardcoded.
create table if not exists public.radio_links (
  id           uuid primary key default gen_random_uuid(),
  sort_order   integer not null default 0,
  label        text not null,
  url          text not null default '#',
  created_at   timestamptz not null default now()
);

alter table public.radio_links enable row level security;

drop policy if exists "Public can read radio links" on public.radio_links;
create policy "Public can read radio links"
  on public.radio_links for select
  using (true);

drop policy if exists "Authenticated can insert radio links" on public.radio_links;
create policy "Authenticated can insert radio links"
  on public.radio_links for insert
  to authenticated
  with check (true);

drop policy if exists "Authenticated can update radio links" on public.radio_links;
create policy "Authenticated can update radio links"
  on public.radio_links for update
  to authenticated
  using (true)
  with check (true);

drop policy if exists "Authenticated can delete radio links" on public.radio_links;
create policy "Authenticated can delete radio links"
  on public.radio_links for delete
  to authenticated
  using (true);

-- ── Radio: upcoming schedule ────────────────────────────────────────────────
create table if not exists public.radio_schedule (
  id           uuid primary key default gen_random_uuid(),
  sort_order   integer not null default 0,
  day_label    text not null default '',
  time_label   text not null default '',
  show_title   text not null default '',
  dj_name      text,
  created_at   timestamptz not null default now()
);

alter table public.radio_schedule enable row level security;

drop policy if exists "Public can read radio schedule" on public.radio_schedule;
create policy "Public can read radio schedule"
  on public.radio_schedule for select
  using (true);

drop policy if exists "Authenticated can insert radio schedule" on public.radio_schedule;
create policy "Authenticated can insert radio schedule"
  on public.radio_schedule for insert
  to authenticated
  with check (true);

drop policy if exists "Authenticated can update radio schedule" on public.radio_schedule;
create policy "Authenticated can update radio schedule"
  on public.radio_schedule for update
  to authenticated
  using (true)
  with check (true);

drop policy if exists "Authenticated can delete radio schedule" on public.radio_schedule;
create policy "Authenticated can delete radio schedule"
  on public.radio_schedule for delete
  to authenticated
  using (true);

-- ── Videos (filmed sets / clips shown on the homepage) ────────────────────
-- Backs the "Krantas Sets" showcase on the homepage and the /admin/videos
-- control panel. Each video is either uploaded directly (stored in the new
-- "videos" Storage bucket below), pasted in as a YouTube link, or any other
-- URL (Vimeo, Facebook reel, a direct .mp4 link, etc). `genre` and `artist`
-- are free text and back the filter pills shown on the homepage.

create table if not exists public.videos (
  id            uuid primary key default gen_random_uuid(),
  sort_order    integer not null default 0,
  title         text not null,
  artist        text,
  genre         text,
  source        text not null default 'youtube' check (source in ('upload', 'youtube', 'url')),
  video_url     text not null default '',
  thumbnail_url text,
  color_from    text not null default '#12494b',
  color_to      text not null default '#0a0c0d',
  created_at    timestamptz not null default now()
);

alter table public.videos enable row level security;

drop policy if exists "Public can read videos" on public.videos;
create policy "Public can read videos"
  on public.videos for select
  using (true);

drop policy if exists "Authenticated can insert videos" on public.videos;
create policy "Authenticated can insert videos"
  on public.videos for insert
  to authenticated
  with check (true);

drop policy if exists "Authenticated can update videos" on public.videos;
create policy "Authenticated can update videos"
  on public.videos for update
  to authenticated
  using (true)
  with check (true);

drop policy if exists "Authenticated can delete videos" on public.videos;
create policy "Authenticated can delete videos"
  on public.videos for delete
  to authenticated
  using (true);

-- ── Storage bucket for uploaded video files ────────────────────────────────
-- Create this in the Supabase dashboard: Storage → New bucket → name it
-- "videos" → toggle "Public bucket" ON. Like "audio", video files are
-- uploaded straight from the browser in /admin/videos (no server-side
-- conversion, and the Vercel/Next.js function body-size limit would choke
-- on a big file anyway), so this bucket needs its own storage RLS policies:

drop policy if exists "Public can read videos bucket" on storage.objects;
create policy "Public can read videos bucket"
  on storage.objects for select
  using (bucket_id = 'videos');

drop policy if exists "Authenticated can upload videos bucket" on storage.objects;
create policy "Authenticated can upload videos bucket"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'videos');

drop policy if exists "Authenticated can update videos bucket" on storage.objects;
create policy "Authenticated can update videos bucket"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'videos')
  with check (bucket_id = 'videos');

drop policy if exists "Authenticated can delete videos bucket" on storage.objects;
create policy "Authenticated can delete videos bucket"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'videos');

-- Also set a file-size limit on the "videos" bucket in the Supabase
-- dashboard (Storage → videos → settings) matching MAX_VIDEO_BYTES in
-- lib/upload-limits.ts, so rejections happen consistently client- and
-- server-side.

-- ── Gallery (venue photo strip on the homepage) ───────────────────────────
-- Backs the scrolling photo strips in components/GallerySection.tsx and the
-- /admin/gallery control panel. Photos are uploaded through /api/upload
-- (prefix "gallery-"), which writes into the existing "events" bucket and
-- converts to WebP server-side — same as artist portraits and event
-- posters — so no new storage bucket or RLS policy is needed here.

create table if not exists public.gallery_images (
  id           uuid primary key default gen_random_uuid(),
  sort_order   integer not null default 0,
  image_url    text not null,
  alt          text not null default '',
  created_at   timestamptz not null default now()
);

alter table public.gallery_images enable row level security;

drop policy if exists "Public can read gallery images" on public.gallery_images;
create policy "Public can read gallery images"
  on public.gallery_images for select
  using (true);

drop policy if exists "Authenticated can insert gallery images" on public.gallery_images;
create policy "Authenticated can insert gallery images"
  on public.gallery_images for insert
  to authenticated
  with check (true);

drop policy if exists "Authenticated can update gallery images" on public.gallery_images;
create policy "Authenticated can update gallery images"
  on public.gallery_images for update
  to authenticated
  using (true)
  with check (true);

drop policy if exists "Authenticated can delete gallery images" on public.gallery_images;
create policy "Authenticated can delete gallery images"
  on public.gallery_images for delete
  to authenticated
  using (true);

-- ── Radio: live broadcast history ───────────────────────────────────────────
-- One row per on-air session, recorded automatically by the live desk
-- toggle. Backs the "recent lives" list the Radio page shows in place of
-- the plain off-air message once there's at least one past session.
create table if not exists public.radio_live_history (
  id           uuid primary key default gen_random_uuid(),
  show_title   text,
  dj_name      text,
  started_at   timestamptz not null default now(),
  ended_at     timestamptz
);

alter table public.radio_live_history enable row level security;

drop policy if exists "Public can read radio live history" on public.radio_live_history;
create policy "Public can read radio live history"
  on public.radio_live_history for select
  using (true);

drop policy if exists "Authenticated can insert radio live history" on public.radio_live_history;
create policy "Authenticated can insert radio live history"
  on public.radio_live_history for insert
  to authenticated
  with check (true);

drop policy if exists "Authenticated can update radio live history" on public.radio_live_history;
create policy "Authenticated can update radio live history"
  on public.radio_live_history for update
  to authenticated
  using (true)
  with check (true);

-- ── Store: products & orders ───────────────────────────────────────────────
-- Products back the /store page. Orders are created server-side only (via
-- /api/store/order using the service-role key) whenever a visitor submits
-- the order form, which also emails the admin and the buyer through Resend
-- — see lib/email-templates.ts. Nothing here needs a public insert policy
-- because the API route, not the browser, is what writes rows.

create table if not exists public.products (
  id           uuid primary key default gen_random_uuid(),
  sort_order   integer not null default 0,
  name         text not null,
  price_cents  integer not null default 0,
  currency     text not null default 'EUR',
  description  text,
  image_url    text,
  color_from   text not null default '#12494b',
  color_to     text not null default '#0a0c0d',
  sizes        text[] not null default '{}',
  sold_out     boolean not null default false,
  created_at   timestamptz not null default now()
);

alter table public.products enable row level security;

drop policy if exists "Public can read products" on public.products;
create policy "Public can read products"
  on public.products for select
  using (true);

drop policy if exists "Authenticated can insert products" on public.products;
create policy "Authenticated can insert products"
  on public.products for insert
  to authenticated
  with check (true);

drop policy if exists "Authenticated can update products" on public.products;
create policy "Authenticated can update products"
  on public.products for update
  to authenticated
  using (true)
  with check (true);

drop policy if exists "Authenticated can delete products" on public.products;
create policy "Authenticated can delete products"
  on public.products for delete
  to authenticated
  using (true);

create table if not exists public.orders (
  id                uuid primary key default gen_random_uuid(),
  product_id        uuid references public.products(id) on delete set null,
  product_name      text not null,   -- snapshot, so edits/deletes never break past orders
  price_cents       integer not null default 0,
  currency          text not null default 'EUR',
  size              text,
  quantity          integer not null default 1,
  customer_name     text not null,
  customer_email    text not null,
  customer_phone    text,
  delivery_method   text not null default 'address', -- pickup | address | locker
  shipping_address  text,
  locker_id         text, -- DPD locker id, only set when delivery_method = 'locker'
  notes             text,
  status            text not null default 'new', -- new | confirmed | fulfilled | cancelled
  created_at        timestamptz not null default now()
);

-- Orders are never written from the browser with the anon key — only
-- read/updated by a logged-in admin, and inserted by /api/store/order
-- using the service-role key (which bypasses RLS entirely). So there's
-- deliberately no insert policy for "authenticated" or "anon" here.
alter table public.orders enable row level security;

drop policy if exists "Authenticated can read orders" on public.orders;
create policy "Authenticated can read orders"
  on public.orders for select
  to authenticated
  using (true);

drop policy if exists "Authenticated can update orders" on public.orders;
create policy "Authenticated can update orders"
  on public.orders for update
  to authenticated
  using (true)
  with check (true);

drop policy if exists "Authenticated can delete orders" on public.orders;
create policy "Authenticated can delete orders"
  on public.orders for delete
  to authenticated
  using (true);

-- Product photos reuse the same "events" bucket via /api/upload
-- (prefix "product-"), so no new storage bucket is needed.

-- ── Reels (short vertical clips, linked out to Facebook or self-hosted) ───
-- Backs the sticky "Reels" tab (components/ReelsTab.tsx) and the
-- /admin/reels control panel. Each reel is either uploaded directly
-- (stored in the "reels" Storage bucket below), pasted in as a Facebook
-- Reel link, or any other URL (Instagram, TikTok, a direct .mp4 link,
-- etc). Facebook/other link-out reels render as branded cards that open
-- the clip in a new tab; uploaded or direct-file URLs play inline.

create table if not exists public.reels (
  id            uuid primary key default gen_random_uuid(),
  sort_order    integer not null default 0,
  label         text not null default '',
  source        text not null default 'facebook' check (source in ('upload', 'facebook', 'url')),
  reel_url      text not null default '',
  thumbnail_url text,
  color_from    text not null default '#12494b',
  color_to      text not null default '#0a0c0d',
  created_at    timestamptz not null default now()
);

alter table public.reels enable row level security;

drop policy if exists "Public can read reels" on public.reels;
create policy "Public can read reels"
  on public.reels for select
  using (true);

drop policy if exists "Authenticated can insert reels" on public.reels;
create policy "Authenticated can insert reels"
  on public.reels for insert
  to authenticated
  with check (true);

drop policy if exists "Authenticated can update reels" on public.reels;
create policy "Authenticated can update reels"
  on public.reels for update
  to authenticated
  using (true)
  with check (true);

drop policy if exists "Authenticated can delete reels" on public.reels;
create policy "Authenticated can delete reels"
  on public.reels for delete
  to authenticated
  using (true);

-- ── Storage bucket for uploaded reel files ────────────────────────────────
-- Create this in the Supabase dashboard: Storage → New bucket → name it
-- "reels" → toggle "Public bucket" ON. Like "videos", reel files are
-- uploaded straight from the browser in /admin/reels, so this bucket
-- needs its own storage RLS policies:

drop policy if exists "Public can read reels bucket" on storage.objects;
create policy "Public can read reels bucket"
  on storage.objects for select
  using (bucket_id = 'reels');

drop policy if exists "Authenticated can upload reels bucket" on storage.objects;
create policy "Authenticated can upload reels bucket"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'reels');

drop policy if exists "Authenticated can update reels bucket" on storage.objects;
create policy "Authenticated can update reels bucket"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'reels')
  with check (bucket_id = 'reels');

drop policy if exists "Authenticated can delete reels bucket" on storage.objects;
create policy "Authenticated can delete reels bucket"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'reels');

-- Also set a file-size limit on the "reels" bucket in the Supabase
-- dashboard (Storage → reels → settings) matching MAX_VIDEO_BYTES in
-- lib/upload-limits.ts, so rejections happen consistently client- and
-- server-side.

-- ── About page ──────────────────────────────────────────────────────────────
-- Singleton row (same pattern as radio_live) backing the /about page,
-- editable from /admin/about. `body` holds one or more paragraphs
-- separated by a blank line.
create table if not exists public.about_page (
  id           int primary key default 1,
  eyebrow      text,
  heading      text,
  subheading   text,
  body         text,
  image_url    text,
  updated_at   timestamptz not null default now(),
  constraint about_page_singleton check (id = 1)
);

insert into public.about_page (id) values (1) on conflict (id) do nothing;

alter table public.about_page enable row level security;

drop policy if exists "Public can read about page" on public.about_page;
create policy "Public can read about page"
  on public.about_page for select
  using (true);

drop policy if exists "Authenticated can update about page" on public.about_page;
create policy "Authenticated can update about page"
  on public.about_page for update
  to authenticated
  using (true)
  with check (true);

-- ── Site stats strip ─────────────────────────────────────────────────────────
-- The small "150+ Events / 300+ Artists / ..." strip shown on the About
-- page. A simple ordered list (same pattern as gallery_images) rather than
-- a fixed singleton, so the admin can add, remove, or reorder figures.
create table if not exists public.site_stats (
  id           uuid primary key default gen_random_uuid(),
  sort_order   integer not null default 0,
  value        text not null,
  label        text not null,
  created_at   timestamptz not null default now()
);

alter table public.site_stats enable row level security;

drop policy if exists "Public can read site stats" on public.site_stats;
create policy "Public can read site stats"
  on public.site_stats for select
  using (true);

drop policy if exists "Authenticated can insert site stats" on public.site_stats;
create policy "Authenticated can insert site stats"
  on public.site_stats for insert
  to authenticated
  with check (true);

drop policy if exists "Authenticated can update site stats" on public.site_stats;
create policy "Authenticated can update site stats"
  on public.site_stats for update
  to authenticated
  using (true)
  with check (true);

drop policy if exists "Authenticated can delete site stats" on public.site_stats;
create policy "Authenticated can delete site stats"
  on public.site_stats for delete
  to authenticated
  using (true);

-- ── Contact messages ────────────────────────────────────────────────────────
-- Backs the /contact page. Rows are only ever written server-side (via
-- /api/contact using the service-role key), which also emails the admin
-- inbox and a confirmation to the sender through Resend — same pattern as
-- store orders. No public insert policy is needed for the same reason.
create table if not exists public.contact_messages (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  email        text not null,
  phone        text,
  subject      text,
  message      text not null,
  status       text not null default 'new', -- new | read | replied
  created_at   timestamptz not null default now()
);

alter table public.contact_messages enable row level security;

drop policy if exists "Authenticated can read contact messages" on public.contact_messages;
create policy "Authenticated can read contact messages"
  on public.contact_messages for select
  to authenticated
  using (true);

drop policy if exists "Authenticated can update contact messages" on public.contact_messages;
create policy "Authenticated can update contact messages"
  on public.contact_messages for update
  to authenticated
  using (true)
  with check (true);

drop policy if exists "Authenticated can delete contact messages" on public.contact_messages;
create policy "Authenticated can delete contact messages"
  on public.contact_messages for delete
  to authenticated
  using (true);

-- ── Booking requests ────────────────────────────────────────────────────────
-- Backs the /book-us page — promoters, artists, and private-event enquiries.
-- Same "written only by the API route" pattern as orders/contact.
create table if not exists public.booking_requests (
  id             uuid primary key default gen_random_uuid(),
  request_type   text not null default 'other', -- dj_booking | private_event | other
  name           text not null,
  email          text not null,
  phone          text,
  event_date     date,
  guest_count    integer,
  artist_name    text, -- selected from the current artists roster, dj_booking only
  message        text not null,
  status         text not null default 'new', -- new | contacted | confirmed | declined
  created_at     timestamptz not null default now()
);

alter table public.booking_requests enable row level security;

drop policy if exists "Authenticated can read booking requests" on public.booking_requests;
create policy "Authenticated can read booking requests"
  on public.booking_requests for select
  to authenticated
  using (true);

drop policy if exists "Authenticated can update booking requests" on public.booking_requests;
create policy "Authenticated can update booking requests"
  on public.booking_requests for update
  to authenticated
  using (true)
  with check (true);

drop policy if exists "Authenticated can delete booking requests" on public.booking_requests;
create policy "Authenticated can delete booking requests"
  on public.booking_requests for delete
  to authenticated
  using (true);

-- ── Lost & found reports ────────────────────────────────────────────────────
-- Backs the /lost-and-found page. A visitor who lost something at Krantas
-- files a report here; same "written only by the API route" pattern.
create table if not exists public.lost_found_reports (
  id                 uuid primary key default gen_random_uuid(),
  item_description   text not null,
  date_lost          date,
  location           text,
  name               text not null,
  email              text not null,
  phone              text,
  status             text not null default 'new', -- new | matched | returned | closed
  created_at         timestamptz not null default now()
);

alter table public.lost_found_reports enable row level security;

drop policy if exists "Authenticated can read lost found reports" on public.lost_found_reports;
create policy "Authenticated can read lost found reports"
  on public.lost_found_reports for select
  to authenticated
  using (true);

drop policy if exists "Authenticated can update lost found reports" on public.lost_found_reports;
create policy "Authenticated can update lost found reports"
  on public.lost_found_reports for update
  to authenticated
  using (true)
  with check (true);

drop policy if exists "Authenticated can delete lost found reports" on public.lost_found_reports;
create policy "Authenticated can delete lost found reports"
  on public.lost_found_reports for delete
  to authenticated
  using (true);
