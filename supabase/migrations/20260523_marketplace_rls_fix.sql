-- =====================================================================
-- Marketplace RLS fix: align with 'pending_payment' flow (2026-05-23)
-- =====================================================================
-- The earlier RLS policy required status = 'pending' on insert, but
-- agents now insert with 'pending_payment' (batched payment flow).
-- Also adds an UPDATE policy so agents can attach a payment proof URL
-- and flip their own orders 'pending_payment' → 'pending'.
--
-- Safe to re-run.
-- =====================================================================

-- INSERT: allow 'pending_payment' (new) instead of 'pending' (old)
DROP POLICY IF EXISTS "Agent submits marketplace orders" ON public.marketplace_orders;
CREATE POLICY "Agent submits marketplace orders" ON public.marketplace_orders
  FOR INSERT WITH CHECK (
    status = 'pending_payment' AND
    EXISTS (
      SELECT 1 FROM public.sales_agents a
      WHERE a.id = referral_agent_id
        AND a.user_id = auth.uid()
        AND a.status = 'active'
    )
  );

-- UPDATE: agent can update own rows ONLY while still in pending_payment
-- and ONLY to flip status to 'pending' (after payment). They can also
-- attach payment_proof_url and tweak notes during this window.
DROP POLICY IF EXISTS "Agent updates own pending payment orders" ON public.marketplace_orders;
CREATE POLICY "Agent updates own pending payment orders" ON public.marketplace_orders
  FOR UPDATE
  USING (
    status = 'pending_payment'
    AND EXISTS (
      SELECT 1 FROM public.sales_agents a
      WHERE a.id = marketplace_orders.referral_agent_id
        AND a.user_id = auth.uid()
        AND a.status = 'active'
    )
  )
  WITH CHECK (
    -- Only allow the transition to 'pending'; never 'approved' / 'rejected'
    status IN ('pending_payment', 'pending')
    AND EXISTS (
      SELECT 1 FROM public.sales_agents a
      WHERE a.id = marketplace_orders.referral_agent_id
        AND a.user_id = auth.uid()
        AND a.status = 'active'
    )
  );
