import type { CartLine } from './types'

const STORAGE_KEY = 'kal_cart_v1'

function isBrowser(): boolean {
  return typeof window !== 'undefined'
}

export function readCart(): CartLine[] {
  if (!isBrowser()) return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (l): l is CartLine =>
        l &&
        typeof l.productId === 'string' &&
        typeof l.quantity === 'number' &&
        l.quantity > 0
    )
  } catch {
    return []
  }
}

export function writeCart(lines: CartLine[]): void {
  if (!isBrowser()) return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lines))
}

interface AddLineInput {
  productId: string
  quantity: number
}

export function mergeLines(existing: CartLine[], additions: AddLineInput[]): CartLine[] {
  const now = new Date().toISOString()
  const map = new Map<string, CartLine>()
  for (const line of existing) {
    map.set(line.productId, { ...line })
  }
  for (const add of additions) {
    if (!add.productId || add.quantity <= 0) continue
    const prev = map.get(add.productId)
    if (prev) {
      map.set(add.productId, { ...prev, quantity: prev.quantity + add.quantity })
    } else {
      map.set(add.productId, {
        productId: add.productId,
        quantity: add.quantity,
        addedAt: now,
      })
    }
  }
  return Array.from(map.values())
}

export function setLineQuantity(
  existing: CartLine[],
  productId: string,
  quantity: number
): CartLine[] {
  if (quantity <= 0) {
    return existing.filter((l) => l.productId !== productId)
  }
  return existing.map((l) =>
    l.productId === productId ? { ...l, quantity } : l
  )
}

export function removeLine(existing: CartLine[], productId: string): CartLine[] {
  return existing.filter((l) => l.productId !== productId)
}

export function totalQuantity(lines: CartLine[]): number {
  return lines.reduce((sum, l) => sum + l.quantity, 0)
}
