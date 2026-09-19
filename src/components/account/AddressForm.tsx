'use client'

import { useState, useTransition } from 'react'
import { ArrowRight } from 'lucide-react'
import { toast } from 'sonner'
import { createAddress, type AddressInput } from '@/actions/addresses/createAddress'
import { updateAddress } from '@/actions/addresses/updateAddress'
import type { Address } from '@/lib/addresses/queries'

interface AddressFormProps {
  /** Pass an existing address to switch into edit mode. */
  initial?: Address | null
  /** Called after a successful save. */
  onSaved?: () => void
}

const MALAYSIAN_STATES = [
  'Johor', 'Kedah', 'Kelantan', 'Kuala Lumpur', 'Labuan', 'Melaka', 'Negeri Sembilan',
  'Pahang', 'Penang', 'Perak', 'Perlis', 'Putrajaya', 'Sabah', 'Sarawak', 'Selangor', 'Terengganu',
]

function inputClass(disabled: boolean) {
  return `w-full rounded-2xl border border-[#006B3C]/15 bg-white px-4 py-2.5 font-body text-[13.5px] text-[#006B3C] placeholder:text-[#12372D]/40 focus:border-[#B58A3B] focus:outline-none focus:ring-2 focus:ring-[#B58A3B]/30 ${
    disabled ? 'opacity-50' : ''
  }`
}

function labelClass() {
  return 'block font-heading text-[10.5px] font-semibold uppercase tracking-[0.18em] text-[#006B3C]/55'
}

export default function AddressForm({ initial, onSaved }: AddressFormProps) {
  const isEdit = !!initial
  const [label, setLabel] = useState(initial?.label ?? 'Home')
  const [recipient, setRecipient] = useState(initial?.recipient ?? '')
  const [phone, setPhone] = useState(initial?.phone ?? '')
  const [line1, setLine1] = useState(initial?.line1 ?? '')
  const [line2, setLine2] = useState(initial?.line2 ?? '')
  const [city, setCity] = useState(initial?.city ?? '')
  const [state, setState] = useState(initial?.state ?? 'Kuala Lumpur')
  const [postcode, setPostcode] = useState(initial?.postcode ?? '')
  const [isDefault, setIsDefault] = useState(initial?.is_default ?? false)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const input: AddressInput = {
      label, recipient, phone, line1, line2: line2 || null,
      city, state, postcode, is_default: isDefault,
    }
    startTransition(async () => {
      const res = isEdit && initial
        ? await updateAddress(initial.id, input)
        : await createAddress(input)
      if (res.ok) {
        toast.success(isEdit ? 'Address updated.' : 'Address saved.')
        if (!isEdit) {
          setRecipient(''); setPhone(''); setLine1(''); setLine2(''); setCity(''); setPostcode('')
          setIsDefault(false)
        }
        onSaved?.()
      } else {
        toast.error(res.error)
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-3xl border border-[#006B3C]/8 bg-white p-5 sm:p-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass()}>Label</label>
          <input type="text" value={label} onChange={(e) => setLabel(e.target.value)} maxLength={100} disabled={isPending} className={`mt-2 ${inputClass(isPending)}`} placeholder="Home, Office, etc." />
        </div>
        <div>
          <label className={labelClass()}>Recipient name</label>
          <input type="text" value={recipient} onChange={(e) => setRecipient(e.target.value)} maxLength={100} disabled={isPending} className={`mt-2 ${inputClass(isPending)}`} />
        </div>
      </div>

      <div>
        <label className={labelClass()}>Phone number</label>
        <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} disabled={isPending} className={`mt-2 ${inputClass(isPending)}`} placeholder="+60 12 345 6789" />
      </div>

      <div>
        <label className={labelClass()}>Street address (line 1)</label>
        <input type="text" value={line1} onChange={(e) => setLine1(e.target.value)} maxLength={200} disabled={isPending} className={`mt-2 ${inputClass(isPending)}`} />
      </div>

      <div>
        <label className={labelClass()}>Apartment / unit (optional)</label>
        <input type="text" value={line2} onChange={(e) => setLine2(e.target.value)} maxLength={200} disabled={isPending} className={`mt-2 ${inputClass(isPending)}`} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label className={labelClass()}>City</label>
          <input type="text" value={city} onChange={(e) => setCity(e.target.value)} maxLength={100} disabled={isPending} className={`mt-2 ${inputClass(isPending)}`} />
        </div>
        <div>
          <label className={labelClass()}>State</label>
          <select value={state} onChange={(e) => setState(e.target.value)} disabled={isPending} className={`mt-2 ${inputClass(isPending)}`}>
            {MALAYSIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className={labelClass()}>Postcode</label>
          <input type="text" inputMode="numeric" maxLength={5} value={postcode} onChange={(e) => setPostcode(e.target.value.replace(/\D/g, ''))} disabled={isPending} className={`mt-2 ${inputClass(isPending)}`} />
        </div>
      </div>

      <label className="flex items-center gap-2 font-body text-[12.5px] text-[#006B3C]/75">
        <input
          type="checkbox"
          checked={isDefault}
          onChange={(e) => setIsDefault(e.target.checked)}
          disabled={isPending}
          className="h-4 w-4 rounded border-[#006B3C]/30 text-[#006B3C] focus:ring-[#B58A3B]"
        />
        Use as default shipping address
      </label>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isPending}
          className="group inline-flex h-11 items-center gap-2 rounded-full bg-[#006B3C] px-6 font-heading text-[12px] font-bold uppercase tracking-[0.16em] text-white transition-all hover:bg-[#006B3C] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending ? 'Saving…' : isEdit ? 'Save changes' : 'Add address'}
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
        </button>
      </div>
    </form>
  )
}
