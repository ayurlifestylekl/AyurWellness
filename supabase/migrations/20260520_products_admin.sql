-- =====================================================================
-- Admin Products + Inventory Module — DB Delta (2026-05-20)
-- =====================================================================
-- Adds: product_status_enum, dosha_enum, stock_movement_type_enum,
-- ~17 new columns on products, stock_movements ledger, product_bundle_items
-- link table, product-images storage bucket, stock auto-apply trigger,
-- products updated_at trigger.
--
-- Safe to re-run. Apply via Supabase SQL Editor.
-- Author: Admin Products + Inventory sub-project (2026-05-20).
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1. New enums
-- ---------------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE public.product_status_enum AS ENUM ('active', 'draft', 'archived');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.dosha_enum AS ENUM ('vata', 'pitta', 'kapha', 'tridosha', 'none');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.stock_movement_type_enum AS ENUM (
    'received', 'sold', 'returned', 'write_off', 'recount_adjust', 'reserved', 'unreserved'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;


-- ---------------------------------------------------------------------
-- 2. New columns on products
-- ---------------------------------------------------------------------
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS slug                  TEXT,
  ADD COLUMN IF NOT EXISTS short_description     TEXT,
  ADD COLUMN IF NOT EXISTS ingredients           TEXT,
  ADD COLUMN IF NOT EXISTS dosage_instructions   TEXT,
  ADD COLUMN IF NOT EXISTS contraindications     TEXT,
  ADD COLUMN IF NOT EXISTS certifications        TEXT,
  ADD COLUMN IF NOT EXISTS dosha_indication      public.dosha_enum DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS sale_price_rm         DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS sale_starts_at        TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS sale_ends_at          TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS member_price_rm       DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS low_stock_threshold   INT,
  ADD COLUMN IF NOT EXISTS allow_backorder       BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS expiry_date           DATE,
  ADD COLUMN IF NOT EXISTS tags                  TEXT[],
  ADD COLUMN IF NOT EXISTS status                public.product_status_enum NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS meta_title            TEXT,
  ADD COLUMN IF NOT EXISTS meta_description      TEXT,
  ADD COLUMN IF NOT EXISTS og_image_url          TEXT,
  ADD COLUMN IF NOT EXISTS weight_grams          INT,
  ADD COLUMN IF NOT EXISTS image_urls            TEXT[],
  ADD COLUMN IF NOT EXISTS featured              BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS created_by_admin_id   UUID REFERENCES public.users(id),
  ADD COLUMN IF NOT EXISTS updated_at            TIMESTAMPTZ NOT NULL DEFAULT now();


-- ---------------------------------------------------------------------
-- 3. Backfill slug for existing rows (from name)
-- ---------------------------------------------------------------------
UPDATE public.products
SET slug = lower(regexp_replace(name, '[^a-zA-Z0-9]+', '-', 'g'))
WHERE slug IS NULL;

-- Trim leading/trailing hyphens left over from edge characters
UPDATE public.products
SET slug = regexp_replace(slug, '^-+|-+$', '', 'g')
WHERE slug ~ '^-' OR slug ~ '-$';

-- Unique constraint on slug now that data is normalised
CREATE UNIQUE INDEX IF NOT EXISTS products_slug_unique ON public.products(slug);


-- ---------------------------------------------------------------------
-- 4. stock_movements ledger
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.stock_movements (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id          UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  movement_type       public.stock_movement_type_enum NOT NULL,
  quantity_delta      INT NOT NULL,
  reason              TEXT,
  reference_order_id  UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  actor_id            UUID REFERENCES public.users(id) ON DELETE SET NULL,
  cost_price_rm       DECIMAL(10,2),
  expiry_date         DATE,
  notes               TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS stock_movements_product_id_idx
  ON public.stock_movements(product_id, created_at DESC);

ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin manages stock movements" ON public.stock_movements;
CREATE POLICY "Admin manages stock movements" ON public.stock_movements
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());


-- ---------------------------------------------------------------------
-- 5. product_bundle_items link table
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.product_bundle_items (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bundle_id       UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  product_id      UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  quantity        INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (bundle_id, product_id)
);

CREATE INDEX IF NOT EXISTS product_bundle_items_bundle_id_idx
  ON public.product_bundle_items(bundle_id);

ALTER TABLE public.product_bundle_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public reads bundle items" ON public.product_bundle_items;
CREATE POLICY "Public reads bundle items" ON public.product_bundle_items
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin manages bundle items" ON public.product_bundle_items;
CREATE POLICY "Admin manages bundle items" ON public.product_bundle_items
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());


-- ---------------------------------------------------------------------
-- 6. Storage bucket: product-images (public read, admin write)
-- ---------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public read product images" ON storage.objects;
CREATE POLICY "Public read product images" ON storage.objects
  FOR SELECT USING (bucket_id = 'product-images');

DROP POLICY IF EXISTS "Admin writes product images" ON storage.objects;
CREATE POLICY "Admin writes product images" ON storage.objects
  FOR ALL USING (bucket_id = 'product-images' AND public.is_admin())
  WITH CHECK (bucket_id = 'product-images' AND public.is_admin());


-- ---------------------------------------------------------------------
-- 7. Trigger: stock_movements row → adjusts products.stock_qty
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.apply_stock_movement()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
BEGIN
  UPDATE public.products
  SET stock_qty = stock_qty + NEW.quantity_delta,
      updated_at = now()
  WHERE id = NEW.product_id;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS stock_movements_apply ON public.stock_movements;
CREATE TRIGGER stock_movements_apply
  AFTER INSERT ON public.stock_movements
  FOR EACH ROW EXECUTE FUNCTION public.apply_stock_movement();


-- ---------------------------------------------------------------------
-- 8. Trigger: bump products.updated_at on UPDATE
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.products_touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS products_touch_updated_at ON public.products;
CREATE TRIGGER products_touch_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.products_touch_updated_at();
