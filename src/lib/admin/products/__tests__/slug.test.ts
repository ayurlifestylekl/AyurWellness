import { describe, it, expect } from 'vitest'
import { slugify, uniqueSlug } from '../slug'

describe('slugify', () => {
  it('lowercases and replaces non-alphanumeric with hyphens', () => {
    expect(slugify('Kesha Thailam Hair Oil')).toBe('kesha-thailam-hair-oil')
  })
  it('strips diacritics', () => {
    expect(slugify('Nāyāka Pāṭha')).toBe('nayaka-patha')
  })
  it('collapses repeated hyphens', () => {
    expect(slugify('A -- B')).toBe('a-b')
  })
  it('trims leading/trailing hyphens', () => {
    expect(slugify('-Kesha-')).toBe('kesha')
  })
  it('handles ampersands and commas', () => {
    expect(slugify('Salt & Pepper, V2')).toBe('salt-pepper-v2')
  })
})

describe('uniqueSlug', () => {
  it('returns the base slug when not taken', async () => {
    const r = await uniqueSlug('kesha', async () => false)
    expect(r).toBe('kesha')
  })
  it('appends -2, -3 until a free slug is found', async () => {
    let calls = 0
    const r = await uniqueSlug('kesha', async () => {
      calls++
      return calls <= 2
    })
    expect(r).toBe('kesha-3')
  })
})
