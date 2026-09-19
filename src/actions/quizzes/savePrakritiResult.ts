'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/getCurrentUser'
import { gradeQuiz } from '@/lib/quizzes/scorer'
import { saveQuizResult } from '@/lib/quizzes/queries'
import type { Dosha, QuizResultRow } from '@/types/quiz'

interface SavePrakritiInput {
  /** Responses map: `question.id` → chosen `option.dosha`. */
  responses: Record<string, Dosha>
}

export interface SavePrakritiResponse {
  ok: boolean
  archetypeKey?: QuizResultRow['archetypeKey']
  resultId?: string
  error?: string
}

/**
 * Persists a completed Prakriti quiz to `quiz_results`.
 * Called by the player on submit. Returns archetype for client navigation.
 */
export async function savePrakritiResult(
  input: SavePrakritiInput
): Promise<SavePrakritiResponse> {
  const me = await getCurrentUser()
  if (!me) return { ok: false, error: 'unauthorized' }
  if (me.role !== 'customer') return { ok: false, error: 'forbidden' }

  if (!input?.responses || typeof input.responses !== 'object') {
    return { ok: false, error: 'invalid_payload' }
  }

  // Grade server-side — never trust client-supplied scores.
  const graded = gradeQuiz(input.responses)
  const row: QuizResultRow = {
    version: 1,
    scores: graded.scores,
    totalPoints: graded.totalPoints,
    archetypeKey: graded.archetypeKey,
    dominantDosha: graded.dominantDosha,
    secondaryDosha: graded.secondaryDosha,
  }

  const supabase = await createClient()
  const saved = await saveQuizResult(supabase, me.authId, 'prakriti', row)
  if (!saved) return { ok: false, error: 'save_failed' }

  // Refresh hub + dashboard so the new completion shows up.
  revalidatePath('/account/assessments')
  revalidatePath('/account/dashboard')

  return { ok: true, archetypeKey: graded.archetypeKey, resultId: saved.id }
}
