-- 20260516_phase1_dashboard.sql
-- Phase 1 dashboard completion: order cancellation, practitioner notes,
-- avatar storage, addresses, soft account deletion + PDPA export.

BEGIN;

-- 1. orders: add cancellation + practitioner note columns,
--    extend fulfillment_status to allow 'cancelled'.
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS cancelled_at        TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS cancel_reason       TEXT,
  ADD COLUMN IF NOT EXISTS practitioner_note   TEXT;

ALTER TABLE public.orders
  DROP CONSTRAINT IF EXISTS orders_fulfillment_status_check;
ALTER TABLE public.orders
  ADD CONSTRAINT orders_fulfillment_status_check
  CHECK (fulfillment_status IN ('processing','shipped','delivered','cancelled'));

-- 2. users: avatar, soft delete, deletion-request timestamp.
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS avatar_url            TEXT,
  ADD COLUMN IF NOT EXISTS deleted_at            TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deletion_requested_at TIMESTAMPTZ;

-- 3. addresses table.
CREATE TABLE IF NOT EXISTS public.addresses (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id  UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  label        TEXT NOT NULL,                       -- 'Home', 'Office', etc.
  recipient    TEXT NOT NULL,
  phone        TEXT NOT NULL,
  line1        TEXT NOT NULL,
  line2        TEXT,
  city         TEXT NOT NULL,
  state        TEXT NOT NULL,
  postcode     TEXT NOT NULL,
  country      TEXT NOT NULL DEFAULT 'Malaysia',
  is_default   BOOLEAN NOT NULL DEFAULT FALSE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_addresses_customer ON public.addresses(customer_id);

-- Only one default per customer.
CREATE UNIQUE INDEX IF NOT EXISTS uniq_default_address_per_customer
  ON public.addresses(customer_id) WHERE is_default;

ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "addresses_select_own" ON public.addresses
  FOR SELECT USING (auth.uid() = customer_id);
CREATE POLICY "addresses_insert_own" ON public.addresses
  FOR INSERT WITH CHECK (auth.uid() = customer_id);
CREATE POLICY "addresses_update_own" ON public.addresses
  FOR UPDATE USING (auth.uid() = customer_id);
CREATE POLICY "addresses_delete_own" ON public.addresses
  FOR DELETE USING (auth.uid() = customer_id);
CREATE POLICY "addresses_admin_all" ON public.addresses
  FOR ALL USING (public.is_admin());

-- 4. Storage bucket for avatars.
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Authenticated users can upload to their own folder (avatars/{auth.uid}/...).
CREATE POLICY "avatars_insert_own" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
CREATE POLICY "avatars_update_own" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
CREATE POLICY "avatars_delete_own" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
CREATE POLICY "avatars_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

COMMIT;
