'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { AlertTriangle, Banknote, CheckCircle2 } from 'lucide-react'
import type { RefundBankDetails, RequestBookingRefundInput } from '@/lib/booking/refund-request'

type RefundRequestAction = (input: RequestBookingRefundInput) => Promise<{ ok?: boolean; error?: string }>

interface ExistingRefund {
  status: string
  customerReason: string | null
  staffReason: string | null
}

interface Props {
  appointmentId: string
  amountRm: number
  provider: string | null
  existingRefund: ExistingRefund | null
  token?: string | null
  action: RefundRequestAction
}

export default function RefundRequestDialog({
  appointmentId,
  amountRm,
  provider,
  existingRefund,
  token,
  action,
}: Props) {
  const router = useRouter()
  const [reason, setReason] = useState(existingRefund?.customerReason ?? '')
  const [bankCode, setBankCode] = useState('')
  const [accountNumber, setAccountNumber] = useState('')
  const [accountHolderName, setAccountHolderName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, start] = useTransition()

  const needsBank = provider === 'billplz'

  if (existingRefund?.status === 'requested' || existingRefund?.status === 'claimed' || existingRefund?.status === 'pending') {
    return (
      <div className="mt-4 rounded-2xl border border-amber-100 bg-amber-50/50 p-5">
        <div className="flex items-start gap-3">
          <Banknote className="mt-0.5 h-5 w-5 flex-none text-amber-600" />
          <div>
            <p className="font-heading text-[13px] font-bold text-amber-800">Refund request pending</p>
            <p className="mt-1 font-body text-[13px] leading-5 text-amber-700">
              Your refund request for <strong>RM{amountRm.toFixed(2)}</strong> has been submitted.
            </p>
            {existingRefund.customerReason ? (
              <p className="mt-2 font-body text-[13px] text-amber-700">
                Reason: <em>{existingRefund.customerReason}</em>
              </p>
            ) : null}
          </div>
        </div>
      </div>
    )
  }

  if (existingRefund?.status === 'confirmed' || existingRefund?.status === 'refunded') {
    return (
      <div className="mt-4 rounded-2xl border border-green-100 bg-green-50/50 p-5">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="mt-0.5 h-5 w-5 flex-none text-green-600" />
          <div>
            <p className="font-heading text-[13px] font-bold text-green-800">Refund processed</p>
            <p className="mt-1 font-body text-[13px] leading-5 text-green-700">
              Your refund of <strong>RM{amountRm.toFixed(2)}</strong> has been processed.
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (existingRefund?.status === 'rejected') {
    return (
      <div className="mt-4 rounded-2xl border border-red-100 bg-red-50/50 p-5">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 flex-none text-red-600" />
          <div>
            <p className="font-heading text-[13px] font-bold text-red-800">Refund request declined</p>
            <p className="mt-1 font-body text-[13px] leading-5 text-red-700">
              Your refund request for <strong>RM{amountRm.toFixed(2)}</strong> was declined.
            </p>
            {existingRefund.staffReason ? (
              <p className="mt-2 font-body text-[13px] text-red-700">
                Reason: <em>{existingRefund.staffReason}</em>
              </p>
            ) : null}
          </div>
        </div>
      </div>
    )
  }

  function submit() {
    const trimmed = reason.trim()
    if (!trimmed) {
      setError('Please tell us why you are requesting a refund.')
      return
    }
    if (needsBank && (!bankCode.trim() || !accountNumber.trim() || !accountHolderName.trim())) {
      setError('Please enter your bank, account number, and account holder name.')
      return
    }
    setError(null)
    const bank: RefundBankDetails | undefined = needsBank
      ? {
          bankCode: bankCode.trim(),
          accountNumber: accountNumber.trim(),
          accountHolderName: accountHolderName.trim(),
        }
      : undefined
    start(async () => {
      const res = await action({ appointmentId, reason: trimmed, token: token ?? null, bank })
      if (res.error) setError(res.error)
      else router.refresh()
    })
  }

  return (
    <div className="mt-4 rounded-2xl border border-amber-100 bg-amber-50/40 p-5">
      <div className="flex items-start gap-3">
        <Banknote className="mt-0.5 h-5 w-5 flex-none text-amber-600" />
        <div className="flex-1">
          <p className="font-heading text-[13px] font-bold text-amber-800">Request a refund</p>
          <p className="mt-1 font-body text-[13px] leading-5 text-amber-700">
            Submit a refund request for <strong>RM{amountRm.toFixed(2)}</strong>. Our team will review and approve or decline it.
          </p>

          {error && <p className="mt-3 rounded-lg bg-red-100 p-2.5 font-body text-[12px] text-red-700">{error}</p>}

          <div className="mt-4">
            <label htmlFor="refund-reason" className="block font-body text-[12px] text-dark/60">
              Reason for refund <span className="text-red-600">*</span>
            </label>
            <textarea
              id="refund-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              placeholder="Why do you need a refund?"
              className="mt-1 w-full rounded-lg border border-accent/20 bg-white px-3 py-2 font-body text-[13px] text-dark placeholder:text-dark/30 focus:outline-none focus:ring-2 focus:ring-accent/40"
              disabled={pending}
            />
          </div>

          {needsBank && (
            <div className="mt-3 space-y-3">
              <p className="font-heading text-[11px] font-bold uppercase tracking-wide text-amber-800">
                FPX refund recipient details
              </p>
              <div>
                <label htmlFor="refund-bank-code" className="block font-body text-[12px] text-dark/60">
                  Bank (e.g. CIMB, Maybank, RHB)
                </label>
                <input
                  id="refund-bank-code"
                  type="text"
                  value={bankCode}
                  onChange={(e) => setBankCode(e.target.value)}
                  placeholder="MBBEMYKL"
                  className="mt-1 w-full rounded-lg border border-accent/20 bg-white px-3 py-2 font-body text-[13px] text-dark placeholder:text-dark/30 focus:outline-none focus:ring-2 focus:ring-accent/40"
                  disabled={pending}
                />
              </div>
              <div>
                <label htmlFor="refund-account-number" className="block font-body text-[12px] text-dark/60">
                  Account number
                </label>
                <input
                  id="refund-account-number"
                  type="text"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  placeholder="1234567890"
                  className="mt-1 w-full rounded-lg border border-accent/20 bg-white px-3 py-2 font-body text-[13px] text-dark placeholder:text-dark/30 focus:outline-none focus:ring-2 focus:ring-accent/40"
                  disabled={pending}
                />
              </div>
              <div>
                <label htmlFor="refund-account-name" className="block font-body text-[12px] text-dark/60">
                  Account holder name
                </label>
                <input
                  id="refund-account-name"
                  type="text"
                  value={accountHolderName}
                  onChange={(e) => setAccountHolderName(e.target.value)}
                  placeholder="As printed on bank card"
                  className="mt-1 w-full rounded-lg border border-accent/20 bg-white px-3 py-2 font-body text-[13px] text-dark placeholder:text-dark/30 focus:outline-none focus:ring-2 focus:ring-accent/40"
                  disabled={pending}
                />
              </div>
            </div>
          )}

          <button
            onClick={submit}
            disabled={pending}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-amber-600 px-5 py-2.5 font-heading text-[11px] font-bold uppercase tracking-[0.2em] text-white transition-colors hover:bg-amber-700 disabled:opacity-60"
          >
            {pending ? 'Submitting…' : 'Submit refund request'}
          </button>
        </div>
      </div>
    </div>
  )
}
