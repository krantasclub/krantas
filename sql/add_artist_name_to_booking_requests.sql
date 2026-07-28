-- Adds an optional "which artist" field to booking requests, so the
-- /book-us form can offer a dropdown of the current roster instead of
-- free text. Run this in Supabase → SQL Editor.

alter table public.booking_requests
  add column if not exists artist_name text;
