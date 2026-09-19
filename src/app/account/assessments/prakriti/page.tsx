import { getCurrentUser } from '@/lib/auth/getCurrentUser'
import { createClient } from '@/lib/supabase/server'
import { getLatestResult } from '@/lib/quizzes/queries'
import PrakritiPlayer from '@/components/assessments/PrakritiPlayer'

export const metadata = {
  title: 'Prakriti Assessment',
}

export default async function PrakritiQuizPage() {
  const me = await getCurrentUser()
  const customerId = me?.authId ?? ''

  const supabase = await createClient()
  const prior = customerId
    ? await getLatestResult(supabase, customerId, 'prakriti')
    : null

  return <PrakritiPlayer hasPriorResult={Boolean(prior)} />
}
