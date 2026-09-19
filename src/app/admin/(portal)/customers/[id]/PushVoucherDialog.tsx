'use client'

import { useState, useTransition } from 'react'
import {
  pushOneOffVoucher,
  pushExistingPromo,
} from '@/lib/admin/customers/actions'

type Kind = 'percentage' | 'fixed' | 'free-shipping'
type Tab = 'oneoff' | 'existing'

interface Promo {
  id: string
  code: string
  title: string
  kind: Kind
  value_amount: number | null
  is_active: boolean
}

export default function PushVoucherDialog({
  customerId,
  customerName,
  promos,
}: {
  customerId: string
  customerName: string
  promos: Promo[]
}) {
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState<Tab>('oneoff')

  // one-off
  const [title, setTitle] = useState('Special gift')
  const [kind, setKind] = useState<Kind>('percentage')
  const [value, setValue] = useState(10)
  const [minSpend, setMinSpend] = useState(0)
  const [expiresInDays, setExpiresInDays] = useState(14)
  const [message, setMessage] = useState('')

  // existing
  const [selectedPromoId, setSelectedPromoId] = useState<string>('')
  const [existingMessage, setExistingMessage] = useState('')

  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function submit() {
    setError(null)
    setSuccess(null)
    startTransition(async () => {
      if (tab === 'oneoff') {
        const r = await pushOneOffVoucher({
          customerIds: [customerId],
          title,
          kind,
          valueAmount: kind === 'free-shipping' ? undefined : value,
          minSpendRm: minSpend,
          appliesTo: 'all',
          expiresInDays,
          message: message || undefined,
        })
        if (!r.ok) {
          setError(r.error)
          return
        }
        const d = (r as { ok: true; data?: { code: string } }).data
        setSuccess(`Voucher ${d?.code ?? ''} pushed to ${customerName}.`)
      } else {
        if (!selectedPromoId) {
          setError('Pick a promo first.')
          return
        }
        const r = await pushExistingPromo({
          customerIds: [customerId],
          promoId: selectedPromoId,
          message: existingMessage || undefined,
        })
        if (!r.ok) {
          setError(r.error)
          return
        }
        setSuccess(`Voucher pushed to ${customerName}.`)
      }
    })
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-lg bg-[#B58A3B] px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-[#B58A3B]"
      >
        Push voucher
      </button>
      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-5">
            <h2 className="font-heading text-[16px] font-semibold text-[#006B3C]">
              Push voucher to {customerName}
            </h2>

            {success ? (
              <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-[12.5px]">
                <p className="font-semibold text-emerald-800">✓ {success}</p>
                <p className="mt-1 text-emerald-700">
                  Customer notified via bell + email. They&apos;ll see it in their voucher
                  wallet.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false)
                    setSuccess(null)
                  }}
                  className="mt-3 rounded-lg bg-emerald-600 px-3 py-1.5 text-[12px] font-semibold text-white"
                >
                  Done
                </button>
              </div>
            ) : (
              <>
                <div className="mt-3 flex gap-1 rounded-full bg-[#EDF4E7]/40 p-1 text-[12px] font-semibold">
                  <button
                    type="button"
                    onClick={() => setTab('oneoff')}
                    className={`flex-1 rounded-full px-3 py-1.5 ${
                      tab === 'oneoff' ? 'bg-white shadow text-[#006B3C]' : 'text-[#12372D]/65'
                    }`}
                  >
                    Create one-off
                  </button>
                  <button
                    type="button"
                    onClick={() => setTab('existing')}
                    className={`flex-1 rounded-full px-3 py-1.5 ${
                      tab === 'existing'
                        ? 'bg-white shadow text-[#006B3C]'
                        : 'text-[#12372D]/65'
                    }`}
                  >
                    Use existing promo
                  </button>
                </div>

                {tab === 'oneoff' ? (
                  <div className="mt-3 flex flex-col gap-3">
                    <label className="flex flex-col gap-1">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-[#006B3C]/70">
                        Title *
                      </span>
                      <input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="rounded-lg border border-[#006B3C]/15 px-3 py-2 text-[13px]"
                      />
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <label className="flex flex-col gap-1">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-[#006B3C]/70">
                          Type
                        </span>
                        <select
                          value={kind}
                          onChange={(e) => setKind(e.target.value as Kind)}
                          className="rounded-lg border border-[#006B3C]/15 px-3 py-2 text-[13px]"
                        >
                          <option value="percentage">% off</option>
                          <option value="fixed">RM off</option>
                          <option value="free-shipping">Free shipping</option>
                        </select>
                      </label>
                      {kind !== 'free-shipping' ? (
                        <label className="flex flex-col gap-1">
                          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#006B3C]/70">
                            {kind === 'percentage' ? '% off' : 'RM off'}
                          </span>
                          <input
                            type="number"
                            min="0"
                            value={value}
                            onChange={(e) => setValue(Number(e.target.value))}
                            className="rounded-lg border border-[#006B3C]/15 px-3 py-2 text-[13px]"
                          />
                        </label>
                      ) : null}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <label className="flex flex-col gap-1">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-[#006B3C]/70">
                          Min spend (RM)
                        </span>
                        <input
                          type="number"
                          min="0"
                          value={minSpend}
                          onChange={(e) => setMinSpend(Number(e.target.value))}
                          className="rounded-lg border border-[#006B3C]/15 px-3 py-2 text-[13px]"
                        />
                      </label>
                      <label className="flex flex-col gap-1">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-[#006B3C]/70">
                          Expires in (days)
                        </span>
                        <input
                          type="number"
                          min="1"
                          value={expiresInDays}
                          onChange={(e) => setExpiresInDays(Number(e.target.value))}
                          className="rounded-lg border border-[#006B3C]/15 px-3 py-2 text-[13px]"
                        />
                      </label>
                    </div>
                    <label className="flex flex-col gap-1">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-[#006B3C]/70">
                        Message
                      </span>
                      <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        rows={2}
                        placeholder="Optional. e.g. 'Welcome — first order on us.'"
                        className="rounded-lg border border-[#006B3C]/15 px-3 py-2 text-[13px]"
                      />
                    </label>
                  </div>
                ) : (
                  <div className="mt-3 flex flex-col gap-3">
                    <label className="flex flex-col gap-1">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-[#006B3C]/70">
                        Pick a promo
                      </span>
                      <select
                        value={selectedPromoId}
                        onChange={(e) => setSelectedPromoId(e.target.value)}
                        className="rounded-lg border border-[#006B3C]/15 px-3 py-2 text-[13px]"
                      >
                        <option value="">Select…</option>
                        {promos
                          .filter((p) => p.is_active)
                          .map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.code} — {p.title}
                            </option>
                          ))}
                      </select>
                    </label>
                    <label className="flex flex-col gap-1">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-[#006B3C]/70">
                        Personal note
                      </span>
                      <textarea
                        value={existingMessage}
                        onChange={(e) => setExistingMessage(e.target.value)}
                        rows={2}
                        placeholder="Optional."
                        className="rounded-lg border border-[#006B3C]/15 px-3 py-2 text-[13px]"
                      />
                    </label>
                    {promos.length === 0 ? (
                      <p className="text-[11.5px] italic text-[#12372D]/55">
                        No promos available. Create one at /admin/promos first, or use the
                        one-off tab.
                      </p>
                    ) : null}
                  </div>
                )}

                {error ? (
                  <p className="mt-3 text-[12px] text-red-600">{error}</p>
                ) : null}

                <div className="mt-4 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="rounded-lg border border-[#006B3C]/15 px-3 py-1.5 text-[12px]"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={
                      pending ||
                      (tab === 'oneoff' ? !title : !selectedPromoId)
                    }
                    onClick={submit}
                    className="rounded-lg bg-[#B58A3B] px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-[#B58A3B] disabled:opacity-50"
                  >
                    {pending ? 'Pushing…' : 'Push voucher'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      ) : null}
    </>
  )
}
