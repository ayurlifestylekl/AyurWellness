'use client'

import { useState, useTransition } from 'react'
import { updateAgentPersonal } from '@/lib/agent/profile/actions'

export default function PersonalForm({
  fullName: initialName,
  phoneNumber: initialPhone,
  email,
}: {
  fullName: string
  phoneNumber: string
  email: string
}) {
  const [fullName, setFullName] = useState(initialName)
  const [phoneNumber, setPhoneNumber] = useState(initialPhone)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [pending, startTransition] = useTransition()

  function save() {
    setError(null)
    setSuccess(false)
    startTransition(async () => {
      const r = await updateAgentPersonal({ fullName, phoneNumber })
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
          Personal details
        </h2>
        <p className="mt-0.5 text-[12px] text-[#12372D]/60">
          Used on receipts and contact records.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field
          label="Full name *"
          value={fullName}
          onChange={setFullName}
          required
        />
        <Field
          label="Phone"
          value={phoneNumber}
          onChange={setPhoneNumber}
          placeholder="+60 12-345 6789"
        />
        <Field label="Email" value={email} onChange={() => {}} readOnly full />
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <div className="text-[12px]">
          {error ? <span className="text-red-700">⚠ {error}</span> : null}
          {success ? <span className="text-emerald-700">✓ Saved.</span> : null}
        </div>
        <button
          type="submit"
          disabled={pending || !fullName.trim()}
          className="rounded-lg bg-[#149447] px-4 py-2 text-[12.5px] font-semibold text-white hover:bg-[#12372D] disabled:opacity-50"
        >
          {pending ? 'Saving…' : 'Save'}
        </button>
      </div>
    </form>
  )
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  required,
  readOnly,
  full,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  required?: boolean
  readOnly?: boolean
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
        required={required}
        readOnly={readOnly}
        onChange={(e) => onChange(e.target.value)}
        className={`rounded-lg border border-[#12372D]/15 px-3 py-2 text-[13px] focus:border-[#149447] focus:outline-none ${
          readOnly ? 'bg-[#EDF4E7]/30 text-[#12372D]/60' : 'bg-white'
        }`}
      />
    </label>
  )
}
