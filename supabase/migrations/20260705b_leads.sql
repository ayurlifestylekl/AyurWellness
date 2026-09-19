-- ============================================================================
-- Lead capture (2026-07-05). Idempotent. Apply via Supabase SQL Editor.
--
-- Details captured by the public site's welcome popup and the WhatsApp gate.
-- Viewed + exported (CSV/Excel) from Admin → Leads.
-- ============================================================================

create table if not exists public.leads (
  id          uuid primary key default gen_random_uuid(),
  name        text,
  email       text,
  phone       text,
  source      text not null default 'unknown' check (source in ('welcome_popup','whatsapp_gate','unknown')),
  created_at  timestamptz not null default now()
);

create index if not exists leads_created_idx on public.leads(created_at desc);

-- Public capture goes through a validated service-role server action (bypasses
-- RLS). Admins read the list/export with their own session via this policy;
-- there is no public/anon access.
alter table public.leads enable row level security;

drop policy if exists leads_admin_read on public.leads;
create policy leads_admin_read on public.leads
  for select using (public.is_admin());
