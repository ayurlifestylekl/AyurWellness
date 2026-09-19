-- "Contacted via WhatsApp" marker on booking requests.
-- Front desk can flag a pending request once they've reached out to the
-- customer, so admin can see the centre has already taken action.
-- Run in the Supabase SQL editor (safe to re-run).

ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS contacted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS contacted_by UUID;

COMMENT ON COLUMN public.appointments.contacted_at IS
  'When staff marked this request as contacted (e.g. via WhatsApp) before approval.';
