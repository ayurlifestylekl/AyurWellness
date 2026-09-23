'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { AdminOrderListItem } from '@/lib/admin/orders/queries'
import BulkActionsBar from './BulkActionsBar'

const STATUS_CLASS: Record<string, string> = {
  pending:    'bg-amber-50 text-amber-700 border-amber-200',
  processing: 'bg-blue-50 text-blue-700 border-blue-200',
  packing:    'bg-indigo-50 text-indigo-700 border-indigo-200',
  shipped:    'bg-violet-50 text-violet-700 border-violet-200',
  delivered:  'bg-emerald-50 text-emerald-700 border-emerald-200',
  completed:  'bg-emerald-100 text-emerald-800 border-emerald-300',
  cancelled:  'bg-red-50 text-red-700 border-red-200',
}

const PAYMENT_CLASS: Record<string, string> = {
  pending:  'text-amber-700',
  paid:     'text-emerald-700',
  failed:   'text-red-700',
  refunded: 'text-slate-700',
}

export default function OrdersTable({ items }: { items: AdminOrderListItem[] }) {
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
    setSelected((prev) => {
      if (prev.size === items.length) return new Set()
      return new Set(items.map((o) => o.id))
    })
  }

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-[#006B3C]/15 p-12 text-center font-body text-sm italic text-[#12372D]/55">
        No orders match your filters.
      </div>
    )
  }

  const allSelected = selected.size === items.length

  return (
    <div className="flex flex-col gap-3">
      <BulkActionsBar selectedIds={Array.from(selected)} />

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
              <th className="px-4 py-3">Order</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Payment</th>
              <th className="px-4 py-3 text-right">Total</th>
              <th className="px-4 py-3">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#006B3C]/6">
            {items.map((o) => (
              <tr key={o.id} className="hover:bg-[#EDF4E7]/30">
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selected.has(o.id)}
                    onChange={() => toggle(o.id)}
                    aria-label={`Select order ${o.shortId}`}
                  />
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/orders/${o.id}`}
                    className="font-semibold text-[#006B3C] hover:text-[#B58A3B]"
                  >
                    #{o.shortId}
                  </Link>
                  <div className="text-[11px] text-[#12372D]/55">
                    {o.itemCount} item{o.itemCount === 1 ? '' : 's'} · {o.channel}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div>{o.customerName ?? '—'}</div>
                  <div className="text-[11px] text-[#12372D]/55">{o.customerEmail ?? ''}</div>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10.5px] font-semibold ${STATUS_CLASS[o.fulfillmentStatus] ?? ''}`}
                  >
                    {o.fulfillmentStatus}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`font-semibold ${PAYMENT_CLASS[o.paymentStatus] ?? ''}`}>
                    {o.paymentStatus}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">RM {o.totalRm.toFixed(2)}</td>
                <td className="px-4 py-3 text-[12px] text-[#12372D]/65">
                  {new Date(o.createdAt).toLocaleDateString('en-MY')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
