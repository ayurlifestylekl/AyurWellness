-- These tables are only ever accessed server-side with the service role key,
-- but were created without RLS, leaving them writable via the public anon key.

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'therapists', 'vaidyas', 'shipping_zones',
    'booking_management_otps', 'booking_management_grants', 'booking_events'
  ] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('REVOKE ALL ON public.%I FROM anon, authenticated', t);
  END LOOP;
END $$;
