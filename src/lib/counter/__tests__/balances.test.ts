import { describe, expect, it } from 'vitest'
import { amountDue, balanceText, balanceTotals, checkoutErrorMessage } from '../rules'

describe('patient balances', () => {
  const held = balanceTotals([
    { kind: 'deposit', amount: 100 },
    { kind: 'deposit', amount: -40.1 },
    { kind: 'credit', amount: 30 },
    { kind: 'outstanding', amount: 190 },
    { kind: 'points', amount: 120 },
    { kind: 'nonsense', amount: 999 },
  ])

  it('adds each balance up from its entries, in sen', () => {
    expect(held).toEqual({ credit: 30, deposit: 59.9, gift_card: 0, points: 120, outstanding: 190 })
  })

  it('works out what is still to pay after using balances', () => {
    expect(amountDue(145, [], held)).toBe(145)
    expect(amountDue(145, [{ kind: 'deposit', amount: 59.9 }, { kind: 'credit', amount: 30 }], held)).toBe(55.1)
    expect(amountDue(30, [{ kind: 'credit', amount: 30 }], held)).toBe(0)
  })

  it('refuses using more than the patient holds, or more than the bill', () => {
    expect(amountDue(145, [{ kind: 'credit', amount: 31 }], held)).toBeNull()
    expect(amountDue(145, [{ kind: 'gift_card', amount: 1 }], held)).toBeNull()
    expect(amountDue(20, [{ kind: 'credit', amount: 30 }], held)).toBeNull()
  })

  it('shows points as a count and the rest as ringgit', () => {
    expect(balanceText('points', 120)).toBe('120 pts')
    expect(balanceText('deposit', 59.9)).toBe('RM 59.90')
  })

  it('explains balance errors from the database', () => {
    expect(checkoutErrorMessage('balance_short:gift_card:12.50')).toBe('Not enough gift card — RM 12.50 left.')
    expect(checkoutErrorMessage('balance_needs_patient')).toMatch(/saved patient/)
    expect(checkoutErrorMessage('balance_over_total')).toMatch(/more balance than the bill/)
  })
})
