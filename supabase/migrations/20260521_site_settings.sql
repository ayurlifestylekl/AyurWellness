-- =====================================================================
-- Site settings: single-row table for clinic-wide configuration (2026-05-21)
-- =====================================================================
-- One row, four JSONB sections (business, commerce, booking, notifications).
-- Read-anywhere, write-by-admin-only.
--
-- Safe to re-run. Apply via Supabase SQL Editor.
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.site_settings (
  id                INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  business          JSONB NOT NULL DEFAULT '{}'::jsonb,
  commerce          JSONB NOT NULL DEFAULT '{}'::jsonb,
  booking           JSONB NOT NULL DEFAULT '{}'::jsonb,
  notifications     JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by        UUID REFERENCES public.users(id)
);

-- Seed the singleton row with sensible Malaysian defaults
INSERT INTO public.site_settings (id, business, commerce, booking, notifications)
VALUES (
  1,
  jsonb_build_object(
    'clinic_name',  'Ayurvedic Wellness Centre',
    'address',      'No. 68-G, Jalan Tun Sambanthan, Brickfields, 50470 Kuala Lumpur',
    'phone',        '+603 2260 3435',
    'email',        'admin@ayurvedawellness.com.my',
    'whatsapp',     '[WHATSAPP NUMBER]',
    'hours',        'Mon-Sat 10:00-19:00, Sun closed',
    'instagram_url',''
  ),
  jsonb_build_object(
    'tax_rate_percent',         6,
    'default_shipping_rm',      10,
    'free_shipping_threshold_rm', 200,
    'currency',                 'RM'
  ),
  jsonb_build_object(
    'lead_time_hours',          24,
    'max_window_days',          30,
    'gender_policy_enabled',    true
  ),
  jsonb_build_object(
    'admin_notify_email',       'admin@ayurvedawellness.com.my',
    'low_stock_threshold',      5
  )
)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone reads site settings" ON public.site_settings;
CREATE POLICY "Anyone reads site settings" ON public.site_settings
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin updates site settings" ON public.site_settings;
CREATE POLICY "Admin updates site settings" ON public.site_settings
  FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Auto-bump updated_at
CREATE OR REPLACE FUNCTION public.touch_site_settings()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS site_settings_touch ON public.site_settings;
CREATE TRIGGER site_settings_touch
  BEFORE UPDATE ON public.site_settings
  FOR EACH ROW EXECUTE FUNCTION public.touch_site_settings();
