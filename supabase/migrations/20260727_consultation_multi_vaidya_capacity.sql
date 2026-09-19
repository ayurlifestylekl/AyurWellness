-- ============================================================================
-- Consultation capacity — per-Vaidya, not clinic-wide (2026-07-27). Idempotent.
-- Apply via Supabase SQL Editor. Apply BEFORE deploying the app code that
-- calls this with real Vaidya resource keys (old app code stays compatible
-- with this new function — see notes below).
--
-- There are now two real doctors (`vaidyas.code` = 'VAIDYA' / 'LYMAT'). Until
-- now, claim_instant_slots() treated every consultation as consuming ONE
-- shared, clinic-wide 30-min slot (resourceKey hardcoded to the literal
-- string 'vaidya', capacity counted across ALL consultations regardless of
-- who they're with) — so a busy VAIDYA blocked a slot even when LYMAT was
-- completely free. This migration re-defines the same function so the
-- consultation branch is scoped by the SPECIFIC Vaidya a claim targets,
-- mirroring the 'gender' branch's already-per-key pattern. It also records
-- that Vaidya onto the new row via `assigned_therapist_code` — the same
-- column treatments already use for therapist assignment.
--
-- A legacy/unassigned consultation (assigned_therapist_code IS NULL) counts
-- against the default Vaidya, 'VAIDYA' — the same fallback convention already
-- used in src/lib/staff/appointments.ts (getDaySchedule/getVaidyaSchedule)
-- and src/lib/booking/actions.ts (bookableVaidyas/consultationBusyByVaidya).
--
-- Everything else (the 'gender' branch, advisory locking, lock ordering) is
-- unchanged from 20260716_instant_booking_claim.sql.
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
    v_resource_key  := v_claim->>'resourceKey';  -- 'male' | 'female' | a Vaidya code (e.g. 'VAIDYA', 'LYMAT')
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
      -- Scoped to the SPECIFIC Vaidya this claim targets, not every
      -- consultation centre-wide. A legacy row with no
      -- assigned_therapist_code counts against the default Vaidya (VAIDYA).
      SELECT count(*) INTO v_count
        FROM public.appointments a
       WHERE a.booking_kind = 'consultation'
         AND (
           a.assigned_therapist_code = v_resource_key
           OR (a.assigned_therapist_code IS NULL AND v_resource_key = 'VAIDYA')
         )
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
      parent_consultation_id, group_id, guest_age, payment_expires_at,
      assigned_therapist_code
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
      NULLIF(v_row->>'payment_expires_at', '')::timestamptz,
      -- Only ever set by consultation claims; treatment ('gender') claims
      -- never include this key in `row`, so ->>'assigned_therapist_code' is
      -- SQL NULL here and NULLIF(NULL,'') stays NULL — unchanged behaviour
      -- for treatments.
      NULLIF(v_row->>'assigned_therapist_code', '')
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
