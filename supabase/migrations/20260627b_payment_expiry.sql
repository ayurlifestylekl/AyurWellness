-- ============================================================================
-- Payment-link expiry (Phase 2 — 2026-06-27). Idempotent.
-- Apply via Supabase SQL Editor.
--
-- When a treatment is approved it moves to 'awaiting_payment' with a 15-hour
-- payment window. A scheduled job releases the slot if it isn't paid in time
-- and emails a reminder beforehand.
-- ============================================================================

alter table public.appointments
  add column if not exists payment_expires_at timestamptz;

alter table public.appointments
  add column if not exists payment_reminded boolean not null default false;

create index if not exists appointments_payment_expiry_idx
  on public.appointments(status, payment_expires_at);
