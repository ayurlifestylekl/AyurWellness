-- ============================================================================
-- Customer announcements (2026-07-05). Idempotent. Apply via Supabase SQL Editor.
--
-- Drives the public site banner. Two kinds:
--   'closure' → "We're closed on <date> for <message>." A linked schedule_block
--               (all-therapist, all-day) also stops bookings on those dates.
--   'message' → free-text notice (holiday hours, promo, etc). Does not touch
--               bookings.
-- An announcement is live while the row exists; remove it to take it down.
-- Closures auto-hide from the banner once their end date has passed.
-- ============================================================================

create table if not exists public.announcements (
  id          uuid primary key default gen_random_uuid(),
  kind        text not null default 'message' check (kind in ('closure','message')),
  message     text not null,
  start_date  date,
  end_date    date,
  -- The centre-closure block this announcement created (closures only), so
  -- removing the announcement also reopens bookings.
  block_id    uuid references public.schedule_blocks(id) on delete set null,
  created_by  uuid,
  created_at  timestamptz not null default now()
);

create index if not exists announcements_created_idx on public.announcements(created_at desc);

-- Locked to the service role (all access is via server-side staff actions and
-- the service-role banner read), matching schedule_blocks.
alter table public.announcements enable row level security;
