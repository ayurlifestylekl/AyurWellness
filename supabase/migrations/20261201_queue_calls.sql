-- Waiting room queue numbers and calling — Ayurvedic Wellness Centre.
--
-- 1. Each guest gets a queue number when checked in: 1, 2, 3 … starting
--    again every day (Malaysia time). assign_queue_no() hands them out one
--    at a time, so two check-ins together never get the same number.
-- 2. Calling a guest records when (called_at), how many times (call_count)
--    and to which room (call_room); the lobby screen announces new calls.
--
-- Safe to re-run.

BEGIN;

ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS queue_no INTEGER CHECK (queue_no IS NULL OR queue_no > 0),
  ADD COLUMN IF NOT EXISTS queue_day DATE,
  ADD COLUMN IF NOT EXISTS called_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS call_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS call_room TEXT CHECK (call_room IS NULL OR char_length(call_room) <= 40);

CREATE UNIQUE INDEX IF NOT EXISTS appointments_queue_no_per_day ON public.appointments (queue_day, queue_no) WHERE queue_no IS NOT NULL;
CREATE INDEX IF NOT EXISTS appointments_called_at_idx ON public.appointments (called_at DESC) WHERE called_at IS NOT NULL;

/** The guest's queue number for today, giving the next one if they have none yet. */
CREATE OR REPLACE FUNCTION public.assign_queue_no(p_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_today DATE := (now() AT TIME ZONE 'Asia/Kuala_Lumpur')::date;
  v_no INTEGER;
BEGIN
  SELECT queue_no INTO v_no FROM public.appointments WHERE id = p_id AND queue_day = v_today;
  IF v_no IS NOT NULL THEN RETURN v_no; END IF;
  -- One number at a time per day.
  PERFORM pg_advisory_xact_lock(hashtextextended('queue|' || v_today::text, 0));
  SELECT COALESCE(MAX(queue_no), 0) + 1 INTO v_no FROM public.appointments WHERE queue_day = v_today;
  UPDATE public.appointments SET queue_no = v_no, queue_day = v_today WHERE id = p_id;
  IF NOT FOUND THEN RETURN NULL; END IF;
  RETURN v_no;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.assign_queue_no(UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.assign_queue_no(UUID) TO service_role;

COMMIT;
