-- =====================================================================
-- Product Orders + Checkout Module — DB Delta (2026-09-02)
-- =====================================================================
-- Adds: product order tables, shipping address table, cancellation/refund
-- request tables, status history, order numbering, and stock reservation
-- helpers tied to the new product_orders table.
--
-- Safe to re-run. Apply via Supabase SQL Editor.
-- =====================================================================


-- -----------------------------------------------------------------
-- 1. Enums
-- -----------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE public.product_order_status_enum AS ENUM (
    'awaiting_payment', 'paid', 'processing', 'shipped', 'delivered',
    'cancelled', 'refunded'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.product_payment_status_enum AS ENUM (
    'pending', 'paid', 'failed', 'refunded'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.product_cancel_status_enum AS ENUM (
    'requested', 'processing', 'approved', 'rejected'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.product_refund_status_enum AS ENUM (
    'requested', 'claimed', 'pending', 'confirmed', 'failed', 'exception', 'rejected'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;


-- -----------------------------------------------------------------
-- 2. Product order address table
-- -----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.product_order_addresses (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  email         TEXT NOT NULL,
  phone         TEXT,
  line_1        TEXT NOT NULL,
  line_2        TEXT,
  city          TEXT NOT NULL,
  postcode      TEXT NOT NULL,
  state         TEXT NOT NULL,
  country       TEXT NOT NULL DEFAULT 'Malaysia',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.product_order_addresses IS
  'Shipping addresses captured at checkout time for product orders.';


-- -----------------------------------------------------------------
-- 3. Shipping zones
-- -----------------------------------------------------------------
-- Add hitpay to the existing payment-method enum if it hasn't been added yet.
ALTER TYPE public.payment_method_enum ADD VALUE IF NOT EXISTS 'hitpay';

CREATE TABLE IF NOT EXISTS public.shipping_zones (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name             TEXT NOT NULL,
  country_code     TEXT NOT NULL DEFAULT '*',
  base_rate_rm     DECIMAL(10,2) NOT NULL CHECK (base_rate_rm >= 0),
  per_kg_rate_rm   DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (per_kg_rate_rm >= 0),
  free_threshold_rm DECIMAL(10,2) DEFAULT NULL,
  sort_order       INTEGER NOT NULL DEFAULT 0,
  is_active        BOOLEAN NOT NULL DEFAULT true,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.shipping_zones IS
  'Flat shipping rate rules per country/region for product orders.';

CREATE UNIQUE INDEX IF NOT EXISTS shipping_zones_country_code_active_idx
  ON public.shipping_zones(country_code) WHERE is_active = true;

-- Seed default overseas shipping zones. Use ON CONFLICT so the file stays re-runnable.
INSERT INTO public.shipping_zones (name, country_code, base_rate_rm, free_threshold_rm, sort_order)
VALUES
  ('Malaysia', 'MY', 10.00, 150.00, 1),
  ('ASEAN', '*-ASEAN', 35.00, 250.00, 2),
  ('Asia Pacific', '*-APAC', 55.00, 300.00, 3),
  ('Rest of World', '*', 80.00, 400.00, 4)
ON CONFLICT (country_code) WHERE is_active = true DO UPDATE SET
  name = EXCLUDED.name,
  base_rate_rm = EXCLUDED.base_rate_rm,
  free_threshold_rm = EXCLUDED.free_threshold_rm,
  sort_order = EXCLUDED.sort_order;

-- Trigger to keep updated_at current on shipping_zones.
CREATE OR REPLACE FUNCTION public.touch_shipping_zone_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS shipping_zones_touch_updated_at ON public.shipping_zones;
CREATE TRIGGER shipping_zones_touch_updated_at
  BEFORE UPDATE ON public.shipping_zones
  FOR EACH ROW EXECUTE FUNCTION public.touch_shipping_zone_updated_at();


-- -----------------------------------------------------------------
-- 4. Product orders
-- -----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.product_orders (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number            TEXT UNIQUE NOT NULL,
  idempotency_key         TEXT UNIQUE,
  customer_id             UUID REFERENCES public.users(id) ON DELETE SET NULL,
  email                   TEXT NOT NULL,
  phone                   TEXT,
  status                  public.product_order_status_enum NOT NULL DEFAULT 'awaiting_payment',
  payment_status          public.product_payment_status_enum NOT NULL DEFAULT 'pending',
  payment_method          public.payment_method_enum NOT NULL DEFAULT 'billplz',
  subtotal_rm             DECIMAL(10,2) NOT NULL CHECK (subtotal_rm >= 0),
  shipping_rm             DECIMAL(10,2) NOT NULL DEFAULT 10.00 CHECK (shipping_rm >= 0),
  member_discount_rm      DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (member_discount_rm >= 0),
  total_rm                DECIMAL(10,2) NOT NULL CHECK (total_rm >= 0),
  shipping_address_id     UUID NOT NULL REFERENCES public.product_order_addresses(id) ON DELETE RESTRICT,
  billplz_bill_id         TEXT,
  billplz_collection_id   TEXT,
  payment_url             TEXT,
  paid_at                 TIMESTAMPTZ,
  shipped_at              TIMESTAMPTZ,
  delivered_at            TIMESTAMPTZ,
  cancelled_at            TIMESTAMPTZ,
  cancel_reason           TEXT,
  payment_expires_at      TIMESTAMPTZ,
  tracking_number         TEXT,
  courier                 TEXT,
  internal_notes          TEXT,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS product_orders_customer_id_idx
  ON public.product_orders(customer_id, created_at DESC);

CREATE INDEX IF NOT EXISTS product_orders_status_idx
  ON public.product_orders(status, created_at DESC);

CREATE INDEX IF NOT EXISTS product_orders_payment_status_idx
  ON public.product_orders(payment_status, created_at DESC);

CREATE INDEX IF NOT EXISTS product_orders_email_idx
  ON public.product_orders(email);

COMMENT ON TABLE public.product_orders IS
  'Customer-facing product orders created from the public storefront checkout.';

ALTER TABLE public.product_orders
  ADD COLUMN IF NOT EXISTS payment_provider TEXT,
  ADD COLUMN IF NOT EXISTS provider_bill_id TEXT,
  ADD COLUMN IF NOT EXISTS provider_collection_id TEXT,
  ADD COLUMN IF NOT EXISTS shipping_zone_id UUID REFERENCES public.shipping_zones(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS shipping_country_code TEXT,
  ADD COLUMN IF NOT EXISTS total_weight_grams INTEGER NOT NULL DEFAULT 0 CHECK (total_weight_grams >= 0);

CREATE INDEX IF NOT EXISTS product_orders_provider_bill_idx
  ON public.product_orders(provider_bill_id);


-- -----------------------------------------------------------------
-- 4. Product order items
-- -----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.product_order_items (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_order_id  UUID NOT NULL REFERENCES public.product_orders(id) ON DELETE CASCADE,
  product_id        UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  product_name      TEXT NOT NULL,
  product_sku       TEXT,
  quantity          INT NOT NULL CHECK (quantity > 0),
  unit_price_rm     DECIMAL(10,2) NOT NULL CHECK (unit_price_rm >= 0),
  line_total_rm     DECIMAL(10,2) NOT NULL CHECK (line_total_rm >= 0),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS product_order_items_order_idx
  ON public.product_order_items(product_order_id);


-- -----------------------------------------------------------------
-- 5. Product order status history
-- -----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.product_order_status_history (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_order_id  UUID NOT NULL REFERENCES public.product_orders(id) ON DELETE CASCADE,
  actor_id          UUID REFERENCES public.users(id) ON DELETE SET NULL,
  event_type        TEXT NOT NULL,
  from_status       TEXT,
  to_status         TEXT,
  payload           JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_customer_visible BOOLEAN NOT NULL DEFAULT true,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS product_order_status_history_order_idx
  ON public.product_order_status_history(product_order_id, created_at DESC);


-- -----------------------------------------------------------------
-- 6. Product cancellations
-- -----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.product_cancellations (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_order_id  UUID NOT NULL REFERENCES public.product_orders(id) ON DELETE CASCADE,
  reason            TEXT NOT NULL,
  status            public.product_cancel_status_enum NOT NULL DEFAULT 'requested',
  requested_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  decided_at        TIMESTAMPTZ,
  staff_reason      TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS product_cancellations_order_idx
  ON public.product_cancellations(product_order_id);

CREATE INDEX IF NOT EXISTS product_cancellations_status_idx
  ON public.product_cancellations(status, requested_at DESC);

-- At most one cancellation per order can be in flight at a time. Without
-- this, a double-submitted cancellation request creates two 'requested'
-- rows, and two staff approving them close together could both reach the
-- non-idempotent restore_stock_for_product_order RPC for the same order.
CREATE UNIQUE INDEX IF NOT EXISTS product_cancellations_one_active_per_order
  ON public.product_cancellations(product_order_id)
  WHERE status IN ('requested', 'processing');


-- -----------------------------------------------------------------
-- 7. Product refund requests
-- -----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.product_refund_requests (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_order_id      UUID NOT NULL REFERENCES public.product_orders(id) ON DELETE CASCADE,
  product_cancellation_id UUID REFERENCES public.product_cancellations(id) ON DELETE SET NULL,
  amount_rm             DECIMAL(10,2) NOT NULL CHECK (amount_rm > 0),
  status                public.product_refund_status_enum NOT NULL DEFAULT 'requested',
  customer_bank_name    TEXT,
  customer_bank_account TEXT,
  customer_reason       TEXT,
  staff_reason          TEXT,
  provider_refund_id    TEXT,
  provider_refund_status TEXT,
  bank_code             TEXT,
  bank_account_number   TEXT,
  bank_account_holder_name TEXT,
  bank_account_last4    TEXT,
  idempotency_key       TEXT UNIQUE,
  failure_reason        TEXT,
  requested_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  confirmed_at          TIMESTAMPTZ,
  decided_at            TIMESTAMPTZ,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS product_refund_requests_order_idx
  ON public.product_refund_requests(product_order_id);

CREATE INDEX IF NOT EXISTS product_refund_requests_status_idx
  ON public.product_refund_requests(status, requested_at DESC);

CREATE INDEX IF NOT EXISTS product_refund_requests_pending_idx
  ON public.product_refund_requests(status, requested_at) WHERE status = 'pending';


-- -----------------------------------------------------------------
-- 8. Order number sequence + helper
-- -----------------------------------------------------------------
CREATE SEQUENCE IF NOT EXISTS public.product_order_number_seq START 1;

CREATE OR REPLACE FUNCTION public.next_product_order_number()
RETURNS TEXT LANGUAGE plpgsql AS $$
BEGIN
  RETURN 'ORD-' || to_char(now(), 'YYYY')
         || '-' || LPAD(nextval('public.product_order_number_seq')::TEXT, 5, '0');
END $$;


-- -----------------------------------------------------------------
-- 9. Updated_at touch
-- -----------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.touch_product_orders()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS product_orders_touch ON public.product_orders;
CREATE TRIGGER product_orders_touch
  BEFORE UPDATE ON public.product_orders
  FOR EACH ROW EXECUTE FUNCTION public.touch_product_orders();


-- -----------------------------------------------------------------
-- 10. Status change audit trigger
-- -----------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.log_product_order_status_change()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
BEGIN
  IF (TG_OP = 'UPDATE') THEN
    IF NEW.status IS DISTINCT FROM OLD.status THEN
      INSERT INTO public.product_order_status_history(
        product_order_id, actor_id, event_type, from_status, to_status
      ) VALUES (
        NEW.id, auth.uid(), 'status_change',
        OLD.status::TEXT, NEW.status::TEXT
      );
    END IF;

    IF NEW.payment_status IS DISTINCT FROM OLD.payment_status THEN
      INSERT INTO public.product_order_status_history(
        product_order_id, actor_id, event_type, from_status, to_status, payload
      ) VALUES (
        NEW.id, auth.uid(), 'payment_status_change',
        OLD.payment_status::TEXT, NEW.payment_status::TEXT,
        jsonb_build_object('amount_rm', NEW.total_rm)
      );
    END IF;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS product_orders_audit_status_change ON public.product_orders;
CREATE TRIGGER product_orders_audit_status_change
  AFTER UPDATE ON public.product_orders
  FOR EACH ROW EXECUTE FUNCTION public.log_product_order_status_change();


-- -----------------------------------------------------------------
-- 11. Link stock_movements to product_orders
-- -----------------------------------------------------------------
ALTER TABLE public.stock_movements
  ADD COLUMN IF NOT EXISTS reference_product_order_id UUID
    REFERENCES public.product_orders(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS stock_movements_product_order_idx
  ON public.stock_movements(reference_product_order_id, created_at DESC);


-- -----------------------------------------------------------------
-- 12. Stock reservation helpers
-- -----------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.reserve_stock_for_product_order(
  p_order_id UUID,
  p_items JSONB
)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
DECLARE
  v_item RECORD;
  v_product RECORD;
BEGIN
  FOR v_item IN
    SELECT *
    FROM jsonb_to_recordset(p_items) AS x(
      product_id UUID,
      quantity INT,
      allow_backorder BOOLEAN
    )
  LOOP
    SELECT stock_qty, allow_backorder
    INTO v_product
    FROM public.products
    WHERE id = v_item.product_id
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Product % not found', v_item.product_id;
    END IF;

    IF NOT COALESCE(v_item.allow_backorder, v_product.allow_backorder, false)
       AND v_product.stock_qty < v_item.quantity THEN
      RAISE EXCEPTION 'Insufficient stock for product % (need %, have %)',
        v_item.product_id, v_item.quantity, v_product.stock_qty;
    END IF;

    INSERT INTO public.stock_movements(
      product_id,
      movement_type,
      quantity_delta,
      reason,
      reference_product_order_id
    ) VALUES (
      v_item.product_id,
      'reserved',
      -v_item.quantity,
      'Reserved for order ' || p_order_id,
      p_order_id
    );
  END LOOP;

  RETURN true;
END $$;


CREATE OR REPLACE FUNCTION public.release_stock_for_product_order(p_order_id UUID)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
DECLARE
  v_item RECORD;
BEGIN
  FOR v_item IN
    SELECT product_id, ABS(quantity_delta) AS qty
    FROM public.stock_movements
    WHERE movement_type = 'reserved'
      AND reference_product_order_id = p_order_id
  LOOP
    INSERT INTO public.stock_movements(
      product_id, movement_type, quantity_delta, reason,
      reference_product_order_id
    ) VALUES (
      v_item.product_id, 'unreserved', v_item.qty,
      'Released reservation for order ' || p_order_id,
      p_order_id
    );
  END LOOP;
END $$;


CREATE OR REPLACE FUNCTION public.finalize_stock_for_product_order(p_order_id UUID)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
BEGIN
  UPDATE public.stock_movements
  SET movement_type = 'sold',
      reason = 'Sold for order ' || p_order_id
  WHERE movement_type = 'reserved'
    AND reference_product_order_id = p_order_id;
END $$;


CREATE OR REPLACE FUNCTION public.restore_stock_for_product_order(
  p_order_id UUID,
  p_reason TEXT DEFAULT 'Order cancelled/refunded'
)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
DECLARE
  v_item RECORD;
BEGIN
  FOR v_item IN
    SELECT product_id, ABS(quantity_delta) AS qty
    FROM public.stock_movements
    WHERE movement_type = 'sold'
      AND reference_product_order_id = p_order_id
  LOOP
    INSERT INTO public.stock_movements(
      product_id, movement_type, quantity_delta, reason,
      reference_product_order_id
    ) VALUES (
      v_item.product_id, 'returned', v_item.qty,
      p_reason || ' — order ' || p_order_id,
      p_order_id
    );
  END LOOP;
END $$;


CREATE OR REPLACE FUNCTION public.sweep_expired_product_orders(p_timeout INTERVAL DEFAULT INTERVAL '24 hours')
RETURNS TABLE (order_id UUID, order_number TEXT) LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
DECLARE
  v_order RECORD;
BEGIN
  FOR v_order IN
    SELECT id, order_number
    FROM public.product_orders
    WHERE status = 'awaiting_payment'
      AND payment_expires_at IS NOT NULL
      AND payment_expires_at < now()
    FOR UPDATE
  LOOP
    PERFORM public.release_stock_for_product_order(v_order.id);

    UPDATE public.product_orders
    SET status = 'cancelled',
        payment_status = 'failed',
        cancelled_at = now(),
        cancel_reason = 'Payment deadline expired'
    WHERE id = v_order.id;

    order_id := v_order.id;
    order_number := v_order.order_number;
    RETURN NEXT;
  END LOOP;
END $$;


-- -----------------------------------------------------------------
-- 13. RLS policies
-- -----------------------------------------------------------------
ALTER TABLE public.product_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_order_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_order_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_cancellations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_refund_requests ENABLE ROW LEVEL SECURITY;

-- Admin full access
DROP POLICY IF EXISTS "Admin manages product orders" ON public.product_orders;
CREATE POLICY "Admin manages product orders" ON public.product_orders
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admin manages product order items" ON public.product_order_items;
CREATE POLICY "Admin manages product order items" ON public.product_order_items
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admin manages product order addresses" ON public.product_order_addresses;
CREATE POLICY "Admin manages product order addresses" ON public.product_order_addresses
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admin manages product order status history" ON public.product_order_status_history;
CREATE POLICY "Admin manages product order status history" ON public.product_order_status_history
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admin manages product cancellations" ON public.product_cancellations;
CREATE POLICY "Admin manages product cancellations" ON public.product_cancellations
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admin manages product refund requests" ON public.product_refund_requests;
CREATE POLICY "Admin manages product refund requests" ON public.product_refund_requests
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Customers read their own rows
DROP POLICY IF EXISTS "Customer reads own product orders" ON public.product_orders;
CREATE POLICY "Customer reads own product orders" ON public.product_orders
  FOR SELECT USING (
    customer_id = auth.uid() OR email = auth.email()
  );

DROP POLICY IF EXISTS "Customer reads own product order items" ON public.product_order_items;
CREATE POLICY "Customer reads own product order items" ON public.product_order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.product_orders o
      WHERE o.id = product_order_items.product_order_id
        AND (o.customer_id = auth.uid() OR o.email = auth.email())
    )
  );

DROP POLICY IF EXISTS "Customer reads own product order addresses" ON public.product_order_addresses;
CREATE POLICY "Customer reads own product order addresses" ON public.product_order_addresses
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.product_orders o
      WHERE o.shipping_address_id = product_order_addresses.id
        AND (o.customer_id = auth.uid() OR o.email = auth.email())
    )
  );

DROP POLICY IF EXISTS "Customer reads own product order history" ON public.product_order_status_history;
CREATE POLICY "Customer reads own product order history" ON public.product_order_status_history
  FOR SELECT USING (
    is_customer_visible AND
    EXISTS (
      SELECT 1 FROM public.product_orders o
      WHERE o.id = product_order_status_history.product_order_id
        AND (o.customer_id = auth.uid() OR o.email = auth.email())
    )
  );

DROP POLICY IF EXISTS "Customer reads own product cancellations" ON public.product_cancellations;
CREATE POLICY "Customer reads own product cancellations" ON public.product_cancellations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.product_orders o
      WHERE o.id = product_cancellations.product_order_id
        AND (o.customer_id = auth.uid() OR o.email = auth.email())
    )
  );

DROP POLICY IF EXISTS "Customer reads own product refund requests" ON public.product_refund_requests;
CREATE POLICY "Customer reads own product refund requests" ON public.product_refund_requests
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.product_orders o
      WHERE o.id = product_refund_requests.product_order_id
        AND (o.customer_id = auth.uid() OR o.email = auth.email())
    )
  );

-- ------------------------------------------------------------------
-- 14. Public read access for the storefront catalog
-- ------------------------------------------------------------------
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public reads active products" ON public.products;
CREATE POLICY "Public reads active products" ON public.products
  FOR SELECT USING (status = 'active');
