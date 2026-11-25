import { describe, expect, it } from 'vitest'
import { EXTRAS, VIP_ROOMS, extrasFor, extrasTotals, nameWithExtras, readExtras, resolveExtras, treatmentKey, vipRoomFor } from '../extras'
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

describe('VIP Private Room', () => {
  it('is RM20, adds no time, and is offered with every therapy on the menu', () => {
    for (const key of Array.from(OFFERED_TREATMENT_IDS)) {
      expect(extrasFor(key).find((e) => e.code === 'vip_room')).toMatchObject({ priceRm: 20, mins: 0, kind: 'room' })
    }
  })

  it('combines with Hair Wash: RM60 more and 20 minutes', () => {
    const chosen = resolveExtras(HEAD_NECK, ['hair_wash', 'vip_room'])
    expect(extrasTotals(chosen)).toEqual({ priceRm: 60, mins: 20 })
    expect(nameWithExtras('Head, Neck & Shoulder Massage', chosen)).toBe('Head, Neck & Shoulder Massage + Hair Wash + VIP Private Room')
  })

  it('Mukha Abhyangam with VIP is RM115 (the centre’s example)', () => {
    expect(95 + extrasTotals(resolveExtras('cat-face-care__mukha-abhyangam', ['vip_room'])).priceRm).toBe(115)
  })
})

describe('VIP rooms', () => {
  it('2 hair & scalp rooms and 1 facial room', () => {
    expect(VIP_ROOMS.hair.count).toBe(2)
    expect(VIP_ROOMS.facial.count).toBe(1)
  })
  it('face care and the foot massage use the facial room; head and hair therapies the hair room', () => {
    expect(vipRoomFor('cat-face-care__mukha-lepam')).toBe('facial')
    expect(vipRoomFor('cat-massage__paadha-abhyangam')).toBe('facial')
    expect(vipRoomFor('cat-hair-care__thalapothichil')).toBe('hair')
    expect(vipRoomFor('cat-massage__head-neck-shoulder-massage')).toBe('hair')
    expect(vipRoomFor('cat-massage__siro-abhyangam')).toBe('hair')
  })
  it('records the room with the VIP choice', () => {
    expect(resolveExtras('cat-face-care__njavara-facial', ['vip_room'])).toEqual([{ code: 'vip_room', label: 'VIP Private Room', priceRm: 20, mins: 0, room: 'facial' }])
    expect(readExtras([{ code: 'vip_room', label: 'VIP Private Room', priceRm: 20, mins: 0, room: 'hair' }])[0].room).toBe('hair')
  })
})
