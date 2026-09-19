-- One cleared consultation may have only one active linked treatment at a time.
-- A parent-scoped advisory lock makes the check safe across concurrent claims,
-- while expired payment holds and inactive terminal rows remain retryable.

CREATE OR REPLACE FUNCTION public.guard_active_linked_treatment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.booking_kind = 'treatment'
     AND NEW.parent_consultation_id IS NOT NULL
     AND NEW.status IN ('pending', 'scheduled', 'awaiting_payment', 'confirmed', 'checked_in', 'in_progress')
     AND (
       NEW.status <> 'awaiting_payment'
       OR NEW.payment_expires_at IS NULL
       OR NEW.payment_expires_at > now()
     )
  THEN
    PERFORM pg_advisory_xact_lock(
      hashtextextended('linked-treatment|' || NEW.parent_consultation_id::text, 0)
    );

    IF EXISTS (
      SELECT 1
      FROM public.appointments a
      WHERE a.parent_consultation_id = NEW.parent_consultation_id
        AND a.id IS DISTINCT FROM NEW.id
        AND a.booking_kind = 'treatment'
        AND a.status IN ('pending', 'scheduled', 'awaiting_payment', 'confirmed', 'checked_in', 'in_progress')
        AND (
          a.status <> 'awaiting_payment'
          OR a.payment_expires_at IS NULL
          OR a.payment_expires_at > now()
        )
    ) THEN
      RAISE EXCEPTION 'ACTIVE_LINKED_TREATMENT_EXISTS';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS appointments_guard_active_linked_treatment ON public.appointments;
CREATE TRIGGER appointments_guard_active_linked_treatment
BEFORE INSERT OR UPDATE OF parent_consultation_id, booking_kind, status, payment_expires_at
ON public.appointments
FOR EACH ROW
EXECUTE FUNCTION public.guard_active_linked_treatment();

REVOKE ALL ON FUNCTION public.guard_active_linked_treatment() FROM PUBLIC;
