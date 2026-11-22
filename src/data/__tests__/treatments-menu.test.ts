import { describe, expect, it } from 'vitest'
import { getAllCategories, getTreatmentBySlug, getTreatmentsByCategorySlug, totalTreatmentCount } from '../treatments'

// The new centre's menu as the client sent it (22 Nov 2026).
const MENU: [string, string, string, string, number][] = [
  ['face-care-therapies', 'mukha-abhyangam', 'Mukha Abhyangam (Face Massage)', '45 min', 95],
  ['face-care-therapies', 'makha-lepham', 'Makha Lepham (Herbal Facial)', '1 Hour 30 min', 175],
  ['face-care-therapies', 'njavara-facial', 'Njavara Facial (Milk Facial)', '1 Hour 30 min', 185],
  ['hair-scalp-care-therapies', 'thalapothichil', 'Thalapothichil (Scalp Detox Treatment)', '1 Hour 30 min', 165],
  ['hair-scalp-care-therapies', 'siro-abhyangam-thalapothichil', 'Siro Abhyangam + Thalapothichil (Hair Treatment)', '1 Hour 30 min', 165],
  ['hair-scalp-care-therapies', 'hair-scalp-oil-massage', 'Hair & Scalp Oil Massage', '1 Hour', 90],
  ['massage-rehab-therapies', 'head-neck-shoulder-massage', 'Head, Neck & Shoulder Massage', '1 Hour', 110],
  ['massage-rehab-therapies', 'siro-abhyangam', 'Siro Abhyangam (Head Massage)', '30 min', 75],
  ['massage-rehab-therapies', 'paadha-abhyangam', 'Paadha Abhyangam (Foot Massage)', '45 min', 95],
]

describe('new centre treatment menu', () => {
  it('shows exactly the nine treatments, with the centre’s durations and prices', () => {
    expect(totalTreatmentCount).toBe(9)
    for (const [cat, slug, title, duration, price] of MENU) {
      const t = getTreatmentBySlug(cat, slug)
      expect(t, slug).not.toBeNull()
      expect(t).toMatchObject({ title, duration, price, bookingType: 'direct' })
    }
  })

  it('only lists categories that have something on offer, with the right counts', () => {
    expect(getAllCategories().map((c) => [c.slug, c.treatmentCount])).toEqual([
      ['face-care-therapies', 3],
      ['massage-rehab-therapies', 3],
      ['hair-scalp-care-therapies', 3],
    ])
  })

  it('hides the rest of the catalogue (kept in the file, not deleted)', () => {
    expect(getTreatmentBySlug('massage-rehab-therapies', 'head-massage')).toBeNull()
    expect(getTreatmentsByCategorySlug('panchakarma')).toEqual([])
  })
})
