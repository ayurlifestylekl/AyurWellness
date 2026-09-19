'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'

export interface WholesaleCartLine {
  productId: string
  quantity: number
}

interface WholesaleCartContextValue {
  lines: WholesaleCartLine[]
  totalUnits: number
  setQty: (productId: string, qty: number) => void
  add: (productId: string, qty?: number) => void
  remove: (productId: string) => void
  clear: () => void
  getQty: (productId: string) => number
}

const Ctx = createContext<WholesaleCartContextValue | null>(null)

const STORAGE_KEY = 'kerala.wholesaleCart.v1'

export function WholesaleCartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<WholesaleCartLine[]>([])
  const [hydrated, setHydrated] = useState(false)

  // Hydrate from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as WholesaleCartLine[]
        if (Array.isArray(parsed)) {
          setLines(
            parsed.filter(
              (l) =>
                typeof l.productId === 'string' &&
                typeof l.quantity === 'number' &&
                l.quantity > 0,
            ),
          )
        }
      }
    } catch {
      /* ignore */
    }
    setHydrated(true)
  }, [])

  // Persist
  useEffect(() => {
    if (!hydrated) return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(lines))
    } catch {
      /* ignore quota errors */
    }
  }, [lines, hydrated])

  const setQty = useCallback((productId: string, qty: number) => {
    setLines((prev) => {
      if (qty <= 0) return prev.filter((l) => l.productId !== productId)
      const idx = prev.findIndex((l) => l.productId === productId)
      if (idx === -1) return [...prev, { productId, quantity: qty }]
      const next = prev.slice()
      next[idx] = { productId, quantity: qty }
      return next
    })
  }, [])

  const add = useCallback((productId: string, qty: number = 1) => {
    setLines((prev) => {
      const idx = prev.findIndex((l) => l.productId === productId)
      if (idx === -1) return [...prev, { productId, quantity: qty }]
      const next = prev.slice()
      next[idx] = { productId, quantity: next[idx].quantity + qty }
      return next
    })
  }, [])

  const remove = useCallback((productId: string) => {
    setLines((prev) => prev.filter((l) => l.productId !== productId))
  }, [])

  const clear = useCallback(() => setLines([]), [])

  const getQty = useCallback(
    (productId: string) =>
      lines.find((l) => l.productId === productId)?.quantity ?? 0,
    [lines],
  )

  const totalUnits = useMemo(
    () => lines.reduce((s, l) => s + l.quantity, 0),
    [lines],
  )

  const value = useMemo<WholesaleCartContextValue>(
    () => ({ lines, totalUnits, setQty, add, remove, clear, getQty }),
    [lines, totalUnits, setQty, add, remove, clear, getQty],
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useWholesaleCart() {
  const v = useContext(Ctx)
  if (!v) throw new Error('useWholesaleCart must be used inside WholesaleCartProvider')
  return v
}
