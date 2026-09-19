-- =====================================================================
-- Customer Login: Phone OTP support (2026-05-15)
-- =====================================================================
-- Adds the schema flexibility needed for SMS-OTP signups:
--   • Make public.users.email nullable (phone-only signups have no email)
--   • Replace strict UNIQUE on email with a partial unique-when-set index
--   • Add partial unique-when-set index on phone_number
--   • Update handle_new_user trigger to populate phone_number from
--     either auth.users.phone (SMS-OTP signup) or raw_user_meta_data
--
-- Safe to re-run. Apply via Supabase SQL Editor or `psql`.
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1. users.email becomes nullable + partial unique-when-set
-- ---------------------------------------------------------------------
ALTER TABLE public.users ALTER COLUMN email DROP NOT NULL;

-- Drop the old strict UNIQUE constraint (rejected NULL/empty rows differently
-- and prevents multiple phone-only signups from existing). Replace with a
-- partial unique index that only enforces uniqueness when email is set.
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_email_key;

CREATE UNIQUE INDEX IF NOT EXISTS users_email_unique_when_set
  ON public.users (email)
  WHERE email IS NOT NULL AND email <> '';


-- ---------------------------------------------------------------------
-- 2. phone_number partial unique-when-set
-- ---------------------------------------------------------------------
-- Ensures a phone number can only be tied to one customer account.
CREATE UNIQUE INDEX IF NOT EXISTS users_phone_unique_when_set
  ON public.users (phone_number)
  WHERE phone_number IS NOT NULL AND phone_number <> '';


-- ---------------------------------------------------------------------
-- 3. handle_new_user trigger — handle phone-only signups
-- ---------------------------------------------------------------------
-- Previous version (foundation migration) read only email + metadata.
-- This version also falls back to NEW.phone (set by Supabase on SMS-OTP
-- signups) so phone-only customers get a complete public.users row.
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, phone_number, full_name)
  VALUES (
    NEW.id,
    NULLIF(NEW.email, ''),
    COALESCE(
      NULLIF(NEW.raw_user_meta_data->>'phone_number', ''),
      NEW.phone
    ),
    NULLIF(NEW.raw_user_meta_data->>'full_name', '')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;


-- =====================================================================
-- End of phone-auth migration. Verify with:
--   \d public.users                       -- email column should be nullable
--   SELECT indexname FROM pg_indexes WHERE tablename = 'users';
--   SELECT prosrc FROM pg_proc WHERE proname = 'handle_new_user';
-- =====================================================================
