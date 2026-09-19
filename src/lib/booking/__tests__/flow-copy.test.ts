import { describe, expect, it } from 'vitest'

import { flowLabels } from '../flow-copy'

describe('flowLabels', () => {
  it('describes an instant treatment without approval', () => {
    expect(flowLabels('treatment', 'awaiting_payment', null)).toEqual([
      'Slot selected',
      'Payment',
      'Confirmation',
    ])
  })

  it('describes a free consultation without payment', () => {
    expect(flowLabels('consultation', 'confirmed', null)).toEqual(['Slot selected', 'Confirmed'])
  })

  it('keeps legacy approval visible only for historical approved rows', () => {
    expect(flowLabels('treatment', 'confirmed', '2026-01-01T00:00:00Z')).toContain('Clinic approval')
  })

  it('never uses request or approval wording for a new instant row', () => {
    expect(flowLabels('treatment', 'confirmed', null).join(' ')).not.toMatch(/request|preferred|awaiting approval/i)
  })
})
