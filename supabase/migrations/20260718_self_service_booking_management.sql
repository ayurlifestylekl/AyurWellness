create table if not exists public.booking_management_otps (
  id uuid primary key default gen_random_uuid(),
  email_hash text not null,
  code_hash text not null,
  expires_at timestamptz not null,
  attempts integer not null default 0 check (attempts between 0 and 6),
  send_count integer not null default 1 check (send_count between 1 and 5),
  request_ip_hash text,
  consumed_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists booking_management_otps_lookup_idx
  on public.booking_management_otps(email_hash, created_at desc);
create index if not exists booking_management_otps_ip_idx
  on public.booking_management_otps(request_ip_hash, created_at desc);

create table if not exists public.booking_management_grants (
  id uuid primary key default gen_random_uuid(),
  token_hash text not null unique,
  email_hash text not null,
  appointment_ids uuid[] not null,
  expires_at timestamptz not null,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.booking_events (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null references public.appointments(id) on delete cascade,
  event_type text not null check (event_type in ('rescheduled','cancelled','group_detached','refund_requested','refund_confirmed','refund_failed','management_link_recovered')),
  actor_type text not null check (actor_type in ('customer','guest','staff','system','provider')),
  old_data jsonb not null default '{}'::jsonb,
  new_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists booking_events_appointment_idx on public.booking_events(appointment_id, created_at desc);

create table if not exists public.booking_refunds (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null references public.appointments(id) on delete restrict,
  provider text not null check (provider in ('stripe','billplz','stub')),
  provider_refund_id text,
  amount_rm numeric(10,2) not null check (amount_rm > 0),
  status text not null check (status in ('claimed','pending','confirmed','failed','exception')),
  eligibility_reason text not null check (eligibility_reason in ('mistake_window','advance_window')),
  idempotency_key text not null,
  bank_code text,
  bank_account_last4 text,
  failure_reason text,
  requested_at timestamptz,
  confirmed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (idempotency_key)
);
alter table public.booking_refunds enable row level security;

alter table public.appointments
  add column if not exists group_management_active boolean not null default true,
  add column if not exists group_detached_at timestamptz,
  add column if not exists management_reminder_sent_at timestamptz;

revoke all on public.booking_management_otps from anon, authenticated;
revoke all on public.booking_management_grants from anon, authenticated;
revoke all on public.booking_events from anon, authenticated;
revoke all on public.booking_refunds from anon, authenticated;

create or replace function public.reserve_booking_management_otp(
  p_email_hash text,
  p_code_hash text,
  p_request_ip_hash text
) returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_now timestamptz;
  v_otp_id uuid;
begin
  if p_email_hash is null or p_email_hash = ''
    or p_code_hash is null or p_code_hash = ''
    or p_request_ip_hash is null or p_request_ip_hash = '' then
    return null;
  end if;

  -- Every request takes locks in the same email-then-IP order. Requests for
  -- the same key serialize before they count and insert, closing check/insert races.
  perform pg_advisory_xact_lock(hashtextextended('booking-otp-email:' || p_email_hash, 0));
  perform pg_advisory_xact_lock(hashtextextended('booking-otp-ip:' || p_request_ip_hash, 0));
  v_now := clock_timestamp();

  if exists (
    select 1
    from public.booking_management_otps
    where email_hash = p_email_hash
      and created_at >= v_now - interval '60 seconds'
  ) then
    return null;
  end if;

  if (
    select count(*)
    from public.booking_management_otps
    where email_hash = p_email_hash
      and created_at >= v_now - interval '1 hour'
  ) >= 5 then
    return null;
  end if;

  if (
    select count(*)
    from public.booking_management_otps
    where request_ip_hash = p_request_ip_hash
      and created_at >= v_now - interval '1 hour'
  ) >= 20 then
    return null;
  end if;

  insert into public.booking_management_otps (
    email_hash,
    code_hash,
    expires_at,
    attempts,
    send_count,
    request_ip_hash,
    created_at
  ) values (
    p_email_hash,
    p_code_hash,
    v_now + interval '10 minutes',
    0,
    1,
    p_request_ip_hash,
    v_now
  )
  returning id into v_otp_id;

  return v_otp_id;
end;
$$;

create or replace function public.verify_booking_management_otp(
  p_email_hash text,
  p_code_hash text,
  p_normalized_email text,
  p_token_hash text
) returns text
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_now timestamptz;
  v_otp public.booking_management_otps%rowtype;
  v_appointment_ids uuid[];
  v_actual_hash bytea;
  v_expected_hash bytea;
  v_difference integer := 0;
  v_index integer;
begin
  if p_email_hash is null or p_email_hash = ''
    or p_code_hash is null or p_code_hash = ''
    or p_normalized_email is null or p_normalized_email = ''
    or p_token_hash is null or p_token_hash = '' then
    return 'unauthorized';
  end if;

  -- Serialize reservation and verification for an email so the locked row is
  -- the latest issued OTP for the whole transaction, never an older fallback.
  perform pg_advisory_xact_lock(hashtextextended('booking-otp-email:' || p_email_hash, 0));

  select *
  into v_otp
  from public.booking_management_otps
  where email_hash = p_email_hash
  order by created_at desc, id desc
  limit 1
  for update;

  v_now := clock_timestamp();

  if not found
    or v_otp.consumed_at is not null
    or v_otp.expires_at <= v_now
    or v_otp.attempts >= 6 then
    return 'unauthorized';
  end if;

  -- Both values are fixed-length HMAC hex strings. Compare every byte without
  -- returning early so a mismatched digit does not expose a useful prefix.
  v_actual_hash := convert_to(p_code_hash, 'UTF8');
  v_expected_hash := convert_to(v_otp.code_hash, 'UTF8');
  if octet_length(v_actual_hash) <> octet_length(v_expected_hash) then
    update public.booking_management_otps
    set attempts = least(6, attempts + 1)
    where id = v_otp.id;
    return 'unauthorized';
  end if;

  for v_index in 0..octet_length(v_expected_hash) - 1 loop
    v_difference := v_difference | (get_byte(v_actual_hash, v_index) # get_byte(v_expected_hash, v_index));
  end loop;

  if v_difference <> 0 then
    update public.booking_management_otps
    set attempts = least(6, attempts + 1)
    where id = v_otp.id;
    return 'unauthorized';
  end if;

  update public.booking_management_otps
  set consumed_at = v_now
  where id = v_otp.id;

  select coalesce(array_agg(id order by id), '{}'::uuid[])
  into v_appointment_ids
  from public.appointments
  where customer_id is null
    and is_guest = true
    and status::text = any (array['pending', 'scheduled', 'awaiting_payment', 'confirmed'])
    and lower(btrim(patient_email)) = p_normalized_email;

  if cardinality(v_appointment_ids) = 0 then
    return 'unauthorized';
  end if;

  update public.booking_management_grants
  set revoked_at = v_now
  where email_hash = p_email_hash
    and revoked_at is null
    and expires_at > v_now;

  insert into public.booking_management_grants (
    token_hash,
    email_hash,
    appointment_ids,
    expires_at
  ) values (
    p_token_hash,
    p_email_hash,
    v_appointment_ids,
    v_now + interval '30 days'
  );

  insert into public.booking_events (
    appointment_id,
    event_type,
    actor_type,
    old_data,
    new_data
  )
  select
    appointment_id,
    'management_link_recovered',
    'guest',
    '{}'::jsonb,
    '{}'::jsonb
  from unnest(v_appointment_ids) as appointment_id;

  return 'granted';
end;
$$;

revoke all on function public.reserve_booking_management_otp(text, text, text) from public, anon, authenticated;
grant execute on function public.reserve_booking_management_otp(text, text, text) to service_role;

revoke all on function public.verify_booking_management_otp(text, text, text, text) from public, anon, authenticated;
grant execute on function public.verify_booking_management_otp(text, text, text, text) to service_role;
