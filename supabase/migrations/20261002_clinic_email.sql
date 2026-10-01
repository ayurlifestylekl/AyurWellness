-- The clinic's real inbox is admin@ayurvedicwellness.com.my (the cPanel account's
-- main domain). The settings were seeded with admin@ayurvedawellness.com.my.
UPDATE public.site_settings
SET business      = jsonb_set(business, '{email}', to_jsonb('admin@ayurvedicwellness.com.my'::text)),
    notifications = CASE
      WHEN notifications ? 'admin_notify_email'
      THEN jsonb_set(notifications, '{admin_notify_email}', to_jsonb('admin@ayurvedicwellness.com.my'::text))
      ELSE notifications
    END,
    updated_at    = now()
WHERE business->>'email' = 'admin@ayurvedawellness.com.my'
   OR notifications->>'admin_notify_email' = 'admin@ayurvedawellness.com.my';
