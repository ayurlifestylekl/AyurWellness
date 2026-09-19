'use client'

import { useState, useTransition } from 'react'
import { pushOneOffVoucher } from '@/lib/admin/customers/actions'

type Kind = 'percentage' | 'fixed' | 'free-shipping'

export default function BulkVoucherPushDialog({
  customerIds,
  onClose,
}: {
  customerIds: string[]
  onClose: () => void
}) {
  const [title, setTitle] = useState('Welcome gift')
  const [kind, setKind] = useState<Kind>('percentage')
  const [value, setValue] = useState(10)
  const [minSpend, setMinSpend] = useState(0)
  const [expiresInDays, setExpiresInDays] = useState(14)
  const [message, setMessage] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<{ code: string; pushed: number } | null>(null)
  const [pending, startTransition] = useTransition()

  function submit() {
    setError(null)
    setResult(null)
    startTransition(async () => {
      const r = await pushOneOffVoucher({
        customerIds,
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
      const d = (r as { ok: true; data?: { code: string; pushed: number } }).data
      if (d) setResult({ code: d.code, pushed: d.pushed })
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-5">
        <h2 className="font-heading text-[16px] font-semibold text-[#006B3C]">
          Push voucher to {customerIds.length} customer{customerIds.length === 1 ? '' : 's'}
        </h2>
        <p className="mt-1 text-[11.5px] text-[#12372D]/65">
          Generates a unique private code and adds it to each customer&apos;s wallet. They&apos;ll get a
          bell notification + email.
        </p>

        {result ? (
          <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-[12.5px]">
            <p className="font-semibold text-emerald-800">
              ✓ Pushed to {result.pushed} customer{result.pushed === 1 ? '' : 's'}
            </p>
            <p className="mt-1 text-emerald-700">
              Voucher code: <code className="font-mono font-bold">{result.code}</code>
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-3 rounded-lg bg-emerald-600 px-3 py-1.5 text-[12px] font-semibold text-white"
            >
              Close
            </button>
          </div>
        ) : (
          <>
            <label className="mt-3 block text-[11px] font-semibold uppercase tracking-wider text-[#006B3C]/70">
              Title *
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 w-full rounded-lg border border-[#006B3C]/15 px-3 py-2 text-[13px]"
              placeholder="Welcome gift, Birthday voucher…"
            />

            <div className="mt-3 grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#006B3C]/70">
                  Discount type
                </label>
                <select
                  value={kind}
                  onChange={(e) => setKind(e.target.value as Kind)}
                  className="mt-1 w-full rounded-lg border border-[#006B3C]/15 px-3 py-2 text-[13px]"
                >
                  <option value="percentage">% off</option>
                  <option value="fixed">RM off</option>
                  <option value="free-shipping">Free shipping</option>
                </select>
              </div>
              {kind !== 'free-shipping' ? (
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#006B3C]/70">
                    {kind === 'percentage' ? '% off' : 'RM off'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    step={kind === 'percentage' ? '1' : '0.01'}
                    value={value}
                    onChange={(e) => setValue(Number(e.target.value))}
                    className="mt-1 w-full rounded-lg border border-[#006B3C]/15 px-3 py-2 text-[13px]"
                  />
                </div>
              ) : null}
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#006B3C]/70">
                  Min spend (RM)
                </label>
                <input
                  type="number"
                  min="0"
                  value={minSpend}
                  onChange={(e) => setMinSpend(Number(e.target.value))}
                  className="mt-1 w-full rounded-lg border border-[#006B3C]/15 px-3 py-2 text-[13px]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#006B3C]/70">
                  Expires in (days)
                </label>
                <input
                  type="number"
                  min="1"
                  value={expiresInDays}
                  onChange={(e) => setExpiresInDays(Number(e.target.value))}
                  className="mt-1 w-full rounded-lg border border-[#006B3C]/15 px-3 py-2 text-[13px]"
                />
              </div>
            </div>

            <label className="mt-3 block text-[11px] font-semibold uppercase tracking-wider text-[#006B3C]/70">
              Message (in notification + email)
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={2}
              placeholder="Optional. e.g. 'Welcome to the family — first order on us.'"
              className="mt-1 w-full rounded-lg border border-[#006B3C]/15 px-3 py-2 text-[13px]"
            />

            {error ? <p className="mt-3 text-[12px] text-red-600">{error}</p> : null}

            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-[#006B3C]/15 px-3 py-1.5 text-[12px]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={pending || !title}
                onClick={submit}
                className="rounded-lg bg-[#B58A3B] px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-[#B58A3B] disabled:opacity-50"
              >
                {pending
                  ? 'Pushing…'
                  : `Push to ${customerIds.length} customer${customerIds.length === 1 ? '' : 's'}`}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
