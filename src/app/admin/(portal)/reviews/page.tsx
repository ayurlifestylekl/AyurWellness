import { createClient } from '@/lib/supabase/server'
import { listAdminReviews, type ReviewStatus } from '@/lib/reviews/queries'
import ReviewsTabs from './ReviewsTabs'
import ReviewsTable from './ReviewsTable'

export const metadata = { title: 'Reviews · Admin' }
export const dynamic = 'force-dynamic'

interface PageProps {
  searchParams: { status?: string }
}

export default async function AdminReviewsPage({ searchParams }: PageProps) {
  const supabase = await createClient()
  const status = (searchParams.status as ReviewStatus | 'all') ?? 'pending'
  const { items, total } = await listAdminReviews(supabase, { status, limit: 200 })

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-4">
      <header>
        <span className="font-heading text-[10px] font-semibold uppercase tracking-[0.22em] text-[#B58A3B]">
          Customer voice
        </span>
        <h1 className="mt-2 font-heading text-[28px] font-bold leading-tight text-[#006B3C]">
          Product reviews
        </h1>
        <p className="mt-1 font-body text-[13px] text-[#12372D]/65">
          {total} {status === 'all' ? 'review' : status + ' review'}
          {total === 1 ? '' : 's'} in this view. Approved reviews appear on the storefront.
        </p>
      </header>

      <ReviewsTabs active={status} />
      <ReviewsTable items={items} />
    </div>
  )
}
