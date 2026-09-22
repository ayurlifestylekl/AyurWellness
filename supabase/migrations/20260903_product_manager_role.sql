-- =====================================================================
-- Product Management — dedicated role (2026-09-03)
-- =====================================================================
-- Product Management (/product-management) previously required an
-- 'admin' account and signed in through /admin/login — not actually
-- separate from the admin portal. This adds a new 'product_manager' role
-- with its own dedicated login (/product-management/login) and RLS access
-- scoped ONLY to the tables Product Management touches: catalog, bundle
-- items, inventory/stock movements, and product orders/fulfillment. It
-- gets no access to bookings, treatments, other admin settings, etc.
--
-- Safe to re-run. Apply via Supabase SQL Editor.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Allow the new role value
-- ---------------------------------------------------------------------
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE public.users
  ADD CONSTRAINT users_role_check
  CHECK (role IN ('admin','customer','sales_agent','doctor','front_desk','product_manager'));

-- ---------------------------------------------------------------------
-- 2. Helper function (mirrors is_admin/is_doctor/is_front_desk pattern)
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_product_manager()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'product_manager'
  );
END;
$$;

-- ---------------------------------------------------------------------
-- 3. Widen product-scoped RLS policies to admin OR product_manager
-- ---------------------------------------------------------------------

-- Catalog
DROP POLICY IF EXISTS "products: admin full access" ON public.products;
CREATE POLICY "products: admin full access" ON public.products
  FOR ALL USING (public.is_admin() OR public.is_product_manager())
  WITH CHECK (public.is_admin() OR public.is_product_manager());

DROP POLICY IF EXISTS "bundle_items: admin full access" ON public.bundle_items;
CREATE POLICY "bundle_items: admin full access" ON public.bundle_items
  FOR ALL USING (public.is_admin() OR public.is_product_manager())
  WITH CHECK (public.is_admin() OR public.is_product_manager());

DROP POLICY IF EXISTS "Admin manages bundle items" ON public.product_bundle_items;
CREATE POLICY "Admin manages bundle items" ON public.product_bundle_items
  FOR ALL USING (public.is_admin() OR public.is_product_manager())
  WITH CHECK (public.is_admin() OR public.is_product_manager());

-- Inventory
DROP POLICY IF EXISTS "Admin manages stock movements" ON public.stock_movements;
CREATE POLICY "Admin manages stock movements" ON public.stock_movements
  FOR ALL USING (public.is_admin() OR public.is_product_manager())
  WITH CHECK (public.is_admin() OR public.is_product_manager());

-- Orders / fulfillment / cancellations / refunds
DROP POLICY IF EXISTS "Admin manages product orders" ON public.product_orders;
CREATE POLICY "Admin manages product orders" ON public.product_orders
  FOR ALL USING (public.is_admin() OR public.is_product_manager())
  WITH CHECK (public.is_admin() OR public.is_product_manager());

DROP POLICY IF EXISTS "Admin manages product order items" ON public.product_order_items;
CREATE POLICY "Admin manages product order items" ON public.product_order_items
  FOR ALL USING (public.is_admin() OR public.is_product_manager())
  WITH CHECK (public.is_admin() OR public.is_product_manager());

DROP POLICY IF EXISTS "Admin manages product order addresses" ON public.product_order_addresses;
CREATE POLICY "Admin manages product order addresses" ON public.product_order_addresses
  FOR ALL USING (public.is_admin() OR public.is_product_manager())
  WITH CHECK (public.is_admin() OR public.is_product_manager());

DROP POLICY IF EXISTS "Admin manages product order status history" ON public.product_order_status_history;
CREATE POLICY "Admin manages product order status history" ON public.product_order_status_history
  FOR ALL USING (public.is_admin() OR public.is_product_manager())
  WITH CHECK (public.is_admin() OR public.is_product_manager());

DROP POLICY IF EXISTS "Admin manages product cancellations" ON public.product_cancellations;
CREATE POLICY "Admin manages product cancellations" ON public.product_cancellations
  FOR ALL USING (public.is_admin() OR public.is_product_manager())
  WITH CHECK (public.is_admin() OR public.is_product_manager());

DROP POLICY IF EXISTS "Admin manages product refund requests" ON public.product_refund_requests;
CREATE POLICY "Admin manages product refund requests" ON public.product_refund_requests
  FOR ALL USING (public.is_admin() OR public.is_product_manager())
  WITH CHECK (public.is_admin() OR public.is_product_manager());

-- Product image uploads (admin/products ProductForm writes via the browser)
DROP POLICY IF EXISTS "Admin writes product images" ON storage.objects;
CREATE POLICY "Admin writes product images" ON storage.objects
  FOR ALL USING (bucket_id = 'product-images' AND (public.is_admin() OR public.is_product_manager()))
  WITH CHECK (bucket_id = 'product-images' AND (public.is_admin() OR public.is_product_manager()));

GRANT EXECUTE ON FUNCTION public.is_product_manager() TO anon, authenticated;
