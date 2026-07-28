-- Adds admin-editable homepage hero background video fields to the existing
-- homepage_content table (see sql/add_homepage_content.sql) — editable from
-- /admin/homepage. Falls back to the bundled /hero.webm + /hero.mp4 footage
-- whenever hero_video_url is null/empty.
-- Run this in Supabase → SQL Editor.

alter table public.homepage_content
  add column if not exists hero_video_url text,
  add column if not exists hero_video_type text,
  add column if not exists hero_poster_url text;
