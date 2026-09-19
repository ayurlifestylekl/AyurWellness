-- Security hardening from the Supabase linter report (12 Jul 2026).
-- Run in the Supabase SQL editor. Safe to re-run.
--
-- Deliberately NOT changed:
--  * contact_messages anon INSERT policy — that's the public contact form.
--  * is_admin/is_doctor/is_front_desk/is_sales_agent/is_staff EXECUTE grants —
--    RLS policies call them as anon/authenticated; revoking breaks those queries.
--  * claim_agent_invite grants — token-gated by design; called during agent signup.
--  * btree_gist in public — moving it risks the appointments no-double-booking
--    exclusion constraint; low-value change.
--  * Leaked-password protection — dashboard toggle (Auth → Passwords), not SQL.

-- ── 1. Pin search_path on flagged functions (blocks search-path hijacking) ──
ALTER FUNCTION public.next_invoice_number()                       SET search_path = public;
ALTER FUNCTION public.next_wholesale_order_number()               SET search_path = public;
ALTER FUNCTION public.set_updated_at()                            SET search_path = public;
ALTER FUNCTION public.products_touch_updated_at()                 SET search_path = public;
ALTER FUNCTION public.appointments_touch_updated_at()             SET search_path = public;
ALTER FUNCTION public.sales_agents_touch_updated_at()             SET search_path = public;
ALTER FUNCTION public.touch_site_settings()                       SET search_path = public;
ALTER FUNCTION public.touch_reviews()                             SET search_path = public;
ALTER FUNCTION public.touch_wholesale_orders()                    SET search_path = public;
ALTER FUNCTION public.appt_occupied_range(timestamptz, integer)   SET search_path = public;

-- ── 2. Trigger functions must not be callable through the REST API ──────────
-- Triggers keep firing regardless of EXECUTE grants; this only closes the
-- /rest/v1/rpc/... exposure. service_role keeps access for server-side code.
DO $$
DECLARE fn text;
BEGIN
  FOREACH fn IN ARRAY ARRAY[
    'set_updated_at',
    'products_touch_updated_at',
    'appointments_touch_updated_at',
    'sales_agents_touch_updated_at',
    'touch_site_settings',
    'touch_reviews',
    'touch_wholesale_orders',
    'handle_new_user',
    'log_order_status_change',
    'create_commission_on_paid',
    'reverse_commission_on_refund_or_cancel',
    'external_sale_to_commission',
    'agent_commissions_update_aggregates',
    'apply_stock_movement',
    'deduct_stock_on_wholesale_paid',
    'restore_stock_on_wholesale_cancel',
    'grant_welcome_message',
    'grant_welcome_promo'
  ] LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION public.%I() FROM PUBLIC, anon, authenticated', fn);
    EXECUTE format('GRANT EXECUTE ON FUNCTION public.%I() TO service_role', fn);
  END LOOP;
END $$;

-- ── 3. Number generators: staff/agents only (called via signed-in sessions) ─
REVOKE EXECUTE ON FUNCTION public.next_invoice_number()         FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.next_invoice_number()         TO authenticated, service_role;
REVOKE EXECUTE ON FUNCTION public.next_wholesale_order_number() FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.next_wholesale_order_number() TO authenticated, service_role;

-- recompute_agent_totals is server-side maintenance only.
REVOKE EXECUTE ON FUNCTION public.recompute_agent_totals(uuid) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.recompute_agent_totals(uuid) TO service_role;

-- ── 4. Public buckets: allow direct URL access but not listing every file ───
-- (The app never lists these buckets; it only uploads and builds public URLs.)
DROP POLICY IF EXISTS "avatars_public_read"                 ON storage.objects;
DROP POLICY IF EXISTS "Public read product images"          ON storage.objects;
DROP POLICY IF EXISTS "storage: product images public read" ON storage.objects;
