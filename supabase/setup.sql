-- ================================================================
-- AYURVEDIC DIGITAL ECOSYSTEM — COMPLETE DATABASE SETUP
-- Ayurvedic Wellness Centre ([BUSINESS REGISTRATION NO.])
-- ----------------------------------------------------------------
-- HOW TO USE:
--   1. Go to your Supabase Dashboard
--   2. Click "SQL Editor" in the left sidebar
--   3. Paste this entire file and click "Run"
-- ================================================================


-- ================================================================
-- SECTION 1: TABLES
-- (Order matters — foreign key dependencies respected)
-- ================================================================

-- 1a. USERS (extends auth.users — do not store passwords here)
CREATE TABLE IF NOT EXISTS public.users (
  id             UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name      TEXT,
  email          TEXT UNIQUE NOT NULL,
  phone_number   TEXT,
  gender         TEXT CHECK (gender IN ('male', 'female')),
  role           TEXT CHECK (role IN ('admin', 'customer', 'sales_agent')) DEFAULT 'customer',
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- 1b. PRODUCTS
CREATE TABLE IF NOT EXISTS public.products (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name           TEXT NOT NULL,
  description    TEXT,
  price_rm       DECIMAL(10,2) NOT NULL,
  sku            TEXT UNIQUE NOT NULL,
  stock_qty      INTEGER NOT NULL DEFAULT 0,
  category       TEXT,
  is_bundle      BOOLEAN DEFAULT FALSE,
  image_url      TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- 1c. BUNDLE ITEMS (Smart Combo Engine — maps bundle → child SKUs)
CREATE TABLE IF NOT EXISTS public.bundle_items (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bundle_product_id    UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  child_product_id     UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity             INTEGER NOT NULL DEFAULT 1
);

-- 1d. SALES AGENTS (Affiliate / TikTok tracking)
CREATE TABLE IF NOT EXISTS public.sales_agents (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                   UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  referral_code             TEXT UNIQUE NOT NULL,
  commission_rate           DECIMAL(5,2) NOT NULL DEFAULT 5.00,
  total_sales_generated_rm  DECIMAL(10,2) DEFAULT 0,
  total_commission_earned_rm DECIMAL(10,2) DEFAULT 0,
  created_at                TIMESTAMPTZ DEFAULT NOW()
);

-- 1e. ORDERS
CREATE TABLE IF NOT EXISTS public.orders (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id         UUID REFERENCES public.users(id),
  total_amount_rm     DECIMAL(10,2) NOT NULL,
  payment_status      TEXT CHECK (payment_status IN ('pending', 'paid', 'failed')) DEFAULT 'pending',
  fulfillment_status  TEXT CHECK (fulfillment_status IN ('processing', 'shipped', 'delivered')) DEFAULT 'processing',
  courier_service     TEXT CHECK (courier_service IN ('Pos Laju', 'J&T Express', 'DHL', 'GDex', 'Ninja Van', 'Self-Pickup')),
  tracking_number     TEXT,
  referral_agent_id   UUID REFERENCES public.sales_agents(id),
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- 1f. ORDER ITEMS
CREATE TABLE IF NOT EXISTS public.order_items (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id              UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id            UUID REFERENCES public.products(id),
  quantity              INTEGER NOT NULL,
  price_at_purchase_rm  DECIMAL(10,2) NOT NULL
);

-- 1g. APPOINTMENTS (syncs with Cal.com)
CREATE TABLE IF NOT EXISTS public.appointments (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id            UUID REFERENCES public.users(id),
  treatment_name         TEXT NOT NULL,
  doctor_name            TEXT DEFAULT 'Vaidya AKHIL HS (B.A.M.S)',
  appointment_date_time  TIMESTAMPTZ NOT NULL,
  duration_mins          INTEGER DEFAULT 30,
  status                 TEXT CHECK (status IN ('scheduled', 'completed', 'cancelled')) DEFAULT 'scheduled',
  advance_payment_rm     DECIMAL(10,2),
  calcom_booking_uid     TEXT UNIQUE
);


-- ================================================================
-- SECTION 2: HELPER FUNCTION (avoids RLS recursion on users table)
-- ================================================================

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.is_sales_agent()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'sales_agent'
  );
END;
$$;


-- ================================================================
-- SECTION 3: AUTH TRIGGER
-- Auto-creates a public.users row when someone signs up
-- ================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Drop if exists to allow re-running this script safely
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ================================================================
-- SECTION 4: ROW LEVEL SECURITY (RLS)
-- Note: Admin server actions use SUPABASE_SERVICE_ROLE_KEY which
-- bypasses RLS entirely — no need for admin INSERT/UPDATE policies.
-- ================================================================

-- Enable RLS on all tables
ALTER TABLE public.users        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bundle_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_agents ENABLE ROW LEVEL SECURITY;


-- Drop existing policies first so re-runs are idempotent.
-- Postgres doesn't support "CREATE POLICY IF NOT EXISTS", so we drop then recreate.
DROP POLICY IF EXISTS "users: self read"                    ON public.users;
DROP POLICY IF EXISTS "users: self update"                  ON public.users;
DROP POLICY IF EXISTS "users: admin full access"            ON public.users;
DROP POLICY IF EXISTS "products: public read"               ON public.products;
DROP POLICY IF EXISTS "products: admin full access"         ON public.products;
DROP POLICY IF EXISTS "bundle_items: public read"           ON public.bundle_items;
DROP POLICY IF EXISTS "bundle_items: admin full access"     ON public.bundle_items;
DROP POLICY IF EXISTS "orders: customer reads own"          ON public.orders;
DROP POLICY IF EXISTS "orders: customer creates own"        ON public.orders;
DROP POLICY IF EXISTS "orders: agent reads attributed"      ON public.orders;
DROP POLICY IF EXISTS "orders: admin full access"           ON public.orders;
DROP POLICY IF EXISTS "order_items: customer reads own"     ON public.order_items;
DROP POLICY IF EXISTS "order_items: customer creates own"   ON public.order_items;
DROP POLICY IF EXISTS "order_items: admin full access"      ON public.order_items;
DROP POLICY IF EXISTS "appointments: customer reads own"    ON public.appointments;
DROP POLICY IF EXISTS "appointments: customer creates own"  ON public.appointments;
DROP POLICY IF EXISTS "appointments: customer updates own"  ON public.appointments;
DROP POLICY IF EXISTS "appointments: admin full access"     ON public.appointments;
DROP POLICY IF EXISTS "sales_agents: agent reads own"       ON public.sales_agents;
DROP POLICY IF EXISTS "sales_agents: admin full access"     ON public.sales_agents;


-- ── USERS ──────────────────────────────────────────────────────
CREATE POLICY "users: self read"
  ON public.users FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "users: self update"
  ON public.users FOR UPDATE
  USING (id = auth.uid());

CREATE POLICY "users: admin full access"
  ON public.users FOR ALL
  USING (public.is_admin());


-- ── PRODUCTS ───────────────────────────────────────────────────
CREATE POLICY "products: public read"
  ON public.products FOR SELECT
  USING (true);

CREATE POLICY "products: admin full access"
  ON public.products FOR ALL
  USING (public.is_admin());


-- ── BUNDLE ITEMS ───────────────────────────────────────────────
CREATE POLICY "bundle_items: public read"
  ON public.bundle_items FOR SELECT
  USING (true);

CREATE POLICY "bundle_items: admin full access"
  ON public.bundle_items FOR ALL
  USING (public.is_admin());


-- ── ORDERS ─────────────────────────────────────────────────────
CREATE POLICY "orders: customer reads own"
  ON public.orders FOR SELECT
  USING (customer_id = auth.uid());

CREATE POLICY "orders: customer creates own"
  ON public.orders FOR INSERT
  WITH CHECK (customer_id = auth.uid());

CREATE POLICY "orders: agent reads attributed"
  ON public.orders FOR SELECT
  USING (
    referral_agent_id IN (
      SELECT id FROM public.sales_agents WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "orders: admin full access"
  ON public.orders FOR ALL
  USING (public.is_admin());


-- ── ORDER ITEMS ────────────────────────────────────────────────
CREATE POLICY "order_items: customer reads own"
  ON public.order_items FOR SELECT
  USING (
    order_id IN (
      SELECT id FROM public.orders WHERE customer_id = auth.uid()
    )
  );

CREATE POLICY "order_items: customer creates own"
  ON public.order_items FOR INSERT
  WITH CHECK (
    order_id IN (
      SELECT id FROM public.orders WHERE customer_id = auth.uid()
    )
  );

CREATE POLICY "order_items: admin full access"
  ON public.order_items FOR ALL
  USING (public.is_admin());


-- ── APPOINTMENTS ───────────────────────────────────────────────
CREATE POLICY "appointments: customer reads own"
  ON public.appointments FOR SELECT
  USING (customer_id = auth.uid());

CREATE POLICY "appointments: customer creates own"
  ON public.appointments FOR INSERT
  WITH CHECK (customer_id = auth.uid());

CREATE POLICY "appointments: customer updates own"
  ON public.appointments FOR UPDATE
  USING (customer_id = auth.uid());

CREATE POLICY "appointments: admin full access"
  ON public.appointments FOR ALL
  USING (public.is_admin());


-- ── SALES AGENTS ───────────────────────────────────────────────
CREATE POLICY "sales_agents: agent reads own"
  ON public.sales_agents FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "sales_agents: admin full access"
  ON public.sales_agents FOR ALL
  USING (public.is_admin());


-- ================================================================
-- SECTION 5: STORAGE BUCKET (product images)
-- ================================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "storage: product images public read" ON storage.objects;
DROP POLICY IF EXISTS "storage: authenticated can upload"   ON storage.objects;
DROP POLICY IF EXISTS "storage: admin can delete"           ON storage.objects;

CREATE POLICY "storage: product images public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'product-images');

CREATE POLICY "storage: authenticated can upload"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'product-images'
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "storage: admin can delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'product-images'
    AND public.is_admin()
  );


-- ================================================================
-- SECTION 6: ADMIN BOOTSTRAP
-- Run this ONCE after setup, replacing the email below.
-- This promotes the first user to admin role.
-- ================================================================

-- UPDATE public.users
-- SET role = 'admin'
-- WHERE email = 'your-admin-email@example.com';


-- ================================================================
-- SECTION 7: CONTACT MESSAGES (leads captured from /contact form)
-- Anonymous visitors can INSERT. Only admins can SELECT/UPDATE.
-- ================================================================

CREATE TABLE IF NOT EXISTS public.contact_messages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  intent      TEXT NOT NULL CHECK (intent IN ('treatment', 'product', 'corporate', 'other')),
  name        TEXT NOT NULL,
  phone       TEXT NOT NULL,
  email       TEXT NOT NULL,
  message     TEXT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'closed')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS contact_messages_status_created_idx
  ON public.contact_messages (status, created_at DESC);

ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "contact_messages: anon can insert"      ON public.contact_messages;
DROP POLICY IF EXISTS "contact_messages: admin reads all"      ON public.contact_messages;
DROP POLICY IF EXISTS "contact_messages: admin updates status" ON public.contact_messages;

-- Anyone (visitor or logged-in user) can submit a new lead.
CREATE POLICY "contact_messages: anon can insert"
  ON public.contact_messages FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Only admins can read the leads.
CREATE POLICY "contact_messages: admin reads all"
  ON public.contact_messages FOR SELECT
  USING (public.is_admin());

-- Only admins can update status (mark as contacted / closed).
CREATE POLICY "contact_messages: admin updates status"
  ON public.contact_messages FOR UPDATE
  USING (public.is_admin());
