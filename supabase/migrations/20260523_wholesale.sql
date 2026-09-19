-- =====================================================================
-- Wholesale: products.wholesale_price + wholesale_orders + items
-- (2026-05-23)
-- =====================================================================
-- Lets reseller-capable agents buy products at wholesale price. On admin
-- mark-paid, stock auto-deducts via stock_movements (type='sold').
--
-- Safe to re-run. Apply via Supabase SQL Editor.
-- =====================================================================

-- 1. Product wholesale price ------------------------------------------
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS wholesale_price_rm DECIMAL(10,2);

-- Convenience: backfill 60% of retail price for any product missing it
UPDATE public.products
SET wholesale_price_rm = ROUND(price_rm * 0.60, 2)
WHERE wholesale_price_rm IS NULL
  AND price_rm IS NOT NULL;

-- 2. wholesale_orders --------------------------------------------------
DO $$ BEGIN
  CREATE TYPE public.wholesale_order_status_enum AS ENUM (
    'pending_payment',  -- agent placed order, awaiting payment proof
    'paid',             -- admin confirmed payment; stock deducted
    'fulfilling',       -- admin packing
    'shipped',          -- admin handed to courier
    'delivered',        -- agent received
    'cancelled'         -- before payment OR refunded
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.wholesale_orders (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number          TEXT UNIQUE NOT NULL,
  agent_id              UUID NOT NULL REFERENCES public.sales_agents(id) ON DELETE RESTRICT,
  status                public.wholesale_order_status_enum NOT NULL DEFAULT 'pending_payment',
  subtotal_rm           DECIMAL(10,2) NOT NULL CHECK (subtotal_rm >= 0),
  shipping_rm           DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (shipping_rm >= 0),
  total_rm              DECIMAL(10,2) NOT NULL CHECK (total_rm >= 0),
  shipping_address      TEXT NOT NULL,
  shipping_postcode     TEXT NOT NULL,
  shipping_state        TEXT NOT NULL,
  agent_notes           TEXT,
  admin_notes           TEXT,
  payment_method        TEXT,
  payment_proof_url     TEXT,
  paid_at               TIMESTAMPTZ,
  paid_by_admin_id      UUID REFERENCES public.users(id),
  tracking_number       TEXT,
  courier               TEXT,
  shipped_at            TIMESTAMPTZ,
  shipped_by_admin_id   UUID REFERENCES public.users(id),
  delivered_at          TIMESTAMPTZ,
  cancelled_at          TIMESTAMPTZ,
  cancel_reason         TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS wholesale_orders_agent_idx
  ON public.wholesale_orders(agent_id, created_at DESC);

CREATE INDEX IF NOT EXISTS wholesale_orders_status_idx
  ON public.wholesale_orders(status, created_at DESC);

ALTER TABLE public.wholesale_orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin manages wholesale orders" ON public.wholesale_orders;
CREATE POLICY "Admin manages wholesale orders" ON public.wholesale_orders
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Agent reads own wholesale orders" ON public.wholesale_orders;
CREATE POLICY "Agent reads own wholesale orders" ON public.wholesale_orders
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.sales_agents a
      WHERE a.id = wholesale_orders.agent_id
        AND a.user_id = auth.uid()
        AND a.status = 'active'
    )
  );

DROP POLICY IF EXISTS "Agent creates own wholesale orders" ON public.wholesale_orders;
CREATE POLICY "Agent creates own wholesale orders" ON public.wholesale_orders
  FOR INSERT WITH CHECK (
    status = 'pending_payment' AND
    EXISTS (
      SELECT 1 FROM public.sales_agents a
      WHERE a.id = wholesale_orders.agent_id
        AND a.user_id = auth.uid()
        AND a.status = 'active'
        AND a.can_wholesale = true
    )
  );

-- 3. wholesale_order_items --------------------------------------------
CREATE TABLE IF NOT EXISTS public.wholesale_order_items (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wholesale_order_id    UUID NOT NULL REFERENCES public.wholesale_orders(id) ON DELETE CASCADE,
  product_id            UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  product_name          TEXT NOT NULL,    -- snapshot at order time
  product_sku           TEXT,             -- snapshot
  quantity              INT NOT NULL CHECK (quantity > 0),
  unit_price_rm         DECIMAL(10,2) NOT NULL CHECK (unit_price_rm >= 0),
  line_total_rm         DECIMAL(10,2) NOT NULL CHECK (line_total_rm >= 0),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS wholesale_order_items_order_idx
  ON public.wholesale_order_items(wholesale_order_id);

ALTER TABLE public.wholesale_order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin manages wholesale order items" ON public.wholesale_order_items;
CREATE POLICY "Admin manages wholesale order items" ON public.wholesale_order_items
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Agent reads own wholesale items" ON public.wholesale_order_items;
CREATE POLICY "Agent reads own wholesale items" ON public.wholesale_order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.wholesale_orders wo
      JOIN public.sales_agents a ON a.id = wo.agent_id
      WHERE wo.id = wholesale_order_items.wholesale_order_id
        AND a.user_id = auth.uid()
        AND a.status = 'active'
    )
  );

DROP POLICY IF EXISTS "Agent inserts own wholesale items" ON public.wholesale_order_items;
CREATE POLICY "Agent inserts own wholesale items" ON public.wholesale_order_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.wholesale_orders wo
      JOIN public.sales_agents a ON a.id = wo.agent_id
      WHERE wo.id = wholesale_order_items.wholesale_order_id
        AND a.user_id = auth.uid()
        AND wo.status = 'pending_payment'
        AND a.can_wholesale = true
    )
  );

-- 4. Order numbering: WO-YYYY-NNNN ------------------------------------
CREATE SEQUENCE IF NOT EXISTS public.wholesale_order_number_seq START 1;

CREATE OR REPLACE FUNCTION public.next_wholesale_order_number()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  v_n  INT;
  v_yr INT := EXTRACT(YEAR FROM now())::INT;
BEGIN
  v_n := nextval('public.wholesale_order_number_seq');
  RETURN 'WO-' || v_yr || '-' || lpad(v_n::TEXT, 4, '0');
END $$;

-- 5. updated_at touch ---------------------------------------------------
CREATE OR REPLACE FUNCTION public.touch_wholesale_orders()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS wholesale_orders_touch ON public.wholesale_orders;
CREATE TRIGGER wholesale_orders_touch
  BEFORE UPDATE ON public.wholesale_orders
  FOR EACH ROW EXECUTE FUNCTION public.touch_wholesale_orders();

-- 6. Stock deduction on mark-paid -------------------------------------
-- When status flips to 'paid', insert stock_movements rows (type='sold')
-- for each line item. The existing product-stock trigger will update
-- products.stock_qty automatically.
CREATE OR REPLACE FUNCTION public.deduct_stock_on_wholesale_paid()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_item RECORD;
BEGIN
  IF NEW.status = 'paid' AND OLD.status IS DISTINCT FROM 'paid' THEN
    FOR v_item IN
      SELECT product_id, quantity FROM public.wholesale_order_items
      WHERE wholesale_order_id = NEW.id
    LOOP
      INSERT INTO public.stock_movements (
        product_id, movement_type, quantity_delta, reason,
        actor_id
      ) VALUES (
        v_item.product_id, 'sold', -v_item.quantity,
        'Wholesale order ' || NEW.order_number || ' paid',
        NEW.paid_by_admin_id
      );
    END LOOP;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS wholesale_orders_deduct_stock ON public.wholesale_orders;
CREATE TRIGGER wholesale_orders_deduct_stock
  AFTER UPDATE OF status ON public.wholesale_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.deduct_stock_on_wholesale_paid();

-- 7. Stock restore on cancel-after-paid -------------------------------
CREATE OR REPLACE FUNCTION public.restore_stock_on_wholesale_cancel()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_item RECORD;
BEGIN
  IF NEW.status = 'cancelled'
     AND OLD.status IN ('paid', 'fulfilling', 'shipped') THEN
    FOR v_item IN
      SELECT product_id, quantity FROM public.wholesale_order_items
      WHERE wholesale_order_id = NEW.id
    LOOP
      INSERT INTO public.stock_movements (
        product_id, movement_type, quantity_delta, reason
      ) VALUES (
        v_item.product_id, 'returned', v_item.quantity,
        'Wholesale order ' || NEW.order_number || ' cancelled'
      );
    END LOOP;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS wholesale_orders_restore_stock ON public.wholesale_orders;
CREATE TRIGGER wholesale_orders_restore_stock
  AFTER UPDATE OF status ON public.wholesale_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.restore_stock_on_wholesale_cancel();
