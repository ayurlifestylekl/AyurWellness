-- ============================================================================
-- Booking & Consultation System — DB delta (2026-06-23). Idempotent.
-- Apply via Supabase SQL Editor.
-- ============================================================================

-- 1. Extend user roles -------------------------------------------------------
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE public.users
  ADD CONSTRAINT users_role_check
  CHECK (role IN ('admin','customer','sales_agent','doctor','front_desk'));

-- 2. Extend appointment status enum -----------------------------------------
ALTER TYPE public.appointment_status_enum ADD VALUE IF NOT EXISTS 'awaiting_payment';

-- 3. New appointment columns -------------------------------------------------
ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS treatment_id          UUID REFERENCES public.treatments(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS treatment_category_id TEXT REFERENCES public.treatment_categories(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS booking_kind          TEXT NOT NULL DEFAULT 'treatment'
                              CHECK (booking_kind IN ('treatment','consultation')),
  ADD COLUMN IF NOT EXISTS requested_datetime    TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS requested_datetime_alt TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS is_guest              BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS patient_name          TEXT,
  ADD COLUMN IF NOT EXISTS patient_phone         TEXT,
  ADD COLUMN IF NOT EXISTS patient_email         TEXT,
  ADD COLUMN IF NOT EXISTS patient_gender        TEXT CHECK (patient_gender IN ('male','female')),
  ADD COLUMN IF NOT EXISTS assigned_therapist_name   TEXT,
  ADD COLUMN IF NOT EXISTS assigned_therapist_gender TEXT CHECK (assigned_therapist_gender IN ('male','female')),
  ADD COLUMN IF NOT EXISTS parent_consultation_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS treatment_unlocked    BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS consultation_outcome  TEXT,
  ADD COLUMN IF NOT EXISTS payable_amount_rm     DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS payment_status        TEXT NOT NULL DEFAULT 'unpaid'
                              CHECK (payment_status IN ('unpaid','pending','paid','failed','refunded')),
  ADD COLUMN IF NOT EXISTS payment_provider      TEXT,
  ADD COLUMN IF NOT EXISTS payment_bill_id       TEXT,
  ADD COLUMN IF NOT EXISTS payment_url           TEXT,
  ADD COLUMN IF NOT EXISTS paid_at               TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS approved_by           UUID REFERENCES public.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS approved_at           TIMESTAMPTZ;
-- NOTE: health intake reuses the existing `pre_visit_form JSONB` column.
-- gender_requirement (existing) = required therapist gender = patient_gender by policy.

CREATE INDEX IF NOT EXISTS appointments_payment_status_idx ON public.appointments(payment_status);
CREATE INDEX IF NOT EXISTS appointments_kind_idx ON public.appointments(booking_kind);
CREATE INDEX IF NOT EXISTS appointments_treatment_idx ON public.appointments(treatment_id);

-- 4. Role helper functions ---------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_doctor() RETURNS BOOLEAN
  LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN RETURN EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'doctor'); END; $$;

CREATE OR REPLACE FUNCTION public.is_front_desk() RETURNS BOOLEAN
  LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN RETURN EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'front_desk'); END; $$;

CREATE OR REPLACE FUNCTION public.is_staff() RETURNS BOOLEAN
  LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN RETURN EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid()
                     AND role IN ('admin','doctor','front_desk')); END; $$;

-- 5. RLS — staff may read appointments (writes go via service role) ----------
DROP POLICY IF EXISTS "appointments: staff read" ON public.appointments;
CREATE POLICY "appointments: staff read"
  ON public.appointments FOR SELECT
  USING (public.is_staff());
-- existing customer + admin policies remain.
