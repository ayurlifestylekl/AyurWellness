'use client'

import { useMemo, useState, useTransition } from 'react'
import { Banknote, Check, X } from 'lucide-react'
import { submitMarketplacePaymentBatch } from '@/lib/agent/marketplace-orders/actions'

interface UnpaidOrder {
  id: string
  channel: string
  customerName: string
  totalAmountRm: number
  createdAt: string
}

const CHANNEL_LABEL: Record<string, string> = {
  tiktok_shop: 'TikTok Shop',
  shopee: 'Shopee',
  lazada: 'Lazada',
  instagram: 'Instagram',
  whatsapp: 'WhatsApp',
  other: 'Other',
}

export default function PayPendingBanner({
  orders,
  total,
}: {
  orders: UnpaidOrder[]
  total: number
}) {
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(
    new Set(orders.map((o) => o.id)),
  )
  const [proofUrl, setProofUrl] = useState('')
  const [note, setNote] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const selectedTotal = useMemo(
    () =>
      orders
        .filter((o) => selected.has(o.id))
        .reduce((s, o) => s + o.totalAmountRm, 0),
    [orders, selected],
  )

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }
  function selectAll() {
    setSelected(new Set(orders.map((o) => o.id)))
  }
  function clearAll() {
    setSelected(new Set())
  }

  function submit() {
    setError(null)
    if (selected.size === 0) {
      setError('Pick at least one order to include in this payment.')
      return
    }
    if (!proofUrl.trim()) {
      setError('Paste the URL of your bank transfer receipt.')
      return
    }
    startTransition(async () => {
      const r = await submitMarketplacePaymentBatch({
        orderIds: Array.from(selected),
        paymentProofUrl: proofUrl,
        paymentNote: note || undefined,
      })
      if (!r.ok) setError(r.error)
      else location.reload()
    })
  }

  return (
    <>
      <section className="overflow-hidden rounded-2xl border border-amber-300 bg-gradient-to-br from-amber-50 to-amber-100">
        <div className="flex flex-wrap items-center gap-4 p-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-300/40">
            <Banknote className="h-5 w-5 text-amber-700" strokeWidth={2} />
          </span>
          <div className="flex-1">
            <h3 className="font-heading text-[14.5px] font-bold text-amber-900">
              {orders.length} order{orders.length === 1 ? '' : 's'} awaiting your payment
            </h3>
            <p className="mt-0.5 text-[12px] text-amber-900/85">
              Pay the clinic <strong>RM {total.toFixed(2)}</strong> in one transfer
              and upload one receipt — all orders flip to pending admin review.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="rounded-lg bg-amber-600 px-4 py-2 text-[13px] font-semibold text-white hover:bg-amber-700"
          >
            Pay all
          </button>
        </div>
      </section>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-3xl bg-white shadow-2xl">
            <header className="flex items-center justify-between border-b border-[#12372D]/10 px-6 py-4">
              <div>
                <h2 className="font-heading text-[18px] font-bold text-[#12372D]">
                  Pay clinic — batch
                </h2>
                <p className="mt-0.5 text-[11.5px] text-[#12372D]/65">
                  Select the orders this payment covers, then upload the receipt.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full text-[#12372D]/60 hover:bg-[#12372D]/[0.06]"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </header>

            <div className="flex-1 overflow-y-auto px-6 py-4">
              {/* Bank details */}
              <section className="rounded-2xl border border-[#12372D]/10 bg-[#EDF4E7]/40 p-3">
                <p className="text-[10.5px] font-semibold uppercase tracking-wider text-[#12372D]/70">
                  Transfer to
                </p>
                <ul className="mt-1 space-y-0.5 text-[12.5px] text-[#12372D]/85">
                  <li>
                    <strong>Bank:</strong> Maybank
                  </li>
                  <li>
                    <strong>Account name:</strong> Ayurvedic Wellness Centre
                  </li>
                  <li>
                    <strong>Account no.:</strong> 5142 6788 9012
                  </li>
                  <li>
                    <strong>TNG eWallet:</strong> +60 12-345 6789
                  </li>
                </ul>
              </section>

              {/* Order selection */}
              <section className="mt-4">
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="font-heading text-[12.5px] font-semibold text-[#12372D]">
                    Orders in this payment ({selected.size} of {orders.length})
                  </h3>
                  <div className="flex gap-2 text-[11px]">
                    <button
                      type="button"
                      onClick={selectAll}
                      className="font-semibold text-[#B58A3B] hover:underline"
                    >
                      Select all
                    </button>
                    <button
                      type="button"
                      onClick={clearAll}
                      className="font-semibold text-[#12372D]/55 hover:underline"
                    >
                      Clear
                    </button>
                  </div>
                </div>
                <ul className="flex flex-col gap-1.5">
                  {orders.map((o) => {
                    const isSel = selected.has(o.id)
                    return (
                      <li key={o.id}>
                        <button
                          type="button"
                          onClick={() => toggle(o.id)}
                          className={`flex w-full items-center gap-3 rounded-lg border px-3 py-2 text-left transition-colors ${
                            isSel
                              ? 'border-emerald-300 bg-emerald-50/60'
                              : 'border-[#12372D]/10 bg-white hover:bg-[#EDF4E7]/40'
                          }`}
                        >
                          <span
                            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border ${
                              isSel
                                ? 'border-emerald-500 bg-emerald-500 text-white'
                                : 'border-[#12372D]/25'
                            }`}
                          >
                            {isSel ? <Check className="h-3.5 w-3.5" /> : null}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block text-[12.5px] font-semibold text-[#12372D]">
                              {o.customerName}
                            </span>
                            <span className="block text-[11px] text-[#12372D]/55">
                              {CHANNEL_LABEL[o.channel] ?? o.channel} ·{' '}
                              {new Date(o.createdAt).toLocaleDateString('en-MY')}
                            </span>
                          </span>
                          <span className="font-heading text-[13px] font-bold text-[#12372D]">
                            RM {o.totalAmountRm.toFixed(2)}
                          </span>
                        </button>
                      </li>
                    )
                  })}
                </ul>
              </section>

              {/* Receipt */}
              <section className="mt-4 flex flex-col gap-3">
                <label className="flex flex-col gap-1">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-[#12372D]/70">
                    Receipt URL *
                  </span>
                  <input
                    type="url"
                    value={proofUrl}
                    onChange={(e) => setProofUrl(e.target.value)}
                    placeholder="Paste a Google Drive / Dropbox / Imgur link to your transfer receipt"
                    className="rounded-lg border border-[#12372D]/15 bg-white px-3 py-2 text-[13px]"
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-[#12372D]/70">
                    Note for admin (optional)
                  </span>
                  <input
                    type="text"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="e.g. Transferred 23 May, ref ABC123"
                    className="rounded-lg border border-[#12372D]/15 bg-white px-3 py-2 text-[13px]"
                  />
                </label>
              </section>

              {error ? (
                <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-800">
                  ⚠ {error}
                </p>
              ) : null}
            </div>

            <footer className="flex items-center justify-between border-t border-[#12372D]/10 px-6 py-4">
              <div className="text-[12px] text-[#12372D]/65">
                Pay <strong className="text-[#12372D]">RM {selectedTotal.toFixed(2)}</strong>{' '}
                for {selected.size} order{selected.size === 1 ? '' : 's'}
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-lg border border-[#12372D]/15 px-4 py-2 text-[12.5px] font-semibold text-[#12372D]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={pending || selected.size === 0 || !proofUrl.trim()}
                  onClick={submit}
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-[12.5px] font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  {pending
                    ? 'Submitting…'
                    : `Submit payment (${selected.size})`}
                </button>
              </div>
            </footer>
          </div>
        </div>
      ) : null}
    </>
  )
}
