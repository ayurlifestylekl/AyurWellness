'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'

const STATUSES = ['active', 'draft', 'archived'] as const

export default function ProductsFilters({ categories }: { categories: string[] }) {
  const router = useRouter()
  const sp = useSearchParams()

  const set = useCallback(
    (k: string, v: string | null) => {
      const next = new URLSearchParams(sp.toString())
      if (!v) next.delete(k)
      else next.set(k, v)
      router.push(`/admin/products?${next.toString()}`)
    },
    [router, sp],
  )

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-[#006B3C]/10 bg-white p-3">
      <input
        type="search"
        placeholder="Search name, SKU, slug…"
        defaultValue={sp.get('q') ?? ''}
        onChange={(e) => set('q', e.target.value || null)}
        className="min-w-[200px] flex-1 rounded-lg border border-[#006B3C]/10 bg-white px-3 py-1.5 text-sm placeholder:text-[#12372D]/40 focus:border-[#006B3C] focus:outline-none"
      />
      <select
        value={sp.get('status') ?? ''}
        onChange={(e) => set('status', e.target.value || null)}
        className="rounded-lg border border-[#006B3C]/10 bg-white px-3 py-1.5 text-sm"
      >
        <option value="">All statuses</option>
        {STATUSES.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
      <select
        value={sp.get('category') ?? ''}
        onChange={(e) => set('category', e.target.value || null)}
        className="rounded-lg border border-[#006B3C]/10 bg-white px-3 py-1.5 text-sm"
      >
        <option value="">All categories</option>
        {categories.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>
      <select
        value={sp.get('featured') ?? ''}
        onChange={(e) => set('featured', e.target.value || null)}
        className="rounded-lg border border-[#006B3C]/10 bg-white px-3 py-1.5 text-sm"
      >
        <option value="">Featured: any</option>
        <option value="true">Featured only</option>
        <option value="false">Not featured</option>
      </select>
    </div>
  )
}
