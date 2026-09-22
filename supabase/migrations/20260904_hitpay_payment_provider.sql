-- Switch the payment provider to HitPay.
--
-- booking_refunds.provider was created with a CHECK constraint listing
-- ('stripe','billplz','stub') — the app now only ever writes 'hitpay' or
-- 'stub' to this column, so without this migration every booking refund
-- insert would fail the constraint. Safe to re-run.

ALTER TABLE public.booking_refunds
  DROP CONSTRAINT IF EXISTS booking_refunds_provider_check;

ALTER TABLE public.booking_refunds
  ADD CONSTRAINT booking_refunds_provider_check
  CHECK (provider IN ('hitpay', 'stub'));
