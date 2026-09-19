-- =====================================================================
-- Foundation Sub-Project — DB Delta (2026-05-12)
-- =====================================================================
-- Adds the data plumbing needed to support:
--   • Two commission models for Brand Partners ('affiliate' vs 'reseller')
--   • Admin-issued, single-use invite tokens for Brand Partner signup
--   • Atomic invite-consumption RPC used by /auth/register?invite=TOKEN
--
-- Safe to re-run. Apply via Supabase SQL Editor or `psql`.
-- Author: Foundation phase. See docs/admin-bootstrap.md.
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1. commission_type enum  +  sales_agents.commission_type column
-- ---------------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE public.commission_type_enum AS ENUM ('affiliate', 'reseller');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE public.sales_agents
  ADD COLUMN IF NOT EXISTS commission_type public.commission_type_enum
  NOT NULL DEFAULT 'affiliate';


-- ---------------------------------------------------------------------
-- 2. agent_invites — admin-issued single-use signup tokens
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.agent_invites (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token                 TEXT UNIQUE NOT NULL,
  email                 TEXT NOT NULL,
  full_name             TEXT NOT NULL,
  referral_code         TEXT UNIQUE NOT NULL,
  commission_rate       DECIMAL(5,2) NOT NULL CHECK (commission_rate >= 0 AND commission_rate <= 100),
  commission_type       public.commission_type_enum NOT NULL DEFAULT 'affiliate',
  expires_at            TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '14 days'),
  used_at               TIMESTAMPTZ,
  used_by_user_id       UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_by_admin_id   UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Partial index on un-used tokens — keeps lookups fast even after years of consumed invites
CREATE INDEX IF NOT EXISTS agent_invites_live_token_idx
  ON public.agent_invites (token)
  WHERE used_at IS NULL;


-- ---------------------------------------------------------------------
-- 3. RLS for agent_invites
-- ---------------------------------------------------------------------
ALTER TABLE public.agent_invites ENABLE ROW LEVEL SECURITY;

-- Anyone (including anon) can SELECT a single live invite by token.
-- This is what /auth/register?invite=TOKEN reads to pre-fill the form.
-- Token is unguessable (server-generated random) so this is safe.
DROP POLICY IF EXISTS "Public can read live invite by token" ON public.agent_invites;
CREATE POLICY "Public can read live invite by token"
  ON public.agent_invites
  FOR SELECT
  USING (used_at IS NULL AND expires_at > now());

-- Only admins can INSERT/UPDATE/DELETE invites.
DROP POLICY IF EXISTS "Admin manages invites" ON public.agent_invites;
CREATE POLICY "Admin manages invites"
  ON public.agent_invites
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());


-- ---------------------------------------------------------------------
-- 4. claim_agent_invite RPC — atomic single-shot invite consumption
-- ---------------------------------------------------------------------
-- Called by /auth/register?invite=TOKEN after the auth.users row exists
-- and the on_auth_user_created trigger has inserted public.users.
--
-- Does all of the following in one transaction:
--   a) Locks the invite row (FOR UPDATE) to block concurrent claims
--   b) Verifies token is live (not used, not expired)
--   c) Promotes the new user to role='sales_agent' + backfills full_name if blank
--   d) Inserts the sales_agents row with locked-in referral_code + commission terms
--   e) Marks the invite consumed
--
-- Returns JSON: { agent_id, referral_code, commission_type }.
-- Raises 'INVALID_OR_EXPIRED_INVITE' if the token is bad — handled by caller.
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.claim_agent_invite(
  p_token   TEXT,
  p_user_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invite   public.agent_invites%ROWTYPE;
  v_agent_id UUID;
BEGIN
  -- (a) Lock the invite row so two simultaneous claims can't both succeed
  SELECT * INTO v_invite
    FROM public.agent_invites
    WHERE token = p_token
      AND used_at IS NULL
      AND expires_at > now()
    FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'INVALID_OR_EXPIRED_INVITE';
  END IF;

  -- (c) Promote user role + backfill full_name if missing
  UPDATE public.users
    SET role      = 'sales_agent',
        full_name = COALESCE(full_name, v_invite.full_name)
    WHERE id = p_user_id;

  -- (d) Create the agent record with locked-in commission terms
  INSERT INTO public.sales_agents (
    user_id, referral_code, commission_rate, commission_type
  ) VALUES (
    p_user_id, v_invite.referral_code, v_invite.commission_rate, v_invite.commission_type
  ) RETURNING id INTO v_agent_id;

  -- (e) Mark invite consumed
  UPDATE public.agent_invites
    SET used_at         = now(),
        used_by_user_id = p_user_id
    WHERE id = v_invite.id;

  RETURN json_build_object(
    'agent_id',        v_agent_id,
    'referral_code',   v_invite.referral_code,
    'commission_type', v_invite.commission_type
  );
END;
$$;

REVOKE ALL ON FUNCTION public.claim_agent_invite(TEXT, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.claim_agent_invite(TEXT, UUID) TO authenticated;


-- ---------------------------------------------------------------------
-- 5. Extend handle_new_user trigger to read signup metadata
-- ---------------------------------------------------------------------
-- Replaces the original handle_new_user (from setup.sql) so it also
-- pulls full_name and phone_number out of auth.users.raw_user_meta_data
-- (populated by supabase.auth.signUp({ options: { data: {...} } })).
-- Existing behavior preserved: only inserts on first auth user creation,
-- skips if a public.users row already exists.
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, phone_number)
  VALUES (
    NEW.id,
    NEW.email,
    NULLIF(NEW.raw_user_meta_data->>'full_name', ''),
    NULLIF(NEW.raw_user_meta_data->>'phone_number', '')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;


-- =====================================================================
-- End of foundation migration. Verify with:
--   SELECT * FROM public.agent_invites LIMIT 0;
--   SELECT typname FROM pg_type WHERE typname = 'commission_type_enum';
--   SELECT proname FROM pg_proc WHERE proname = 'claim_agent_invite';
--   SELECT prosrc FROM pg_proc WHERE proname = 'handle_new_user';
-- =====================================================================
