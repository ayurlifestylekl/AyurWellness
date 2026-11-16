-- Patient records that staff add by hand (Console → Patients → Add patient),
-- so a patient can exist before their first booking and keep details that a
-- booking doesn't hold (date of birth, address, standing medical history).
--
-- Bookings still carry their own copy of name/phone/email/gender. The website
-- links a record to a patient's bookings by phone + first name (see
-- src/lib/staff/patients.ts), the same way it groups bookings into patients.
--
-- Server-only: RLS is on with no policies, so only the service role (used by
-- staff pages after their role check) can read or write. Safe to re-run.

CREATE TABLE IF NOT EXISTS public.patients (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name          TEXT NOT NULL CHECK (char_length(full_name) BETWEEN 1 AND 120),
  phone              TEXT NOT NULL CHECK (char_length(phone) BETWEEN 7 AND 30),
  email              TEXT CHECK (email IS NULL OR char_length(email) <= 254),
  gender             TEXT NOT NULL CHECK (gender IN ('female', 'male')),
  date_of_birth      DATE,
  address            TEXT CHECK (address IS NULL OR char_length(address) <= 300),
  conditions         TEXT CHECK (conditions IS NULL OR char_length(conditions) <= 1000),
  allergies          TEXT CHECK (allergies IS NULL OR char_length(allergies) <= 1000),
  medications        TEXT CHECK (medications IS NULL OR char_length(medications) <= 1000),
  notes              TEXT CHECK (notes IS NULL OR char_length(notes) <= 2000),
  created_by_staff_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  updated_by_staff_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS patients_phone_idx ON public.patients (phone);
CREATE INDEX IF NOT EXISTS patients_name_idx ON public.patients (lower(full_name));

ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.patients FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.patients TO service_role;
