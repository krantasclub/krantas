-- ============================================================================
-- Krantas — missing tables migration
-- Run this in Supabase → SQL Editor to create:
--   - contact_messages   (backs /contact)
--   - booking_requests   (backs /book-us)
--   - lost_found_reports (backs /lost-and-found)
--
-- These are written only by their API routes (via the service-role key),
-- same pattern as store orders — so no public insert policy is needed.
-- After running, Settings → API → "Reload schema cache" if the errors
-- persist for more than ~60 seconds.
-- ============================================================================

-- ── Contact messages ────────────────────────────────────────────────────────
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
create table if not exists public.booking_requests (
  id             uuid primary key default gen_random_uuid(),
  request_type   text not null default 'other', -- dj_booking | private_event | other
  name           text not null,
  email          text not null,
  phone          text,
  event_date     date,
  guest_count    integer,
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
