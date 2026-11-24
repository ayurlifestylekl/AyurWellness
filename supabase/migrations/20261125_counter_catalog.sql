-- Ayurvedic Wellness Centre only. Run after 20261123_counter_checkout.sql.
--
-- 1. Billing items staff manage themselves (front desk, doctor, admin):
--    extra services, products and packages, each can be hidden or removed.
--    Website therapies and shop products can be hidden from checkout too.
-- 2. Packages: sold at the counter, then their sessions are used on later bills.
-- 3. Bill lines get a remark (printed on the receipt, e.g. for insurance claims),
--    and a bill can take a deposit, which is added to the patient's balance.
-- 4. "Online (HitPay)" as a payment method, for money already paid online.
-- 5. "Makha Lepham" is spelt "Mukha Lepam".
--
-- Server-only: RLS on with no policies; staff pages use the service role after
-- their role check. Safe to re-run.

DO $$
BEGIN
  -- Kerala Ayurvedic Lifestyle has its own package system (Deepavali packages).
  IF to_regclass('public.packages') IS NOT NULL THEN
    RAISE EXCEPTION 'This file is for Ayurvedic Wellness Centre only.';
  END IF;
  IF to_regclass('public.counter_sale_items') IS NULL THEN
    RAISE EXCEPTION 'Run 20261123_counter_checkout.sql first.';
  END IF;
END $$;

BEGIN;

-- 1. Billing items ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.counter_items (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kind                TEXT NOT NULL CHECK (kind IN ('service', 'product', 'package')),
  name                TEXT NOT NULL CHECK (char_length(name) BETWEEN 1 AND 120),
  price_rm            NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (price_rm >= 0),
  duration_mins       INTEGER CHECK (duration_mins IS NULL OR duration_mins BETWEEN 5 AND 600),
  sessions            INTEGER CHECK (sessions IS NULL OR sessions BETWEEN 1 AND 100),
  valid_days          INTEGER CHECK (valid_days IS NULL OR valid_days BETWEEN 1 AND 3650),
  is_hidden           BOOLEAN NOT NULL DEFAULT false,
  created_by_staff_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (kind <> 'package' OR (sessions IS NOT NULL AND valid_days IS NOT NULL))
);
CREATE INDEX IF NOT EXISTS counter_items_kind_idx ON public.counter_items (kind, name);

-- Website therapies / shop products hidden from checkout (they stay on the website).
CREATE TABLE IF NOT EXISTS public.counter_hidden (
  kind       TEXT NOT NULL CHECK (kind IN ('treatment', 'product')),
  ref_id     UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (kind, ref_id)
);

-- 2. Packages ------------------------------------------------------------------------
-- Same column names as Kerala's, so the session-use code is shared.
CREATE TABLE IF NOT EXISTS public.package_purchases (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  counter_item_id        UUID REFERENCES public.counter_items(id) ON DELETE SET NULL,
  sale_id                UUID REFERENCES public.counter_sales(id) ON DELETE SET NULL,
  patient_id             UUID REFERENCES public.patients(id) ON DELETE SET NULL,
  owner_name             TEXT NOT NULL,
  owner_phone            TEXT NOT NULL,
  package_name_snapshot  TEXT NOT NULL,
  price_rm_snapshot      NUMERIC(10,2) NOT NULL,
  session_count_snapshot INTEGER NOT NULL CHECK (session_count_snapshot >= 1),
  sessions_used          INTEGER NOT NULL DEFAULT 0 CHECK (sessions_used >= 0),
  purchased_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at             TIMESTAMPTZ NOT NULL,
  status                 TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled')),
  created_by_staff_id    UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS package_purchases_phone_idx ON public.package_purchases (owner_phone) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS package_purchases_patient_idx ON public.package_purchases (patient_id);

CREATE TABLE IF NOT EXISTS public.package_redemptions (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  package_purchase_id  UUID NOT NULL REFERENCES public.package_purchases(id) ON DELETE CASCADE,
  appointment_id       UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  redeemed_by_staff_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  redeemed_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  notes                TEXT
);
CREATE INDEX IF NOT EXISTS package_redemptions_purchase_idx ON public.package_redemptions (package_purchase_id, redeemed_at);

CREATE OR REPLACE FUNCTION public.redeem_package_session(p_package_purchase_id UUID, p_staff_id UUID, p_notes TEXT DEFAULT NULL)
RETURNS public.package_redemptions
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_purchase RECORD;
  v_redemption public.package_redemptions;
BEGIN
  SELECT * INTO v_purchase FROM public.package_purchases WHERE id = p_package_purchase_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Package purchase % not found', p_package_purchase_id; END IF;
  IF v_purchase.status <> 'active' THEN RAISE EXCEPTION 'Package is % — not active', v_purchase.status; END IF;
  IF v_purchase.expires_at <= now() THEN
    UPDATE public.package_purchases SET status = 'expired' WHERE id = p_package_purchase_id;
    RAISE EXCEPTION 'Package expired on %', v_purchase.expires_at;
  END IF;
  IF v_purchase.sessions_used >= v_purchase.session_count_snapshot THEN
    RAISE EXCEPTION 'All % sessions already used', v_purchase.session_count_snapshot;
  END IF;
  UPDATE public.package_purchases SET sessions_used = sessions_used + 1 WHERE id = p_package_purchase_id;
  INSERT INTO public.package_redemptions (package_purchase_id, redeemed_by_staff_id, notes)
  VALUES (p_package_purchase_id, p_staff_id, p_notes)
  RETURNING * INTO v_redemption;
  RETURN v_redemption;
END $$;
REVOKE EXECUTE ON FUNCTION public.redeem_package_session(UUID, UUID, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.redeem_package_session(UUID, UUID, TEXT) TO service_role;

-- 3. Bill lines: remark, billing items, package sales, deposits ----------------------
ALTER TABLE public.counter_sale_items
  ADD COLUMN IF NOT EXISTS remark TEXT CHECK (remark IS NULL OR char_length(remark) <= 200),
  ADD COLUMN IF NOT EXISTS counter_item_id UUID REFERENCES public.counter_items(id) ON DELETE SET NULL;

-- Replace the line-kind checks (they had no names of their own).
DO $$
DECLARE c RECORD;
BEGIN
  FOR c IN
    SELECT conname FROM pg_constraint
    WHERE conrelid = 'public.counter_sale_items'::regclass AND contype = 'c' AND pg_get_constraintdef(oid) LIKE '%kind%'
  LOOP
    EXECUTE format('ALTER TABLE public.counter_sale_items DROP CONSTRAINT %I', c.conname);
  END LOOP;
END $$;
ALTER TABLE public.counter_sale_items ADD CONSTRAINT counter_sale_items_kind_shape CHECK (
  (kind = 'service' AND product_id IS NULL AND package_purchase_id IS NULL) OR
  (kind = 'product' AND (product_id IS NOT NULL OR counter_item_id IS NOT NULL) AND package_purchase_id IS NULL) OR
  (kind = 'package' AND package_purchase_id IS NOT NULL AND unit_price_rm = 0) OR
  (kind = 'package_sale' AND counter_item_id IS NOT NULL AND product_id IS NULL AND package_purchase_id IS NULL) OR
  (kind = 'deposit' AND treatment_id IS NULL AND product_id IS NULL AND package_purchase_id IS NULL AND counter_item_id IS NULL AND quantity = 1)
);

-- 4. Payment method "Online (HitPay)" --------------------------------------------------
DO $$
DECLARE c RECORD;
BEGIN
  FOR c IN
    SELECT conrelid::regclass AS tbl, conname FROM pg_constraint
    WHERE conrelid IN ('public.counter_sales'::regclass, 'public.patient_balance_entries'::regclass)
      AND contype = 'c' AND pg_get_constraintdef(oid) LIKE '%payment_method%'
  LOOP
    EXECUTE format('ALTER TABLE %s DROP CONSTRAINT %I', c.tbl, c.conname);
  END LOOP;
END $$;
ALTER TABLE public.counter_sales ADD CONSTRAINT counter_sales_payment_method_ok CHECK (payment_method IS NULL OR payment_method IN
  ('cash', 'duitnow_qr', 'tng_ewallet', 'card_terminal', 'bank_transfer', 'hitpay_online', 'other'));
ALTER TABLE public.patient_balance_entries ADD CONSTRAINT patient_balance_entries_payment_method_ok CHECK (payment_method IS NULL OR payment_method IN
  ('cash', 'duitnow_qr', 'tng_ewallet', 'card_terminal', 'bank_transfer', 'hitpay_online', 'other'));

-- 5. Payment, now also selling packages and taking deposits --------------------------
CREATE OR REPLACE FUNCTION public.complete_counter_sale(
  p_sale_id UUID,
  p_staff_id UUID,
  p_method TEXT,
  p_received NUMERIC,
  p_uses JSONB DEFAULT '[]'::jsonb,
  p_outstanding BOOLEAN DEFAULT false
)
RETURNS public.counter_sales
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sale public.counter_sales;
  v_item RECORD;
  v_use RECORD;
  v_pkg public.counter_items;
  v_sub NUMERIC(10,2);
  v_total NUMERIC(10,2);
  v_used NUMERIC(10,2) := 0;
  v_due NUMERIC(10,2);
  v_paid NUMERIC(10,2) := 0;
  v_bal NUMERIC(10,2);
  v_stock INTEGER;
  v_backorder BOOLEAN;
  v_redemption_id UUID;
  v_label TEXT;
  v_has_deposit BOOLEAN;
BEGIN
  SELECT * INTO v_sale FROM public.counter_sales WHERE id = p_sale_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'bill_not_found'; END IF;
  IF v_sale.status <> 'open' THEN RAISE EXCEPTION 'bill_not_open'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.counter_sale_items WHERE sale_id = p_sale_id) THEN
    RAISE EXCEPTION 'bill_empty';
  END IF;

  SELECT COALESCE(SUM(line_total_rm), 0) INTO v_sub FROM public.counter_sale_items WHERE sale_id = p_sale_id;
  v_total := GREATEST(v_sub - v_sale.discount_rm, 0);
  v_label := 'Bill INV-' || lpad(v_sale.bill_no::text, 6, '0');

  -- A deposit is money paid in now: it needs a saved patient, and can't be
  -- discounted, paid from a balance, or left to pay later.
  v_has_deposit := EXISTS (SELECT 1 FROM public.counter_sale_items WHERE sale_id = p_sale_id AND kind = 'deposit');
  IF v_has_deposit THEN
    IF v_sale.patient_id IS NULL THEN RAISE EXCEPTION 'balance_needs_patient'; END IF;
    IF v_sale.discount_rm > 0 OR p_outstanding OR jsonb_array_length(COALESCE(p_uses, '[]'::jsonb)) > 0 THEN
      RAISE EXCEPTION 'deposit_paid_now';
    END IF;
  END IF;
  -- A package is found later by the customer's phone number.
  IF EXISTS (SELECT 1 FROM public.counter_sale_items WHERE sale_id = p_sale_id AND kind = 'package_sale')
     AND COALESCE(btrim(v_sale.customer_phone), '') = '' THEN
    RAISE EXCEPTION 'package_needs_phone';
  END IF;

  -- Balances: only a saved patient's own, never more than they hold or than the bill.
  IF jsonb_typeof(COALESCE(p_uses, '[]'::jsonb)) <> 'array' THEN RAISE EXCEPTION 'balance_invalid'; END IF;
  IF jsonb_array_length(COALESCE(p_uses, '[]'::jsonb)) > 0 OR p_outstanding THEN
    IF v_sale.patient_id IS NULL THEN RAISE EXCEPTION 'balance_needs_patient'; END IF;
    PERFORM 1 FROM public.patients WHERE id = v_sale.patient_id FOR UPDATE;
  END IF;
  FOR v_use IN SELECT * FROM jsonb_to_recordset(COALESCE(p_uses, '[]'::jsonb)) AS x(kind TEXT, amount NUMERIC) LOOP
    IF v_use.kind IS NULL OR v_use.kind NOT IN ('credit', 'deposit', 'gift_card') OR v_use.amount IS NULL OR v_use.amount <= 0 THEN
      RAISE EXCEPTION 'balance_invalid';
    END IF;
    SELECT COALESCE(SUM(amount), 0) INTO v_bal FROM public.patient_balance_entries WHERE patient_id = v_sale.patient_id AND kind = v_use.kind;
    IF v_bal < v_use.amount THEN RAISE EXCEPTION 'balance_short:%:%', v_use.kind, v_bal; END IF;
    INSERT INTO public.patient_balance_entries (patient_id, kind, amount, note, sale_id, staff_id)
    VALUES (v_sale.patient_id, v_use.kind, -round(v_use.amount, 2), 'Used on ' || v_label, p_sale_id, p_staff_id);
    v_used := v_used + round(v_use.amount, 2);
  END LOOP;
  IF v_used > v_total THEN RAISE EXCEPTION 'balance_over_total'; END IF;
  v_due := v_total - v_used;

  IF p_outstanding THEN
    IF v_due > 0 THEN
      INSERT INTO public.patient_balance_entries (patient_id, kind, amount, note, sale_id, staff_id)
      VALUES (v_sale.patient_id, 'outstanding', v_due, 'Unpaid on ' || v_label, p_sale_id, p_staff_id);
    END IF;
  ELSE
    IF v_due > 0 AND p_method IS NULL THEN RAISE EXCEPTION 'payment_method_required'; END IF;
    IF v_due > 0 AND p_method = 'cash' AND (p_received IS NULL OR p_received < v_due) THEN RAISE EXCEPTION 'cash_short'; END IF;
    v_paid := v_due;
  END IF;

  -- Shop products come out of stock; billing-item products have no stock count.
  FOR v_item IN
    SELECT * FROM public.counter_sale_items WHERE sale_id = p_sale_id AND kind = 'product' AND product_id IS NOT NULL ORDER BY created_at
  LOOP
    SELECT stock_qty, allow_backorder INTO v_stock, v_backorder FROM public.products WHERE id = v_item.product_id FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'product_missing:%', v_item.description; END IF;
    IF NOT v_backorder AND v_stock < v_item.quantity THEN
      RAISE EXCEPTION 'out_of_stock:%:%', v_item.description, v_stock;
    END IF;
    INSERT INTO public.stock_movements (product_id, movement_type, quantity_delta, reason, actor_id, notes)
    VALUES (v_item.product_id, 'sold', -v_item.quantity, 'counter_sale', p_staff_id, v_label);
  END LOOP;

  -- Package sessions used on this bill.
  FOR v_item IN
    SELECT * FROM public.counter_sale_items WHERE sale_id = p_sale_id AND kind = 'package' ORDER BY created_at
  LOOP
    FOR i IN 1..v_item.quantity LOOP
      SELECT r.id INTO v_redemption_id FROM public.redeem_package_session(v_item.package_purchase_id, p_staff_id, v_label) AS r;
      IF v_sale.appointment_id IS NOT NULL THEN
        UPDATE public.package_redemptions SET appointment_id = v_sale.appointment_id WHERE id = v_redemption_id;
      END IF;
    END LOOP;
  END LOOP;

  -- Packages bought on this bill: one package per quantity.
  FOR v_item IN
    SELECT * FROM public.counter_sale_items WHERE sale_id = p_sale_id AND kind = 'package_sale' ORDER BY created_at
  LOOP
    SELECT * INTO v_pkg FROM public.counter_items WHERE id = v_item.counter_item_id;
    IF NOT FOUND OR v_pkg.sessions IS NULL THEN RAISE EXCEPTION 'product_missing:%', v_item.description; END IF;
    FOR i IN 1..v_item.quantity LOOP
      INSERT INTO public.package_purchases (counter_item_id, sale_id, patient_id, owner_name, owner_phone, package_name_snapshot,
        price_rm_snapshot, session_count_snapshot, expires_at, created_by_staff_id)
      VALUES (v_pkg.id, p_sale_id, v_sale.patient_id, v_sale.customer_name, btrim(v_sale.customer_phone), v_pkg.name,
        v_item.unit_price_rm, v_pkg.sessions, now() + make_interval(days => v_pkg.valid_days), p_staff_id);
    END LOOP;
  END LOOP;

  -- Deposits paid in are added to the patient's deposit balance. The money is
  -- counted with the bill, so the entry has no payment method of its own.
  FOR v_item IN
    SELECT * FROM public.counter_sale_items WHERE sale_id = p_sale_id AND kind = 'deposit' ORDER BY created_at
  LOOP
    INSERT INTO public.patient_balance_entries (patient_id, kind, amount, note, sale_id, staff_id)
    VALUES (v_sale.patient_id, 'deposit', v_item.line_total_rm,
      left('Paid in on ' || v_label || COALESCE(' — ' || v_item.remark, ''), 300), p_sale_id, p_staff_id);
  END LOOP;

  UPDATE public.counter_sales
  SET status = 'paid',
      subtotal_rm = v_sub,
      total_rm = v_total,
      balance_used_rm = v_used,
      outstanding_rm = CASE WHEN p_outstanding THEN v_due ELSE 0 END,
      amount_paid_rm = v_paid,
      payment_method = CASE WHEN v_paid > 0 THEN p_method ELSE NULL END,
      amount_received_rm = CASE WHEN v_paid > 0 AND p_method = 'cash' THEN p_received ELSE NULL END,
      paid_at = now(),
      paid_by_staff_id = p_staff_id,
      updated_at = now()
  WHERE id = p_sale_id
  RETURNING * INTO v_sale;

  RETURN v_sale;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.complete_counter_sale(UUID, UUID, TEXT, NUMERIC, JSONB, BOOLEAN) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.complete_counter_sale(UUID, UUID, TEXT, NUMERIC, JSONB, BOOLEAN) TO service_role;

-- 6. Lock down -------------------------------------------------------------------------
ALTER TABLE public.counter_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.counter_hidden ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.package_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.package_redemptions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.counter_items, public.counter_hidden, public.package_purchases, public.package_redemptions FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.counter_items, public.counter_hidden TO service_role;
GRANT SELECT, INSERT, UPDATE ON public.package_purchases, public.package_redemptions TO service_role;

-- 7. Spelling: Mukha Lepam ---------------------------------------------------------------
UPDATE public.treatments
SET slug = 'mukha-lepam',
    title = replace(title, 'Makha Lepham', 'Mukha Lepam'),
    body = replace(body, 'Makha Lepham', 'Mukha Lepam'),
    updated_at = now()
WHERE category_id = 'cat-face-care' AND slug = 'makha-lepham'
  AND NOT EXISTS (SELECT 1 FROM public.treatments WHERE category_id = 'cat-face-care' AND slug = 'mukha-lepam');

COMMIT;

-- Check
SELECT
  (SELECT count(*) FROM public.counter_items) AS billing_items,
  (SELECT title FROM public.treatments WHERE slug = 'mukha-lepam') AS mukha_lepam,
  (SELECT count(*) FROM information_schema.columns WHERE table_name = 'counter_sale_items' AND column_name = 'remark') AS remark_column;
