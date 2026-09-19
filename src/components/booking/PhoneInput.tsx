'use client'

import { useState } from 'react'
import { COUNTRY_CODES, OTHER_CODE } from '@/lib/phone/countryCodes'

interface PhoneInputProps {
  /** Combined value, e.g. "+81 90-1234-5678". */
  value: string
  onChange: (v: string) => void
  required?: boolean
}

/** Country-code chooser + local number field, combined into one phone string. */
export default function PhoneInput({ value, onChange, required }: PhoneInputProps) {
  const [iso2, setIso2] = useState('MY')
  const [customDial, setCustomDial] = useState('+')
  const isOther = iso2 === OTHER_CODE
  const dial = isOther ? customDial : COUNTRY_CODES.find((c) => c.iso2 === iso2)?.dial ?? '+60'

  // Local number is whatever comes after the dial code in the combined value.
  const local = value.startsWith(dial) ? value.slice(dial.length).trim() : value

  const emit = (nextDial: string, nextLocal: string) => {
    const cleanDial = nextDial.trim()
    const cleanLocal = nextLocal.trim()
    onChange(cleanLocal ? `${cleanDial} ${cleanLocal}` : '')
  }

  return (
    <div>
      <div className="flex gap-2">
        <select
          value={iso2}
          onChange={(e) => { setIso2(e.target.value); emit(e.target.value === OTHER_CODE ? customDial : COUNTRY_CODES.find((c) => c.iso2 === e.target.value)?.dial ?? '+60', local) }}
          className="w-[112px] flex-none rounded-lg border border-accent/30 bg-white px-2 py-2.5 font-body text-[13px] text-dark focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/40"
          aria-label="Country code"
        >
          {COUNTRY_CODES.map((c) => (
            <option key={c.iso2} value={c.iso2}>{c.flag} {c.dial}</option>
          ))}
          <option value={OTHER_CODE}>🌐 Other…</option>
        </select>
        {isOther && (
          <input
            value={customDial}
            onChange={(e) => {
              const v = e.target.value.startsWith('+') ? e.target.value : `+${e.target.value}`
              setCustomDial(v)
              emit(v, local)
            }}
            placeholder="+xxx"
            className="w-16 flex-none rounded-lg border border-accent/30 bg-white px-2 py-2.5 font-body text-[13px] text-dark focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/40"
            aria-label="Country dial code"
            inputMode="tel"
          />
        )}
        <input
          value={local}
          onChange={(e) => emit(dial, e.target.value)}
          required={required}
          className="min-w-0 flex-1 rounded-lg border border-accent/30 bg-white px-3 py-2.5 font-body text-[14px] text-dark placeholder:text-dark/35 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/40"
          placeholder="12-3456789"
          inputMode="tel"
          aria-label="Phone number"
        />
      </div>
      <p className="mt-1.5 font-body text-[11.5px] italic text-dark/50">
        If possible, please use the number you have on WhatsApp — it&apos;s the easiest way for us to reach you.
      </p>
    </div>
  )
}
