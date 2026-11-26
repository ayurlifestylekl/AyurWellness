import { describe, expect, it } from 'vitest'
import { VACANCY, applyMailto } from '../careers'

describe('job vacancy', () => {
  it('applicants email the address on the poster, with the job in the subject', () => {
    expect(VACANCY.applyEmail).toBe('ayurvedicwellness2026@gmail.com')
    const url = applyMailto()
    expect(url.startsWith('mailto:ayurvedicwellness2026@gmail.com?subject=Application%3A%20Admin%20Assistant&body=')).toBe(true)
    expect(decodeURIComponent(url)).toContain('apply for the Admin Assistant position')
  })
  it('pay matches the poster', () => {
    expect([VACANCY.salaryMin, VACANCY.salaryMax]).toEqual([2500, 3000])
  })
})
