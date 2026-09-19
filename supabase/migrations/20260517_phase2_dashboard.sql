-- 20260517_phase2_dashboard.sql
-- Phase 2: wishlist + in-app notifications + denote MFA enrolment state.

BEGIN;

-- 1. wishlist_items
CREATE TABLE IF NOT EXISTS public.wishlist_items (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id  UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  product_id   UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(customer_id, product_id)
);
CREATE INDEX IF NOT EXISTS idx_wishlist_customer ON public.wishlist_items(customer_id);

ALTER TABLE public.wishlist_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "wishlist_select_own" ON public.wishlist_items
  FOR SELECT USING (auth.uid() = customer_id);
CREATE POLICY "wishlist_insert_own" ON public.wishlist_items
  FOR INSERT WITH CHECK (auth.uid() = customer_id);
CREATE POLICY "wishlist_delete_own" ON public.wishlist_items
  FOR DELETE USING (auth.uid() = customer_id);
CREATE POLICY "wishlist_admin_all" ON public.wishlist_items
  FOR ALL USING (public.is_admin());

-- 2. notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  kind        TEXT NOT NULL CHECK (kind IN (
    'welcome','order_placed','order_shipped','order_delivered','order_cancelled',
    'appointment_confirmed','appointment_reminder','appointment_cancelled',
    'ticket_reply','promo_granted','account_deletion_scheduled','address_saved'
  )),
  title       TEXT NOT NULL,
  body        TEXT NOT NULL,
  href        TEXT,                          -- where the bell-row "click" should send them
  read_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
  ON public.notifications(user_id, created_at DESC) WHERE read_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_notifications_user_all
  ON public.notifications(user_id, created_at DESC);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notifications_select_own" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "notifications_update_own_read" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);
-- INSERT is service-role only — done from server actions via the service-role client.
CREATE POLICY "notifications_admin_all" ON public.notifications
  FOR ALL USING (public.is_admin());

-- 3. Enable realtime on notifications so the bell can subscribe.
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- 4. users: add a flag to indicate MFA is enrolled. (Supabase Auth tracks
--    factors in auth.mfa_factors; this mirror saves a join on every page.)
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS mfa_enrolled BOOLEAN NOT NULL DEFAULT FALSE;

COMMIT;
