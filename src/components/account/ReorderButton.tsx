'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { RotateCw } from 'lucide-react'
import { toast } from 'sonner'
import { useCart } from '@/lib/cart/CartProvider'

interface ReorderItem {
  product: { id: string; name: string } | null
  quantity: number
}

interface ReorderButtonProps {
  items: ReorderItem[]
  variant?: 'primary' | 'chip'
}

export default function ReorderButton({ items, variant = 'primary' }: ReorderButtonProps) {
  const { addItems } = useCart()
  const router = useRouter()
  const [busy, setBusy] = useState(false)

  const validItems = items.filter(
    (it): it is { product: { id: string; name: string }; quantity: number } =>
      it.product !== null && it.quantity > 0
  )
  const disabled = validItems.length === 0

  function handleClick(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (busy || disabled) return
    setBusy(true)

    addItems(
      validItems.map((it) => ({
        productId: it.product.id,
        quantity: it.quantity,
      }))
    )

    const totalQty = validItems.reduce((sum, it) => sum + it.quantity, 0)
    toast.success(
      `${totalQty} ${totalQty === 1 ? 'item' : 'items'} added to your bag`,
      { description: 'Review and check out when you’re ready.' }
    )

    router.push('/cart')
  }

  if (variant === 'chip') {
    return (
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled || busy}
        className="group inline-flex items-center gap-1.5 rounded-full border border-[#B58A3B]/45 bg-[#B58A3B]/[0.08] px-3 py-1.5 font-heading text-[11px] font-semibold uppercase tracking-[0.14em] text-[#006B3C] transition-all hover:border-[#B58A3B] hover:bg-[#B58A3B]/[0.14] active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50"
        aria-label="Reorder these items"
      >
        <RotateCw className="h-3 w-3 transition-transform duration-300 group-hover:rotate-[-90deg]" strokeWidth={2} />
        Reorder
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled || busy}
      className="group inline-flex h-11 items-center justify-center gap-2 rounded-full border border-[#B58A3B] bg-[#B58A3B]/[0.12] px-4 font-heading text-[12px] font-bold uppercase tracking-[0.14em] text-[#006B3C] transition-all hover:bg-[#B58A3B] hover:text-[#12372D] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
    >
      <RotateCw className="h-3.5 w-3.5 transition-transform duration-300 group-hover:rotate-[-90deg]" strokeWidth={2} />
      Reorder items
    </button>
  )
}
