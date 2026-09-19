-- =====================================================================
-- Marketplace orders: customer shipping address + proof URL (2026-05-23)
-- =====================================================================
-- Lets agents submit a customer's shipping address (the clinic ships to
-- this address once the marketplace order is approved). Also adds a
-- payment_proof_url for the agent to upload a screenshot of the Shopee /
-- TikTok order page.
--
-- Safe to re-run.
-- =====================================================================

ALTER TABLE public.marketplace_orders
  ADD COLUMN IF NOT EXISTS customer_address   TEXT,
  ADD COLUMN IF NOT EXISTS customer_postcode  TEXT,
  ADD COLUMN IF NOT EXISTS customer_state     TEXT,
  ADD COLUMN IF NOT EXISTS customer_city      TEXT,
  ADD COLUMN IF NOT EXISTS payment_proof_url  TEXT;
