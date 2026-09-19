'use client'

import { useState, useTransition } from 'react'
import { Plus } from 'lucide-react'
import { logExternalSale } from '@/lib/admin/external-sales/actions'
import { EXTERNAL_CHANNEL_LABEL, type ExternalChannel } from '@/lib/admin/external-sales/queries'

interface AgentOption {
  id: string
  referralCode: string
  commissionRate: number
  fullName: string
}

export default function LogSaleDialog({ agents }: { agents: AgentOption[] }) {
  const [open, setOpen] = useState(false)
  const [agentId, setAgentId] = useState('')
  const [channel, setChannel] = useState<ExternalChannel>('tiktok_shop')
  const [grossAmount, setGrossAmount] = useState('')
  const [customerName, setCustomerName] = useState('')
  const [customerContact, setCustomerContact] = useState('')
  const [marketplaceRef, setMarketplaceRef] = useState('')
  const [proofUrl, setProofUrl] = useState('')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const selectedAgent = agents.find((a) => a.id === agentId)
  const computedCommission = selectedAgent && grossAmount
    ? (Number(grossAmount) * selectedAgent.commissionRate) / 100
    : 0

  function reset() {
    setAgentId('')
    setChannel('tiktok_shop')
    setGrossAmount('')
    setCustomerName('')
    setCustomerContact('')
    setMarketplaceRef('')
    setProofUrl('')
    setNotes('')
    setError(null)
    setSuccess(null)
  }

  function submit() {
    setError(null)
    setSuccess(null)
    startTransition(async () => {
      const r = await logExternalSale({
        agentId,
        channel,
        grossAmountRm: Number(grossAmount),
        customerName: customerName || undefined,
        customerContact: customerContact || undefined,
        marketplaceOrderRef: marketplaceRef || undefined,
        proofUrl: proofUrl || undefined,
        notes: notes || undefined,
      })
      if (!r.ok) {
        setError(r.error)
        return
      }
      const d = (r as { ok: true; data?: { commissionRm: number } }).data
      setSuccess(
        `Logged. Commission RM ${(d?.commissionRm ?? 0).toFixed(2)} added to agent's payout balance.`,
      )
      setTimeout(() => {
        setOpen(false)
        reset()
        location.reload()
      }, 1500)
    })
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-lg bg-[#006B3C] px-3 py-2 text-[12.5px] font-semibold text-white hover:bg-[#006B3C]"
      >
        <Plus className="h-3.5 w-3.5" />
        Log external sale
      </button>
      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-5">
            <h2 className="font-heading text-[16px] font-semibold text-[#006B3C]">
              Log external sale
            </h2>
            <p className="mt-1 text-[11.5px] text-[#12372D]/65">
              Records a commission for an affiliate&apos;s sale on TikTok Shop / Shopee /
              other platform. No order or stock is touched — just creates the
              commission so it lands in the payouts queue.
            </p>

            {success ? (
              <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-[12.5px] text-emerald-800">
                ✓ {success}
              </div>
            ) : (
              <>
                <label className="mt-3 block text-[11px] font-semibold uppercase tracking-wider text-[#006B3C]/70">
                  Affiliate *
                </label>
                <select
                  value={agentId}
                  onChange={(e) => setAgentId(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-[#006B3C]/15 px-3 py-2 text-[13px]"
                >
                  <option value="">Pick an agent…</option>
                  {agents.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.fullName} · {a.referralCode} · {a.commissionRate}%
                    </option>
                  ))}
                </select>

                <div className="mt-3 grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#006B3C]/70">
                      Channel *
                    </label>
                    <select
                      value={channel}
                      onChange={(e) => setChannel(e.target.value as ExternalChannel)}
                      className="mt-1 w-full rounded-lg border border-[#006B3C]/15 px-3 py-2 text-[13px]"
                    >
                      {(
                        Object.entries(EXTERNAL_CHANNEL_LABEL) as [
                          ExternalChannel,
                          string,
                        ][]
                      ).map(([v, l]) => (
                        <option key={v} value={v}>
                          {l}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#006B3C]/70">
                      Gross amount (RM) *
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={grossAmount}
                      onChange={(e) => setGrossAmount(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-[#006B3C]/15 px-3 py-2 text-[13px]"
                    />
                  </div>
                </div>

                {selectedAgent && grossAmount ? (
                  <p className="mt-2 rounded-lg border border-[#B58A3B]/40 bg-[#EDF4E7] px-3 py-2 text-[12px] text-[#B58A3B]">
                    Commission at {selectedAgent.commissionRate}%:{' '}
                    <strong>RM {computedCommission.toFixed(2)}</strong>
                  </p>
                ) : null}

                <label className="mt-3 block text-[11px] font-semibold uppercase tracking-wider text-[#006B3C]/70">
                  Customer name (optional)
                </label>
                <input
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-[#006B3C]/15 px-3 py-2 text-[13px]"
                />

                <label className="mt-3 block text-[11px] font-semibold uppercase tracking-wider text-[#006B3C]/70">
                  Customer contact (phone / handle)
                </label>
                <input
                  value={customerContact}
                  onChange={(e) => setCustomerContact(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-[#006B3C]/15 px-3 py-2 text-[13px]"
                />

                <label className="mt-3 block text-[11px] font-semibold uppercase tracking-wider text-[#006B3C]/70">
                  Marketplace order reference
                </label>
                <input
                  value={marketplaceRef}
                  onChange={(e) => setMarketplaceRef(e.target.value)}
                  placeholder="e.g. Shopee #2026100012345"
                  className="mt-1 w-full rounded-lg border border-[#006B3C]/15 px-3 py-2 text-[13px]"
                />

                <label className="mt-3 block text-[11px] font-semibold uppercase tracking-wider text-[#006B3C]/70">
                  Proof URL (WhatsApp screenshot, etc.)
                </label>
                <input
                  value={proofUrl}
                  onChange={(e) => setProofUrl(e.target.value)}
                  placeholder="https://…"
                  className="mt-1 w-full rounded-lg border border-[#006B3C]/15 px-3 py-2 text-[13px]"
                />

                <label className="mt-3 block text-[11px] font-semibold uppercase tracking-wider text-[#006B3C]/70">
                  Notes
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className="mt-1 w-full rounded-lg border border-[#006B3C]/15 px-3 py-2 text-[13px]"
                />

                {error ? (
                  <p className="mt-3 text-[12px] text-red-600">{error}</p>
                ) : null}

                <div className="mt-4 flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setOpen(false)
                      reset()
                    }}
                    className="rounded-lg border border-[#006B3C]/15 px-3 py-1.5 text-[12px]"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={pending || !agentId || !grossAmount}
                    onClick={submit}
                    className="rounded-lg bg-[#006B3C] px-3 py-1.5 text-[12px] font-semibold text-white disabled:opacity-50"
                  >
                    {pending ? 'Logging…' : 'Log sale'}
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
