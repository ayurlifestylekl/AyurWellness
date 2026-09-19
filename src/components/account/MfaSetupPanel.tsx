'use client'

import { useState, useTransition } from 'react'
import { ShieldCheck, ShieldOff } from 'lucide-react'
import { toast } from 'sonner'
import { enrollMfa } from '@/actions/profile/mfa/enrollMfa'
import { unenrollMfa } from '@/actions/profile/mfa/unenrollMfa'
import MfaQrDialog from './MfaQrDialog'

interface MfaSetupPanelProps {
  enrolled: boolean
}

export default function MfaSetupPanel({ enrolled: initialEnrolled }: MfaSetupPanelProps) {
  const [enrolled, setEnrolled] = useState(initialEnrolled)
  const [dialogProps, setDialogProps] = useState<{ factorId: string; qrSvg: string; secret: string } | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleEnroll() {
    startTransition(async () => {
      const res = await enrollMfa()
      if (res.ok) {
        setDialogProps({ factorId: res.factorId, qrSvg: res.qrSvg, secret: res.secret })
      } else {
        toast.error(res.error)
      }
    })
  }

  function handleUnenroll() {
    if (!confirm('Turn off two-factor authentication?')) return
    startTransition(async () => {
      const res = await unenrollMfa()
      if (res.ok) {
        setEnrolled(false)
        toast.success('Two-factor authentication disabled.')
      } else {
        toast.error(res.error)
      }
    })
  }

  return (
    <div className="rounded-2xl border border-[#006B3C]/8 bg-white p-4">
      <div className="flex items-start gap-3">
        <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${enrolled ? 'bg-[#006B3C]/[0.10]' : 'bg-[#006B3C]/[0.06]'}`}>
          {enrolled ? <ShieldCheck className="h-4 w-4 text-[#006B3C]" /> : <ShieldOff className="h-4 w-4 text-[#006B3C]/55" />}
        </span>
        <div className="flex-1">
          <p className="font-heading text-[13px] font-semibold text-[#006B3C]">
            Two-factor authentication
          </p>
          <p className="mt-0.5 font-body text-[11.5px] text-[#12372D]/65">
            {enrolled
              ? 'Enabled. You\'ll need your authenticator app code at sign-in.'
              : 'Add an extra layer of security with an authenticator app.'}
          </p>
          <div className="mt-3">
            {enrolled ? (
              <button
                type="button"
                onClick={handleUnenroll}
                disabled={isPending}
                className="rounded-full border border-red-200 bg-red-50/40 px-4 py-2 font-heading text-[11px] font-semibold uppercase tracking-[0.14em] text-red-700 hover:bg-red-50 disabled:opacity-50"
              >
                Disable 2FA
              </button>
            ) : (
              <button
                type="button"
                onClick={handleEnroll}
                disabled={isPending}
                className="rounded-full bg-[#006B3C] px-4 py-2 font-heading text-[11px] font-bold uppercase tracking-[0.14em] text-white hover:bg-[#006B3C] disabled:opacity-50"
              >
                {isPending ? 'Starting…' : 'Enable 2FA'}
              </button>
            )}
          </div>
        </div>
      </div>

      {dialogProps && (
        <MfaQrDialog
          factorId={dialogProps.factorId}
          qrSvg={dialogProps.qrSvg}
          secret={dialogProps.secret}
          onClose={() => setDialogProps(null)}
          onVerified={() => { setEnrolled(true); setDialogProps(null) }}
        />
      )}
    </div>
  )
}
