import { describe, expect, it } from 'vitest'
import { bookableById, durationText, groupByCategory, matchServices, priceText, toServiceOptions } from '../services'

const services = toServiceOptions([
  { _id: 'a', title: 'Head Massage', duration: '30 min', price: 55, categoryId: 'mass', categoryTitle: 'Massage Therapies', categoryOrder: 2, bookingType: 'enquiry' },
  { _id: 'b', title: 'Abhyangam (Partial)', duration: '45 mins', price: 75, categoryId: 'mass', categoryTitle: 'Massage Therapies', categoryOrder: 2, bookingType: 'direct' },
  { _id: 'c', title: 'Shirodhara', duration: '1 hour 30 mins', price: 190, categoryId: 'stress', categoryTitle: 'Stress & Sleep Care', categoryOrder: 1, bookingType: 'direct' },
  { _id: 'd', title: 'Nasyam', duration: null, price: null, priceLabel: 'Ask us', categoryId: null, categoryTitle: null, categoryOrder: null, bookingType: null },
])

describe('staff services', () => {
  it('reads duration labels into minutes', () => {
    expect(services.map((s) => s.durationMins)).toEqual([30, 45, 90, 60])
  })

  it('groups by category in the site order, keeping catalog order inside', () => {
    const groups = groupByCategory(services)
    expect(groups.map((g) => g.title)).toEqual(['Stress & Sleep Care', 'Massage Therapies', 'Other'])
    expect(groups[1].services.map((s) => s.title)).toEqual(['Head Massage', 'Abhyangam (Partial)'])
  })

  it('searches therapy and category names, ignoring case and accents', () => {
    expect(matchServices(services, 'abhy').map((s) => s.id)).toEqual(['b'])
    expect(matchServices(services, 'SLEEP').map((s) => s.id)).toEqual(['c'])
    expect(matchServices(services, '  ')).toHaveLength(4)
  })

  it('formats durations and prices the way staff read them', () => {
    expect([30, 60, 90, 120].map(durationText)).toEqual(['30m', '1h', '1h 30m', '2h'])
    expect(priceText(services[1])).toBe('RM75.00')
    expect(priceText(services[3])).toBe('Ask us')
  })

  it('only books by catalog id where the booking actions accept one', () => {
    const [head, abhy, shiro] = services
    expect(bookableById(head, false)).toBe(false) // enquiry-only
    expect(bookableById(abhy, false)).toBe(true)
    expect(bookableById(abhy, true)).toBe(false) // 45 min: groups reject short therapies by id
    expect(bookableById(shiro, true)).toBe(true)
  })
})
