import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center bg-[#EDF4E7] px-6 text-center">
      <span className="font-heading text-[11px] font-bold uppercase tracking-[0.28em] text-[#B58A3B]">
        Ayurvedic Wellness Centre
      </span>
      <p className="mt-4 font-display text-[52px] italic leading-none text-[#006B3C]">404</p>
      <h1 className="mt-2 font-heading text-[20px] font-extrabold text-[#006B3C]">This page wandered off.</h1>
      <p className="mt-3 max-w-md font-body text-[14px] leading-relaxed text-[#12372D]/65">
        The page you&apos;re looking for doesn&apos;t exist or has moved.
      </p>
      <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/"
          className="rounded-full bg-[#006B3C] px-6 py-3 font-heading text-[11px] font-bold uppercase tracking-[0.2em] text-white transition-colors hover:bg-[#12372D]"
        >
          Back to home
        </Link>
        <Link
          href="/treatments"
          className="rounded-full border border-[#006B3C]/25 px-6 py-3 font-heading text-[11px] font-bold uppercase tracking-[0.2em] text-[#006B3C] transition-colors hover:border-[#B58A3B]"
        >
          Browse therapies
        </Link>
      </div>
    </div>
  )
}
