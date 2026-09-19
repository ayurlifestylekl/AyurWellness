import { describe, expect, it } from 'vitest'
import { confirmationCopy } from '../confirmation-copy'

describe('confirmationCopy', () => {
  it('uses payment and assignment wording for a treatment', () => {
    const c = confirmationCopy('treatment')
    expect(c.staffHeading).toContain('Payment received')
    expect(c.customerLines.join(' ')).toContain('same-gender therapist')
  })

  it('uses free Vaidya wording with no payment or therapist for a consultation', () => {
    const c = confirmationCopy('consultation')
    const all = JSON.stringify(c)
    expect(all).toContain('Free consultation confirmed')
    expect(all).toContain('Vaidya')
    expect(all).not.toMatch(/Payment received|same-gender therapist|Assign a therapist/i)
  })
})
