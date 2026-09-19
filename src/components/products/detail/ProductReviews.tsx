import Link from 'next/link'
import { Star } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/getCurrentUser'
import {
  getApprovedReviewsForProduct,
  getProductReviewSummary,
  customerCanReviewProduct,
} from '@/lib/reviews/queries'
import ReviewForm from './ReviewForm'

export default async function ProductReviews({ productId }: { productId: string }) {
  const supabase = await createClient()
  const me = await getCurrentUser()

  const [summary, reviews, eligibility] = await Promise.all([
    getProductReviewSummary(supabase, productId),
    getApprovedReviewsForProduct(supabase, productId, 30),
    me && me.role === 'customer'
      ? customerCanReviewProduct(supabase, me.profile.id, productId)
      : Promise.resolve({ canReview: false, orderId: null, reason: null as string | null }),
  ])

  return (
    <section className="mt-16 border-t border-accent/20 pt-10">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-3xl text-primary md:text-4xl">
            Customer reviews
          </h2>
          {summary.count > 0 ? (
            <div className="mt-2 flex items-center gap-3">
              <Stars value={Math.round(summary.averageRating)} />
              <span className="font-body text-sm text-primary/70">
                {summary.averageRating.toFixed(1)} · {summary.count} review
                {summary.count === 1 ? '' : 's'}
              </span>
            </div>
          ) : (
            <p className="mt-2 font-body text-sm italic text-primary/55">
              Be the first to share your experience.
            </p>
          )}
        </div>
      </header>

      {/* Submission area */}
      <div className="mt-6">
        {!me ? (
          <div className="rounded-2xl border border-accent/30 bg-cream/40 p-5 text-sm text-primary/75">
            <Link href="/auth/login" className="font-semibold text-accent hover:underline">
              Sign in
            </Link>{' '}
            to leave a review.
          </div>
        ) : me.role !== 'customer' ? null : eligibility.canReview ? (
          <ReviewForm productId={productId} />
        ) : (
          <div className="rounded-2xl border border-accent/20 bg-cream/30 p-4 text-sm italic text-primary/60">
            {eligibility.reason}
          </div>
        )}
      </div>

      {/* Reviews list */}
      {reviews.length > 0 ? (
        <ul className="mt-8 flex flex-col gap-4">
          {reviews.map((r) => (
            <li
              key={r.id}
              className="rounded-2xl border border-accent/15 bg-white p-5"
            >
              <div className="flex flex-wrap items-center gap-3">
                <Stars value={r.rating} />
                <span className="font-body text-xs text-primary/55">
                  {new Date(r.createdAt).toLocaleDateString('en-MY')}
                </span>
              </div>
              {r.title ? (
                <h3 className="mt-2 font-display text-lg text-primary">{r.title}</h3>
              ) : null}
              <p className="mt-2 whitespace-pre-wrap font-body text-sm leading-relaxed text-primary/85">
                {r.body}
              </p>
              <p className="mt-3 font-body text-xs italic text-primary/55">
                — {r.customerName}
              </p>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  )
}

function Stars({ value }: { value: number }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={`h-4 w-4 ${
            n <= value ? 'fill-accent text-accent' : 'text-primary/20'
          }`}
          strokeWidth={1.5}
        />
      ))}
    </span>
  )
}
