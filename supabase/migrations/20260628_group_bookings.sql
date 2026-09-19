-- ============================================================================
-- Group / multi-guest bookings (Phase 2 — 2026-06-28). Idempotent.
-- Apply via Supabase SQL Editor.
--
-- A group booking creates one appointment row PER guest, linked by group_id.
-- Each guest is assigned its own same-gender therapist; payment is combined
-- (one bill) and confirms the whole group at once.
-- ============================================================================

alter table public.appointments
  add column if not exists group_id uuid;

alter table public.appointments
  add column if not exists guest_age int;

create index if not exists appointments_group_idx on public.appointments(group_id);
