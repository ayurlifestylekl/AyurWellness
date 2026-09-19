'use client'

import { useState, useTransition } from 'react'
import {
  updateAgentCommissionRate,
  updateAgentCapabilities,
  suspendAgent,
  reactivateAgent,
  setAgentInternalNotes,
} from '@/lib/admin/agents/actions'

export default function PartnerControls({
  agentId,
  initialRate,
  initialCanAffiliate,
  initialCanWholesale,
  initialStatus,
  suspendedReason,
  initialNotes,
}: {
  agentId: string
  initialRate: number
  initialCanAffiliate: boolean
  initialCanWholesale: boolean
  initialStatus: 'active' | 'suspended'
  suspendedReason: string | null
  initialNotes: string | null
}) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  // Rate form
  const [newRate, setNewRate] = useState(initialRate)
  const [reason, setReason] = useState('')

  // Capabilities
  const [canAffiliate, setCanAffiliate] = useState(initialCanAffiliate)
  const [canWholesale, setCanWholesale] = useState(initialCanWholesale)
  const capsDirty =
    canAffiliate !== initialCanAffiliate || canWholesale !== initialCanWholesale

  // Suspend
  const [confirmSuspend, setConfirmSuspend] = useState(false)
  const [suspendReason, setSuspendReason] = useState('')

  // Notes
  const [notes, setNotes] = useState(initialNotes ?? '')

  function flash(ok: boolean, msg: string) {
    if (ok) setMessage(msg)
    else setError(msg)
    setTimeout(() => {
      setError(null)
      setMessage(null)
    }, 4000)
  }

  function saveRate() {
    setError(null)
    setMessage(null)
    startTransition(async () => {
      const r = await updateAgentCommissionRate({
        agentId,
        newRate: Number(newRate),
        reason,
      })
      if (!r.ok) flash(false, r.error)
      else {
        flash(true, 'Rate updated.')
        setReason('')
      }
    })
  }

  function saveCapabilities() {
    if (!canAffiliate && !canWholesale) {
      flash(false, 'Pick at least one capability.')
      return
    }
    startTransition(async () => {
      const r = await updateAgentCapabilities(agentId, { canAffiliate, canWholesale })
      flash(r.ok, r.ok ? 'Capabilities updated.' : r.error)
    })
  }

  function doSuspend() {
    setError(null)
    startTransition(async () => {
      const r = await suspendAgent(agentId, suspendReason)
      if (!r.ok) flash(false, r.error)
      else {
        setConfirmSuspend(false)
        location.reload()
      }
    })
  }

  function doReactivate() {
    startTransition(async () => {
      const r = await reactivateAgent(agentId)
      if (r.ok) location.reload()
      else flash(false, r.error)
    })
  }

  function saveNotes() {
    startTransition(async () => {
      const r = await setAgentInternalNotes(agentId, notes)
      flash(r.ok, r.ok ? 'Notes saved.' : r.error)
    })
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Commission rate */}
      <article className="rounded-2xl border border-[#006B3C]/8 bg-white p-4">
        <h3 className="font-heading text-[12.5px] font-semibold text-[#006B3C]">
          Commission
        </h3>
        <label className="mt-3 flex flex-col gap-1">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#006B3C]/70">
            Rate (%)
          </span>
          <input
            type="number"
            min="0"
            max="100"
            step="0.1"
            value={newRate}
            onChange={(e) => setNewRate(Number(e.target.value))}
            className="rounded-lg border border-[#006B3C]/15 px-3 py-2 text-[13px]"
          />
        </label>
        <label className="mt-3 flex flex-col gap-1">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#006B3C]/70">
            Reason for change *
          </span>
          <input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. promoted to senior tier"
            className="rounded-lg border border-[#006B3C]/15 px-3 py-2 text-[13px]"
          />
        </label>
        <button
          type="button"
          disabled={pending || reason.trim().length < 3 || newRate === initialRate}
          onClick={saveRate}
          className="mt-3 rounded-lg bg-[#006B3C] px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-[#006B3C] disabled:opacity-50"
        >
          {pending ? 'Saving…' : 'Save rate'}
        </button>
      </article>

      {/* Capabilities */}
      <article className="rounded-2xl border border-[#006B3C]/8 bg-white p-4">
        <h3 className="font-heading text-[12.5px] font-semibold text-[#006B3C]">
          Capabilities
        </h3>
        <p className="mt-1 text-[11.5px] text-[#12372D]/65">
          Determines which sections this partner sees in their portal.
        </p>
        <div className="mt-3 flex flex-col gap-2">
          <label className="flex cursor-pointer items-start gap-2 rounded-lg border border-[#006B3C]/8 px-3 py-2">
            <input
              type="checkbox"
              checked={canAffiliate}
              onChange={(e) => setCanAffiliate(e.target.checked)}
              className="mt-0.5 h-4 w-4"
            />
            <span className="text-[12.5px] text-[#006B3C]">
              <strong>Earn commission on referred sales</strong>
              <span className="block text-[11px] text-[#12372D]/55">
                Sees Referred Sales, Marketplace, Earnings.
              </span>
            </span>
          </label>
          <label className="flex cursor-pointer items-start gap-2 rounded-lg border border-[#006B3C]/8 px-3 py-2">
            <input
              type="checkbox"
              checked={canWholesale}
              onChange={(e) => setCanWholesale(e.target.checked)}
              className="mt-0.5 h-4 w-4"
            />
            <span className="text-[12.5px] text-[#006B3C]">
              <strong>Buy wholesale to resell</strong>
              <span className="block text-[11px] text-[#12372D]/55">
                Sees Wholesale Shop, My Wholesale Orders.
              </span>
            </span>
          </label>
        </div>
        <button
          type="button"
          disabled={pending || !capsDirty || (!canAffiliate && !canWholesale)}
          onClick={saveCapabilities}
          className="mt-3 rounded-lg bg-[#006B3C] px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-[#006B3C] disabled:opacity-50"
        >
          {pending ? 'Saving…' : 'Save capabilities'}
        </button>
      </article>

      {/* Status */}
      <article className="rounded-2xl border border-[#006B3C]/8 bg-white p-4">
        <h3 className="font-heading text-[12.5px] font-semibold text-[#006B3C]">
          Status
        </h3>
        <p className="mt-2 text-[12px] text-[#12372D]/65">
          Currently:{' '}
          <span
            className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10.5px] font-semibold ${
              initialStatus === 'active'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                : 'border-red-200 bg-red-50 text-red-700'
            }`}
          >
            {initialStatus}
          </span>
        </p>
        {initialStatus === 'suspended' && suspendedReason ? (
          <p className="mt-2 text-[11.5px] italic text-red-700">
            Reason: {suspendedReason}
          </p>
        ) : null}
        <div className="mt-3">
          {initialStatus === 'suspended' ? (
            <button
              type="button"
              disabled={pending}
              onClick={doReactivate}
              className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[12px] font-semibold text-emerald-700 hover:bg-emerald-100 disabled:opacity-50"
            >
              Reactivate
            </button>
          ) : (
            <button
              type="button"
              disabled={pending}
              onClick={() => setConfirmSuspend(true)}
              className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-[12px] font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50"
            >
              Suspend
            </button>
          )}
        </div>
      </article>

      {/* Internal notes */}
      <article className="rounded-2xl border border-[#006B3C]/8 bg-white p-4">
        <div className="flex items-center justify-between">
          <h3 className="font-heading text-[12.5px] font-semibold text-[#006B3C]">
            Internal notes
          </h3>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[#12372D]/55">
            Staff-only
          </span>
        </div>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
          placeholder="Audit log of rate changes appears here automatically."
          className="mt-2 w-full rounded-lg border border-[#006B3C]/15 px-3 py-2 font-mono text-[11.5px]"
        />
        <button
          type="button"
          disabled={pending}
          onClick={saveNotes}
          className="mt-2 rounded-lg border border-[#006B3C]/20 bg-white px-3 py-1.5 text-[12px] font-semibold text-[#006B3C] disabled:opacity-50"
        >
          Save notes
        </button>
      </article>

      {message ? (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-[12px] text-emerald-800">
          {message}
        </p>
      ) : null}
      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-800">
          {error}
        </p>
      ) : null}

      {confirmSuspend ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5">
            <h2 className="font-heading text-[16px] font-semibold text-[#006B3C]">
              Suspend partner?
            </h2>
            <p className="mt-1 text-[12px] text-[#12372D]/65">
              They&apos;ll lose access to their agent dashboard. New referrals via their code
              still create attributed orders (we keep historical commission intact). Reversible
              any time.
            </p>
            <label className="mt-3 block text-[11px] font-semibold uppercase tracking-wider text-[#006B3C]/70">
              Reason *
            </label>
            <textarea
              value={suspendReason}
              onChange={(e) => setSuspendReason(e.target.value)}
              rows={2}
              className="mt-1 w-full rounded-lg border border-[#006B3C]/15 px-3 py-2 text-[13px]"
            />
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => setConfirmSuspend(false)}
                className="rounded-lg border border-[#006B3C]/15 px-3 py-1.5 text-[12px]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={pending || suspendReason.trim().length < 3}
                onClick={doSuspend}
                className="rounded-lg bg-red-600 px-3 py-1.5 text-[12px] font-semibold text-white disabled:opacity-50"
              >
                Suspend
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
