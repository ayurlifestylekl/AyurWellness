'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { CartLine } from './types'
import {
  readCart,
  writeCart,
  mergeLines,
  setLineQuantity,
  removeLine,
  totalQuantity,
} from './store'

interface AddItem {
  productId: string
  quantity: number
}

interface CartContextValue {
  lines: CartLine[]
  totalQuantity: number
  hydrated: boolean
  addItems: (items: AddItem[]) => CartLine[]
  setQuantity: (productId: string, quantity: number) => void
  removeItem: (productId: string) => void
  clear: () => void
}

const CartContext = createContext<CartContextValue | null>(null)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([])
  const [hydrated, setHydrated] = useState(false)

  // Hydrate from localStorage once on mount
  useEffect(() => {
    setLines(readCart())
    setHydrated(true)
  }, [])

  // Persist on every change after hydration
  useEffect(() => {
    if (!hydrated) return
    writeCart(lines)
  }, [lines, hydrated])

  const addItems = useCallback((items: AddItem[]): CartLine[] => {
    const next = mergeLines(lines, items)
    setLines(next)
    return next
  }, [lines])

  const setQuantity = useCallback((productId: string, quantity: number) => {
    setLines((prev) => setLineQuantity(prev, productId, quantity))
  }, [])

  const removeItem = useCallback((productId: string) => {
    setLines((prev) => removeLine(prev, productId))
  }, [])

  const clear = useCallback(() => setLines([]), [])

  const value = useMemo<CartContextValue>(
    () => ({
      lines,
      totalQuantity: totalQuantity(lines),
      hydrated,
      addItems,
      setQuantity,
      removeItem,
      clear,
    }),
    [lines, hydrated, addItems, setQuantity, removeItem, clear]
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext)
  if (!ctx) {
    throw new Error('useCart must be used within a <CartProvider>')
  }
  return ctx
}
