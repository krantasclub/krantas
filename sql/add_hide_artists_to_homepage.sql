-- Adds a site-wide "hide artists" switch to the existing homepage_content
-- table (see sql/add_homepage_content.sql) — editable from /admin/homepage.
-- When true: the Artists link disappears from the header nav, /artists
-- redirects home, the homepage artist line-up is skipped, and the artist
-- picker on the Book us form is left off.
-- Run this in Supabase → SQL Editor.

alter table public.homepage_content
  add column if not exists hide_artists boolean not null default false;
