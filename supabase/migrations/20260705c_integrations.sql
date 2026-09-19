-- ============================================================================
-- Integration settings (2026-07-05). Idempotent. Apply via Supabase SQL Editor.
--
-- Private, single-row config for third-party integrations. Holds the Telegram
-- bot token (a SECRET) — must NOT go in site_settings, which is world-readable.
-- Admins read/write via their session; the notifier reads via the service role.
-- ============================================================================

create table if not exists public.integration_settings (
  id                  integer primary key default 1 check (id = 1),
  telegram_bot_token  text,
  telegram_chat_id    text,
  updated_at          timestamptz not null default now()
);

insert into public.integration_settings (id) values (1) on conflict (id) do nothing;

alter table public.integration_settings enable row level security;

-- Admins only (no public/anon read — this holds a secret). The service role
-- bypasses RLS for the server-side notifier.
drop policy if exists integ_admin_all on public.integration_settings;
create policy integ_admin_all on public.integration_settings
  for all using (public.is_admin()) with check (public.is_admin());
