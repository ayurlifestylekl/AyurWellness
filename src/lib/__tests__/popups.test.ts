import { describe, expect, it } from 'vitest'
import { popupAllowedOn } from '../popups'

describe('where the hiring popup may appear', () => {
  it('on browsing pages', () => {
    for (const p of ['/', '/treatments', '/treatments/face-care-therapies/mukha-lepam', '/products', '/about', '/blog']) expect(popupAllowedOn(p)).toBe(true)
  })
  it('never on booking, payment, account pages or the Careers page', () => {
    for (const p of ['/careers', '/book', '/book/treatment', '/checkout', '/checkout/success', '/cart', '/account/dashboard', '/auth/login', '/order/123']) expect(popupAllowedOn(p)).toBe(false)
    expect(popupAllowedOn(null)).toBe(false)
  })
  it('a page that only starts with the same letters is not blocked', () => {
    expect(popupAllowedOn('/booking-tips')).toBe(true)
  })
})
