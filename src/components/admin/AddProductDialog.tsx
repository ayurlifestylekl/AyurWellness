'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { createProduct } from '@/actions/admin/createProduct'

interface AddProductDialogProps {
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

export default function AddProductDialog({ onClose }: AddProductDialogProps) {
  const [name, setName] = useState('')
  const [sku, setSku] = useState('')
  const [priceRm, setPriceRm] = useState('')
  const [stockQty, setStockQty] = useState('0')
  const [category, setCategory] = useState('')
  const [description, setDescription] = useState('')
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      const res = await createProduct({
        name,
        sku,
        priceRm: Number(priceRm),
        stockQty: parseInt(stockQty, 10),
        category,
        description,
      })
      if (res.ok) {
        toast.success('Product created.')
        onClose()
      } else {
        toast.error(res.error)
      }
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-lg rounded-3xl border border-[#006B3C]/8 bg-white p-6"
      >
        <h3 className="font-heading text-[16px] font-bold text-[#006B3C]">Add new product</h3>
        <p className="mt-1 font-body text-[12.5px] text-[#12372D]/65">
          Saves directly into your catalogue. Edit deeper details later from the Products page.
        </p>

        <div className="mt-4 flex flex-col gap-3">
          <div>
            <label className={labelClass()}>Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={200}
              disabled={isPending}
              required
              autoFocus
              className={`mt-2 ${inputClass(isPending)}`}
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className={labelClass()}>SKU *</label>
              <input
                type="text"
                value={sku}
                onChange={(e) => setSku(e.target.value.toUpperCase())}
                maxLength={30}
                disabled={isPending}
                required
                placeholder="e.g. NEEM-OIL-100"
                className={`mt-2 font-mono ${inputClass(isPending)}`}
              />
            </div>
            <div>
              <label className={labelClass()}>Category</label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                maxLength={50}
                disabled={isPending}
                placeholder="e.g. Hair Care"
                className={`mt-2 ${inputClass(isPending)}`}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className={labelClass()}>Price (RM) *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={priceRm}
                onChange={(e) => setPriceRm(e.target.value)}
                disabled={isPending}
                required
                className={`mt-2 ${inputClass(isPending)}`}
              />
            </div>
            <div>
              <label className={labelClass()}>Stock qty *</label>
              <input
                type="number"
                min="0"
                step="1"
                value={stockQty}
                onChange={(e) => setStockQty(e.target.value)}
                disabled={isPending}
                required
                className={`mt-2 ${inputClass(isPending)}`}
              />
            </div>
          </div>

          <div>
            <label className={labelClass()}>Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              maxLength={1500}
              disabled={isPending}
              className={`mt-2 resize-y ${inputClass(isPending)}`}
            />
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-2">
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
            disabled={isPending}
            className="rounded-full bg-[#006B3C] px-4 py-2 font-heading text-[12px] font-bold uppercase tracking-[0.14em] text-white hover:bg-[#006B3C] disabled:opacity-50"
          >
            {isPending ? 'Saving…' : 'Add product'}
          </button>
        </div>
      </form>
    </div>
  )
}
