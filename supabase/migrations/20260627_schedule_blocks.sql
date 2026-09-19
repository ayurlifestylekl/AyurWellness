-- ============================================================================
-- Schedule blocks & staff leave (Phase 2 — 2026-06-27). Idempotent.
-- Apply via Supabase SQL Editor.
--
-- A "block" makes a therapist (or the whole centre) unavailable for a window.
--   therapist_code NULL  → applies to ALL therapists (centre closed / holiday)
--   all_day = true       → the whole day(s); time-of-day ignored
--   recurrence           → 'none' | 'weekly' (same weekday) | 'monthly' (same day-of-month)
--   until_date           → recurrence stop (inclusive); NULL = anchor only / open-ended
-- ============================================================================

create table if not exists public.schedule_blocks (
  id          uuid primary key default gen_random_uuid(),
  therapist_code text,
  start_at    timestamptz not null,
  end_at      timestamptz not null,
  all_day     boolean not null default false,
  recurrence  text not null default 'none' check (recurrence in ('none','weekly','monthly')),
  until_date  date,
  reason      text,
  created_by  uuid,
  created_at  timestamptz not null default now()
);

create index if not exists schedule_blocks_therapist_idx on public.schedule_blocks(therapist_code);
create index if not exists schedule_blocks_start_idx on public.schedule_blocks(start_at);

-- Locked to the service role (all access is via server-side staff actions).
alter table public.schedule_blocks enable row level security;
