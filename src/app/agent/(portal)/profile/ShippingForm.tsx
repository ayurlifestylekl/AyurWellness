'use client'

import { useState, useTransition } from 'react'
import { updateAgentShipping } from '@/lib/agent/profile/actions'

const MY_STATES = [
  'Johor', 'Kedah', 'Kelantan', 'Melaka', 'Negeri Sembilan', 'Pahang',
  'Penang', 'Perak', 'Perlis', 'Sabah', 'Sarawak', 'Selangor',
  'Terengganu', 'Kuala Lumpur', 'Labuan', 'Putrajaya',
]

export default function ShippingForm({
  address: initialAddress,
  postcode: initialPostcode,
  state: initialState,
}: {
  address: string
  postcode: string
  state: string
}) {
  const [address, setAddress] = useState(initialAddress)
  const [postcode, setPostcode] = useState(initialPostcode)
  const [state, setState] = useState(initialState)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [pending, startTransition] = useTransition()

  function save() {
    setError(null)
    setSuccess(false)
    startTransition(async () => {
      const r = await updateAgentShipping({ address, postcode, state })
      if (!r.ok) setError(r.error)
      else setSuccess(true)
    })
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        save()
      }}
      className="rounded-3xl border border-[#12372D]/10 bg-white p-5"
    >
      <header className="mb-4">
        <h2 className="font-heading text-[15px] font-semibold text-[#12372D]">
          Shipping address (wholesale)
        </h2>
        <p className="mt-0.5 text-[12px] text-[#12372D]/60">
          Where the clinic ships your wholesale orders. Required to check out
          from the wholesale shop.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-3">
        <label className="flex flex-col gap-1">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#12372D]/70">
            Address *
          </span>
          <textarea
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            rows={3}
            placeholder="No 5, Jalan Berhala, Brickfields"
            className="rounded-lg border border-[#12372D]/15 bg-white px-3 py-2 text-[13px] focus:border-[#149447] focus:outline-none"
          />
        </label>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#12372D]/70">
              Postcode *
            </span>
            <input
              type="text"
              value={postcode}
              onChange={(e) => setPostcode(e.target.value)}
              placeholder="50470"
              className="rounded-lg border border-[#12372D]/15 bg-white px-3 py-2 text-[13px] focus:border-[#149447] focus:outline-none"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#12372D]/70">
              State *
            </span>
            <select
              value={state}
              onChange={(e) => setState(e.target.value)}
              className="rounded-lg border border-[#12372D]/15 bg-white px-3 py-2 text-[13px] focus:border-[#149447] focus:outline-none"
            >
              <option value="">Select state…</option>
              {MY_STATES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <div className="text-[12px]">
          {error ? <span className="text-red-700">⚠ {error}</span> : null}
          {success ? <span className="text-emerald-700">✓ Saved.</span> : null}
        </div>
        <button
          type="submit"
          disabled={pending || !address.trim() || !postcode.trim() || !state.trim()}
          className="rounded-lg bg-[#149447] px-4 py-2 text-[12.5px] font-semibold text-white hover:bg-[#12372D] disabled:opacity-50"
        >
          {pending ? 'Saving…' : 'Save shipping address'}
        </button>
      </div>
    </form>
  )
}
