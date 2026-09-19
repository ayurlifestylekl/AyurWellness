-- ============================================================================
-- quiz_results — stores completed Ayurvedic assessment outcomes per customer.
--
-- result_data is JSONB so the same table can store payloads from each quiz
-- type (Prakriti, Vikriti, Agni, Skin, Hair, Sleep, Manas). The Prakriti
-- v1 payload follows the QuizResultRow shape in src/types/quiz.ts.
--
-- RLS: customer reads + writes their own rows. Admin reads + writes any row
-- (uses the existing public.is_admin() helper from setup.sql).
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.quiz_results (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  quiz_slug     TEXT NOT NULL CHECK (quiz_slug IN (
                  'prakriti','vikriti','agni','skin','hair','sleep','manas'
                )),
  result_data   JSONB NOT NULL,
  completed_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS quiz_results_user_idx
  ON public.quiz_results (user_id, quiz_slug, completed_at DESC);

ALTER TABLE public.quiz_results ENABLE ROW LEVEL SECURITY;

-- Drop existing policies (idempotent re-run)
DROP POLICY IF EXISTS "quiz_results: customer reads own"  ON public.quiz_results;
DROP POLICY IF EXISTS "quiz_results: customer writes own" ON public.quiz_results;
DROP POLICY IF EXISTS "quiz_results: admin full access"   ON public.quiz_results;

CREATE POLICY "quiz_results: customer reads own"
  ON public.quiz_results FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "quiz_results: customer writes own"
  ON public.quiz_results FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "quiz_results: admin full access"
  ON public.quiz_results FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
