-- =====================================================================
-- Marketplace: 'pending_payment' status for batched agent payment
-- (2026-05-23)
-- =====================================================================
-- Agents submit orders one-by-one; orders sit in 'pending_payment' until
-- the agent pays the clinic in one lump sum and uploads a receipt URL
-- (which gets stamped on every order in that payment batch).
--
-- Status flow after this migration:
--   pending_payment  → agent submitted, hasn't paid yet
--   pending          → agent uploaded receipt, admin to review
--   approved         → admin confirmed payment + created real order
--   rejected         → admin rejected
--
-- Safe to re-run.
-- =====================================================================

-- ALTER TYPE ADD VALUE must run outside a transaction in Postgres.
-- If your SQL editor wraps the whole script in a tx, run this single
-- statement first, then the rest.
ALTER TYPE public.marketplace_order_status_enum
  ADD VALUE IF NOT EXISTS 'pending_payment';
