import type { TreatmentSibling } from '@/types/treatments'

/**
 * Given an ordered siblings array and the slug of the current item,
 * return its previous and next siblings. Wraps around at the ends.
 *
 * Returns prev=null, next=null when:
 *   - the list is empty,
 *   - the list has a single item,
 *   - or the current slug is not present in the list.
 */
export function findPrevNext(
  siblings: TreatmentSibling[],
  currentSlug: string,
): { prev: TreatmentSibling | null; next: TreatmentSibling | null } {
  if (siblings.length < 2) return { prev: null, next: null }
  const idx = siblings.findIndex((s) => s.slug === currentSlug)
  if (idx === -1) return { prev: null, next: null }
  const prev = siblings[(idx - 1 + siblings.length) % siblings.length]
  const next = siblings[(idx + 1) % siblings.length]
  return { prev, next }
}
