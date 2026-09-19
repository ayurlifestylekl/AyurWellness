'use client'

import { useState, useTransition } from 'react'
import { MapPin, Pencil, Trash2, Star, X } from 'lucide-react'
import { toast } from 'sonner'
import { deleteAddress } from '@/actions/addresses/deleteAddress'
import { setDefaultAddress } from '@/actions/addresses/setDefaultAddress'
import type { Address } from '@/lib/addresses/queries'
import AddressForm from './AddressForm'

interface AddressBookCardProps {
  address: Address
}

export default function AddressBookCard({ address }: AddressBookCardProps) {
  const [editing, setEditing] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleDelete() {
    if (!confirm(`Delete "${address.label}"?`)) return
    startTransition(async () => {
      const res = await deleteAddress(address.id)
      if (res.ok) toast.success('Address deleted.')
      else toast.error(res.error)
    })
  }

  function handleSetDefault() {
    startTransition(async () => {
      const res = await setDefaultAddress(address.id)
      if (res.ok) toast.success(`"${address.label}" is now your default.`)
      else toast.error(res.error)
    })
  }

  if (editing) {
    return (
      <div className="relative">
        <button
          type="button"
          onClick={() => setEditing(false)}
          className="absolute right-3 top-3 z-10 inline-flex h-7 w-7 items-center justify-center rounded-full border border-[#006B3C]/15 bg-white text-[#006B3C]/55 hover:text-[#006B3C]"
          aria-label="Close edit"
        >
          <X className="h-3.5 w-3.5" />
        </button>
        <AddressForm initial={address} onSaved={() => setEditing(false)} />
      </div>
    )
  }

  return (
    <article
      className="relative flex h-full flex-col overflow-hidden rounded-3xl border border-[#006B3C]/8 bg-white p-5"
      style={{
        boxShadow:
          '0 1px 0 0 rgba(0,107,60,0.04), 0 12px 30px -16px rgba(0,107,60,0.18)',
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-2xl bg-[#006B3C]/8">
            <MapPin className="h-4 w-4 text-[#006B3C]" strokeWidth={1.8} />
          </span>
          <div>
            <h3 className="font-heading text-[14px] font-bold text-[#006B3C]">{address.label}</h3>
            <p className="font-body text-[11.5px] text-[#12372D]/55">{address.country}</p>
          </div>
        </div>
        {address.is_default && (
          <span className="inline-flex items-center gap-1 rounded-full border border-[#B58A3B]/40 bg-[#B58A3B]/[0.08] px-2 py-0.5 font-heading text-[9.5px] font-semibold uppercase tracking-[0.12em] text-[#B58A3B]">
            <Star className="h-2.5 w-2.5 fill-current" />
            Default
          </span>
        )}
      </div>

      <div className="mt-4 flex-1 font-body text-[13px] leading-[1.6] text-[#12372D]/80">
        <p className="font-heading font-semibold text-[#006B3C]">{address.recipient}</p>
        <p>{address.line1}</p>
        {address.line2 && <p>{address.line2}</p>}
        <p>{address.postcode} {address.city}, {address.state}</p>
        <p className="mt-2 text-[#12372D]/60">{address.phone}</p>
      </div>

      <div className="mt-4 flex flex-wrap gap-2 border-t border-[#006B3C]/6 pt-3">
        {!address.is_default && (
          <button
            type="button"
            onClick={handleSetDefault}
            disabled={isPending}
            className="inline-flex items-center gap-1.5 rounded-full border border-[#006B3C]/15 px-3 py-1.5 font-heading text-[11px] font-semibold text-[#006B3C] hover:bg-[#006B3C]/[0.04] disabled:opacity-50"
          >
            <Star className="h-3 w-3" />
            Set default
          </button>
        )}
        <button
          type="button"
          onClick={() => setEditing(true)}
          disabled={isPending}
          className="inline-flex items-center gap-1.5 rounded-full border border-[#006B3C]/15 px-3 py-1.5 font-heading text-[11px] font-semibold text-[#006B3C] hover:bg-[#006B3C]/[0.04] disabled:opacity-50"
        >
          <Pencil className="h-3 w-3" />
          Edit
        </button>
        <button
          type="button"
          onClick={handleDelete}
          disabled={isPending}
          className="inline-flex items-center gap-1.5 rounded-full border border-red-200 px-3 py-1.5 font-heading text-[11px] font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
        >
          <Trash2 className="h-3 w-3" />
          Delete
        </button>
      </div>
    </article>
  )
}
