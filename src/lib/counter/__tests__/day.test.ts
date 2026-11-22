import { describe, expect, it } from 'vitest'
import { cashDifference, dayRange, expectedCash, summarizeDay, type DayBill } from '../day'

const bills: DayBill[] = [
  // 145 + 2 × 38.90 = 222.80, 22.70 off → 200.10, all cash
  { billNo: 1, subtotalRm: 222.8, totalRm: 200.1, amountPaidRm: 200.1, balanceUsedRm: 0, outstandingRm: 0, paymentMethod: 'cash',
    items: [{ kind: 'service', description: 'Abhyangam', quantity: 1, lineTotalRm: 145 }, { kind: 'product', description: 'Dhanwantharam Thailam', quantity: 2, lineTotalRm: 77.8 }] },
  // 145: 130 from balances, 15 by card
  { billNo: 2, subtotalRm: 145, totalRm: 145, amountPaidRm: 15, balanceUsedRm: 130, outstandingRm: 0, paymentMethod: 'card_terminal',
    items: [{ kind: 'service', description: 'Abhyangam', quantity: 1, lineTotalRm: 145 }] },
  // 190 paid later
  { billNo: 3, subtotalRm: 190, totalRm: 190, amountPaidRm: 0, balanceUsedRm: 0, outstandingRm: 190, paymentMethod: null,
    items: [{ kind: 'service', description: 'Shirodhara', quantity: 1, lineTotalRm: 190 }, { kind: 'package', description: 'Abhyangam Package', quantity: 1, lineTotalRm: 0 }] },
  { billNo: 4, subtotalRm: 38.9, totalRm: 38.9, amountPaidRm: 38.9, balanceUsedRm: 0, outstandingRm: 0, paymentMethod: 'cash',
    items: [{ kind: 'product', description: 'Dhanwantharam Thailam', quantity: 1, lineTotalRm: 38.9 }] },
]
const money = [
  { kind: 'deposit', amount: 100, paymentMethod: 'cash' },
  { kind: 'outstanding', amount: -50, paymentMethod: 'duitnow_qr' },
]

describe('day close', () => {
  const d = summarizeDay(bills, money)

  it('adds up sales, discounts, balances used and amounts left owing', () => {
    expect(d.billCount).toBe(4)
    expect(d.salesRm).toBe(574)
    expect(d.discountRm).toBe(22.7)
    expect(d.balanceUsedRm).toBe(130)
    expect(d.outstandingAddedRm).toBe(190)
    expect(d.servicesCount).toBe(3)
    expect(d.packageSessions).toBe(1)
  })

  it('splits money taken by method, including deposits and settled amounts', () => {
    expect(d.takenByMethod.map((m) => [m.method, m.billsRm, m.otherRm, m.totalRm])).toEqual([
      ['cash', 239, 100, 339],
      ['card_terminal', 15, 0, 15],
      ['duitnow_qr', 0, 50, 50],
    ])
    expect(d.takenRm).toBe(404)
    expect(d.cashInRm).toBe(339)
  })

  it('lists products sold, most first', () => {
    expect(d.productsSold).toEqual([{ name: 'Dhanwantharam Thailam', quantity: 3, amountRm: 116.7 }])
  })

  it('expects the float plus cash taken, and reports over / short', () => {
    expect(expectedCash(200, d)).toBe(539)
    expect(cashDifference(539, 539)).toBe(0)
    expect(cashDifference(530, 539)).toBe(-9)
    expect(cashDifference(540.5, 539)).toBe(1.5)
  })

  it('uses the Malaysia calendar day', () => {
    expect(dayRange('2026-11-22')).toEqual({ from: '2026-11-21T16:00:00.000Z', to: '2026-11-22T16:00:00.000Z' })
  })

  it('handles an empty day', () => {
    expect(summarizeDay([], [])).toMatchObject({ billCount: 0, takenRm: 0, takenByMethod: [], productsSold: [] })
  })
})
