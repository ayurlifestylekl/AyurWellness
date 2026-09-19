-- ============================================================================
-- public.users — extend with profile-page fields.
--
--   • date_of_birth, language               — display + greetings
--   • height_cm, weight_kg                  — body composition (optional)
--   • allergies, current_medications,
--     medical_conditions                    — health intake (PDPA-flagged)
--   • *_opt_in flags                        — communication preferences
--
-- Existing RLS on public.users (self read / self update / admin full) already
-- covers reads + writes for the new columns. No new policies needed.
-- ============================================================================

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS date_of_birth DATE,
  ADD COLUMN IF NOT EXISTS language TEXT
    CHECK (language IN ('en','ms')) DEFAULT 'en',
  ADD COLUMN IF NOT EXISTS height_cm NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS weight_kg NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS allergies TEXT,
  ADD COLUMN IF NOT EXISTS current_medications TEXT,
  ADD COLUMN IF NOT EXISTS medical_conditions TEXT,
  ADD COLUMN IF NOT EXISTS marketing_opt_in BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS whatsapp_reminders_opt_in BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS email_reminders_opt_in BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS treatment_followups_opt_in BOOLEAN NOT NULL DEFAULT TRUE;

-- Range checks on body composition. Defensive — the form also clamps before
-- submit.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'users_height_range'
  ) THEN
    ALTER TABLE public.users ADD CONSTRAINT users_height_range
      CHECK (height_cm IS NULL OR (height_cm >= 50 AND height_cm <= 250));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'users_weight_range'
  ) THEN
    ALTER TABLE public.users ADD CONSTRAINT users_weight_range
      CHECK (weight_kg IS NULL OR (weight_kg >= 20 AND weight_kg <= 300));
  END IF;
END$$;

-- Sanity check on date_of_birth — between 1900 and today.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'users_dob_range'
  ) THEN
    ALTER TABLE public.users ADD CONSTRAINT users_dob_range
      CHECK (date_of_birth IS NULL OR
             (date_of_birth >= '1900-01-01' AND date_of_birth <= CURRENT_DATE));
  END IF;
END$$;
