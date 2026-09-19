-- ============================================================================
-- OPTIONAL HARDENING — DO NOT paste-run blindly. Review + test first.
-- ============================================================================
-- Prevents two ACTIVE bookings from occupying the SAME therapist at overlapping
-- times, at the database level. This closes the check-then-write race in
-- approveAndAssign / approveGroup that the application layer cannot fully
-- prevent under concurrency (two staff approving the same therapist+slot within
-- the same instant both pass the in-code clash check and both write).
--
-- Buffer: 30 minutes after each session (matches THERAPIST_BUFFER_MINS /
-- findClash in src/lib/booking/scheduling.ts). Only "occupied" statuses count.
--
-- ── BEFORE APPLYING ─────────────────────────────────────────────────────────
-- 1) Find any pre-existing overlaps that would make the ADD CONSTRAINT fail:
--
--    SELECT a.id AS a_id, b.id AS b_id, a.assigned_therapist_code,
--           a.appointment_date_time, b.appointment_date_time
--      FROM public.appointments a
--      JOIN public.appointments b
--        ON a.assigned_therapist_code = b.assigned_therapist_code
--       AND a.id < b.id
--     WHERE a.assigned_therapist_code IS NOT NULL
--       AND a.status IN ('scheduled','awaiting_payment','confirmed','checked_in','in_progress')
--       AND b.status IN ('scheduled','awaiting_payment','confirmed','checked_in','in_progress')
--       AND tstzrange(a.appointment_date_time,
--             a.appointment_date_time + ((COALESCE(a.duration_mins,60)+30)||' minutes')::interval) &&
--           tstzrange(b.appointment_date_time,
--             b.appointment_date_time + ((COALESCE(b.duration_mins,60)+30)||' minutes')::interval);
--
--    Resolve any rows returned (reschedule/cancel) before continuing.
--
-- 2) After applying, a genuine concurrent double-book raises SQLSTATE 23P01
--    (exclusion_violation). The app currently surfaces that as a raw error
--    message from the approve action — safe (no double-book), just not pretty.
--    Optional follow-up: catch 23P01 in approveAndAssign/approveGroup and return
--    the friendly "therapist is busy — pick another time" message.
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS btree_gist;

-- A range expression used inside a GiST exclusion index must come from a
-- function explicitly marked IMMUTABLE. This wrapper computes the occupied
-- window (session + 30-min buffer). Minute-based math on a UTC instant is
-- deterministic, so IMMUTABLE is a safe assertion.
CREATE OR REPLACE FUNCTION public.appt_occupied_range(_start timestamptz, _dur integer)
RETURNS tstzrange
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
AS $$
  SELECT tstzrange(_start, _start + make_interval(mins => COALESCE(_dur, 60) + 30));
$$;

ALTER TABLE public.appointments
  ADD CONSTRAINT appointments_no_therapist_overlap
  EXCLUDE USING gist (
    assigned_therapist_code WITH =,
    public.appt_occupied_range(appointment_date_time, duration_mins) WITH &&
  )
  WHERE (
    assigned_therapist_code IS NOT NULL
    AND status IN ('scheduled', 'awaiting_payment', 'confirmed', 'checked_in', 'in_progress')
  );
