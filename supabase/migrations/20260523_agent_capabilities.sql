-- =====================================================================
-- Agent capabilities: replace single commission_type with two flags
-- (2026-05-23)
-- =====================================================================
-- A partner can now be affiliate, reseller, or both. We keep the legacy
-- `commission_type` column for backfill compatibility but stop driving
-- UI off of it.
--
-- Also adds payout + shipping fields for the Profile page (only the
-- relevant section is shown per capability).
--
-- Safe to re-run. Apply via Supabase SQL Editor.
-- =====================================================================

-- 1. sales_agents capability + profile columns -------------------------
ALTER TABLE public.sales_agents
  ADD COLUMN IF NOT EXISTS can_affiliate BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS can_wholesale BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS payout_method        TEXT,   -- 'bank_transfer' | 'tng_ewallet'
  ADD COLUMN IF NOT EXISTS payout_bank_name     TEXT,
  ADD COLUMN IF NOT EXISTS payout_account_name  TEXT,
  ADD COLUMN IF NOT EXISTS payout_account_no    TEXT,
  ADD COLUMN IF NOT EXISTS payout_tng_phone     TEXT,
  ADD COLUMN IF NOT EXISTS shipping_address     TEXT,
  ADD COLUMN IF NOT EXISTS shipping_postcode    TEXT,
  ADD COLUMN IF NOT EXISTS shipping_state       TEXT;

-- Backfill capability flags from legacy commission_type, if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'sales_agents'
      AND column_name = 'commission_type'
  ) THEN
    UPDATE public.sales_agents
    SET
      can_affiliate = (commission_type = 'affiliate'),
      can_wholesale = (commission_type = 'reseller')
    WHERE can_affiliate IS NULL OR can_wholesale IS NULL OR
          (can_affiliate = true AND can_wholesale = false AND commission_type = 'reseller');
  END IF;
END $$;

-- Enforce: at least one capability must be set
DO $$ BEGIN
  ALTER TABLE public.sales_agents
    ADD CONSTRAINT sales_agents_at_least_one_capability
    CHECK (can_affiliate OR can_wholesale);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2. agent_invites: same capability columns ----------------------------
ALTER TABLE public.agent_invites
  ADD COLUMN IF NOT EXISTS can_affiliate BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS can_wholesale BOOLEAN NOT NULL DEFAULT false;

-- Same constraint on invites
DO $$ BEGIN
  ALTER TABLE public.agent_invites
    ADD CONSTRAINT agent_invites_at_least_one_capability
    CHECK (can_affiliate OR can_wholesale);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 3. Update claim_agent_invite RPC to carry capabilities forward -------
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
  SELECT * INTO v_invite
    FROM public.agent_invites
    WHERE token = p_token
      AND used_at IS NULL
      AND expires_at > now()
    FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'INVALID_OR_EXPIRED_INVITE';
  END IF;

  UPDATE public.users
    SET role      = 'sales_agent',
        full_name = COALESCE(full_name, v_invite.full_name)
    WHERE id = p_user_id;

  INSERT INTO public.sales_agents (
    user_id, referral_code, commission_rate, commission_type,
    can_affiliate, can_wholesale
  ) VALUES (
    p_user_id,
    v_invite.referral_code,
    v_invite.commission_rate,
    v_invite.commission_type,
    v_invite.can_affiliate,
    v_invite.can_wholesale
  ) RETURNING id INTO v_agent_id;

  UPDATE public.agent_invites
    SET used_at         = now(),
        used_by_user_id = p_user_id
    WHERE id = v_invite.id;

  RETURN json_build_object(
    'agent_id',       v_agent_id,
    'referral_code',  v_invite.referral_code,
    'commission_type', v_invite.commission_type,
    'can_affiliate',  v_invite.can_affiliate,
    'can_wholesale',  v_invite.can_wholesale
  );
END;
$$;

REVOKE ALL ON FUNCTION public.claim_agent_invite(TEXT, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.claim_agent_invite(TEXT, UUID) TO authenticated;

-- 4. Backfill demo agent (from seed_demo_users.sql) to be a hybrid -----
UPDATE public.sales_agents
SET can_affiliate = true,
    can_wholesale = true
WHERE referral_code = 'DEMO2026';
