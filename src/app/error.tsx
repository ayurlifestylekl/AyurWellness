'use client'

import Link from 'next/link'
import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Surface to the server logs / monitoring.
    console.error(error)
  }, [error])

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center bg-[#EDF4E7] px-6 text-center">
      <span className="font-heading text-[11px] font-bold uppercase tracking-[0.28em] text-[#B58A3B]">
        Ayurvedic Wellness Centre
      </span>
      <h1 className="mt-4 font-heading text-[26px] font-extrabold text-[#006B3C] sm:text-[32px]">
        Something went wrong.
      </h1>
      <p className="mt-3 max-w-md font-body text-[14px] leading-relaxed text-[#12372D]/65">
        A hiccup on our side — please try again. If it keeps happening, reach us on WhatsApp and we&apos;ll help you straight away.
      </p>
      <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
        <button
          onClick={reset}
          className="rounded-full bg-[#006B3C] px-6 py-3 font-heading text-[11px] font-bold uppercase tracking-[0.2em] text-white transition-colors hover:bg-[#12372D]"
        >
          Try again
        </button>
        <Link
          href="/"
          className="rounded-full border border-[#006B3C]/25 px-6 py-3 font-heading text-[11px] font-bold uppercase tracking-[0.2em] text-[#006B3C] transition-colors hover:border-[#B58A3B]"
        >
          Back to home
        </Link>
      </div>
    </div>
  )
}
