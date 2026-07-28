-- Adds the homepage_content table, backing the scrolling strip below the
-- header and the text-only "statement" section on the homepage — both
-- editable from /admin/homepage.
-- Run this in Supabase → SQL Editor.

create table if not exists public.homepage_content (
  id                 int primary key default 1,
  marquee_text       text,
  statement_eyebrow  text,
  statement_heading  text,
  statement_body     text,
  updated_at         timestamptz not null default now(),
  constraint homepage_content_singleton check (id = 1)
);

insert into public.homepage_content (id) values (1) on conflict (id) do nothing;

alter table public.homepage_content enable row level security;

drop policy if exists "Public can read homepage content" on public.homepage_content;
create policy "Public can read homepage content"
  on public.homepage_content for select
  using (true);

drop policy if exists "Authenticated can update homepage content" on public.homepage_content;
create policy "Authenticated can update homepage content"
  on public.homepage_content for update
  to authenticated
  using (true)
  with check (true);
