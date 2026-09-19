import { describe, it, expect } from 'vitest'
import { findPrevNext } from '../pager'
import type { TreatmentSibling } from '@/types/treatments'

const mkSibling = (slug: string, title: string, order: number): TreatmentSibling => ({
  _id: slug,
  title,
  slug,
  categorySlug: 'face',
  order,
  duration: null,
  heroImage: null,
})

const siblings: TreatmentSibling[] = [
  mkSibling('a', 'A', 1),
  mkSibling('b', 'B', 2),
  mkSibling('c', 'C', 3),
]

describe('findPrevNext', () => {
  it('returns prev=last and next=second for the first item (wrap-around)', () => {
    const { prev, next } = findPrevNext(siblings, 'a')
    expect(prev?.slug).toBe('c')
    expect(next?.slug).toBe('b')
  })

  it('returns prev=second and next=first for the last item (wrap-around)', () => {
    const { prev, next } = findPrevNext(siblings, 'c')
    expect(prev?.slug).toBe('b')
    expect(next?.slug).toBe('a')
  })

  it('returns adjacent siblings for a middle item', () => {
    const { prev, next } = findPrevNext(siblings, 'b')
    expect(prev?.slug).toBe('a')
    expect(next?.slug).toBe('c')
  })

  it('returns null/null when the current slug is not in the list', () => {
    const { prev, next } = findPrevNext(siblings, 'z')
    expect(prev).toBeNull()
    expect(next).toBeNull()
  })

  it('returns null/null for an empty list', () => {
    const { prev, next } = findPrevNext([], 'a')
    expect(prev).toBeNull()
    expect(next).toBeNull()
  })

  it('returns null/null for a single-item list', () => {
    const single = [siblings[0]]
    const { prev, next } = findPrevNext(single, 'a')
    expect(prev).toBeNull()
    expect(next).toBeNull()
  })
})
