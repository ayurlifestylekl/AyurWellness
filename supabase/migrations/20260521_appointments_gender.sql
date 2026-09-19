-- =====================================================================
-- Appointments — gender match requirement (2026-05-21, addendum)
-- =====================================================================
-- Adds an optional gender requirement to appointments so the clinic's
-- gender-segregated therapy policy (men-to-men, ladies-to-ladies) is
-- captured in the data and validated at creation time.
--
-- Safe to re-run. Apply via Supabase SQL Editor.
-- =====================================================================

DO $$ BEGIN
  CREATE TYPE public.gender_requirement_enum AS ENUM (
    'any', 'men_only', 'ladies_only'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS gender_requirement
    public.gender_requirement_enum NOT NULL DEFAULT 'any';
