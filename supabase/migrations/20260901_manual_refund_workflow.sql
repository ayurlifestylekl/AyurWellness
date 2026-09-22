-- Manual refund approval workflow
-- 1. Customers cancel with a reason but no automatic refund.
-- 2. Customers separately request a refund with a reason and bank details.
-- 3. Staff approve (triggers provider refund) or reject (with a reason).

-- ---------------------------------------------------------------------------
-- 1. Extend booking_refunds to store request/approval metadata
-- ---------------------------------------------------------------------------

alter table public.booking_refunds
  add column if not exists customer_reason text,
  add column if not exists staff_reason text,
  add column if not exists bank_account_number text,
  add column if not exists bank_account_holder_name text;

-- Allow customers to request a refund and staff to reject it.
alter table public.booking_refunds
  drop constraint if exists booking_refunds_status_check;

alter table public.booking_refunds
  add constraint booking_refunds_status_check
    check (status in ('claimed', 'pending', 'confirmed', 'failed', 'exception', 'requested', 'rejected'));

comment on column public.booking_refunds.customer_reason is 'Reason provided by the customer when requesting a refund.';
comment on column public.booking_refunds.staff_reason is 'Reason provided by staff when rejecting a refund.';
comment on column public.booking_refunds.bank_account_number is 'Full bank account number collected for FPX refunds (sensitive).';
comment on column public.booking_refunds.bank_account_holder_name is 'Bank account holder name collected for FPX refunds.';

-- ---------------------------------------------------------------------------
-- 2. Replace claim_booking_cancellation so it records the customer reason and
--    no longer creates an automatic refund record. Refunds are requested
--    separately and approved by staff.
-- ---------------------------------------------------------------------------

drop function if exists public.claim_booking_cancellation(uuid[], timestamptz, text);

create or replace function public.claim_booking_cancellation(
  p_appointment_ids uuid[],
  p_now timestamptz,
  p_actor_type text,
  p_reason text default null
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
  v_is_paid boolean;
  v_group_id_val uuid;
  v_whole_group boolean := false;
  v_active_group_ids uuid[];
  v_detach_this boolean;
  v_idempotency_key text;
  v_result_appointments uuid[] := array[]::uuid[];
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
  end loop;

  -- ── mutations: all guards passed ─────────────────────────────────────────
  for v_appointment in
    select * from public.appointments
    where id = any(p_appointment_ids)
    order by id
  loop
    v_is_paid := v_appointment.payment_status = 'paid';
    v_detach_this := v_appointment.group_id is not null and not v_whole_group;

    -- cancel the appointment and optionally mark detached
    update public.appointments
    set status = 'cancelled',
        cancelled_at = v_now,
        cancellation_reason = coalesce(p_reason, 'Cancelled by customer'),
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

    -- audit event (cancelled)
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
        'appointment_date_time', v_appointment.appointment_date_time,
        'cancellation_reason', coalesce(p_reason, 'Cancelled by customer')
      ),
      v_now
    );

    v_result_appointments := array_append(v_result_appointments, v_appointment.id);
  end loop;

  return jsonb_build_object(
    'refund_required', false,
    'appointments',    to_jsonb(v_result_appointments),
    'refunds',         '[]'::jsonb,
    'unpaid_bills',    v_result_bills
  );
end;
$$;

revoke all on function public.claim_booking_cancellation(uuid[], timestamptz, text, text) from public, anon, authenticated;
grant execute on function public.claim_booking_cancellation(uuid[], timestamptz, text, text) to service_role;
