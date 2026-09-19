-- Enforce therapist assignment at the database boundary so every writer,
-- including concurrent or future call sites, preserves the operational rule.

CREATE OR REPLACE FUNCTION public.enforce_treatment_operational_assignment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.booking_kind = 'treatment'
     AND NEW.status IN ('checked_in', 'in_progress')
     AND (
       NEW.assigned_therapist_code IS NULL
       OR NEW.assigned_therapist_code !~ '[^[:space:]]'
     )
  THEN
    RAISE EXCEPTION USING
      ERRCODE = '23514',
      MESSAGE = 'treatment_operational_assignment_required';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS appointments_enforce_treatment_operational_assignment ON public.appointments;
CREATE TRIGGER appointments_enforce_treatment_operational_assignment
BEFORE INSERT OR UPDATE OF status, booking_kind, assigned_therapist_code
ON public.appointments
FOR EACH ROW
EXECUTE FUNCTION public.enforce_treatment_operational_assignment();

REVOKE ALL ON FUNCTION public.enforce_treatment_operational_assignment() FROM PUBLIC;
