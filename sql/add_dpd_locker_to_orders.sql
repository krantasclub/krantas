-- Adds DPD parcel-locker delivery support to the Krantas store.
-- Run this in Supabase → SQL Editor.

alter table public.orders
  add column if not exists delivery_method text not null default 'address', -- pickup | address | locker
  add column if not exists locker_id text; -- DPD locker id, only set when delivery_method = 'locker'
