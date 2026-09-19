'use client'

import { useState, useTransition } from 'react'
import { updateAgentPayout } from '@/lib/agent/profile/actions'

type Method = 'bank_transfer' | 'tng_ewallet'

export default function PayoutForm({
  method: initialMethod,
  bankName: initialBank,
  accountName: initialAcctName,
  accountNo: initialAcctNo,
  tngPhone: initialTng,
}: {
  method: Method
  bankName: string
  accountName: string
  accountNo: string
  tngPhone: string
}) {
  const [method, setMethod] = useState<Method>(initialMethod)
  const [bankName, setBankName] = useState(initialBank)
  const [accountName, setAccountName] = useState(initialAcctName)
  const [accountNo, setAccountNo] = useState(initialAcctNo)
  const [tngPhone, setTngPhone] = useState(initialTng)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [pending, startTransition] = useTransition()

  function save() {
    setError(null)
    setSuccess(false)
    startTransition(async () => {
      const r = await updateAgentPayout({ method, bankName, accountName, accountNo, tngPhone })
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
          Payout method
        </h2>
        <p className="mt-0.5 text-[12px] text-[#12372D]/60">
          Where commission earnings should land. Admin pays out monthly.
        </p>
      </header>

      {/* Method tabs */}
      <div className="mb-4 flex gap-1.5">
        <MethodTab
          active={method === 'bank_transfer'}
          onClick={() => setMethod('bank_transfer')}
          label="Bank transfer"
        />
        <MethodTab
          active={method === 'tng_ewallet'}
          onClick={() => setMethod('tng_ewallet')}
          label="TNG eWallet"
        />
      </div>

      {method === 'bank_transfer' ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field
            label="Bank name *"
            value={bankName}
            onChange={setBankName}
            placeholder="Maybank, CIMB, Public Bank…"
          />
          <Field
            label="Account holder name *"
            value={accountName}
            onChange={setAccountName}
          />
          <Field
            label="Account number *"
            value={accountNo}
            onChange={setAccountNo}
            full
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field
            label="TNG eWallet phone *"
            value={tngPhone}
            onChange={setTngPhone}
            placeholder="+60 12-345 6789"
            full
          />
        </div>
      )}

      <div className="mt-4 flex items-center justify-between gap-3">
        <div className="text-[12px]">
          {error ? <span className="text-red-700">⚠ {error}</span> : null}
          {success ? <span className="text-emerald-700">✓ Saved.</span> : null}
        </div>
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-[#149447] px-4 py-2 text-[12.5px] font-semibold text-white hover:bg-[#12372D] disabled:opacity-50"
        >
          {pending ? 'Saving…' : 'Save payout method'}
        </button>
      </div>
    </form>
  )
}

function MethodTab({
  active,
  onClick,
  label,
}: {
  active: boolean
  onClick: () => void
  label: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg px-3 py-1.5 text-[12px] font-semibold transition-colors ${
        active
          ? 'bg-[#149447] text-white'
          : 'border border-[#12372D]/15 bg-white text-[#12372D] hover:bg-[#EDF4E7]/60'
      }`}
    >
      {label}
    </button>
  )
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  full,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  full?: boolean
}) {
  return (
    <label className={`flex flex-col gap-1 ${full ? 'sm:col-span-2' : ''}`}>
      <span className="text-[11px] font-semibold uppercase tracking-wider text-[#12372D]/70">
        {label}
      </span>
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border border-[#12372D]/15 bg-white px-3 py-2 text-[13px] focus:border-[#149447] focus:outline-none"
      />
    </label>
  )
}
