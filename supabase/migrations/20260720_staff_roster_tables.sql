-- ================================================================
-- Staff Roster Tables
--
-- Moves therapist and Vaidya rosters from hardcoded arrays in
-- src/lib/staff/therapists.ts to database tables for self-service
-- admin management.
-- ================================================================

-- 1. Therapists table -------------------------------------------------
CREATE TABLE public.therapists (
  code TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  gender TEXT NOT NULL CHECK (gender IN ('male', 'female')),
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.therapists IS 'Massage therapist roster. Managed via /console/roster admin UI.';
COMMENT ON COLUMN public.therapists.code IS 'Unique therapist code (e.g. NT02, DP03). Immutable after creation.';
COMMENT ON COLUMN public.therapists.gender IS 'Therapist gender for same-gender matching. Must be male or female.';
COMMENT ON COLUMN public.therapists.active IS 'If false, therapist is deactivated and excluded from new bookings. Never hard-delete — appointments reference codes as text.';

-- 2. Vaidyas table ----------------------------------------------------
CREATE TABLE public.vaidyas (
  code TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  public_facing BOOLEAN NOT NULL DEFAULT true,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.vaidyas IS 'Vaidya (doctor) roster. Managed via /console/roster admin UI.';
COMMENT ON COLUMN public.vaidyas.code IS 'Unique Vaidya code (e.g. VAIDYA, LYMAT). Immutable after creation.';
COMMENT ON COLUMN public.vaidyas.public_facing IS 'If false, Vaidya is selectable by staff internally but never shown in customer-facing consultation booking.';
COMMENT ON COLUMN public.vaidyas.active IS 'If false, Vaidya is deactivated and excluded from new bookings. Never hard-delete — appointments reference codes as text.';

-- 3. Indexes ----------------------------------------------------------
CREATE INDEX therapists_active_gender_idx ON public.therapists(active, gender) WHERE active = true;
CREATE INDEX vaidyas_active_idx ON public.vaidyas(active) WHERE active = true;

COMMENT ON INDEX therapists_active_gender_idx IS 'Optimizes therapistsForGender() queries which filter by active + gender.';
COMMENT ON INDEX vaidyas_active_idx IS 'Optimizes active Vaidya lookups.';

-- 4. Seed current roster ----------------------------------------------
-- Backfill with existing 6 therapists from src/lib/staff/therapists.ts
INSERT INTO public.therapists (code, name, gender, active) VALUES
  ('NT02', 'Nithin', 'male', true),
  ('DP03', 'Deepak', 'male', true),
  ('BN08', 'Bintu', 'male', true),
  ('SM05', 'Sreeja Mol', 'female', true),
  ('CR08', 'Seeta', 'female', true),
  ('AS12', 'Asha', 'female', true);

-- Backfill with existing 2 Vaidyas
INSERT INTO public.vaidyas (code, name, public_facing, active) VALUES
  ('VAIDYA', 'Vaidya Akhil', true, true),
  ('LYMAT', 'Vaidya LYMAT', false, true);
