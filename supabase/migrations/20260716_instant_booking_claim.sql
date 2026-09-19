-- ============================================================================
-- Instant booking — race-safe slot claim (2026-07-16). Idempotent.
-- Apply via Supabase SQL Editor.
--
-- Removing the staff-approval gate means a customer's browser-side capacity
-- check (computeMixedSlots / getConsultationSlots) and the actual insert of
-- their appointment are no longer separated by a human reviewer re-checking
-- availability — they now happen back-to-back, unattended. Two customers
-- racing for the literal last same-gender slot (or the last consultation
-- slot) could both read "available" and both insert.
--
-- This function closes that race at the database level: it takes a
-- transaction-scoped advisory lock per resource+day (serialising concurrent
-- claims for the same gender/day or the same day's consultations), re-counts
-- occupancy inside that lock, and only inserts if there's still room. It
-- reuses appt_occupied_range() from the 20260701 double-booking migration —
-- same 30-min-buffered overlap definition used everywhere else.
--
-- The browse-time estimate (which slots to even show) stays in application
-- code (src/lib/booking/actions.ts) — this function is only the write-time
-- guard, called once, right before the row(s) are actually created.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.claim_instant_slots(p_claims jsonb)
RETURNS uuid[]
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_keys text[];
  v_key text;
  v_claim jsonb;
  v_row jsonb;
  v_resource_type text;
  v_resource_key text;
  v_capacity integer;
  v_start timestamptz;
  v_dur integer;
  v_count integer;
  v_id uuid;
  v_ids uuid[] := '{}';
BEGIN
  IF jsonb_typeof(p_claims) IS DISTINCT FROM 'array' OR jsonb_array_length(p_claims) = 0 THEN
    RAISE EXCEPTION 'claim_instant_slots requires a non-empty JSON array';
  END IF;

  -- Lock every distinct resource this batch touches, in a stable sorted
  -- order, BEFORE any counting or inserting — this prevents two concurrent
  -- group claims that touch overlapping resources from deadlocking each
  -- other (classic lock-ordering fix).
  SELECT array_agg(DISTINCT key ORDER BY key) INTO v_keys
  FROM (
    SELECT (c->>'resourceType') || '|' || (c->>'resourceKey') || '|' ||
           to_char((c->'row'->>'appointment_date_time')::timestamptz AT TIME ZONE 'Asia/Kuala_Lumpur', 'YYYY-MM-DD') AS key
    FROM jsonb_array_elements(p_claims) c
  ) s;

  FOREACH v_key IN ARRAY v_keys LOOP
    PERFORM pg_advisory_xact_lock(hashtextextended(v_key, 0));
  END LOOP;

  FOR v_claim IN SELECT * FROM jsonb_array_elements(p_claims) LOOP
    v_resource_type := v_claim->>'resourceType'; -- 'gender' | 'consultation'
    v_resource_key  := v_claim->>'resourceKey';  -- 'male' | 'female' | 'vaidya'
    v_capacity      := (v_claim->>'capacity')::integer;
    v_row           := v_claim->'row';
    v_start         := (v_row->>'appointment_date_time')::timestamptz;
    v_dur           := COALESCE((v_row->>'duration_mins')::integer, 60);

    IF v_resource_type = 'gender' THEN
      SELECT count(*) INTO v_count
        FROM public.appointments a
       WHERE a.gender_requirement::text = v_resource_key
         AND a.status IN ('scheduled', 'awaiting_payment', 'confirmed', 'checked_in', 'in_progress')
         AND (a.status <> 'awaiting_payment' OR a.payment_expires_at IS NULL OR a.payment_expires_at > now())
         AND public.appt_occupied_range(a.appointment_date_time, a.duration_mins)
             && public.appt_occupied_range(v_start, v_dur);
    ELSE
      SELECT count(*) INTO v_count
        FROM public.appointments a
       WHERE a.booking_kind = 'consultation'
         AND a.status IN ('scheduled', 'awaiting_payment', 'confirmed', 'checked_in', 'in_progress')
         AND (a.status <> 'awaiting_payment' OR a.payment_expires_at IS NULL OR a.payment_expires_at > now())
         AND public.appt_occupied_range(a.appointment_date_time, a.duration_mins)
             && public.appt_occupied_range(v_start, v_dur);
    END IF;

    IF v_count >= v_capacity THEN
      RAISE EXCEPTION 'SLOT_FULL: % has no room at %', v_resource_key, v_start;
    END IF;

    -- Explicit column list — deliberately NOT jsonb_populate_record(), which
    -- would silently leave any column absent from the JSON as NULL instead of
    -- applying the table's own defaults (id, created_at, etc.).
    INSERT INTO public.appointments (
      customer_id, is_guest, booking_kind, treatment_id, treatment_category_id,
      treatment_name, duration_mins, status, requested_datetime, requested_datetime_alt,
      appointment_date_time, patient_name, patient_phone, patient_email, patient_gender,
      gender_requirement, pre_visit_form, payable_amount_rm, payment_status,
      parent_consultation_id, group_id, guest_age, payment_expires_at
    ) VALUES (
      NULLIF(v_row->>'customer_id', '')::uuid,
      COALESCE((v_row->>'is_guest')::boolean, true),
      v_row->>'booking_kind',
      NULLIF(v_row->>'treatment_id', '')::uuid,
      v_row->>'treatment_category_id',
      v_row->>'treatment_name',
      v_dur,
      (v_row->>'status')::appointment_status_enum,
      (v_row->>'requested_datetime')::timestamptz,
      NULLIF(v_row->>'requested_datetime_alt', '')::timestamptz,
      v_start,
      v_row->>'patient_name',
      v_row->>'patient_phone',
      v_row->>'patient_email',
      v_row->>'patient_gender',
      (v_row->>'gender_requirement')::gender_requirement_enum,
      COALESCE(v_row->'pre_visit_form', '{}'::jsonb),
      NULLIF(v_row->>'payable_amount_rm', '')::numeric,
      v_row->>'payment_status',
      NULLIF(v_row->>'parent_consultation_id', '')::uuid,
      NULLIF(v_row->>'group_id', '')::uuid,
      NULLIF(v_row->>'guest_age', '')::integer,
      NULLIF(v_row->>'payment_expires_at', '')::timestamptz
    )
    RETURNING id INTO v_id;

    v_ids := array_append(v_ids, v_id);
  END LOOP;

  RETURN v_ids;
END;
$$;

-- Called only from server actions using the service-role key — never exposed
-- to anon/authenticated directly.
REVOKE ALL ON FUNCTION public.claim_instant_slots(jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.claim_instant_slots(jsonb) TO service_role;
