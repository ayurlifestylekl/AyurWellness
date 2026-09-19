-- =====================================================================
-- Admin Customers (CRM) Module — DB Delta (2026-05-20)
-- =====================================================================
-- Adds 4 small columns to public.users for:
--   * admin-defined tags (segments)
--   * staff-only internal notes
--   * customer blocking (with reason + timestamp)
--
-- All voucher functionality reuses existing `promos` + `customer_promos`
-- tables (already present from 20260516_promos.sql).
--
-- Safe to re-run. Apply via Supabase SQL Editor.
-- =====================================================================

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS tags            TEXT[],
  ADD COLUMN IF NOT EXISTS internal_notes  TEXT,
  ADD COLUMN IF NOT EXISTS blocked_at      TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS blocked_reason  TEXT;

-- Helpful index for tag filtering
CREATE INDEX IF NOT EXISTS users_tags_idx ON public.users USING GIN (tags);

-- Helpful index for birthday-list queries
CREATE INDEX IF NOT EXISTS users_dob_month_idx
  ON public.users (EXTRACT(MONTH FROM date_of_birth))
  WHERE date_of_birth IS NOT NULL;
