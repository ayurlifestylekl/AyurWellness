'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Banknote, CheckCircle2, XCircle } from 'lucide-react'
import { approveRefund, rejectRefund } from '@/lib/booking/refund-request'
import { fmtMY } from '@/lib/datetime'

interface Refund {
  id: string
  status: string
  amountRm: number
  provider: string
  customerReason: string | null
  staffReason: string | null
  bankCode: string | null
  bankAccountLast4: string | null
  bankAccountNumber: string | null
  bankAccountHolderName: string | null
  failureReason: string | null
  createdAt: string
  confirmedAt: string | null
}

interface Props {
  refunds: Refund[]
  canApprove?: boolean
}

export default function RefundRequestPanel({ refunds, canApprove = true }: Props) {
  const router = useRouter()
  const [rejectingId, setRejectingId] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, start] = useTransition()

  if (refunds.length === 0) return null

  function run(fn: () => Promise<{ ok?: boolean; error?: string }>) {
    setError(null)
    start(async () => {
      const res = await fn()
      if (res.error) setError(res.error)
      else {
        setRejectingId(null)
        setRejectReason('')
        router.refresh()
      }
    })
  }

  return (
    <div className="rounded-xl border border-accent/30 bg-white p-5">
      <h3 className="mb-3 font-heading text-[12px] font-bold uppercase tracking-[0.16em] text-accent">Refund requests</h3>
      <div className="space-y-3">
        {refunds.map((r) => (
          <div key={r.id} className="flex flex-col gap-2 rounded-lg border border-dark/10 bg-cream/40 p-3 font-body text-[13px]">
            <div className="flex items-center justify-between">
              <span className="font-medium text-dark/85">
                RM{r.amountRm.toFixed(2)} via {r.provider}
              </span>
              <StatusBadge status={r.status} />
            </div>

            {r.customerReason && (
              <p className="text-dark/70">
                Customer reason: <em>{r.customerReason}</em>
              </p>
            )}

            {r.staffReason && (
              <p className="text-dark/70">
                Staff reason: <em>{r.staffReason}</em>
              </p>
            )}

            {(r.bankCode || r.bankAccountLast4) && (
              <p className="text-dark/60">
                Refund recipient:{' '}
                <strong>
                  {r.bankCode ?? '—'} •••• {r.bankAccountLast4 ?? '—'}
                </strong>
                {r.bankAccountHolderName ? ` (${r.bankAccountHolderName})` : ''}
              </p>
            )}

            {r.failureReason && <p className="text-red-700">{r.failureReason}</p>}

            <p className="text-[11px] text-dark/50">Requested {fmtMY(r.createdAt, { dateStyle: 'medium', timeStyle: 'short' })}</p>

            {r.status === 'requested' && canApprove && (
              <div className="mt-1 flex flex-col gap-2">
                {rejectingId === r.id ? (
                  <>
                    <textarea
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      rows={2}
                      placeholder="Reason for declining (shown to customer)"
                      className="w-full rounded-lg border border-accent/20 bg-white px-3 py-2 font-body text-[13px] text-dark placeholder:text-dark/30 focus:outline-none focus:ring-2 focus:ring-accent/40"
                      disabled={pending}
                    />
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => run(() => rejectRefund(r.id, rejectReason))}
                        disabled={pending || !rejectReason.trim()}
                        className="rounded-lg bg-red-600 px-3 py-2 font-heading text-[11px] font-bold uppercase tracking-[0.12em] text-white hover:bg-red-700 disabled:opacity-60"
                      >
                        {pending ? 'Declining…' : 'Confirm decline'}
                      </button>
                      <button
                        onClick={() => { setRejectingId(null); setRejectReason('') }}
                        disabled={pending}
                        className="rounded-lg border border-accent/30 px-3 py-2 font-heading text-[11px] font-bold uppercase tracking-[0.12em] text-primary hover:bg-cream disabled:opacity-60"
                      >
                        Cancel
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => run(() => approveRefund(r.id))}
                      disabled={pending}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-2 font-heading text-[11px] font-bold uppercase tracking-[0.12em] text-white hover:bg-green-700 disabled:opacity-60"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Approve & refund
                    </button>
                    <button
                      onClick={() => setRejectingId(r.id)}
                      disabled={pending}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-red-300 px-3 py-2 font-heading text-[11px] font-bold uppercase tracking-[0.12em] text-red-700 hover:bg-red-50 disabled:opacity-60"
                    >
                      <XCircle className="h-3.5 w-3.5" />
                      Decline
                    </button>
                  </div>
                )}
              </div>
            )}

            {r.status === 'requested' && !canApprove && (
              <p className="text-[11px] text-dark/50">Only front-desk / admin staff can approve refunds.</p>
            )}
          </div>
        ))}
      </div>
      {error && <p role="alert" className="mt-3 rounded-lg border border-red-300 bg-red-50 px-3 py-2 font-body text-[12.5px] text-red-700">{error}</p>}
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const classes =
    status === 'confirmed'
      ? 'bg-green-100 text-green-800'
      : status === 'failed' || status === 'exception' || status === 'rejected'
        ? 'bg-red-100 text-red-800'
        : 'bg-amber-100 text-amber-800'
  const icon =
    status === 'confirmed' ? <CheckCircle2 className="h-3 w-3" /> :
    status === 'failed' || status === 'exception' || status === 'rejected' ? <XCircle className="h-3 w-3" /> :
    <Banknote className="h-3 w-3" />
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-heading text-[10px] font-bold uppercase tracking-wider ${classes}`}>
      {icon}
      {status}
    </span>
  )
}
