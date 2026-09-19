-- ================================================================
-- Standardise duration for the 5 Vasti/Tarpanam "special chapter"
-- therapies to 1 hour, with the multi-day course options noted.
-- Run via the Supabase SQL Editor or `supabase migration up`.
-- ================================================================

UPDATE public.treatments
SET duration = '1 hour (3, 5, 7, 10 or more days)'
WHERE title IN (
  'Jaanu Vasti (Knee Care)',
  'Kati Vasti (Lower Back Care)',
  'Greeva Vasti (Neck Care)',
  'Uro Vasti (Chest Care)',
  'Netra Tarpanam (Eye Rejuvenation)'
);

-- Simplify the Post-Delivery Care Package duration label (drop the
-- redundant "Personalised" prefix and the "~" tilde).
UPDATE public.treatments
SET duration = 'Up to 45 days'
WHERE title = 'Post-Delivery Care Package (Sutika Paricharya)';
