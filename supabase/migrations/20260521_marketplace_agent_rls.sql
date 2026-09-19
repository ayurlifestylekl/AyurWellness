-- =====================================================================
-- Marketplace orders — agent self-service RLS (2026-05-21)
-- =====================================================================
-- Allows sales agents to:
--   * INSERT marketplace_orders rows where referral_agent_id = their own agent.id
--   * SELECT marketplace_orders rows where referral_agent_id = their own agent.id
-- Admin keeps full access (existing policy).
--
-- Also adds a column to record which user (agent or admin) entered the row,
-- distinct from the admin who later approved it.
--
-- Safe to re-run. Apply via Supabase SQL Editor.
-- =====================================================================

ALTER TABLE public.marketplace_orders
  ADD COLUMN IF NOT EXISTS entered_by_user_id UUID REFERENCES public.users(id);

-- Backfill from the legacy admin column for any existing rows
UPDATE public.marketplace_orders
SET entered_by_user_id = entered_by_admin_id
WHERE entered_by_user_id IS NULL AND entered_by_admin_id IS NOT NULL;

-- Agents can read their own submissions
DROP POLICY IF EXISTS "Agent reads own marketplace orders" ON public.marketplace_orders;
CREATE POLICY "Agent reads own marketplace orders" ON public.marketplace_orders
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.sales_agents a
      WHERE a.id = marketplace_orders.referral_agent_id
        AND a.user_id = auth.uid()
        AND a.status = 'active'
    )
  );

-- Agents can submit new orders attributed to themselves (status MUST be 'pending')
DROP POLICY IF EXISTS "Agent submits marketplace orders" ON public.marketplace_orders;
CREATE POLICY "Agent submits marketplace orders" ON public.marketplace_orders
  FOR INSERT WITH CHECK (
    status = 'pending' AND
    EXISTS (
      SELECT 1 FROM public.sales_agents a
      WHERE a.id = referral_agent_id
        AND a.user_id = auth.uid()
        AND a.status = 'active'
    )
  );
