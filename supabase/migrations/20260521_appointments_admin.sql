-- =====================================================================
-- Admin Appointments / Clinic Module — DB Delta (2026-05-21)
-- =====================================================================
-- Widens the appointment status enum and adds columns needed for the
-- admin workflow: check-in tracking, cancellation reasons, internal +
-- clinical notes, rescheduling lineage, room, pre-visit form data.
--
-- The clinical_notes column is added now but its admin UI is deferred —
-- vaidya can write SQL access in the meantime; full SOAP UI ships in
-- Phase 2 after PDPA review.
--
-- Safe to re-run. Apply via Supabase SQL Editor.
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1. Widen status enum
-- ---------------------------------------------------------------------
-- Existing values: 'scheduled', 'completed', 'cancelled'
-- New values needed: 'pending', 'confirmed', 'checked_in', 'in_progress',
--   'no_show', 'rescheduled'
-- The status column is currently TEXT with a check constraint. We swap
-- to a real enum so future code is type-safe.

DO $$ BEGIN
  CREATE TYPE public.appointment_status_enum AS ENUM (
    'pending', 'scheduled', 'confirmed', 'checked_in', 'in_progress',
    'completed', 'cancelled', 'no_show', 'rescheduled'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;


-- ---------------------------------------------------------------------
-- 2. Drop old check constraint + default, swap column type, restore default
-- ---------------------------------------------------------------------
ALTER TABLE public.appointments
  DROP CONSTRAINT IF EXISTS appointments_status_check;

ALTER TABLE public.appointments ALTER COLUMN status DROP DEFAULT;

DO $$
BEGIN
  IF (SELECT data_type FROM information_schema.columns
       WHERE table_schema='public' AND table_name='appointments' AND column_name='status') <> 'USER-DEFINED' THEN
    ALTER TABLE public.appointments
      ALTER COLUMN status TYPE public.appointment_status_enum
        USING status::public.appointment_status_enum;
  END IF;
END $$;

ALTER TABLE public.appointments
  ALTER COLUMN status SET DEFAULT 'scheduled'::public.appointment_status_enum;


-- ---------------------------------------------------------------------
-- 3. New columns
-- ---------------------------------------------------------------------
ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS rescheduled_from_id     UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS checked_in_at           TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS completed_at            TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS cancelled_at            TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS cancellation_reason     TEXT,
  ADD COLUMN IF NOT EXISTS internal_notes          TEXT,
  ADD COLUMN IF NOT EXISTS clinical_notes          TEXT,  -- vaidya-only, UI deferred
  ADD COLUMN IF NOT EXISTS room                    TEXT,
  ADD COLUMN IF NOT EXISTS pre_visit_form          JSONB,
  ADD COLUMN IF NOT EXISTS advance_payment_status  TEXT DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS created_by_admin_id     UUID REFERENCES public.users(id),
  ADD COLUMN IF NOT EXISTS updated_at              TIMESTAMPTZ NOT NULL DEFAULT now();


-- ---------------------------------------------------------------------
-- 4. Trigger: bump updated_at on UPDATE
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.appointments_touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS appointments_touch_updated_at ON public.appointments;
CREATE TRIGGER appointments_touch_updated_at
  BEFORE UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.appointments_touch_updated_at();


-- ---------------------------------------------------------------------
-- 5. Helpful indexes
-- ---------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS appointments_status_idx ON public.appointments(status);
CREATE INDEX IF NOT EXISTS appointments_date_idx ON public.appointments(appointment_date_time);
CREATE INDEX IF NOT EXISTS appointments_customer_idx ON public.appointments(customer_id);


-- ---------------------------------------------------------------------
-- 6. RLS — vaidya-only access to clinical_notes
-- ---------------------------------------------------------------------
-- For now keep existing RLS (admin reads all, customer reads own).
-- When clinical_notes UI ships, we'll add a column-level policy or
-- migrate to a separate consultation_notes table with row-level vaidya
-- scoping.
