'use client'

import { useState } from 'react'
import { Send, Download } from 'lucide-react'
import type { PendingPayoutSummary } from '@/lib/admin/agents/payouts-queries'
import { bulkMarkAgentsPaid } from '@/lib/admin/agents/payouts-actions'

function relativeAge(iso: string | null): string {
  if (!iso) return '—'
  const ms = Date.now() - new Date(iso).getTime()
  const days = Math.floor(ms / (1000 * 60 * 60 * 24))
  if (days < 1) return 'Today'
  if (days === 1) return '1 day ago'
  if (days < 30) return `${days} days ago`
  const months = Math.floor(days / 30)
  return `${months} mo ago`
}

export default function PayoutsQueueTable({
  rows,
}: {
  rows: PendingPayoutSummary[]
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [paymentMethod, setPaymentMethod] = useState<
    'bank_transfer' | 'cash' | 'fpx' | 'cheque'
  >('bank_transfer')
  const [pending, setPending] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  function toggle(id: string) {
    setSelected((p) => {
      const n = new Set(p)
      if (n.has(id)) n.delete(id)
      else n.add(id)
      return n
    })
  }
  function toggleAll() {
    setSelected((p) =>
      p.size === rows.length ? new Set() : new Set(rows.map((r) => r.agentId)),
    )
  }

  const allSelected = rows.length > 0 && selected.size === rows.length
  const selectedTotal = rows
    .filter((r) => selected.has(r.agentId))
    .reduce((s, r) => s + r.pendingTotalRm, 0)

  async function bulkPay() {
    setPending(true)
    setMessage(null)
    const r = await bulkMarkAgentsPaid({
      agentIds: Array.from(selected),
      paymentMethod,
    })
    setPending(false)
    if (!r.ok) {
      setMessage(`Failed: ${r.error}`)
      return
    }
    const d = (r as { ok: true; data?: { updated: number; totalRm: number } }).data
    setMessage(
      `Paid ${d?.updated ?? 0} agent${d?.updated === 1 ? '' : 's'} · total RM ${(d?.totalRm ?? 0).toFixed(2)}.`,
    )
    setTimeout(() => location.reload(), 1200)
  }

  function exportCsv() {
    const ids = Array.from(selected).join(',')
    if (!ids) {
      window.open('/admin/partners/payouts/export', '_blank')
      return
    }
    window.open(`/admin/partners/payouts/export?ids=${encodeURIComponent(ids)}`, '_blank')
  }

  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-[#006B3C]/15 p-12 text-center font-body text-sm italic text-[#12372D]/55">
        Nothing pending. All paid up.
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {selected.size > 0 ? (
        <div className="sticky top-0 z-10 flex flex-wrap items-center gap-2 rounded-2xl border border-[#B58A3B]/30 bg-[#EDF4E7] p-3">
          <span className="text-[12px] font-semibold text-[#006B3C]">
            {selected.size} agent{selected.size === 1 ? '' : 's'} · RM {selectedTotal.toFixed(2)}
          </span>
          <select
            value={paymentMethod}
            onChange={(e) =>
              setPaymentMethod(
                e.target.value as 'bank_transfer' | 'cash' | 'fpx' | 'cheque',
              )
            }
            className="rounded-lg border border-[#006B3C]/15 bg-white px-3 py-1.5 text-[12px]"
          >
            <option value="bank_transfer">Bank transfer</option>
            <option value="fpx">FPX</option>
            <option value="cash">Cash</option>
            <option value="cheque">Cheque</option>
          </select>
          <button
            type="button"
            disabled={pending}
            onClick={bulkPay}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#006B3C] px-3 py-1.5 text-[12px] font-semibold text-white disabled:opacity-50"
          >
            <Send className="h-3.5 w-3.5" />
            {pending ? 'Marking…' : 'Mark all as paid'}
          </button>
          <button
            type="button"
            onClick={exportCsv}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#006B3C]/20 bg-white px-3 py-1.5 text-[12px] font-semibold text-[#006B3C]"
          >
            <Download className="h-3.5 w-3.5" />
            Bank-transfer CSV
          </button>
          {message ? (
            <span className="text-[11.5px] text-[#12372D]/70">{message}</span>
          ) : null}
        </div>
      ) : null}

      <div className="overflow-hidden rounded-2xl border border-[#006B3C]/8 bg-white">
        <table className="w-full text-left text-[13px]">
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
              <th className="px-4 py-3">Partner</th>
              <th className="px-4 py-3">Referral code</th>
              <th className="px-4 py-3 text-right">Pending</th>
              <th className="px-4 py-3 text-right">Amount owed</th>
              <th className="px-4 py-3">Oldest pending</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#006B3C]/6">
            {rows.map((r) => (
              <tr key={r.agentId} className="hover:bg-[#EDF4E7]/30">
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selected.has(r.agentId)}
                    onChange={() => toggle(r.agentId)}
                    aria-label={`Select ${r.agentName}`}
                  />
                </td>
                <td className="px-4 py-3">
                  <a
                    href={`/admin/partners/${r.agentId}`}
                    className="font-semibold text-[#006B3C] hover:text-[#B58A3B]"
                  >
                    {r.agentName ?? '—'}
                  </a>
                  <div className="text-[11px] text-[#12372D]/55">{r.agentEmail ?? ''}</div>
                </td>
                <td className="px-4 py-3">
                  <code className="font-mono text-[11.5px] font-semibold">
                    {r.referralCode}
                  </code>
                  <div className="text-[11px] text-[#12372D]/55 capitalize">
                    {r.commissionType}
                  </div>
                </td>
                <td className="px-4 py-3 text-right">{r.pendingCount}</td>
                <td className="px-4 py-3 text-right font-semibold text-[#B58A3B]">
                  RM {r.pendingTotalRm.toFixed(2)}
                </td>
                <td className="px-4 py-3 text-[12px] text-[#12372D]/65">
                  {relativeAge(r.oldestPendingAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
