-- =====================================================================
-- Marketplace channels: external sales + marketplace order intake (2026-05-21)
-- =====================================================================
-- Adds:
--   * 'shopee' / 'tiktok_shop' / 'lazada' / 'instagram' / 'whatsapp' values
--     to order_channel_enum
--   * external_sales table — affiliate commissions for sales they did
--     on external platforms (no order in our system, just commission credit)
--   * marketplace_orders table — staging table where staff key in Shopee /
--     TikTok orders for admin approval. On approve, a real `orders` row
--     is created.
--
-- Safe to re-run. Apply via Supabase SQL Editor.
-- Note: ALTER TYPE ADD VALUE works in Postgres 12+ outside a transaction —
-- run each statement individually if your SQL editor wraps everything in tx.
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1. Extend order_channel_enum with marketplace values
-- ---------------------------------------------------------------------
ALTER TYPE public.order_channel_enum ADD VALUE IF NOT EXISTS 'shopee';
ALTER TYPE public.order_channel_enum ADD VALUE IF NOT EXISTS 'tiktok_shop';
ALTER TYPE public.order_channel_enum ADD VALUE IF NOT EXISTS 'lazada';
ALTER TYPE public.order_channel_enum ADD VALUE IF NOT EXISTS 'instagram';
ALTER TYPE public.order_channel_enum ADD VALUE IF NOT EXISTS 'whatsapp';


-- ---------------------------------------------------------------------
-- 2. external_sales — commission entries for affiliate-reported sales
-- ---------------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE public.external_channel_enum AS ENUM (
    'tiktok_shop', 'shopee', 'lazada', 'instagram', 'whatsapp', 'other'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.external_sales (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id              UUID NOT NULL REFERENCES public.sales_agents(id) ON DELETE RESTRICT,
  channel               public.external_channel_enum NOT NULL,
  gross_amount_rm       DECIMAL(10,2) NOT NULL CHECK (gross_amount_rm > 0),
  rate_percent          DECIMAL(5,2)  NOT NULL,
  commission_rm         DECIMAL(10,2) NOT NULL,
  customer_name         TEXT,
  customer_contact      TEXT,
  marketplace_order_ref TEXT,
  proof_url             TEXT,
  notes                 TEXT,
  logged_by_admin_id    UUID REFERENCES public.users(id),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS external_sales_agent_idx
  ON public.external_sales(agent_id, created_at DESC);

CREATE INDEX IF NOT EXISTS external_sales_channel_idx
  ON public.external_sales(channel, created_at DESC);

ALTER TABLE public.external_sales ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin manages external sales" ON public.external_sales;
CREATE POLICY "Admin manages external sales" ON public.external_sales
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Agent reads own external sales" ON public.external_sales;
CREATE POLICY "Agent reads own external sales" ON public.external_sales
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.sales_agents a
      WHERE a.id = external_sales.agent_id AND a.user_id = auth.uid()
    )
  );

-- Trigger: when an external_sale row is inserted, mirror as a commission entry
-- so it shows up in the payouts queue alongside web-order commissions.
CREATE OR REPLACE FUNCTION public.external_sale_to_commission()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
BEGIN
  -- We need a fake order_id to satisfy the FK, but agent_commissions.order_id
  -- references orders. Approach: skip the trigger for external sales and let
  -- the payouts queue join from BOTH tables. Simpler than fake orders.
  --
  -- The payouts query (see payouts-queries.ts) will UNION agent_commissions
  -- with external_sales to compute totals. No commission row needed here.
  RETURN NEW;
END $$;
-- Note: we intentionally do NOT create a trigger that inserts into
-- agent_commissions, because that table's order_id FK requires a real order.
-- Instead, the payouts query reads BOTH tables and sums.


-- ---------------------------------------------------------------------
-- 3. marketplace_orders — staging table for Shopee / TikTok intake
-- ---------------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE public.marketplace_order_status_enum AS ENUM (
    'pending', 'approved', 'rejected'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.marketplace_orders (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel                  public.external_channel_enum NOT NULL,
  marketplace_order_ref    TEXT,
  customer_name            TEXT NOT NULL,
  customer_phone           TEXT,
  customer_email           TEXT,
  items                    JSONB NOT NULL DEFAULT '[]'::jsonb,
  subtotal_rm              DECIMAL(10,2) NOT NULL DEFAULT 0,
  shipping_rm              DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_amount_rm          DECIMAL(10,2) NOT NULL,
  referral_agent_id        UUID REFERENCES public.sales_agents(id) ON DELETE SET NULL,
  status                   public.marketplace_order_status_enum NOT NULL DEFAULT 'pending',
  notes                    TEXT,
  rejection_reason         TEXT,
  entered_by_admin_id      UUID REFERENCES public.users(id),
  approved_by_admin_id     UUID REFERENCES public.users(id),
  created_order_id         UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  approved_at              TIMESTAMPTZ,
  rejected_at              TIMESTAMPTZ,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS marketplace_orders_status_idx
  ON public.marketplace_orders(status, created_at DESC);

CREATE INDEX IF NOT EXISTS marketplace_orders_channel_idx
  ON public.marketplace_orders(channel, created_at DESC);

ALTER TABLE public.marketplace_orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin manages marketplace orders" ON public.marketplace_orders;
CREATE POLICY "Admin manages marketplace orders" ON public.marketplace_orders
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
