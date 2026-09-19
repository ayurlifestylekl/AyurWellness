-- ================================================================
-- Staff-selectable schedule colour tags
--
-- The client asked for a manual colour palette front desk can apply to a
-- slot for their own bookkeeping (temporary booking, needs special
-- attention, booking between 2 centres, etc.) — separate from the
-- automatic status colouring already on the schedule grid. NULL means
-- "no manual tag, use the automatic status colour."
-- ================================================================

ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS staff_color_tag TEXT
    CHECK (staff_color_tag IS NULL OR staff_color_tag IN (
      'red', 'blue_light', 'blue_dark', 'green_light', 'green_dark',
      'purple', 'pink', 'black'
    ));

COMMENT ON COLUMN public.appointments.staff_color_tag IS
  'Manual front-desk colour tag for the schedule grid (e.g. temporary booking, needs attention, booking between 2 centres). NULL = use the automatic status colour.';
