-- ============================================================================
-- appointments — add columns to support the Appointments/Bookings page.
--
--  • mode          — 'in-person' (default) vs 'virtual' (telehealth)
--  • meeting_link  — Cal.com video URL for virtual appointments
--  • notes         — Vaidya's free-text post-visit notes (powers the
--                    Aftercare panel; admin UI to populate is a later task)
-- ============================================================================

ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS mode TEXT
    CHECK (mode IN ('in-person', 'virtual')) DEFAULT 'in-person',
  ADD COLUMN IF NOT EXISTS meeting_link TEXT,
  ADD COLUMN IF NOT EXISTS notes TEXT;

-- Backfill existing rows to the safe default. (DEFAULT only applies to new
-- rows; explicit UPDATE ensures legacy rows aren't NULL on `mode`.)
UPDATE public.appointments SET mode = 'in-person' WHERE mode IS NULL;
