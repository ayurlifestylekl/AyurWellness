-- Confirm a paid single or group booking in one transaction. Idempotent.
-- `created_at` is supplied by 20260716b_appointments_created_at.sql and is
-- used to choose a stable lead when every member of a group shares one bill.

ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS payment_problem_alerted_at timestamptz;

CREATE OR REPLACE FUNCTION public.confirm_appointment_payment(p_bill_id text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_lead public.appointments%ROWTYPE;
  v_problem public.appointments%ROWTYPE;
  v_rows jsonb := '[]'::jsonb;
  v_problem_status text;
  v_should_alert boolean := false;
  v_alert_claim_count integer := 0;
BEGIN
  IF p_bill_id IS NULL OR btrim(p_bill_id) = '' THEN
    RETURN jsonb_build_object(
      'state', 'not_found', 'lead_id', null, 'group_id', null,
      'booking_status', null, 'should_alert', false, 'rows', '[]'::jsonb
    );
  END IF;

  -- Serialize duplicate provider callbacks for the same bill for exactly-once
  -- state transition and notification eligibility.
  PERFORM pg_advisory_xact_lock(hashtextextended('appointment-payment|' || p_bill_id, 0));

  SELECT * INTO v_lead
  FROM public.appointments
  WHERE payment_bill_id = p_bill_id
  ORDER BY created_at ASC, id ASC
  LIMIT 1
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'state', 'not_found', 'lead_id', null, 'group_id', null,
      'booking_status', null, 'should_alert', false, 'rows', '[]'::jsonb
    );
  END IF;

  IF v_lead.group_id IS NOT NULL THEN
    -- Lock every member before making ANY idempotency/eligibility decision.
    -- Historical partial confirmations must never be mistaken for an
    -- all-confirmed group merely because the stable lead is confirmed.
    PERFORM 1
    FROM public.appointments
    WHERE group_id = v_lead.group_id
    FOR UPDATE;

    IF NOT EXISTS (
      SELECT 1
      FROM public.appointments
      WHERE group_id = v_lead.group_id
        AND status <> 'confirmed'
    ) THEN
      RETURN jsonb_build_object(
        'state', 'already_confirmed', 'lead_id', v_lead.id, 'group_id', v_lead.group_id,
        'booking_status', 'confirmed', 'should_alert', false, 'rows', '[]'::jsonb
      );
    ELSIF NOT EXISTS (
      SELECT 1
      FROM public.appointments
      WHERE group_id = v_lead.group_id
        AND status <> 'awaiting_payment'
    ) THEN
      -- Every member is payable; continue to the single atomic UPDATE below.
      NULL;
    ELSIF (
      SELECT COUNT(DISTINCT status)
      FROM public.appointments
      WHERE group_id = v_lead.group_id
    ) > 1 THEN
      -- A historical partial transition (confirmed/cancelled/awaiting/etc.) is
      -- terminal and requires staff review, not another partial update.
      v_problem := v_lead;
      v_problem_status := 'mixed_group';
    ELSE
      -- Every member shares the same terminal state. Preserve that real state
      -- (including expired vs manually cancelled) in the alert context.
      SELECT *
      INTO v_problem
      FROM public.appointments
      WHERE group_id = v_lead.group_id
      ORDER BY created_at ASC, id ASC
      LIMIT 1;
    END IF;
  ELSE
    IF v_lead.status = 'confirmed' THEN
      RETURN jsonb_build_object(
        'state', 'already_confirmed', 'lead_id', v_lead.id, 'group_id', null,
        'booking_status', 'confirmed', 'should_alert', false, 'rows', '[]'::jsonb
      );
    ELSIF v_lead.status <> 'awaiting_payment' THEN
      v_problem := v_lead;
    END IF;
  END IF;

  IF v_problem_status IS NULL AND v_problem.id IS NOT NULL THEN
    v_problem_status := CASE
      WHEN v_problem.status = 'cancelled'
        AND v_problem.cancellation_reason = 'Payment wasn’t completed in time — the slot has been released. You’re welcome to book again.'
      THEN 'expired'
      ELSE v_problem.status::text
    END;
  END IF;

  IF v_problem_status IS NOT NULL THEN
    -- The stable lead owns the durable notification claim. The advisory lock
    -- and row lock make exactly one duplicate callback receive should_alert.
    UPDATE public.appointments
    SET payment_problem_alerted_at = now()
    WHERE id = v_lead.id
      AND payment_problem_alerted_at IS NULL;
    GET DIAGNOSTICS v_alert_claim_count = ROW_COUNT;
    v_should_alert := v_alert_claim_count = 1;

    RETURN jsonb_build_object(
      'state', 'not_payable',
      'lead_id', v_lead.id,
      'group_id', v_lead.group_id,
      'booking_status', v_problem_status,
      'should_alert', v_should_alert,
      'rows', jsonb_build_array(jsonb_build_object(
        'id', v_lead.id,
        'patient_name', v_lead.patient_name,
        'guest_age', v_lead.guest_age,
        'treatment_name', v_lead.treatment_name,
        'appointment_date_time', v_lead.appointment_date_time,
        'patient_email', v_lead.patient_email
      ))
    );
  END IF;

  WITH changed AS (
    UPDATE public.appointments
    SET payment_status = 'paid', paid_at = now(), status = 'confirmed'
    WHERE (
      v_lead.group_id IS NOT NULL AND group_id = v_lead.group_id
      OR v_lead.group_id IS NULL AND id = v_lead.id
    )
      AND status = 'awaiting_payment'
    RETURNING id, patient_name, guest_age, treatment_name, appointment_date_time, patient_email
  )
  SELECT COALESCE(jsonb_agg(to_jsonb(changed) ORDER BY id), '[]'::jsonb)
  INTO v_rows
  FROM changed;

  RETURN jsonb_build_object(
    'state', 'confirmed', 'lead_id', v_lead.id, 'group_id', v_lead.group_id,
    'booking_status', 'confirmed', 'should_alert', false, 'rows', v_rows
  );
END;
$$;

REVOKE ALL ON FUNCTION public.confirm_appointment_payment(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.confirm_appointment_payment(text) TO service_role;
