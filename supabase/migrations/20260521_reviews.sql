-- =====================================================================
-- Product reviews with admin moderation (2026-05-21)
-- =====================================================================
-- Customer submits review on product page (must have a paid order for that
-- product), admin approves/rejects, approved reviews show on storefront.
--
-- Safe to re-run. Apply via Supabase SQL Editor.
-- =====================================================================

DO $$ BEGIN
  CREATE TYPE public.review_status_enum AS ENUM (
    'pending', 'approved', 'rejected'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.reviews (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id        UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  customer_id       UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  order_id          UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  rating            INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title             TEXT,
  body              TEXT NOT NULL CHECK (length(body) BETWEEN 10 AND 2000),
  status            public.review_status_enum NOT NULL DEFAULT 'pending',
  rejection_reason  TEXT,
  approved_by_admin_id UUID REFERENCES public.users(id),
  approved_at       TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- One review per customer per product
CREATE UNIQUE INDEX IF NOT EXISTS reviews_product_customer_uq
  ON public.reviews(product_id, customer_id);

CREATE INDEX IF NOT EXISTS reviews_product_status_idx
  ON public.reviews(product_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS reviews_status_idx
  ON public.reviews(status, created_at DESC);

CREATE INDEX IF NOT EXISTS reviews_customer_idx
  ON public.reviews(customer_id, created_at DESC);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Public reads only approved reviews
DROP POLICY IF EXISTS "Public reads approved reviews" ON public.reviews;
CREATE POLICY "Public reads approved reviews" ON public.reviews
  FOR SELECT USING (status = 'approved');

-- Customers see their own (any status). public.users.id == auth.uid().
DROP POLICY IF EXISTS "Customer reads own reviews" ON public.reviews;
CREATE POLICY "Customer reads own reviews" ON public.reviews
  FOR SELECT USING (customer_id = auth.uid());

-- Customers can insert reviews for themselves (status must start as 'pending')
DROP POLICY IF EXISTS "Customer submits own reviews" ON public.reviews;
CREATE POLICY "Customer submits own reviews" ON public.reviews
  FOR INSERT WITH CHECK (
    customer_id = auth.uid()
    AND status = 'pending'
  );

-- Admin manages everything
DROP POLICY IF EXISTS "Admin manages reviews" ON public.reviews;
CREATE POLICY "Admin manages reviews" ON public.reviews
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- touch updated_at
CREATE OR REPLACE FUNCTION public.touch_reviews()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS reviews_touch ON public.reviews;
CREATE TRIGGER reviews_touch
  BEFORE UPDATE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.touch_reviews();
