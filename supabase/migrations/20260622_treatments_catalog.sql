-- ================================================================
-- Treatment catalogue — categories + treatments
--
-- Moves the treatment catalogue out of Sanity and into Supabase so it
-- lives in the same database as bookings/payments and is editable from
-- the admin panel. Public read; admin-only writes (service role bypasses
-- RLS for seeding, matching the products pattern).
-- ================================================================

-- ── TREATMENT CATEGORIES ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.treatment_categories (
  id          TEXT PRIMARY KEY,            -- stable slug-ish id, e.g. 'cat-face-care'
  title       TEXT NOT NULL,
  slug        TEXT UNIQUE NOT NULL,
  description TEXT,
  image_url   TEXT,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── TREATMENTS ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.treatments (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id              TEXT NOT NULL REFERENCES public.treatment_categories(id) ON DELETE CASCADE,
  title                    TEXT NOT NULL,
  slug                     TEXT NOT NULL,
  duration                 TEXT,
  description              TEXT,
  -- Pricing: price_rm is the numeric standard price (RM). Null for
  -- consultation/enquiry-only therapies, which surface price_label instead.
  price_rm                 DECIMAL(10,2),
  price_label              TEXT,
  booking_type             TEXT NOT NULL DEFAULT 'direct'
                             CHECK (booking_type IN ('direct', 'consultation', 'enquiry')),
  booking_lead_time_hours  INTEGER,
  requires_consultation    BOOLEAN NOT NULL DEFAULT FALSE,
  sessions_recommended     TEXT,
  sanskrit_name            TEXT,
  origin                   TEXT,
  benefits                 TEXT[],
  procedure_steps          JSONB,          -- [{ "title": ..., "description": ... }]
  contraindications        TEXT,
  body                     TEXT,           -- long-form overview (paragraphs joined by blank lines)
  hero_image_url           TEXT,
  gallery                  JSONB,          -- [{ "url": ..., "alt": ... }]
  sort_order               INTEGER NOT NULL DEFAULT 0,
  is_active                BOOLEAN NOT NULL DEFAULT TRUE,
  created_at               TIMESTAMPTZ DEFAULT NOW(),
  updated_at               TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (category_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_treatments_category ON public.treatments(category_id);
CREATE INDEX IF NOT EXISTS idx_treatments_slug     ON public.treatments(slug);

-- keep updated_at fresh on writes
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_treatments_updated_at ON public.treatments;
CREATE TRIGGER trg_treatments_updated_at
  BEFORE UPDATE ON public.treatments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── RLS ────────────────────────────────────────────────────────
ALTER TABLE public.treatment_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.treatments           ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "treatment_categories: public read"       ON public.treatment_categories;
DROP POLICY IF EXISTS "treatment_categories: admin full access" ON public.treatment_categories;
DROP POLICY IF EXISTS "treatments: public read"                 ON public.treatments;
DROP POLICY IF EXISTS "treatments: admin full access"           ON public.treatments;

CREATE POLICY "treatment_categories: public read"
  ON public.treatment_categories FOR SELECT
  USING (true);

CREATE POLICY "treatment_categories: admin full access"
  ON public.treatment_categories FOR ALL
  USING (public.is_admin());

CREATE POLICY "treatments: public read"
  ON public.treatments FOR SELECT
  USING (true);

CREATE POLICY "treatments: admin full access"
  ON public.treatments FOR ALL
  USING (public.is_admin());
