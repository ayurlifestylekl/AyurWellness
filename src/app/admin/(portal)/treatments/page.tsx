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
          Treatments live in Sanity Studio
        </h2>
        <p className="mt-2 text-[13px] text-[#12372D]/70">
          Treatment content — title, duration, description, category, &quot;requires
          consultation&quot; flag — is managed inside <strong>Sanity Studio</strong>,
          our content-management system. Changes there flow to the public{' '}
          <Link href="/treatments" className="underline">
            /treatments
          </Link>{' '}
          page automatically (cached ~30 seconds) and appear in the walk-in appointment
          form&apos;s treatment picker.
        </p>
        <p className="mt-3 text-[13px] text-[#12372D]/70">
          To add or edit treatments, open Sanity Studio:
        </p>
        <Link
          href="/studio"
          target="_blank"
          rel="noopener"
          className="mt-3 inline-flex items-center gap-2 rounded-lg bg-[#006B3C] px-4 py-2 text-[13px] font-semibold text-white hover:bg-[#006B3C]"
        >
          <ExternalLink className="h-3.5 w-3.5" /> Open Sanity Studio
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </article>

      <article className="rounded-2xl border border-[#006B3C]/8 bg-white p-5">
        <h3 className="font-heading text-[13px] font-semibold text-[#006B3C]">
          Why not in the admin panel directly?
        </h3>
        <p className="mt-2 text-[12.5px] text-[#12372D]/65">
          Treatments need rich content (descriptions, categorisation, &quot;requires
          consultation&quot; flag) and live alongside the marketing pages. Sanity is the
          right tool for that. The admin panel reads treatment names from Sanity to
          populate dropdowns &mdash; nothing duplicated, single source of truth.
        </p>
      </article>
    </div>
  )
}
