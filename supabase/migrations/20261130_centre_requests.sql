-- Centre requests, 28 Nov 2026 — Ayurvedic Wellness Centre.
--
-- 1. Patient age: when no date of birth is given, the age as told, and the
--    day it was recorded (so it can be shown as their age today).
-- 2. Packages can last a number of months (valid_months) as well as days.
-- 3. Day open / close can keep the cash counted by notes and coins.
-- 4. "VIP Private Room" (RM20) as a counter billing item.
--
-- Needs 20261122_patient_profile, 20261124_front_desk_day and
-- 20261125_counter_catalog. Safe to re-run.

BEGIN;

-- 1. Age ------------------------------------------------------------------------------
ALTER TABLE public.patients
  ADD COLUMN IF NOT EXISTS age_years INTEGER CHECK (age_years IS NULL OR age_years BETWEEN 0 AND 130),
  ADD COLUMN IF NOT EXISTS age_recorded_on DATE;

-- 2. Package validity in months -------------------------------------------------------
ALTER TABLE public.counter_items
  ADD COLUMN IF NOT EXISTS valid_months INTEGER CHECK (valid_months IS NULL OR valid_months BETWEEN 1 AND 120);
DO $$
DECLARE c RECORD;
BEGIN
  FOR c IN
    SELECT conname FROM pg_constraint
    WHERE conrelid = 'public.counter_items'::regclass AND contype = 'c' AND pg_get_constraintdef(oid) LIKE '%valid_days IS NOT NULL%'
  LOOP
    EXECUTE format('ALTER TABLE public.counter_items DROP CONSTRAINT %I', c.conname);
  END LOOP;
END $$;
ALTER TABLE public.counter_items ADD CONSTRAINT counter_items_package_shape CHECK (
  kind <> 'package' OR (sessions IS NOT NULL AND (valid_days IS NOT NULL OR valid_months IS NOT NULL))
);

-- 3. Cash counted by notes and coins --------------------------------------------------
-- {"RM100": 2, "RM50": 1, ..., "5sen": 3}; null when the cash was entered as one amount.
ALTER TABLE public.counter_days
  ADD COLUMN IF NOT EXISTS opening_breakdown JSONB,
  ADD COLUMN IF NOT EXISTS closing_breakdown JSONB;

-- 4. VIP Private Room at the counter --------------------------------------------------
INSERT INTO public.counter_items (kind, name, price_rm)
SELECT 'service', 'VIP Private Room', 20
WHERE NOT EXISTS (SELECT 1 FROM public.counter_items WHERE kind = 'service' AND name = 'VIP Private Room');

-- Packages sold now last their days or months.
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
        v_item.unit_price_rm, v_pkg.sessions, now() + CASE WHEN v_pkg.valid_months IS NOT NULL THEN make_interval(months => v_pkg.valid_months) ELSE make_interval(days => v_pkg.valid_days) END, p_staff_id);
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

COMMIT;
