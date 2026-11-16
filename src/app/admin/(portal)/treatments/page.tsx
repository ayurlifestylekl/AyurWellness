import Link from 'next/link'
import { ExternalLink, ArrowRight } from 'lucide-react'

export const metadata = { title: 'Treatments · Admin' }

export default function AdminTreatmentsRedirectPage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5">
      <Link
        href="/admin/appointments"
        className="text-[11px] uppercase tracking-wider text-[#006B3C]/55 hover:text-[#B58A3B]"
      >
        ← Back to appointments
      </Link>
      <header>
        <span className="font-heading text-[10px] font-semibold uppercase tracking-[0.22em] text-[#B58A3B]">
          Catalog
        </span>
        <h1 className="mt-2 font-heading text-[28px] font-bold leading-tight text-[#006B3C]">
          Treatments
        </h1>
        <p className="mt-1 font-body text-[13px] text-[#12372D]/65">
          Manage treatment offerings — names, durations, descriptions, categories.
        </p>
      </header>

      <article
        className="rounded-2xl border border-[#B58A3B]/30 bg-[#EDF4E7]/60 p-5"
        style={{
          boxShadow:
            '0 1px 0 0 rgba(0,107,60,0.04), 0 12px 30px -16px rgba(0,107,60,0.18)',
        }}
      >
        <h2 className="font-heading text-[16px] font-semibold text-[#006B3C]">
          Treatments are managed by your developer
        </h2>
        <p className="mt-2 text-[13px] text-[#12372D]/70">
          The therapies on the{' '}
          <Link href="/treatments" className="underline">
            /treatments
          </Link>{' '}
          pages and in online booking — names, prices, durations, photos, and rules such as
          &quot;consultation first&quot;, minimum age and health questions — are stored in the
          website&apos;s database. To add a therapy or change one, send the details to your
          developer.
        </p>
        <p className="mt-3 text-[13px] text-[#12372D]/70">
          Sanity Studio is used for the blog, FAQs and the About page. Editing treatments there
          does not change the website.
        </p>
        <Link
          href="/treatments"
          target="_blank"
          rel="noopener"
          className="mt-3 inline-flex items-center gap-2 rounded-lg bg-[#006B3C] px-4 py-2 text-[13px] font-semibold text-white hover:bg-[#006B3C]"
        >
          <ExternalLink className="h-3.5 w-3.5" /> View live treatments
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </article>
    </div>
  )
}
