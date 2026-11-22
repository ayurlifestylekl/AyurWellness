-- Front desk day: opening and closing the counter, and the waiting room.
-- (Package signing is added when this centre starts selling packages.)
--
-- Server-only like the other staff tables: RLS on with no policies, so only
-- the service role (staff pages, after their role check) can read or write.
-- Safe to re-run. Run after 20261123_counter_checkout.sql.

-- 1. Day open / close -------------------------------------------------------------
-- One row per day: the cash float the counter opened with, and at closing the
-- cash counted, what the system expected and any difference explained in notes.
CREATE TABLE IF NOT EXISTS public.counter_days (
  day               DATE PRIMARY KEY,
  opened_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  opened_by         UUID REFERENCES public.users(id) ON DELETE SET NULL,
  opening_float_rm  NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (opening_float_rm >= 0),
  closed_at         TIMESTAMPTZ,
  closed_by         UUID REFERENCES public.users(id) ON DELETE SET NULL,
  counted_cash_rm   NUMERIC(10,2) CHECK (counted_cash_rm IS NULL OR counted_cash_rm >= 0),
  expected_cash_rm  NUMERIC(10,2),
  -- Totals as they were at closing, so the report doesn't change afterwards.
  summary           JSONB,
  notes             TEXT CHECK (notes IS NULL OR char_length(notes) <= 1000)
);

-- 2. Waiting room ---------------------------------------------------------------------
-- When a treatment actually started (checked_in_at and completed_at exist already).
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ;

-- 3. Lock down ----------------------------------------------------------------------
ALTER TABLE public.counter_days ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.counter_days FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.counter_days TO service_role;
