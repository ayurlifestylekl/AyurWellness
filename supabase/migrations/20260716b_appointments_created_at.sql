-- ============================================================================
-- Missing created_at column (2026-07-16b). Idempotent.
-- Apply via Supabase SQL Editor.
--
-- src/lib/booking/map.ts already selects `created_at` (feeding
-- StaffAppointment.requestReceivedAt — "when the customer's web booking
-- actually reached us"), but the migration that was meant to add this column
-- was apparently never applied. Staff console queries (src/lib/staff/appointments.ts)
-- use a different column list and never hit this — the customer-facing
-- pay/checkout/status page (getBookingForPayment) is what surfaced it.
-- ============================================================================

ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();
