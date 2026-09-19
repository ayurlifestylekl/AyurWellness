'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { verifyMfaEnrollment } from '@/actions/profile/mfa/verifyMfaEnrollment'

interface MfaQrDialogProps {
  factorId: string
  qrSvg: string
  secret: string
  onClose: () => void
  onVerified: () => void
}

export default function MfaQrDialog({ factorId, qrSvg, secret, onClose, onVerified }: MfaQrDialogProps) {
  const [code, setCode] = useState('')
  const [isPending, startTransition] = useTransition()

  function handleVerify() {
    startTransition(async () => {
      const res = await verifyMfaEnrollment(factorId, code)
      if (res.ok) {
        toast.success('Two-factor authentication enabled.')
        onVerified()
      } else {
        toast.error(res.error)
      }
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-3xl border border-[#006B3C]/8 bg-white p-6">
        <h3 className="font-heading text-[16px] font-bold text-[#006B3C]">Set up two-factor authentication</h3>
        <p className="mt-2 font-body text-[13px] text-[#12372D]/70">
          Scan the QR code with Google Authenticator, Authy, or 1Password. Then enter the 6-digit code it shows.
        </p>

        <div className="mt-4 flex justify-center rounded-2xl border border-[#006B3C]/10 bg-white p-4">
          {/* qrSvg is a data: URI from Supabase Auth */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qrSvg} alt="MFA QR code" className="h-44 w-44" />
        </div>

        <p className="mt-3 break-all rounded-xl bg-[#EDF4E7]/60 px-3 py-2 font-mono text-[11px] text-[#006B3C]/70">
          Can&apos;t scan? Enter this secret manually: <strong>{secret}</strong>
        </p>

        <label className="mt-4 block font-heading text-[10.5px] font-semibold uppercase tracking-[0.18em] text-[#006B3C]/55">
          Verification code
        </label>
        <input
          inputMode="numeric"
          maxLength={6}
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
          disabled={isPending}
          className="mt-2 w-full rounded-2xl border border-[#006B3C]/15 bg-white px-4 py-2.5 text-center font-mono text-[20px] tracking-[0.4em] text-[#006B3C] focus:border-[#B58A3B] focus:outline-none focus:ring-2 focus:ring-[#B58A3B]/30 disabled:opacity-50"
          placeholder="000000"
          autoFocus
        />

        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="rounded-full border border-[#006B3C]/15 px-4 py-2 font-heading text-[12px] font-semibold uppercase tracking-[0.14em] text-[#006B3C] disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleVerify}
            disabled={isPending || code.length !== 6}
            className="rounded-full bg-[#006B3C] px-4 py-2 font-heading text-[12px] font-bold uppercase tracking-[0.14em] text-white hover:bg-[#006B3C] disabled:opacity-50"
          >
            {isPending ? 'Verifying…' : 'Verify & enable'}
          </button>
        </div>
      </div>
    </div>
  )
}
