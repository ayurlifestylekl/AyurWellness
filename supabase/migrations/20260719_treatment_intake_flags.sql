-- ================================================================
-- Treatment intake & age gating flags
--
-- Adds per-treatment controls used by the public booking flow and
-- back-fills the existing Supabase catalogue with sensible defaults.
-- Run via the Supabase SQL Editor or `supabase migration up`.
-- ================================================================

-- 1. New columns -----------------------------------------------------
ALTER TABLE public.treatments
  ADD COLUMN IF NOT EXISTS requires_scalp_disclaimer BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS requires_health_intake     BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS minimum_age                INTEGER,
  ADD COLUMN IF NOT EXISTS special_tags               TEXT[]   DEFAULT '{}';

COMMENT ON COLUMN public.treatments.requires_scalp_disclaimer IS 'If true, the customer must confirm they have no dandruff or scalp issues before booking.';
COMMENT ON COLUMN public.treatments.requires_health_intake     IS 'If true, the expanded health-intake section is mandatory before booking.';
COMMENT ON COLUMN public.treatments.minimum_age              IS 'Minimum patient age (in years) for direct online booking. NULL means no age gate.';
COMMENT ON COLUMN public.treatments.special_tags             IS 'Internal tags used to group therapies (e.g. oldage, kids, shirodhara). Editable from admin/seed if needed.';

-- 2. Backfill: Shirodhara / stress & sleep / scalp-related therapies.
--    The special_tags array is de-duplicated as it is built up.
UPDATE public.treatments
SET
  requires_scalp_disclaimer = TRUE,
  special_tags = ARRAY(
    SELECT DISTINCT unnest(array_append(COALESCE(special_tags, '{}'), 'shirodhara'))
  )
WHERE
  category_id = 'cat-stress-sleep'
  OR lower(
       coalesce(title, '') || ' ' ||
       coalesce(description, '') || ' ' ||
       coalesce(body, '')
     ) LIKE '%shirodhara%'
  OR lower(
       coalesce(title, '') || ' ' ||
       coalesce(description, '') || ' ' ||
       coalesce(body, '')
     ) LIKE '%sirodhaara%'
  OR lower(
       coalesce(title, '') || ' ' ||
       coalesce(description, '') || ' ' ||
       coalesce(body, '')
     ) LIKE '%takradhara%';

-- 3. Backfill: Old-age care therapies require the expanded health intake.
UPDATE public.treatments
SET
  requires_health_intake = TRUE,
  special_tags = ARRAY(
    SELECT DISTINCT unnest(array_append(COALESCE(special_tags, '{}'), 'oldage'))
  )
WHERE
  category_id = 'cat-oldage';

-- 4. Backfill: Kids Ayurveda Care therapies require expanded health intake.
--    Treatments whose description mentions an age range with a lower bound
--    of 11 or above are switched to direct booking; younger age groups remain
--    consultation-first.
UPDATE public.treatments
SET
  requires_health_intake = TRUE,
  special_tags = ARRAY(
    SELECT DISTINCT unnest(array_append(COALESCE(special_tags, '{}'), 'kids'))
  )
WHERE
  category_id = 'cat-kids';

-- 5. Enable direct booking + age gating for kids 11+.
UPDATE public.treatments
SET
  booking_type          = 'direct',
  requires_consultation = FALSE,
  minimum_age           = GREATEST(COALESCE(kids.min_age, 11), 11)
FROM (
  SELECT
    id,
    (regexp_match(
      lower(coalesce(description, '') || ' ' || coalesce(body, '')),
      'aged (\d+)'
    ))[1]::int AS min_age
  FROM public.treatments
  WHERE category_id = 'cat-kids'
) AS kids
WHERE
  public.treatments.id = kids.id
  AND kids.min_age IS NOT NULL
  AND kids.min_age >= 11;
