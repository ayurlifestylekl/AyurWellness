-- Signed receipts for claims — Ayurvedic Wellness Centre.
--
-- A customer who needs the receipt for an insurance / company claim can sign
-- it on the counter tablet. The signature (a PNG data URL), the name signed
-- and when, are kept with the bill; the receipt and PDF then show a signature
-- block with an empty box for the company stamp (stamped by hand).
--
-- Safe to re-run.

BEGIN;

ALTER TABLE public.counter_sales
  ADD COLUMN IF NOT EXISTS signature_png TEXT CHECK (signature_png IS NULL OR (signature_png LIKE 'data:image/png;base64,%' AND char_length(signature_png) <= 400000)),
  ADD COLUMN IF NOT EXISTS signed_name TEXT CHECK (signed_name IS NULL OR char_length(signed_name) <= 120),
  ADD COLUMN IF NOT EXISTS signed_at TIMESTAMPTZ;

COMMIT;
