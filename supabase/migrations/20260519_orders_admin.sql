-- =====================================================================
-- Admin Orders Module — DB Delta (2026-05-19)
-- =====================================================================
-- Adds: payment_status_enum (refunded), fulfillment_status_enum (paid,
-- packing, completed), order_channel_enum, payment_method_enum, 16 new
-- columns on orders, order_events audit table, refunds table, invoice
-- number sequence + helper, status-change trigger.
--
-- Safe to re-run. Apply via Supabase SQL Editor.
-- Author: Admin Orders sub-project (2026-05-19).
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1. New enums
-- ---------------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE public.payment_status_enum AS ENUM ('pending', 'paid', 'failed', 'refunded');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.fulfillment_status_enum AS ENUM (
    'pending', 'processing', 'packing', 'shipped', 'delivered', 'completed', 'cancelled'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.order_channel_enum AS ENUM ('web', 'manual', 'walk_in', 'phone');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.payment_method_enum AS ENUM (
    'billplz', 'cod', 'bank_transfer', 'fpx', 'cash', 'card'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;


-- ---------------------------------------------------------------------
-- 2. Backfill nulls before enum type swap
-- ---------------------------------------------------------------------
UPDATE public.orders SET fulfillment_status = 'processing' WHERE fulfillment_status IS NULL;
UPDATE public.orders SET payment_status     = 'pending'    WHERE payment_status IS NULL;


-- ---------------------------------------------------------------------
-- 3. Drop legacy check constraints + defaults, convert status types,
--    then re-add enum defaults. Postgres can't auto-cast TEXT defaults
--    to a new enum type, so we drop defaults first.
-- ---------------------------------------------------------------------
ALTER TABLE public.orders
  DROP CONSTRAINT IF EXISTS orders_payment_status_check,
  DROP CONSTRAINT IF EXISTS orders_fulfillment_status_check;

-- Drop existing defaults (no-op if already absent)
ALTER TABLE public.orders ALTER COLUMN payment_status     DROP DEFAULT;
ALTER TABLE public.orders ALTER COLUMN fulfillment_status DROP DEFAULT;

-- Only convert if columns aren't already the enum type (idempotent)
DO $$
BEGIN
  IF (SELECT data_type FROM information_schema.columns
       WHERE table_schema='public' AND table_name='orders' AND column_name='payment_status') <> 'USER-DEFINED' THEN
    ALTER TABLE public.orders
      ALTER COLUMN payment_status TYPE public.payment_status_enum
        USING payment_status::public.payment_status_enum;
  END IF;

  IF (SELECT data_type FROM information_schema.columns
       WHERE table_schema='public' AND table_name='orders' AND column_name='fulfillment_status') <> 'USER-DEFINED' THEN
    ALTER TABLE public.orders
      ALTER COLUMN fulfillment_status TYPE public.fulfillment_status_enum
        USING fulfillment_status::public.fulfillment_status_enum;
  END IF;
END $$;

-- Re-add the defaults using the new enum values
ALTER TABLE public.orders
  ALTER COLUMN payment_status     SET DEFAULT 'pending'::public.payment_status_enum,
  ALTER COLUMN fulfillment_status SET DEFAULT 'processing'::public.fulfillment_status_enum;


-- ---------------------------------------------------------------------
-- 4. New columns on orders
-- ---------------------------------------------------------------------
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS channel                public.order_channel_enum NOT NULL DEFAULT 'web',
  ADD COLUMN IF NOT EXISTS payment_method         public.payment_method_enum,
  ADD COLUMN IF NOT EXISTS subtotal_rm            DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS tax_amount_rm          DECIMAL(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS shipping_amount_rm     DECIMAL(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS discount_amount_rm     DECIMAL(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS discount_code          TEXT,
  ADD COLUMN IF NOT EXISTS billing_address_id     UUID REFERENCES public.addresses(id),
  ADD COLUMN IF NOT EXISTS shipping_address_id    UUID REFERENCES public.addresses(id),
  ADD COLUMN IF NOT EXISTS invoice_number         TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS paid_at                TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS shipped_at             TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS delivered_at           TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS completed_at           TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS internal_notes         TEXT,
  ADD COLUMN IF NOT EXISTS created_by_admin_id    UUID REFERENCES public.users(id);


-- ---------------------------------------------------------------------
-- 5. order_events audit table
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.order_events (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id            UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  actor_id            UUID REFERENCES public.users(id) ON DELETE SET NULL,
  event_type          TEXT NOT NULL,
  from_status         TEXT,
  to_status           TEXT,
  payload             JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_customer_visible BOOLEAN NOT NULL DEFAULT true,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS order_events_order_id_idx
  ON public.order_events(order_id, created_at DESC);

ALTER TABLE public.order_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Customer reads own visible events" ON public.order_events;
CREATE POLICY "Customer reads own visible events" ON public.order_events
  FOR SELECT USING (
    is_customer_visible AND
    EXISTS (SELECT 1 FROM public.orders o
            WHERE o.id = order_events.order_id AND o.customer_id = auth.uid())
  );

DROP POLICY IF EXISTS "Admin manages events" ON public.order_events;
CREATE POLICY "Admin manages events" ON public.order_events
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());


-- ---------------------------------------------------------------------
-- 6. refunds table
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.refunds (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id             UUID NOT NULL REFERENCES public.orders(id) ON DELETE RESTRICT,
  amount_rm            DECIMAL(10,2) NOT NULL CHECK (amount_rm > 0),
  reason               TEXT NOT NULL,
  refund_method        public.payment_method_enum NOT NULL,
  gateway_reference    TEXT,
  notes                TEXT,
  created_by_admin_id  UUID NOT NULL REFERENCES public.users(id),
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS refunds_order_id_idx ON public.refunds(order_id);
ALTER TABLE public.refunds ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Customer reads own refunds" ON public.refunds;
CREATE POLICY "Customer reads own refunds" ON public.refunds
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.orders o
            WHERE o.id = refunds.order_id AND o.customer_id = auth.uid())
  );

DROP POLICY IF EXISTS "Admin manages refunds" ON public.refunds;
CREATE POLICY "Admin manages refunds" ON public.refunds
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());


-- ---------------------------------------------------------------------
-- 7. Invoice number sequence + helper
-- ---------------------------------------------------------------------
CREATE SEQUENCE IF NOT EXISTS public.invoice_number_seq START 1;

CREATE OR REPLACE FUNCTION public.next_invoice_number()
RETURNS TEXT LANGUAGE plpgsql AS $$
BEGIN
  RETURN 'INV-' || to_char(now(), 'YYYY')
         || '-' || LPAD(nextval('public.invoice_number_seq')::TEXT, 5, '0');
END $$;


-- ---------------------------------------------------------------------
-- 8. Trigger: log status changes into order_events
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.log_order_status_change()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
BEGIN
  IF (TG_OP = 'UPDATE') THEN
    IF NEW.fulfillment_status IS DISTINCT FROM OLD.fulfillment_status THEN
      INSERT INTO public.order_events(order_id, actor_id, event_type, from_status, to_status)
      VALUES (NEW.id, auth.uid(), 'status_change',
              OLD.fulfillment_status::TEXT, NEW.fulfillment_status::TEXT);
    END IF;
    IF NEW.payment_status IS DISTINCT FROM OLD.payment_status THEN
      INSERT INTO public.order_events(order_id, actor_id, event_type, from_status, to_status, payload)
      VALUES (NEW.id, auth.uid(), 'payment_status_change',
              OLD.payment_status::TEXT, NEW.payment_status::TEXT,
              jsonb_build_object('amount_rm', NEW.total_amount_rm));
    END IF;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS orders_audit_status_change ON public.orders;
CREATE TRIGGER orders_audit_status_change
  AFTER UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.log_order_status_change();
