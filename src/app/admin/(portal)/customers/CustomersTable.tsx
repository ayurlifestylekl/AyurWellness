'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { CustomerListItem } from '@/lib/admin/customers/queries'
import CustomerBulkActions from './CustomerBulkActions'

export default function CustomersTable({ items }: { items: CustomerListItem[] }) {
  const [selected, setSelected] = useState<Set<string>>(new Set())

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }
  function toggleAll() {
    setSelected((prev) =>
      prev.size === items.length ? new Set() : new Set(items.map((c) => c.id)),
    )
  }

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-[#006B3C]/15 p-12 text-center font-body text-sm italic text-[#12372D]/55">
        No customers match your filters.
      </div>
    )
  }

  const allSelected = selected.size === items.length

  return (
    <div className="flex flex-col gap-3">
      <CustomerBulkActions selectedIds={Array.from(selected)} />

      <div className="overflow-x-auto rounded-2xl border border-[#006B3C]/8 bg-white">
        <table className="min-w-[640px] w-full text-left text-[13px]">
          <thead className="bg-[#EDF4E7]/40 text-[11px] font-semibold uppercase tracking-wider text-[#006B3C]/70">
            <tr>
              <th className="px-4 py-3">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleAll}
                  aria-label="Select all"
                />
              </th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Contact</th>
              <th className="px-4 py-3 text-right">Orders</th>
              <th className="px-4 py-3 text-right">Lifetime spend</th>
              <th className="px-4 py-3">Dosha</th>
              <th className="px-4 py-3">Tags</th>
              <th className="px-4 py-3">Joined</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#006B3C]/6">
            {items.map((c) => (
              <tr key={c.id} className="hover:bg-[#EDF4E7]/30">
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selected.has(c.id)}
                    onChange={() => toggle(c.id)}
                    aria-label={`Select ${c.fullName ?? c.email}`}
                  />
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/customers/${c.id}`}
                    className="font-semibold text-[#006B3C] hover:text-[#B58A3B]"
                  >
                    {c.fullName ?? '—'}
                  </Link>
                  {c.blocked ? (
                    <span className="ml-2 rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-[10px] font-semibold text-red-700">
                      blocked
                    </span>
                  ) : null}
                </td>
                <td className="px-4 py-3 text-[12px] text-[#12372D]/65">
                  <div>{c.email ?? '—'}</div>
                  <div className="text-[11px]">{c.phone ?? ''}</div>
                </td>
                <td className="px-4 py-3 text-right">{c.totalOrders}</td>
                <td className="px-4 py-3 text-right font-semibold">
                  RM {c.totalSpentRm.toFixed(2)}
                </td>
                <td className="px-4 py-3 text-[12px] text-[#12372D]/65 capitalize">
                  {c.doshaPrimary ?? '—'}
                </td>
                <td className="px-4 py-3 text-[11px]">
                  {c.tags?.length ? (
                    c.tags.map((t) => (
                      <span
                        key={t}
                        className="mr-1 inline-block rounded-full border border-[#006B3C]/15 bg-[#EDF4E7]/40 px-2 py-0.5"
                      >
                        {t}
                      </span>
                    ))
                  ) : (
                    <span className="text-[#12372D]/45">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-[11.5px] text-[#12372D]/55">
                  {new Date(c.createdAt).toLocaleDateString('en-MY')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
