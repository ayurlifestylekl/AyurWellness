import { describe, expect, it } from 'vitest'
import { EXTRAS, extrasFor, extrasTotals, nameWithExtras, readExtras, resolveExtras, treatmentKey } from '../extras'
import { OFFERED_TREATMENT_IDS } from '@/data/treatments'

const HEAD_NECK = 'cat-massage__head-neck-shoulder-massage'

describe('Hair Wash add-on', () => {
  it('is RM40 and 20 minutes', () => {
    expect(EXTRAS.find((e) => e.code === 'hair_wash')).toMatchObject({ priceRm: 40, mins: 20 })
  })

  it('is offered only with the three head and hair therapies, all of which are on the menu', () => {
    const keys = Array.from(OFFERED_TREATMENT_IDS)
    const offered = keys.filter((k) => extrasFor(k).some((e) => e.code === 'hair_wash'))
    expect(offered.sort()).toEqual(['cat-hair-care__hair-scalp-oil-massage', 'cat-massage__head-neck-shoulder-massage', 'cat-massage__siro-abhyangam'])
  })

  it('keeps only add-ons allowed for the treatment, once each, at the server price', () => {
    expect(resolveExtras(HEAD_NECK, ['hair_wash', 'hair_wash', 'vip', 5])).toEqual([{ code: 'hair_wash', label: 'Hair Wash', priceRm: 40, mins: 20 }])
    expect(resolveExtras('cat-face-care__mukha-abhyangam', ['hair_wash'])).toEqual([])
    expect(resolveExtras(HEAD_NECK, 'hair_wash')).toEqual([])
    expect(resolveExtras(null, ['hair_wash'])).toEqual([])
  })

  it('adds price and time and names the booking', () => {
    const chosen = resolveExtras(HEAD_NECK, ['hair_wash'])
    expect(extrasTotals(chosen)).toEqual({ priceRm: 40, mins: 20 })
    expect(nameWithExtras('Head, Neck & Shoulder Massage', chosen)).toBe('Head, Neck & Shoulder Massage + Hair Wash')
    expect(nameWithExtras('Siro Abhyangam', [])).toBe('Siro Abhyangam')
    expect(treatmentKey('cat-massage', 'siro-abhyangam')).toBe('cat-massage__siro-abhyangam')
  })

  it('reads stored add-ons defensively', () => {
    expect(readExtras(null)).toEqual([])
    expect(readExtras([{ code: 'hair_wash', label: 'Hair Wash', priceRm: 40, mins: 20 }, 'x', null])).toHaveLength(1)
  })
})
