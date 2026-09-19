-- =====================================================================
-- Admin Sales Agents — Part 1 (2026-05-21)
-- =====================================================================
-- Adds management columns to sales_agents:
--   * status (active / suspended)
--   * suspended_at + suspended_reason
--   * internal_notes — staff-only context
--
-- Part 2 (tomorrow) will add agent_commissions + agent_payouts tables.
--
-- Safe to re-run. Apply via Supabase SQL Editor.
-- =====================================================================

DO $$ BEGIN
  CREATE TYPE public.agent_status_enum AS ENUM ('active', 'suspended');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.sales_agents
  ADD COLUMN IF NOT EXISTS status
    public.agent_status_enum NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS suspended_at      TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS suspended_reason  TEXT,
  ADD COLUMN IF NOT EXISTS internal_notes    TEXT,
  ADD COLUMN IF NOT EXISTS updated_at        TIMESTAMPTZ NOT NULL DEFAULT now();

CREATE INDEX IF NOT EXISTS sales_agents_status_idx
  ON public.sales_agents(status);

-- Touch updated_at on update
CREATE OR REPLACE FUNCTION public.sales_agents_touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS sales_agents_touch_updated_at ON public.sales_agents;
CREATE TRIGGER sales_agents_touch_updated_at
  BEFORE UPDATE ON public.sales_agents
  FOR EACH ROW EXECUTE FUNCTION public.sales_agents_touch_updated_at();
