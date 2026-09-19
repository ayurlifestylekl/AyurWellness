import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Compass, ArrowRight } from 'lucide-react'
import { getCurrentUser } from '@/lib/auth/getCurrentUser'
import { createClient } from '@/lib/supabase/server'
import { getLatestResult } from '@/lib/quizzes/queries'
import { getStorefrontProducts } from '@/lib/storefront/products'
import { prakritiQuiz } from '@/data/quizzes/prakriti'
import PrakritiResults from '@/components/assessments/PrakritiResults'

export const metadata = {
  title: 'Your Prakriti',
}

export default async function PrakritiResultsPage() {
  const me = await getCurrentUser()
  if (!me) redirect('/auth/login?next=/account/assessments/prakriti/results')

  const supabase = await createClient()
  const latest = await getLatestResult(supabase, me.authId, 'prakriti')

  if (!latest) {
    return (
      <div className="mx-auto flex max-w-xl flex-col items-center gap-6 py-16 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EDF4E7]">
          <Compass className="h-6 w-6 text-[#B58A3B]" strokeWidth={1.6} />
        </span>
        <h1
          className="font-heading text-[26px] font-bold text-[#006B3C]"
          style={{ letterSpacing: '-0.02em' }}
        >
          No assessment on file yet.
        </h1>
        <p className="max-w-md font-body text-[14px] text-[#12372D]/65" style={{ lineHeight: 1.65 }}>
          Take the Prakriti assessment to receive your personal profile, daily anchors,
          and recommendations from our Vaidya.
        </p>
        <Link
          href="/account/assessments/prakriti"
          className="group inline-flex h-11 items-center gap-2 rounded-full bg-[#006B3C] px-6 font-heading text-[12px] font-bold uppercase tracking-[0.16em] text-white transition-all hover:bg-[#006B3C] active:scale-[0.98]"
        >
          Begin assessment
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
    )
  }

  // Resolve recommended products from Supabase (with hardcoded fallback inside
  // getStorefrontProducts). Match by slug — both legacy and Supabase products
  // use the same slug-like key, so this works during the transition.
  const archetype = prakritiQuiz.archetypes[latest.result.archetypeKey]
  const slugList = archetype?.recommendations.productSlugs ?? []
  const allProducts = await getStorefrontProducts(supabase)
  const recommendedProducts = slugList
    .map((slug) => allProducts.find((p) => p.id === slug))
    .filter((p): p is NonNullable<typeof p> => Boolean(p))

  return (
    <PrakritiResults
      result={latest.result}
      completedAt={latest.completedAt}
      recommendedProducts={recommendedProducts}
    />
  )
}
