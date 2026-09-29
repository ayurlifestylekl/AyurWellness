-- Use the SSM-registered business address.
UPDATE public.site_settings
SET business = jsonb_set(business::jsonb, '{address}', '"No. 68-3, Jalan Padang Belia, Brickfields, 50470 Kuala Lumpur"')
WHERE business->>'address' LIKE 'No. 68-G, Jalan Tun Sambanthan%';
