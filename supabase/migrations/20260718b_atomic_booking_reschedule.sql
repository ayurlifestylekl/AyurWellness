-- Atomic self-service appointment rescheduling. This migration remains local
-- until it is applied through the controlled release path.

-- Database-owned canonical capacity roster. Application roster values remain
-- useful for browse-time estimates, but this private table is authoritative at
-- write time inside reschedule_bookings.
create table if not exists public.booking_resource_members (
  resource_type text not null check (resource_type in ('gender', 'consultation')),
  resource_key text not null,
  member_key text not null,
  active boolean not null default true,
  primary key (resource_type, resource_key, member_key),
  unique (member_key),
  check (
    (resource_type = 'gender' and resource_key in ('men_only', 'ladies_only'))
    or (resource_type = 'consultation' and resource_key = 'vaidya')
  )
);

insert into public.booking_resource_members (resource_type, resource_key, member_key)
values
  ('gender', 'men_only', 'NT02'),
  ('gender', 'men_only', 'DP03'),
  ('gender', 'men_only', 'BN08'),
  ('gender', 'ladies_only', 'SM05'),
  ('gender', 'ladies_only', 'CR08'),
  ('gender', 'ladies_only', 'AS12'),
  ('consultation', 'vaidya', 'VAIDYA')
on conflict (resource_type, resource_key, member_key) do nothing;

alter table public.booking_resource_members enable row level security;
revoke all on public.booking_resource_members from anon, authenticated;
revoke all on public.booking_resource_members from public;

create or replace function public.reschedule_bookings(
  p_changes jsonb,
  p_actor_type text,
  p_now timestamptz
) returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_appointment_ids uuid[];
  v_resource_keys text[];
  v_resource_key text;
  v_change jsonb;
  v_other jsonb;
  v_appointment public.appointments%rowtype;
  v_locked_count integer;
  v_existing_count integer;
  v_batch_count integer;
  v_capacity integer;
  v_duration_mins integer;
  v_old_start timestamptz;
  v_new_start timestamptz;
  v_candidate_day date;
  v_detach_from_group boolean;
  v_now timestamptz;
  v_result jsonb := '[]'::jsonb;
begin
  if jsonb_typeof(p_changes) is distinct from 'array'
    or jsonb_array_length(p_changes) = 0 then
    raise exception 'INVALID_INPUT: reschedule_bookings requires a non-empty JSON array';
  end if;
  if p_actor_type not in ('customer', 'guest', 'staff', 'system', 'provider') then
    raise exception 'INVALID_INPUT: invalid actor';
  end if;

  begin
    select array_agg((c->>'appointment_id')::uuid order by (c->>'appointment_id')::uuid)
    into v_appointment_ids
    from jsonb_array_elements(p_changes) c;
  exception when others then
    raise exception 'INVALID_INPUT: every appointment_id must be a UUID';
  end;
  if cardinality(v_appointment_ids) <> (
    select count(distinct appointment_id)
    from unnest(v_appointment_ids) appointment_id
  ) then
    raise exception 'INVALID_INPUT: duplicate appointment_id';
  end if;

  -- Take appointment locks in one global order. Any wait here occurs before the
  -- authoritative clock is sampled, so time policy is re-evaluated afterwards.
  perform a.id
  from public.appointments a
  where a.id = any(v_appointment_ids)
  order by a.id
  for update;
  get diagnostics v_locked_count = row_count;
  if v_locked_count <> cardinality(v_appointment_ids) then
    raise exception 'INVALID_INPUT: appointment not found';
  end if;

  -- Validate immutable/source semantics against the locked rows. Time policy is
  -- intentionally deferred until every potentially blocking lock is held.
  for v_change in
    select c
    from jsonb_array_elements(p_changes) c
    order by (c->>'appointment_id')::uuid
  loop
    select * into strict v_appointment
    from public.appointments
    where id = (v_change->>'appointment_id')::uuid;

    if coalesce(v_change->>'old_start', '') = ''
      or coalesce(v_change->>'new_start', '') = ''
      or coalesce(v_change->>'resource_type', '') = ''
      or coalesce(v_change->>'resource_key', '') = ''
      or coalesce(v_change->>'capacity', '') !~ '^[0-9]+$'
      or coalesce(v_change->>'duration_mins', '') !~ '^[0-9]+$' then
      raise exception 'INVALID_INPUT: malformed reschedule change';
    end if;

    begin
      v_old_start := (v_change->>'old_start')::timestamptz;
      v_new_start := (v_change->>'new_start')::timestamptz;
      v_duration_mins := (v_change->>'duration_mins')::integer;
      v_detach_from_group := coalesce((v_change->>'detach_from_group')::boolean, false);
    exception when others then
      raise exception 'INVALID_INPUT: malformed reschedule value';
    end;

    if v_duration_mins < 1 or v_duration_mins > 1440 then
      raise exception 'INVALID_INPUT: invalid duration';
    end if;
    if v_appointment.appointment_date_time is distinct from v_old_start then
      raise exception 'INVALID_INPUT: old_start no longer matches appointment';
    end if;
    if v_appointment.status::text not in ('pending', 'scheduled', 'confirmed') then
      raise exception 'POLICY_CLOSED: appointment status cannot be rescheduled';
    end if;

    if v_appointment.booking_kind = 'consultation' then
      if v_change->>'resource_type' <> 'consultation'
        or v_change->>'resource_key' <> 'vaidya'
        or v_duration_mins <> 30 then
        raise exception 'INVALID_INPUT: consultation reschedule semantics changed';
      end if;
    elsif v_appointment.booking_kind = 'treatment' then
      if v_change->>'resource_type' <> 'gender'
        or v_change->>'resource_key' <> v_appointment.gender_requirement::text
        or v_duration_mins <> v_appointment.duration_mins then
        raise exception 'INVALID_INPUT: treatment reschedule semantics changed';
      end if;
    else
      raise exception 'INVALID_INPUT: unknown booking kind';
    end if;

    if v_detach_from_group and v_appointment.group_id is null then
      raise exception 'INVALID_INPUT: ungrouped appointment cannot detach';
    end if;
  end loop;

  select array_agg(distinct key order by key)
  into v_resource_keys
  from (
    select (c->>'resource_type') || '|' || (c->>'resource_key') || '|' ||
      to_char((c->>'new_start')::timestamptz at time zone 'Asia/Kuala_Lumpur', 'YYYY-MM-DD') as key
    from jsonb_array_elements(p_changes) c
  ) resource_locks;

  foreach v_resource_key in array v_resource_keys loop
    -- Identical namespace to claim_instant_slots: new claims and moves contend.
    perform pg_advisory_xact_lock(hashtextextended(v_resource_key, 0));
  end loop;

  -- SHARE ROW EXCLUSIVE conflicts with the ROW EXCLUSIVE lock taken by
  -- INSERT/UPDATE/DELETE. A block committed before this lock is visible to the
  -- recount below; a later block writer waits for this transaction to finish.
  lock table public.schedule_blocks in share row exclusive mode;
  -- Roster mutations are likewise serialized with the capacity derivation.
  lock table public.booking_resource_members in share mode;

  -- Trusted database time is captured only after every potentially blocking
  -- row/advisory/table lock. The compatibility time argument is never used.
  v_now := clock_timestamp();

  -- Re-evaluate exact cutoff and future-start policy using post-lock DB time.
  for v_change in
    select c
    from jsonb_array_elements(p_changes) c
    order by (c->>'appointment_id')::uuid
  loop
    select * into strict v_appointment
    from public.appointments
    where id = (v_change->>'appointment_id')::uuid;
    v_new_start := (v_change->>'new_start')::timestamptz;

    if v_appointment.appointment_date_time < v_now + interval '24 hours' then
      raise exception 'POLICY_CLOSED: online rescheduling window has closed';
    end if;
    if v_new_start <= v_now then
      raise exception 'INVALID_INPUT: new appointment must be in the future';
    end if;
  end loop;

  -- Derive active capacity from the canonical roster minus centre/member blocks,
  -- then count persisted and same-batch occupancy. Caller capacity is ignored.
  for v_change in select c from jsonb_array_elements(p_changes) c loop
    v_new_start := (v_change->>'new_start')::timestamptz;
    v_duration_mins := (v_change->>'duration_mins')::integer;
    v_candidate_day := (v_new_start at time zone 'Asia/Kuala_Lumpur')::date;

    select count(*) into v_capacity
    from public.booking_resource_members rm
    where rm.resource_type = v_change->>'resource_type'
      and rm.resource_key = v_change->>'resource_key'
      and rm.active = true
      and not exists (
        select 1
        from public.schedule_blocks b
        where (b.therapist_code is null or b.therapist_code = rm.member_key)
          and (
            (b.recurrence = 'none'
              and v_candidate_day between
                (b.start_at at time zone 'Asia/Kuala_Lumpur')::date
                and (b.end_at at time zone 'Asia/Kuala_Lumpur')::date)
            or (b.recurrence = 'weekly'
              and v_candidate_day >= (b.start_at at time zone 'Asia/Kuala_Lumpur')::date
              and (b.until_date is null or v_candidate_day <= b.until_date)
              and extract(dow from v_candidate_day) = extract(
                dow from (b.start_at at time zone 'Asia/Kuala_Lumpur')::date
              ))
            or (b.recurrence = 'monthly'
              and v_candidate_day >= (b.start_at at time zone 'Asia/Kuala_Lumpur')::date
              and (b.until_date is null or v_candidate_day <= b.until_date)
              and extract(day from v_candidate_day) = extract(
                day from (b.start_at at time zone 'Asia/Kuala_Lumpur')::date
              ))
          )
          and (
            b.all_day
            or (
              v_new_start < ((
                  v_candidate_day
                  + (b.end_at at time zone 'Asia/Kuala_Lumpur')::time
                ) at time zone 'Asia/Kuala_Lumpur')
              and ((
                  v_candidate_day
                  + (b.start_at at time zone 'Asia/Kuala_Lumpur')::time
                ) at time zone 'Asia/Kuala_Lumpur')
                < v_new_start + (v_duration_mins * interval '1 minute')
            )
          )
      );

    select count(*) into v_existing_count
    from public.appointments a
    where not (a.id = any(v_appointment_ids))
      and a.status::text in ('scheduled', 'awaiting_payment', 'confirmed', 'checked_in', 'in_progress')
      and (a.status::text <> 'awaiting_payment' or a.payment_expires_at is null or a.payment_expires_at > v_now)
      and (
        (v_change->>'resource_type' = 'gender' and a.gender_requirement::text = v_change->>'resource_key')
        or (v_change->>'resource_type' = 'consultation' and a.booking_kind = 'consultation')
      )
      and public.appt_occupied_range(a.appointment_date_time, a.duration_mins)
        && public.appt_occupied_range(v_new_start, v_duration_mins);

    select count(*) into v_batch_count
    from jsonb_array_elements(p_changes) v_other
    where v_other->>'appointment_id' <> v_change->>'appointment_id'
      and v_other->>'resource_type' = v_change->>'resource_type'
      and v_other->>'resource_key' = v_change->>'resource_key'
      and tstzrange(
        (v_other->>'new_start')::timestamptz,
        (v_other->>'new_start')::timestamptz
          + ((v_other->>'duration_mins')::integer * interval '1 minute')
          + interval '30 minutes',
        '[)'
      ) && tstzrange(
        v_new_start,
        v_new_start + (v_duration_mins * interval '1 minute') + interval '30 minutes',
        '[)'
      );

    if v_existing_count + v_batch_count >= v_capacity then
      raise exception 'SLOT_FULL: % has no room at %', v_change->>'resource_key', v_new_start;
    end if;
  end loop;

  -- All mutation follows every policy/block/capacity guard. Payment columns are
  -- deliberately absent, preserving every payment/provider field.
  for v_change in
    select c
    from jsonb_array_elements(p_changes) c
    order by (c->>'appointment_id')::uuid
  loop
    select * into strict v_appointment
    from public.appointments
    where id = (v_change->>'appointment_id')::uuid;

    v_new_start := (v_change->>'new_start')::timestamptz;
    v_detach_from_group := coalesce((v_change->>'detach_from_group')::boolean, false);

    update public.appointments
    set requested_datetime = v_new_start,
        appointment_date_time = v_new_start,
        duration_mins = case when booking_kind = 'consultation' then 30 else duration_mins end,
        status = 'confirmed',
        updated_at = v_now
    where id = v_appointment.id;

    if v_appointment.booking_kind = 'treatment' then
      update public.appointments
      set assigned_therapist_code = null,
          assigned_therapist_name = null,
          assigned_therapist_gender = null,
          doctor_name = 'To be assigned'
      where id = v_appointment.id;
    end if;

    if v_detach_from_group then
      update public.appointments
      set group_management_active = false,
          group_detached_at = v_now
      where id = v_appointment.id;
    end if;

    insert into public.booking_events (
      appointment_id, event_type, actor_type, old_data, new_data, created_at
    ) values (
      v_appointment.id,
      'rescheduled',
      p_actor_type,
      jsonb_build_object(
        'appointment_date_time', v_appointment.appointment_date_time,
        'status', v_appointment.status,
        'assigned_therapist_code', v_appointment.assigned_therapist_code
      ),
      jsonb_build_object(
        'appointment_date_time', v_new_start,
        'status', 'confirmed',
        'assigned_therapist_code', case when v_appointment.booking_kind = 'treatment' then null else v_appointment.assigned_therapist_code end
      ),
      v_now
    );

    if v_detach_from_group then
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

    v_result := v_result || jsonb_build_array(jsonb_build_object(
      'appointment_id', v_appointment.id,
      'old_start', v_appointment.appointment_date_time,
      'new_start', v_new_start
    ));
  end loop;

  return v_result;
end;
$$;

revoke all on function public.reschedule_bookings(jsonb, text, timestamptz) from public, anon, authenticated;
grant execute on function public.reschedule_bookings(jsonb, text, timestamptz) to service_role;
