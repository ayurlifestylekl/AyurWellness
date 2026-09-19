-- =====================================================================
-- Products: opt-in flag for the wholesale shop (2026-05-23)
-- =====================================================================
-- Adds wholesale_enabled so admin can opt products in/out of the agent
-- wholesale shop. Existing products with a wholesale_price_rm get
-- auto-enabled (since the previous migration already backfilled prices).
--
-- Safe to re-run.
-- =====================================================================

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS wholesale_enabled BOOLEAN NOT NULL DEFAULT false;

-- Backfill: if a product has a wholesale price and is active, enable it.
UPDATE public.products
SET wholesale_enabled = true
WHERE wholesale_enabled = false
  AND wholesale_price_rm IS NOT NULL
  AND status = 'active';

CREATE INDEX IF NOT EXISTS products_wholesale_enabled_idx
  ON public.products(wholesale_enabled)
  WHERE wholesale_enabled = true;
