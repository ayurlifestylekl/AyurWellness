-- ============================================================================
-- promos + customer_promos — the customer-facing Promo Wallet foundation.
--
--   • promos            — master catalog (admin-managed)
--   • customer_promos   — per-user grant ledger (status + redemption tracking)
--
-- RLS:
--   • Anyone can SELECT active promos (claim-by-code needs this lookup).
--   • Customers SELECT + INSERT their own customer_promos rows.
--   • Admin (public.is_admin()) has full access to both tables.
--
-- Trigger:
--   • on_new_customer_grant_welcome — fires after INSERT on public.users
--     with role='customer'; auto-grants WELCOME10 to every new customer.
-- ============================================================================

-- ── promos (master catalog) ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.promos (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code            TEXT UNIQUE NOT NULL,
  title           TEXT NOT NULL,
  description     TEXT,
  kind            TEXT NOT NULL CHECK (kind IN ('percentage','fixed','free-shipping')),
  value_amount    NUMERIC(10,2),
  min_spend_rm    NUMERIC(10,2) DEFAULT 0,
  applies_to      TEXT NOT NULL DEFAULT 'all'
                  CHECK (applies_to IN ('all','products','treatments','consultation')),
  starts_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at      TIMESTAMPTZ,
  is_public       BOOLEAN NOT NULL DEFAULT FALSE,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.promos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "promos: public read active" ON public.promos;
CREATE POLICY "promos: public read active"
  ON public.promos FOR SELECT
  USING (is_active = TRUE);

DROP POLICY IF EXISTS "promos: admin full" ON public.promos;
CREATE POLICY "promos: admin full"
  ON public.promos FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());


-- ── customer_promos (per-user grant ledger) ────────────────────────────────
CREATE TABLE IF NOT EXISTS public.customer_promos (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id          UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  promo_id             UUID NOT NULL REFERENCES public.promos(id) ON DELETE CASCADE,
  status               TEXT NOT NULL DEFAULT 'active'
                       CHECK (status IN ('active','used','expired','revoked')),
  source               TEXT NOT NULL
                       CHECK (source IN ('signup','manual-claim','admin-grant','referral','birthday','loyalty')),
  granted_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  used_at              TIMESTAMPTZ,
  used_on_order_id     UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  UNIQUE(customer_id, promo_id)
);

CREATE INDEX IF NOT EXISTS customer_promos_user_idx
  ON public.customer_promos (customer_id, status, granted_at DESC);

ALTER TABLE public.customer_promos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "customer_promos: own read"   ON public.customer_promos;
DROP POLICY IF EXISTS "customer_promos: own write"  ON public.customer_promos;
DROP POLICY IF EXISTS "customer_promos: admin all"  ON public.customer_promos;

CREATE POLICY "customer_promos: own read"
  ON public.customer_promos FOR SELECT
  USING (customer_id = auth.uid());

CREATE POLICY "customer_promos: own write"
  ON public.customer_promos FOR INSERT
  WITH CHECK (customer_id = auth.uid());

CREATE POLICY "customer_promos: admin all"
  ON public.customer_promos FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());


-- ── seed: WELCOME10 ────────────────────────────────────────────────────────
INSERT INTO public.promos
  (code, title, description, kind, value_amount, min_spend_rm, applies_to, is_public)
VALUES
  ('WELCOME10',
   'RM 10 off your first order',
   'A welcome from our practice. Valid on any product order — does not stack with other offers.',
   'fixed', 10, 50, 'products', FALSE)
ON CONFLICT (code) DO NOTHING;


-- ── trigger: auto-grant WELCOME10 to every new customer ───────────────────
CREATE OR REPLACE FUNCTION public.grant_welcome_promo()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_promo_id UUID;
BEGIN
  IF NEW.role = 'customer' THEN
    SELECT id INTO v_promo_id FROM public.promos WHERE code = 'WELCOME10' LIMIT 1;
    IF v_promo_id IS NOT NULL THEN
      INSERT INTO public.customer_promos (customer_id, promo_id, source)
      VALUES (NEW.id, v_promo_id, 'signup')
      ON CONFLICT (customer_id, promo_id) DO NOTHING;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_new_customer_grant_welcome ON public.users;
CREATE TRIGGER on_new_customer_grant_welcome
  AFTER INSERT ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.grant_welcome_promo();
