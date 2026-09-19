import Link from 'next/link'
import { Star } from 'lucide-react'
import { getCurrentUser } from '@/lib/auth/getCurrentUser'
import { createClient } from '@/lib/supabase/server'
import { listCustomerReviews } from '@/lib/reviews/queries'

export const metadata = { title: 'My Reviews' }
export const dynamic = 'force-dynamic'

const STATUS_CLASS: Record<string, string> = {
  pending:  'bg-amber-50 text-amber-700 border-amber-200',
  approved: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  rejected: 'bg-red-50 text-red-700 border-red-200',
}

const STATUS_LABEL: Record<string, string> = {
  pending:  'Awaiting moderation',
  approved: 'Published',
  rejected: 'Not published',
}

export default async function MyReviewsPage() {
  // Layout already redirects unauthed/non-customer; me is guaranteed here.
  const me = await getCurrentUser()
  const supabase = await createClient()
  const reviews = me ? await listCustomerReviews(supabase, me.profile.id) : []

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4">
      <header>
        <span className="font-heading text-[10px] font-semibold uppercase tracking-[0.22em] text-[#B58A3B]">
          Your voice
        </span>
        <h1 className="mt-2 font-heading text-[26px] font-bold leading-tight text-[#006B3C]">
          My reviews
        </h1>
        <p className="mt-1 font-body text-[13px] text-[#12372D]/65">
          Reviews you&apos;ve written. Published reviews appear on product pages.
        </p>
      </header>

      {reviews.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#006B3C]/15 p-12 text-center">
          <p className="font-body text-sm italic text-[#12372D]/55">
            You haven&apos;t reviewed any products yet.
          </p>
          <Link
            href="/account/orders"
            className="mt-3 inline-block text-[12.5px] font-semibold text-[#B58A3B] hover:underline"
          >
            See products you&apos;ve bought →
          </Link>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {reviews.map((r) => (
            <li key={r.id} className="rounded-2xl border border-[#006B3C]/8 bg-white p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <Stars value={r.rating} />
                    <span
                      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10.5px] font-semibold ${STATUS_CLASS[r.status] ?? ''}`}
                    >
                      {STATUS_LABEL[r.status] ?? r.status}
                    </span>
                  </div>
                  {r.title ? (
                    <h2 className="mt-2 font-heading text-[15px] font-semibold text-[#006B3C]">
                      {r.title}
                    </h2>
                  ) : null}
                  <p className="mt-1 text-[12px] text-[#12372D]/55">
                    on{' '}
                    <Link
                      href={`/shop/${r.productId}`}
                      className="font-semibold text-[#006B3C] hover:text-[#B58A3B]"
                    >
                      {r.productName}
                    </Link>{' '}
                    · {new Date(r.createdAt).toLocaleDateString('en-MY')}
                  </p>
                </div>
              </div>
              <p className="mt-3 whitespace-pre-wrap text-[13px] leading-relaxed text-[#12372D]/85">
                {r.body}
              </p>
              {r.rejectionReason ? (
                <p className="mt-3 rounded-lg border border-red-200 bg-red-50 p-2 text-[12px] text-red-800">
                  <strong>Admin note:</strong> {r.rejectionReason}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function Stars({ value }: { value: number }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={`h-3.5 w-3.5 ${
            n <= value ? 'fill-[#B58A3B] text-[#B58A3B]' : 'text-[#006B3C]/20'
          }`}
          strokeWidth={1.5}
        />
      ))}
    </span>
  )
}
