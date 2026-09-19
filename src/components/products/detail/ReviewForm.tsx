'use client'

import { useState, useTransition } from 'react'
import { Star } from 'lucide-react'
import { submitReview } from '@/lib/reviews/actions'

export default function ReviewForm({ productId }: { productId: string }) {
  const [rating, setRating] = useState(5)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [pending, startTransition] = useTransition()

  function submit() {
    setError(null)
    startTransition(async () => {
      const r = await submitReview({
        productId,
        rating,
        title: title.trim() || undefined,
        body: body.trim(),
      })
      if (!r.ok) setError(r.error)
      else {
        setSuccess(true)
        setTitle('')
        setBody('')
        setRating(5)
      }
    })
  }

  if (success) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-sm text-emerald-800">
        ✓ Thank you! Your review has been submitted for moderation. It will appear
        on this page once approved.
      </div>
    )
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        submit()
      }}
      className="rounded-2xl border border-accent/30 bg-white p-5"
    >
      <h3 className="font-display text-xl text-primary">Share your experience</h3>
      <p className="mt-1 font-body text-xs italic text-primary/55">
        Verified buyer · Reviews are moderated before publishing.
      </p>

      <fieldset className="mt-4">
        <legend className="font-body text-xs font-semibold uppercase tracking-wider text-primary/70">
          Rating
        </legend>
        <div className="mt-2 flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setRating(n)}
              aria-label={`${n} star${n === 1 ? '' : 's'}`}
              className="p-0.5"
            >
              <Star
                className={`h-7 w-7 transition-colors ${
                  n <= rating ? 'fill-accent text-accent' : 'text-primary/20'
                }`}
                strokeWidth={1.5}
              />
            </button>
          ))}
        </div>
      </fieldset>

      <label className="mt-4 block">
        <span className="font-body text-xs font-semibold uppercase tracking-wider text-primary/70">
          Title (optional)
        </span>
        <input
          type="text"
          value={title}
          maxLength={120}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Summarise your experience"
          className="mt-1 w-full rounded-lg border border-accent/20 bg-white px-3 py-2 font-body text-sm focus:border-accent focus:outline-none"
        />
      </label>

      <label className="mt-3 block">
        <span className="font-body text-xs font-semibold uppercase tracking-wider text-primary/70">
          Review *
        </span>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={4}
          minLength={10}
          maxLength={2000}
          required
          placeholder="What did you like, what worked for you, how did it feel?"
          className="mt-1 w-full rounded-lg border border-accent/20 bg-white px-3 py-2 font-body text-sm focus:border-accent focus:outline-none"
        />
        <span className="mt-1 block text-right font-body text-[11px] text-primary/45">
          {body.length} / 2000
        </span>
      </label>

      {error ? (
        <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          ⚠ {error}
        </p>
      ) : null}

      <div className="mt-4 flex items-center justify-end">
        <button
          type="submit"
          disabled={pending || body.trim().length < 10}
          className="rounded-lg bg-primary px-4 py-2 font-body text-sm font-semibold text-cream hover:bg-primary/90 disabled:opacity-50"
        >
          {pending ? 'Submitting…' : 'Submit review'}
        </button>
      </div>
    </form>
  )
}
