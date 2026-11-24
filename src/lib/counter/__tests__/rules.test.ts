import { describe, expect, it } from 'vitest'
import { billNoText, billTotals, cashChange, checkoutErrorMessage, isPaymentMethod, parseRm, rm } from '../rules'

describe('counter checkout rules', () => {
  it('adds lines in sen, so 0.1 + 0.2 style drift never reaches the bill', () => {
    const t = billTotals([{ quantity: 3, unitPriceRm: 0.1 }, { quantity: 1, unitPriceRm: 0.2 }], 0)
    expect(t).toEqual({ subtotal: 0.5, discount: 0, total: 0.5 })
    expect(billTotals([{ quantity: 2, unitPriceRm: 145 }, { quantity: 1, unitPriceRm: 38.9 }], 20)).toEqual({ subtotal: 328.9, discount: 20, total: 308.9 })
  })

  it('never discounts below zero', () => {
    expect(billTotals([{ quantity: 1, unitPriceRm: 50 }], 80)).toEqual({ subtotal: 50, discount: 50, total: 0 })
    expect(billTotals([], 10).total).toBe(0)
  })

  it('works out cash change, or null when the customer is short', () => {
    expect(cashChange(145, 200)).toBe(55)
    expect(cashChange(99.9, 100)).toBe(0.1)
    expect(cashChange(145, 145)).toBe(0)
    expect(cashChange(145, 100)).toBeNull()
  })

  it('reads amounts the way the counter types them', () => {
    expect(parseRm('12')).toBe(12)
    expect(parseRm('12.5')).toBe(12.5)
    expect(parseRm('RM 1,200.00')).toBe(1200)
    expect(parseRm('12.345')).toBeNull()
    expect(parseRm('-5')).toBeNull()
    expect(parseRm('abc')).toBeNull()
  })

  it('formats bill numbers and money', () => {
    expect(billNoText(123)).toBe('INV-000123')
    expect(rm(1234.5)).toBe('RM 1,234.50')
  })

  it('accepts only the counter payment methods', () => {
    expect(isPaymentMethod('cash')).toBe(true)
    expect(isPaymentMethod('billplz')).toBe(false)
  })

  it('turns database error codes into plain words', () => {
    expect(checkoutErrorMessage('out_of_stock:Dhanwantharam Thailam:2')).toBe('Not enough stock of Dhanwantharam Thailam (2 left).')
    expect(checkoutErrorMessage('ERROR: cash_short')).toBe('The cash received is less than the total.')
    expect(checkoutErrorMessage('bill_closed')).toBe('This bill is already paid, so it can’t be changed.')
    expect(checkoutErrorMessage('Package expired on 2026-10-01')).toBe('That package has expired.')
    expect(checkoutErrorMessage('All 10 sessions already used')).toBe('That package has no sessions left.')
    expect(checkoutErrorMessage('weird')).toBe('Something went wrong. Please try again.')
  })
})

describe('new checkout messages', () => {
  it('explains deposit and package errors', () => {
    expect(checkoutErrorMessage('deposit_paid_now')).toMatch(/deposit has to be paid now/)
    expect(checkoutErrorMessage('package_needs_phone')).toMatch(/phone number/)
    expect(isPaymentMethod('hitpay_online')).toBe(true)
  })
})
