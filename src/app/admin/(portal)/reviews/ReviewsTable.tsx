'use client'

import { useState, useTransition } from 'react'
import { Star } from 'lucide-react'
import type { AdminReviewListItem } from '@/lib/reviews/queries'
import { approveReview, rejectReview } from '@/lib/reviews/actions'

const STATUS_CLASS: Record<string, string> = {
  pending:  'bg-amber-50 text-amber-700 border-amber-200',
  approved: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  rejected: 'bg-red-50 text-red-700 border-red-200',
}

export default function ReviewsTable({ items }: { items: AdminReviewListItem[] }) {
  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-[#006B3C]/15 p-12 text-center font-body text-sm italic text-[#12372D]/55">
        No reviews in this view.
      </div>
    )
  }
  return (
    <div className="flex flex-col gap-3">
      {items.map((r) => (
        <ReviewCard key={r.id} review={r} />
      ))}
    </div>
  )
}

function ReviewCard({ review }: { review: AdminReviewListItem }) {
  const [showReject, setShowReject] = useState(false)
  const [reason, setReason] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function doApprove() {
    setError(null)
    startTransition(async () => {
      const r = await approveReview(review.id)
      if (!r.ok) setError(r.error)
      else location.reload()
    })
  }

  function doReject() {
    setError(null)
    startTransition(async () => {
      const r = await rejectReview(review.id, reason)
      if (!r.ok) setError(r.error)
      else location.reload()
    })
  }

  return (
    <article className="rounded-2xl border border-[#006B3C]/8 bg-white p-4">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Stars value={review.rating} />
            <span
              className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10.5px] font-semibold ${STATUS_CLASS[review.status] ?? ''}`}
            >
              {review.status}
            </span>
            <span className="text-[11.5px] text-[#12372D]/55">
              {new Date(review.createdAt).toLocaleDateString('en-MY')}
            </span>
          </div>
          {review.title ? (
            <h3 className="mt-2 font-heading text-[15px] font-semibold text-[#006B3C]">
              {review.title}
            </h3>
          ) : null}
          <p className="mt-1 text-[12px] text-[#12372D]/65">
            on <strong>{review.productName}</strong> · by {review.customerName} ({review.customerEmail})
          </p>
        </div>
      </header>
      <p className="mt-3 whitespace-pre-wrap text-[13px] leading-relaxed text-[#12372D]/85">
        {review.body}
      </p>
      {review.rejectionReason ? (
        <p className="mt-3 rounded-lg border border-red-200 bg-red-50 p-2 text-[12px] text-red-800">
          <strong>Rejected:</strong> {review.rejectionReason}
        </p>
      ) : null}
      {review.status === 'pending' || review.status === 'rejected' ? (
        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-[#006B3C]/6 pt-3">
          <button
            type="button"
            disabled={pending}
            onClick={doApprove}
            className="rounded-lg bg-emerald-600 px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {pending ? 'Working…' : 'Approve'}
          </button>
          {review.status === 'pending' ? (
            <button
              type="button"
              disabled={pending}
              onClick={() => setShowReject(true)}
              className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-[12px] font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
            >
              Reject
            </button>
          ) : null}
          {error ? <span className="text-[11.5px] text-red-700">{error}</span> : null}
        </div>
      ) : (
        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-[#006B3C]/6 pt-3">
          <button
            type="button"
            disabled={pending}
            onClick={() => setShowReject(true)}
            className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-[12px] font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
          >
            Unpublish (reject)
          </button>
          {error ? <span className="text-[11.5px] text-red-700">{error}</span> : null}
        </div>
      )}

      {showReject ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5">
            <h2 className="font-heading text-[16px] font-semibold text-[#006B3C]">
              Reject review
            </h2>
            <label className="mt-3 block text-[11px] font-semibold uppercase tracking-wider text-[#006B3C]/70">
              Reason *
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              className="mt-1 w-full rounded-lg border border-[#006B3C]/15 px-3 py-2 text-[13px]"
              placeholder="e.g. inappropriate language, spam, off-topic"
            />
            {error ? <p className="mt-2 text-[12px] text-red-600">{error}</p> : null}
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => setShowReject(false)}
                className="rounded-lg border border-[#006B3C]/15 px-3 py-1.5 text-[12px]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={pending || reason.trim().length < 3}
                onClick={doReject}
                className="rounded-lg bg-red-600 px-3 py-1.5 text-[12px] font-semibold text-white disabled:opacity-50"
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </article>
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
