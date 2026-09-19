'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useTransition } from 'react'
import { AlertTriangle, XCircle } from 'lucide-react'

import type { CancelManagedBookingInput } from '@/lib/booking/cancellation'
import type { ManagementActionResult } from '@/lib/booking/management-actions'

type CancelAction = (
  input: CancelManagedBookingInput,
) => Promise<ManagementActionResult<{ appointmentIds: string[]; refunds: { appointmentId: string; refundStatus: string }[] }>>

const REJECTED_ACTION_FAILURE = {
  code: 'PROVIDER_ERROR' as const,
  error: 'We could not cancel the booking right now. No changes were made.',
}

async function runCancelAction(action: CancelAction, input: CancelManagedBookingInput) {
  try {
    return await action(input)
  } catch {
    return REJECTED_ACTION_FAILURE
  }
}

export default function CancelBookingDialog({
  anchorId,
  appointmentIds,
  wholeGroup,
  refundEligibility,
  provider,
  action,
}: {
  anchorId: string
  /** IDs to cancel — anchor only or full active group */
  appointmentIds: string[]
  wholeGroup: boolean
  refundEligibility: 'not_paid' | 'mistake_window' | 'advance_window' | 'not_eligible'
  /** Payment provider for the booking, or null */
  provider?: string | null
  action: CancelAction
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('t') ?? undefined

  const [open, setOpen] = useState(false)
  const [confirmed, setConfirmed] = useState(false)
  const [bankCode, setBankCode] = useState('')
  const [accountNumber, setAccountNumber] = useState('')
  const [accountHolderName, setAccountHolderName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<{ refunds: { appointmentId: string; refundStatus: string }[] } | null>(null)
  const [pending, startTransition] = useTransition()

  const isPaid = refundEligibility !== 'not_paid'
  const needsRefund = isPaid && refundEligibility !== 'not_eligible'
  const needsBankDetails = needsRefund && provider === 'billplz'

  function reset() {
    setOpen(false)
    setConfirmed(false)
    setBankCode('')
    setAccountNumber('')
    setAccountHolderName('')
    setError(null)
    setResult(null)
  }

  function submit() {
    if (!confirmed) { setError('Please confirm that you understand this action cannot be undone.'); return }
    if (needsBankDetails && (!bankCode.trim() || !accountNumber.trim() || !accountHolderName.trim())) {
      setError('Please enter your bank, account number, and account holder name to receive your refund.')
      return
    }
    setError(null)
    startTransition(async () => {
      const input: CancelManagedBookingInput = {
        anchorId,
        appointmentIds,
        token: token ?? null,
        wholeGroup,
        bank: needsBankDetails
          ? { bankCode: bankCode.trim(), accountNumber: accountNumber.trim(), accountHolderName: accountHolderName.trim() }
          : undefined,
      }
      const res = await runCancelAction(action, input)
      if ('error' in res) {
        setError(res.error)
      } else {
        setResult(res.data)
        router.refresh()
      }
    })
  }

  if (!open) {
    return (
      <button
        id="cancel-booking-open"
        onClick={() => setOpen(true)}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-red-100 bg-red-50/60 px-5 py-3 font-heading text-[13px] font-bold text-red-700 transition hover:bg-red-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-500"
        type="button"
      >
        <XCircle className="h-4 w-4" />
        Cancel this booking
      </button>
    )
  }

  if (result) {
    const allRefundsOk = result.refunds.length === 0 || result.refunds.every((r) => r.refundStatus === 'confirmed')
    const anyException = result.refunds.some((r) => r.refundStatus === 'exception')
    return (
      <div className="mt-4 rounded-2xl border border-green-100 bg-green-50/70 p-5">
        <p className="font-heading text-[13px] font-bold text-green-800">Booking cancelled</p>
        <p className="mt-1 font-body text-[13px] text-green-700">
          {result.refunds.length === 0
            ? 'This booking has been cancelled. No payment was made, so no refund is needed.'
            : allRefundsOk
              ? 'Your booking has been cancelled and your refund has been confirmed.'
              : anyException
                ? 'Your booking is cancelled. Our team is reviewing your refund and will be in touch.'
                : 'Your booking is cancelled and your refund request is being processed. You will receive a confirmation email.'}
        </p>
      </div>
    )
  }

  return (
    <div className="mt-4 rounded-2xl border border-red-100 bg-red-50/40 p-5">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 flex-none text-red-600" />
        <div className="flex-1">
          <p className="font-heading text-[13px] font-bold text-red-800">
            {wholeGroup ? 'Cancel all group bookings' : 'Cancel this booking'}
          </p>
          <p className="mt-1 font-body text-[13px] leading-5 text-red-700">
            {needsRefund
              ? 'A full refund will be submitted automatically. This action cannot be undone.'
              : isPaid
                ? 'This booking is not eligible for an automatic refund under our policy. This action cannot be undone.'
                : 'This booking has not been paid. Cancelling will release the slot. This action cannot be undone.'}
          </p>

          {needsBankDetails && (
            <div className="mt-4 space-y-3">
              <p className="font-heading text-[11px] font-bold uppercase tracking-wide text-red-700">
                FPX refund recipient details
              </p>
              <div>
                <label htmlFor="cancel-bank-code" className="block font-body text-[12px] text-dark/60">
                  Bank (e.g. CIMB, Maybank, RHB)
                </label>
                <input
                  id="cancel-bank-code"
                  type="text"
                  autoComplete="off"
                  value={bankCode}
                  onChange={(e) => setBankCode(e.target.value)}
                  placeholder="MBBEMYKL"
                  className="mt-1 w-full rounded-lg border border-accent/20 bg-white px-3 py-2 font-body text-[13px] text-dark placeholder:text-dark/30 focus:outline-none focus:ring-2 focus:ring-accent/40"
                />
              </div>
              <div>
                <label htmlFor="cancel-account-number" className="block font-body text-[12px] text-dark/60">
                  Account number
                </label>
                <input
                  id="cancel-account-number"
                  type="text"
                  autoComplete="off"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  placeholder="1234567890"
                  className="mt-1 w-full rounded-lg border border-accent/20 bg-white px-3 py-2 font-body text-[13px] text-dark placeholder:text-dark/30 focus:outline-none focus:ring-2 focus:ring-accent/40"
                />
              </div>
              <div>
                <label htmlFor="cancel-account-name" className="block font-body text-[12px] text-dark/60">
                  Account holder name
                </label>
                <input
                  id="cancel-account-name"
                  type="text"
                  autoComplete="off"
                  value={accountHolderName}
                  onChange={(e) => setAccountHolderName(e.target.value)}
                  placeholder="As printed on bank card"
                  className="mt-1 w-full rounded-lg border border-accent/20 bg-white px-3 py-2 font-body text-[13px] text-dark placeholder:text-dark/30 focus:outline-none focus:ring-2 focus:ring-accent/40"
                />
              </div>
            </div>
          )}

          <label className="mt-4 flex cursor-pointer items-start gap-2">
            <input
              id="cancel-confirm-checkbox"
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-red-300 accent-red-600"
            />
            <span className="font-body text-[12px] text-red-700">
              I understand this cannot be undone.
            </span>
          </label>

          {error && (
            <p className="mt-3 font-body text-[12px] text-red-600">{error}</p>
          )}

          <div className="mt-4 flex items-center gap-3">
            <button
              id="cancel-booking-confirm"
              onClick={submit}
              disabled={pending}
              type="button"
              className="rounded-xl bg-red-600 px-5 py-2.5 font-heading text-[12px] font-bold text-white transition hover:bg-red-700 disabled:opacity-50"
            >
              {pending ? 'Cancelling…' : 'Confirm cancellation'}
            </button>
            <button
              id="cancel-booking-back"
              onClick={reset}
              disabled={pending}
              type="button"
              className="rounded-xl border border-dark/10 bg-white px-5 py-2.5 font-heading text-[12px] font-bold text-dark/60 transition hover:bg-dark/5 disabled:opacity-50"
            >
              Go back
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
