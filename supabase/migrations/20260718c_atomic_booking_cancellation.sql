-- Atomic self-service appointment cancellation with refund claiming.
-- Replaces confirm_appointment_payment so all group operations scope to
-- group_management_active = true, keeping detached historical members from
-- corrupting the active group's payment state.
-- This migration remains local until applied through the controlled release path.

-- ---------------------------------------------------------------------------
-- 1. claim_booking_cancellation — atomic cancellation with refund claiming
--
-- Lock strategy: sorted for update on target rows, then clock_timestamp()
-- for all policy decisions. Validate the full batch before any mutation.
-- ---------------------------------------------------------------------------
create or replace function public.claim_booking_cancellation(
  p_appointment_ids uuid[],
  p_now timestamptz,
  p_actor_type text
) returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_appointment public.appointments%rowtype;
  v_locked_count integer;
  v_now timestamptz;
  v_created_ms double precision;
  v_appt_ms double precision;
  v_now_ms double precision;
  v_mistake boolean;
  v_advance boolean;
  v_is_paid boolean;
  v_group_id_val uuid;
  v_whole_group boolean := false;
  v_active_group_ids uuid[];
  v_detach_this boolean;
  v_idempotency_key text;
  v_existing_refund_id uuid;
  v_result_appointments uuid[] := array[]::uuid[];
  v_result_refunds jsonb := '[]'::jsonb;
  v_result_bills jsonb := '[]'::jsonb;
  v_seen_bills text[] := array[]::text[];
  v_bill_id text;
  v_bill_provider text;
begin
  -- ── structural validation ──────────────────────────────────────────────────
  if p_appointment_ids is null or cardinality(p_appointment_ids) = 0 then
    raise exception 'INVALID_INPUT: appointment_ids must be non-empty';
  end if;
  if (select count(distinct id) from unnest(p_appointment_ids) id) <> cardinality(p_appointment_ids) then
    raise exception 'INVALID_INPUT: duplicate appointment_id';
  end if;
  if p_actor_type not in ('customer', 'guest', 'staff', 'system', 'provider') then
    raise exception 'INVALID_INPUT: invalid actor_type';
  end if;

  -- ── lock rows in uuid order (before clock sample) ─────────────────────────
  -- serializes cancel/cancel and cancel/reschedule races
  perform a.id
  from public.appointments a
  where a.id = any(p_appointment_ids)
  order by a.id
  for update;

  get diagnostics v_locked_count = row_count;
  if v_locked_count <> cardinality(p_appointment_ids) then
    raise exception 'INVALID_INPUT: one or more appointments not found';
  end if;

  -- ── trusted database time (after all locks) ────────────────────────────────
  -- p_now is kept only for api compatibility; clock_timestamp() is authoritative.
  v_now := clock_timestamp();
  v_now_ms := extract(epoch from v_now) * 1000;

  -- ── determine whole-group vs individual ───────────────────────────────────
  select a.group_id into v_group_id_val
  from public.appointments a
  where a.id = p_appointment_ids[1];

  if v_group_id_val is not null then
    select array_agg(a.id order by a.id)
    into v_active_group_ids
    from public.appointments a
    where a.group_id = v_group_id_val
      and a.group_management_active = true;

    if cardinality(p_appointment_ids) = cardinality(v_active_group_ids) then
      v_whole_group := (
        select bool_and(a.id = any(p_appointment_ids))
        from unnest(v_active_group_ids) a(id)
      );
    end if;
  end if;

  -- ── full batch validation before any mutation ─────────────────────────────
  for v_appointment in
    select * from public.appointments
    where id = any(p_appointment_ids)
    order by id
  loop
    if v_appointment.status not in ('pending', 'scheduled', 'awaiting_payment', 'confirmed') then
      raise exception 'POLICY_CLOSED: appointment % is not in a cancellable status', v_appointment.id;
    end if;

    v_appt_ms := extract(epoch from v_appointment.appointment_date_time) * 1000;
    if v_now_ms >= v_appt_ms then
      raise exception 'POLICY_CLOSED: appointment % has already started', v_appointment.id;
    end if;

    v_is_paid := v_appointment.payment_status = 'paid';

    if v_is_paid then
      v_created_ms := extract(epoch from v_appointment.created_at) * 1000;
      v_mistake := (v_now_ms - v_created_ms) <= (60 * 60 * 1000)
                   and v_now_ms >= v_created_ms;
      v_advance := (v_appt_ms - v_now_ms) >= (48 * 60 * 60 * 1000);

      if not (v_mistake or v_advance) then
        raise exception 'POLICY_CLOSED: appointment % is not eligible for an automatic refund', v_appointment.id;
      end if;

      if v_appointment.payable_amount_rm is null or v_appointment.payable_amount_rm <= 0 then
        raise exception 'INVALID_INPUT: appointment % has no valid payable amount', v_appointment.id;
      end if;
      if v_appointment.payment_provider not in ('stripe', 'billplz', 'stub') then
        raise exception 'INVALID_INPUT: appointment % has unknown payment provider', v_appointment.id;
      end if;
    end if;
  end loop;

  -- ── mutations: all guards passed ─────────────────────────────────────────
  for v_appointment in
    select * from public.appointments
    where id = any(p_appointment_ids)
    order by id
  loop
    v_is_paid := v_appointment.payment_status = 'paid';
    v_detach_this := v_appointment.group_id is not null and not v_whole_group;

    if v_is_paid then
      v_created_ms := extract(epoch from v_appointment.created_at) * 1000;
      v_appt_ms    := extract(epoch from v_appointment.appointment_date_time) * 1000;
      v_mistake    := (v_now_ms - v_created_ms) <= (60 * 60 * 1000) and v_now_ms >= v_created_ms;
      v_advance    := (v_appt_ms - v_now_ms) >= (48 * 60 * 60 * 1000);
    end if;

    -- cancel the appointment and optionally mark detached
    update public.appointments
    set status = 'cancelled',
        cancelled_at = v_now,
        cancellation_reason = 'Cancelled by customer',
        updated_at = v_now,
        group_management_active = case when v_detach_this then false else group_management_active end,
        group_detached_at = case when v_detach_this and group_detached_at is null then v_now else group_detached_at end
    where id = v_appointment.id;

    -- sever old group bill from remaining active siblings for unpaid individual
    if v_detach_this and not v_is_paid and v_appointment.payment_bill_id is not null then
      update public.appointments
      set payment_bill_id = null,
          payment_url = null,
          payment_status = 'unpaid',
          updated_at = v_now
      where group_id = v_appointment.group_id
        and group_management_active = true
        and id <> v_appointment.id;

      v_bill_id := v_appointment.payment_bill_id;
      v_bill_provider := coalesce(v_appointment.payment_provider, '');
      if not (v_bill_id = any(v_seen_bills)) then
        v_seen_bills := array_append(v_seen_bills, v_bill_id);
        v_result_bills := v_result_bills || jsonb_build_array(
          jsonb_build_object('bill_id', v_bill_id, 'provider', v_bill_provider)
        );
      end if;
    end if;

    -- collect unpaid single-row bill (non-group or whole-group cancellation)
    if not v_is_paid and not v_detach_this and v_appointment.payment_bill_id is not null
       and not (v_appointment.payment_bill_id = any(v_seen_bills)) then
      v_seen_bills := array_append(v_seen_bills, v_appointment.payment_bill_id);
      v_result_bills := v_result_bills || jsonb_build_array(
        jsonb_build_object(
          'bill_id', v_appointment.payment_bill_id,
          'provider', coalesce(v_appointment.payment_provider, '')
        )
      );
    end if;

    -- claim a refund for paid appointments
    if v_is_paid then
      v_idempotency_key := 'booking-refund:' || v_appointment.id::text || ':full';

      select id into v_existing_refund_id
      from public.booking_refunds
      where idempotency_key = v_idempotency_key;

      if v_existing_refund_id is null then
        insert into public.booking_refunds (
          appointment_id,
          provider,
          amount_rm,
          status,
          eligibility_reason,
          idempotency_key
        ) values (
          v_appointment.id,
          v_appointment.payment_provider::text,
          v_appointment.payable_amount_rm,
          'claimed',
          case when v_mistake then 'mistake_window' else 'advance_window' end,
          v_idempotency_key
        )
        returning id into v_existing_refund_id;
      end if;

      v_result_refunds := v_result_refunds || jsonb_build_array(
        jsonb_build_object(
          'refund_id',       v_existing_refund_id,
          'appointment_id',  v_appointment.id,
          'provider',        v_appointment.payment_provider,
          'amount_rm',       v_appointment.payable_amount_rm,
          'idempotency_key', v_idempotency_key,
          'bill_id',         v_appointment.payment_bill_id,
          'customer_email',  v_appointment.patient_email
        )
      );
    end if;

    -- audit events (cancelled, refund_requested, group_detached) in same transaction
    insert into public.booking_events (
      appointment_id, event_type, actor_type, old_data, new_data, created_at
    ) values (
      v_appointment.id,
      'cancelled',
      p_actor_type,
      jsonb_build_object(
        'status', v_appointment.status,
        'payment_status', v_appointment.payment_status,
        'appointment_date_time', v_appointment.appointment_date_time
      ),
      jsonb_build_object(
        'status', 'cancelled',
        'payment_status', v_appointment.payment_status,
        'appointment_date_time', v_appointment.appointment_date_time
      ),
      v_now
    );

    if v_is_paid then
      insert into public.booking_events (
        appointment_id, event_type, actor_type, old_data, new_data, created_at
      ) values (
        v_appointment.id,
        'refund_requested',
        p_actor_type,
        jsonb_build_object('payment_status', 'paid'),
        jsonb_build_object('refund_status', 'claimed'),
        v_now
      );
    end if;

    if v_detach_this then
      insert into public.booking_events (
        appointment_id, event_type, actor_type, old_data, new_data, created_at
      ) values (
        v_appointment.id,
        'group_detached',
        p_actor_type,
        jsonb_build_object('group_management_active', v_appointment.group_management_active),
        jsonb_build_object('group_management_active', false, 'group_detached_at', v_now),
        v_now
      );
    end if;

    v_result_appointments := array_append(v_result_appointments, v_appointment.id);
  end loop;

  return jsonb_build_object(
    'refund_required', (select jsonb_array_length(v_result_refunds) > 0),
    'appointments',    to_jsonb(v_result_appointments),
    'refunds',         v_result_refunds,
    'unpaid_bills',    v_result_bills
  );
end;
$$;

revoke all on function public.claim_booking_cancellation(uuid[], timestamptz, text) from public, anon, authenticated;
grant execute on function public.claim_booking_cancellation(uuid[], timestamptz, text) to service_role;

-- ---------------------------------------------------------------------------
-- 2. sync_appointment_after_refund — trigger that truthfully synchronizes
--    appointment payment_status when a booking_refunds row transitions.
--    only a confirmed refund writes to payment_status; pending and exception
--    retain the current value. emits audit events exactly once per transition.
-- ---------------------------------------------------------------------------
create or replace function public.sync_appointment_after_refund()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  -- fire only when status actually changes; old.status is distinct from new.status
  if old.status is distinct from new.status then

    if new.status = 'confirmed' then
      update public.appointments
      set payment_status = 'refunded'
      where id = new.appointment_id
        and payment_status = 'paid';

      insert into public.booking_events (
        appointment_id, event_type, actor_type, old_data, new_data, created_at
      ) values (
        new.appointment_id,
        'refund_confirmed',
        'provider',
        jsonb_build_object('refund_status', old.status),
        jsonb_build_object('refund_status', 'confirmed', 'payment_status', 'refunded'),
        clock_timestamp()
      );

    elsif new.status in ('failed', 'exception') then
      -- retain payment_status = 'paid' — do not mark refunded on failure
      insert into public.booking_events (
        appointment_id, event_type, actor_type, old_data, new_data, created_at
      ) values (
        new.appointment_id,
        'refund_failed',
        'provider',
        jsonb_build_object('refund_status', old.status),
        jsonb_build_object('refund_status', new.status),
        clock_timestamp()
      );
    end if;

  end if;

  return new;
end;
$$;

drop trigger if exists trg_sync_appointment_after_refund on public.booking_refunds;

create trigger trg_sync_appointment_after_refund
  after update on public.booking_refunds
  for each row
  execute function public.sync_appointment_after_refund();

-- ---------------------------------------------------------------------------
-- 3. replace confirm_appointment_payment to scope every group query to
--    active management members only. A detached (cancelled) guest must never
--    make the remaining active group look "mixed" or receive a confirmation.
-- ---------------------------------------------------------------------------
create or replace function public.confirm_appointment_payment(p_bill_id text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_lead public.appointments%rowtype;
  v_problem public.appointments%rowtype;
  v_rows jsonb := '[]'::jsonb;
  v_problem_status text;
  v_should_alert boolean := false;
  v_alert_claim_count integer := 0;
begin
  if p_bill_id is null or btrim(p_bill_id) = '' then
    return jsonb_build_object(
      'state', 'not_found', 'lead_id', null, 'group_id', null,
      'booking_status', null, 'should_alert', false, 'rows', '[]'::jsonb
    );
  end if;

  -- serialize duplicate provider callbacks for exactly-once state transition
  perform pg_advisory_xact_lock(hashtextextended('appointment-payment|' || p_bill_id, 0));

  select * into v_lead
  from public.appointments
  where payment_bill_id = p_bill_id
  order by created_at asc, id asc
  limit 1
  for update;

  if not found then
    return jsonb_build_object(
      'state', 'not_found', 'lead_id', null, 'group_id', null,
      'booking_status', null, 'should_alert', false, 'rows', '[]'::jsonb
    );
  end if;

  if v_lead.group_id is not null then
    -- lock every active member before making any idempotency/eligibility decision.
    -- detached historical members are excluded: group_id = v_lead.group_id and group_management_active = true
    perform 1
    from public.appointments
    where group_id = v_lead.group_id and group_management_active = true
    for update;

    -- already confirmed: every active member is confirmed
    if not exists (
      select 1
      from public.appointments
      where group_id = v_lead.group_id and group_management_active = true
        and status <> 'confirmed'
    ) then
      return jsonb_build_object(
        'state', 'already_confirmed', 'lead_id', v_lead.id, 'group_id', v_lead.group_id,
        'booking_status', 'confirmed', 'should_alert', false, 'rows', '[]'::jsonb
      );
    elsif not exists (
      select 1
      from public.appointments
      where group_id = v_lead.group_id and group_management_active = true
        and status <> 'awaiting_payment'
    ) then
      -- every active member is payable; continue to the atomic update below
      null;
    elsif (
      select count(distinct status)
      from public.appointments
      where group_id = v_lead.group_id and group_management_active = true
    ) > 1 then
      -- a historical partial transition among active members is terminal
      v_problem := v_lead;
      v_problem_status := 'mixed_group';
    else
      select *
      into v_problem
      from public.appointments
      where group_id = v_lead.group_id and group_management_active = true
      order by created_at asc, id asc
      limit 1;
    end if;
  else
    if v_lead.status = 'confirmed' then
      return jsonb_build_object(
        'state', 'already_confirmed', 'lead_id', v_lead.id, 'group_id', null,
        'booking_status', 'confirmed', 'should_alert', false, 'rows', '[]'::jsonb
      );
    elsif v_lead.status <> 'awaiting_payment' then
      v_problem := v_lead;
    end if;
  end if;

  if v_problem_status is null and v_problem.id is not null then
    v_problem_status := case
      when v_problem.status = 'cancelled'
        and v_problem.cancellation_reason = 'Payment wasn''t completed in time — the slot has been released. You''re welcome to book again.'
      then 'expired'
      else v_problem.status::text
    end;
  end if;

  if v_problem_status is not null then
    update public.appointments
    set payment_problem_alerted_at = now()
    where id = v_lead.id
      and payment_problem_alerted_at is null;
    get diagnostics v_alert_claim_count = row_count;
    v_should_alert := v_alert_claim_count = 1;

    return jsonb_build_object(
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
  end if;

  -- atomic confirmation update — active members only; detached rows excluded
  with changed as (
    update public.appointments
    set payment_status = 'paid', paid_at = now(), status = 'confirmed'
    where (
      v_lead.group_id is not null and group_id = v_lead.group_id and group_management_active = true
      or v_lead.group_id is null and id = v_lead.id
    )
      and status = 'awaiting_payment'
    returning id, patient_name, guest_age, treatment_name, appointment_date_time, patient_email
  )
  select coalesce(jsonb_agg(to_jsonb(changed) order by id), '[]'::jsonb)
  into v_rows
  from changed;

  return jsonb_build_object(
    'state', 'confirmed', 'lead_id', v_lead.id, 'group_id', v_lead.group_id,
    'booking_status', 'confirmed', 'should_alert', false, 'rows', v_rows
  );
end;
$$;

revoke all on function public.confirm_appointment_payment(text) from public;
grant execute on function public.confirm_appointment_payment(text) to service_role;
