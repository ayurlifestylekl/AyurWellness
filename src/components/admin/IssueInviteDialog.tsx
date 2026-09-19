'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Copy, Check } from 'lucide-react'
import { issueAgentInvite } from '@/actions/admin/issueAgentInvite'

interface IssueInviteDialogProps {
  onClose: () => void
}

function inputClass(disabled: boolean) {
  return `w-full rounded-2xl border border-[#006B3C]/15 bg-white px-4 py-2.5 font-body text-[13.5px] text-[#006B3C] focus:border-[#B58A3B] focus:outline-none focus:ring-2 focus:ring-[#B58A3B]/30 ${
    disabled ? 'opacity-50' : ''
  }`
}

function labelClass() {
  return 'block font-heading text-[10.5px] font-semibold uppercase tracking-[0.18em] text-[#006B3C]/55'
}

export default function IssueInviteDialog({ onClose }: IssueInviteDialogProps) {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [commissionRate, setCommissionRate] = useState('15')
  const [canAffiliate, setCanAffiliate] = useState(true)
  const [canWholesale, setCanWholesale] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [issued, setIssued] = useState<{ inviteUrl: string; referralCode: string } | null>(null)
  const [copied, setCopied] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      const res = await issueAgentInvite({
        fullName,
        email,
        commissionRate: Number(commissionRate),
        canAffiliate,
        canWholesale,
      })
      if (res.ok) {
        toast.success('Invite created — share the link below.')
        setIssued({ inviteUrl: res.inviteUrl, referralCode: res.referralCode })
      } else {
        toast.error(res.error)
      }
    })
  }

  function handleCopy() {
    if (!issued) return
    navigator.clipboard.writeText(issued.inviteUrl).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-3xl border border-[#006B3C]/8 bg-white p-6">
        <h3 className="font-heading text-[16px] font-bold text-[#006B3C]">Issue partner invite</h3>
        <p className="mt-1 font-body text-[12.5px] text-[#12372D]/65">
          Creates a one-time signup link. Share with your new brand partner — link expires in 14 days.
        </p>

        {!issued ? (
          <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3">
            <div>
              <label className={labelClass()}>Full name *</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                disabled={isPending}
                required
                autoFocus
                className={`mt-2 ${inputClass(isPending)}`}
              />
            </div>
            <div>
              <label className={labelClass()}>Email *</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isPending}
                required
                className={`mt-2 ${inputClass(isPending)}`}
              />
            </div>
            <div>
              <label className={labelClass()}>Commission rate (%) *</label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.5"
                value={commissionRate}
                onChange={(e) => setCommissionRate(e.target.value)}
                disabled={isPending}
                required
                className={`mt-2 ${inputClass(isPending)}`}
              />
              <p className="mt-1 text-[10.5px] italic text-[#12372D]/55">
                Only applies if this partner can earn affiliate commission.
              </p>
            </div>

            <fieldset className="rounded-2xl border border-[#006B3C]/10 bg-[#EDF4E7]/40 p-3">
              <legend className={`${labelClass()} px-1`}>
                What can this partner do? *
              </legend>
              <label className="mt-2 flex cursor-pointer items-start gap-2 rounded-lg px-1 py-1.5">
                <input
                  type="checkbox"
                  checked={canAffiliate}
                  onChange={(e) => setCanAffiliate(e.target.checked)}
                  disabled={isPending}
                  className="mt-0.5 h-4 w-4"
                />
                <span className="text-[12.5px] text-[#006B3C]">
                  <strong>Earn commission on referred sales</strong>
                  <span className="block text-[11px] text-[#12372D]/60">
                    Shares their link / submits TikTok &amp; Shopee orders for commission.
                  </span>
                </span>
              </label>
              <label className="mt-1 flex cursor-pointer items-start gap-2 rounded-lg px-1 py-1.5">
                <input
                  type="checkbox"
                  checked={canWholesale}
                  onChange={(e) => setCanWholesale(e.target.checked)}
                  disabled={isPending}
                  className="mt-0.5 h-4 w-4"
                />
                <span className="text-[12.5px] text-[#006B3C]">
                  <strong>Buy wholesale to resell</strong>
                  <span className="block text-[11px] text-[#12372D]/60">
                    Purchases stock at wholesale price, resells via their own channels.
                  </span>
                </span>
              </label>
              {!canAffiliate && !canWholesale ? (
                <p className="mt-2 px-1 text-[11px] font-semibold text-red-700">
                  Pick at least one.
                </p>
              ) : null}
            </fieldset>

            <div className="mt-3 flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isPending}
                className="rounded-full border border-[#006B3C]/15 px-4 py-2 font-heading text-[12px] font-semibold uppercase tracking-[0.14em] text-[#006B3C] disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isPending || (!canAffiliate && !canWholesale)}
                className="rounded-full bg-[#006B3C] px-4 py-2 font-heading text-[12px] font-bold uppercase tracking-[0.14em] text-white hover:bg-[#006B3C] disabled:opacity-50"
              >
                {isPending ? 'Creating…' : 'Create invite'}
              </button>
            </div>
          </form>
        ) : (
          <div className="mt-4 flex flex-col gap-4">
            <div className="rounded-2xl border border-[#006B3C]/20 bg-[#EDF4E7]/60 p-4">
              <p className="font-heading text-[10.5px] font-semibold uppercase tracking-[0.18em] text-[#006B3C]/55">
                Invite link
              </p>
              <p className="mt-2 break-all font-mono text-[11.5px] text-[#006B3C]">
                {issued.inviteUrl}
              </p>
              <button
                type="button"
                onClick={handleCopy}
                className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-[#006B3C] px-4 py-2 font-heading text-[11px] font-bold uppercase tracking-[0.14em] text-white hover:bg-[#006B3C]"
              >
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? 'Copied!' : 'Copy link'}
              </button>
            </div>

            <div className="rounded-2xl border border-[#006B3C]/10 p-4">
              <p className="font-heading text-[10.5px] font-semibold uppercase tracking-[0.18em] text-[#006B3C]/55">
                Referral code (auto-assigned)
              </p>
              <p className="mt-2 font-mono text-[14px] font-semibold text-[#006B3C]">
                {issued.referralCode}
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="self-end rounded-full bg-[#006B3C] px-5 py-2 font-heading text-[12px] font-bold uppercase tracking-[0.14em] text-white hover:bg-[#006B3C]"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
