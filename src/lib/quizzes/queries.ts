import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/database.types'
import type { QuizResultRow } from '@/types/quiz'

type QuizSlug = Database['public']['Tables']['quiz_results']['Row']['quiz_slug']

export interface SavedQuizResult {
  id: string
  quizSlug: QuizSlug
  result: QuizResultRow
  completedAt: string
}

/**
 * Insert a fresh quiz result for the signed-in customer.
 * RLS enforces `user_id = auth.uid()` at the database level.
 */
export async function saveQuizResult(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any, 'public', any>,
  userId: string,
  slug: QuizSlug,
  data: QuizResultRow
): Promise<{ id: string } | null> {
  const { data: inserted, error } = await supabase
    .from('quiz_results')
    .insert({
      user_id: userId,
      quiz_slug: slug,
      result_data: data as unknown as Database['public']['Tables']['quiz_results']['Insert']['result_data'],
    })
    .select('id')
    .single()

  if (error) {
    console.error('[quizzes/saveQuizResult] failed:', error.message)
    return null
  }
  return { id: (inserted as { id: string }).id }
}

/**
 * Fetch the customer's most recent result for a given quiz, if any.
 */
export async function getLatestResult(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any, 'public', any>,
  userId: string,
  slug: QuizSlug
): Promise<SavedQuizResult | null> {
  const { data, error } = await supabase
    .from('quiz_results')
    .select('id, quiz_slug, result_data, completed_at')
    .eq('user_id', userId)
    .eq('quiz_slug', slug)
    .order('completed_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    console.error('[quizzes/getLatestResult] failed:', error.message)
    return null
  }
  if (!data) return null

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const row = data as any
  return {
    id: row.id,
    quizSlug: row.quiz_slug,
    result: row.result_data as QuizResultRow,
    completedAt: row.completed_at,
  }
}

/**
 * Used by the hub to know which quizzes are already completed.
 * Returns a Set of quiz slugs the user has at least one row for.
 */
export async function getCompletedQuizSlugs(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any, 'public', any>,
  userId: string
): Promise<Set<QuizSlug>> {
  const { data, error } = await supabase
    .from('quiz_results')
    .select('quiz_slug')
    .eq('user_id', userId)

  if (error) {
    console.error('[quizzes/getCompletedQuizSlugs] failed:', error.message)
    return new Set()
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return new Set((data as any[]).map((r) => r.quiz_slug as QuizSlug))
}
