-- =====================================================================
-- Admin Sales Agents — Part 2: Commission ledger + Payouts (2026-05-21)
-- =====================================================================
-- Adds:
--   * agent_commissions ledger — one row per paid order × attributed agent
--   * agent_payouts — admin records lump-sum payments to agents
--   * Trigger on orders to auto-create commission rows when paid
--   * Trigger to auto-reverse on cancel/refund
--   * Trigger to keep sales_agents aggregate totals in sync
--
-- Safe to re-run. Apply via Supabase SQL Editor.
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1. Enums
-- ---------------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE public.commission_status_enum AS ENUM (
    'pending', 'paid', 'reversed'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

 
-- ---------------------------------------------------------------------
-- 2. agent_commissions — ledger of individual commission events
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.agent_commissions (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id            UUID NOT NULL REFERENCES public.sales_agents(id) ON DELETE RESTRICT,
  order_id            UUID NOT NULL REFERENCES public.orders(id) ON DELETE RESTRICT,
  base_amount_rm      DECIMAL(10,2) NOT NULL,    -- order.total_amount_rm at time of commission
  rate_percent        DECIMAL(5,2)  NOT NULL,    -- agent.commission_rate at time of commission
  commission_rm       DECIMAL(10,2) NOT NULL,    -- base × rate / 100
  status              public.commission_status_enum NOT NULL DEFAULT 'pending',
  payout_id           UUID,                       -- references agent_payouts.id once paid (FK added below)
  reversal_reason     TEXT,
  notes               TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  paid_at             TIMESTAMPTZ,
  reversed_at         TIMESTAMPTZ,
  UNIQUE (order_id, agent_id)
);

CREATE INDEX IF NOT EXISTS agent_commissions_agent_status_idx
  ON public.agent_commissions(agent_id, status);

CREATE INDEX IF NOT EXISTS agent_commissions_order_idx
  ON public.agent_commissions(order_id);

ALTER TABLE public.agent_commissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin manages commissions" ON public.agent_commissions;
CREATE POLICY "Admin manages commissions" ON public.agent_commissions
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Agent can read their own commissions (for the agent portal)
DROP POLICY IF EXISTS "Agent reads own commissions" ON public.agent_commissions;
CREATE POLICY "Agent reads own commissions" ON public.agent_commissions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.sales_agents a
      WHERE a.id = agent_commissions.agent_id AND a.user_id = auth.uid()
    )
  );


-- ---------------------------------------------------------------------
-- 3. agent_payouts — lump-sum disbursements to agents
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.agent_payouts (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id             UUID NOT NULL REFERENCES public.sales_agents(id) ON DELETE RESTRICT,
  amount_rm            DECIMAL(10,2) NOT NULL CHECK (amount_rm > 0),
  commission_count     INT NOT NULL DEFAULT 0,
  period_start         DATE,
  period_end           DATE,
  payment_method       TEXT NOT NULL,             -- 'bank_transfer' / 'cash' / 'fpx' / 'cheque'
  bank_reference       TEXT,
  notes                TEXT,
  created_by_admin_id  UUID REFERENCES public.users(id),
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS agent_payouts_agent_idx
  ON public.agent_payouts(agent_id, created_at DESC);

ALTER TABLE public.agent_payouts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin manages payouts" ON public.agent_payouts;
CREATE POLICY "Admin manages payouts" ON public.agent_payouts
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Agent reads their own payouts
DROP POLICY IF EXISTS "Agent reads own payouts" ON public.agent_payouts;
CREATE POLICY "Agent reads own payouts" ON public.agent_payouts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.sales_agents a
      WHERE a.id = agent_payouts.agent_id AND a.user_id = auth.uid()
    )
  );


-- ---------------------------------------------------------------------
-- 4. FK from commissions → payouts (added after both tables exist)
-- ---------------------------------------------------------------------
DO $$ BEGIN
  ALTER TABLE public.agent_commissions
    ADD CONSTRAINT agent_commissions_payout_fk
      FOREIGN KEY (payout_id) REFERENCES public.agent_payouts(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;


-- ---------------------------------------------------------------------
-- 5. Trigger: auto-create commission when order is paid
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.create_commission_on_paid()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
DECLARE
  v_agent_id     UUID;
  v_agent_rate   DECIMAL(5,2);
  v_total_rm     DECIMAL(10,2);
BEGIN
  -- Only fire when status flips TO paid (not on subsequent updates)
  IF NEW.payment_status = 'paid'
     AND (OLD.payment_status IS DISTINCT FROM 'paid')
     AND NEW.referral_agent_id IS NOT NULL THEN
    v_agent_id := NEW.referral_agent_id;
    v_total_rm := NEW.total_amount_rm;
    SELECT commission_rate INTO v_agent_rate
    FROM public.sales_agents WHERE id = v_agent_id;
    IF v_agent_rate IS NOT NULL THEN
      INSERT INTO public.agent_commissions
        (agent_id, order_id, base_amount_rm, rate_percent, commission_rm)
      VALUES
        (v_agent_id, NEW.id, v_total_rm, v_agent_rate,
         ROUND(v_total_rm * v_agent_rate / 100, 2))
      ON CONFLICT (order_id, agent_id) DO NOTHING;
    END IF;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS orders_create_commission ON public.orders;
CREATE TRIGGER orders_create_commission
  AFTER UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.create_commission_on_paid();


-- ---------------------------------------------------------------------
-- 6. Trigger: auto-reverse commission when order cancelled or refunded
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.reverse_commission_on_refund_or_cancel()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
BEGIN
  IF (NEW.fulfillment_status = 'cancelled' AND OLD.fulfillment_status IS DISTINCT FROM 'cancelled')
     OR (NEW.payment_status = 'refunded' AND OLD.payment_status IS DISTINCT FROM 'refunded') THEN
    UPDATE public.agent_commissions
    SET status = 'reversed',
        reversed_at = now(),
        reversal_reason = COALESCE(reversal_reason,
          'Auto-reversed: order ' || NEW.fulfillment_status::TEXT || '/' || NEW.payment_status::TEXT)
    WHERE order_id = NEW.id
      AND status = 'pending';
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS orders_reverse_commission ON public.orders;
CREATE TRIGGER orders_reverse_commission
  AFTER UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.reverse_commission_on_refund_or_cancel();


-- ---------------------------------------------------------------------
-- 7. Trigger: keep sales_agents aggregates in sync
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.recompute_agent_totals(p_agent_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
DECLARE
  v_sales DECIMAL(10,2);
  v_comm  DECIMAL(10,2);
BEGIN
  SELECT
    COALESCE(SUM(base_amount_rm) FILTER (WHERE status != 'reversed'), 0),
    COALESCE(SUM(commission_rm) FILTER (WHERE status != 'reversed'), 0)
  INTO v_sales, v_comm
  FROM public.agent_commissions
  WHERE agent_id = p_agent_id;

  UPDATE public.sales_agents
  SET total_sales_generated_rm  = v_sales,
      total_commission_earned_rm = v_comm
  WHERE id = p_agent_id;
END $$;

CREATE OR REPLACE FUNCTION public.agent_commissions_update_aggregates()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.recompute_agent_totals(NEW.agent_id);
  ELSIF TG_OP = 'UPDATE' THEN
    PERFORM public.recompute_agent_totals(NEW.agent_id);
    IF NEW.agent_id IS DISTINCT FROM OLD.agent_id THEN
      PERFORM public.recompute_agent_totals(OLD.agent_id);
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM public.recompute_agent_totals(OLD.agent_id);
  END IF;
  RETURN COALESCE(NEW, OLD);
END $$;

DROP TRIGGER IF EXISTS commissions_keep_aggregates ON public.agent_commissions;
CREATE TRIGGER commissions_keep_aggregates
  AFTER INSERT OR UPDATE OR DELETE ON public.agent_commissions
  FOR EACH ROW EXECUTE FUNCTION public.agent_commissions_update_aggregates();
