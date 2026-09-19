'use client'

import React, { useState } from 'react'
import { ShoppingBag, Minus, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { useCart } from '@/lib/cart/CartProvider'

interface AddToBagButtonProps {
  productId: string
  disabled?: boolean
}

/**
 * Outline gold pill that expands to a qty stepper + commit button.
 * Adds the product to the localStorage cart via CartProvider.
 */
export default function AddToBagButton({ productId, disabled }: AddToBagButtonProps) {
  const [expanded, setExpanded] = useState(false)
  const [qty, setQty] = useState(1)
  const { addItems } = useCart()

  function handleAdd() {
    if (disabled) return
    addItems([{ productId, quantity: qty }])
    toast.success(`${qty} ${qty === 1 ? 'item' : 'items'} added to your bag`, {
      description: 'View bag or keep browsing.',
      action: {
        label: 'View bag',
        onClick: () => {
          window.location.href = '/cart'
        },
      },
    })
    setExpanded(false)
    setQty(1)
  }

  if (!expanded) {
    return (
      <button
        type="button"
        disabled={disabled}
        onClick={() => setExpanded(true)}
        className="inline-flex items-center gap-2 rounded-full border border-accent bg-transparent px-6 py-3 font-heading text-[11px] font-bold uppercase tracking-[0.2em] text-primary transition-colors duration-300 hover:bg-accent hover:text-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <ShoppingBag className="h-4 w-4" strokeWidth={2} />
        {disabled ? 'Out of Stock' : '+ Bag'}
      </button>
    )
  }

  return (
    <div className="inline-flex items-stretch gap-2 rounded-full border border-accent bg-white/70 p-1 backdrop-blur">
      <button
        type="button"
        aria-label="Decrease quantity"
        onClick={() => setQty((q) => Math.max(1, q - 1))}
        className="flex h-9 w-9 items-center justify-center rounded-full text-primary transition-colors duration-200 hover:bg-accent/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        <Minus className="h-3.5 w-3.5" strokeWidth={2} />
      </button>
      <span aria-live="polite" className="flex min-w-[2ch] items-center justify-center font-heading text-[14px] font-bold text-primary">
        {qty}
      </span>
      <button
        type="button"
        aria-label="Increase quantity"
        onClick={() => setQty((q) => q + 1)}
        className="flex h-9 w-9 items-center justify-center rounded-full text-primary transition-colors duration-200 hover:bg-accent/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        <Plus className="h-3.5 w-3.5" strokeWidth={2} />
      </button>
      <button
        type="button"
        onClick={handleAdd}
        className="ml-1 rounded-full bg-accent px-5 font-heading text-[11px] font-bold uppercase tracking-[0.2em] text-dark transition-transform duration-200 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      >
        Add
      </button>
    </div>
  )
}
