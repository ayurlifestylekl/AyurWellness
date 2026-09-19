-- ============================================================================
-- Therapist assignment by code (2026-06-23 addendum). Idempotent.
-- Apply via Supabase SQL Editor.
-- ============================================================================

-- The therapist's roster code (e.g. NT02). Name + gender are still stored in
-- assigned_therapist_name / assigned_therapist_gender; the roster lives in code
-- (src/lib/staff/therapists.ts).
ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS assigned_therapist_code TEXT;

-- For therapist double-booking checks we need each appointment's length.
-- duration_mins already exists; index the therapist code for fast clash lookups.
CREATE INDEX IF NOT EXISTS appointments_therapist_code_idx
  ON public.appointments(assigned_therapist_code);
