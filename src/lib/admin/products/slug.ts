/**
 * URL-safe slug helpers for products.
 *   slugify('Kesha Thailam Hair Oil')  -> 'kesha-thailam-hair-oil'
 *   slugify('Nāyāka Pāṭha')            -> 'nayaka-patha'
 */
export function slugify(input: string): string {
  return input
    .normalize('NFD')
    // strip combining diacritical marks (U+0300 to U+036F)
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/**
 * Given a base slug and a predicate that says whether a candidate is already
 * taken, returns the first free slug — base, base-2, base-3, etc.
 */
export async function uniqueSlug(
  base: string,
  isTaken: (candidate: string) => Promise<boolean>,
): Promise<string> {
  let candidate = base
  let i = 2
  // eslint-disable-next-line no-await-in-loop
  while (await isTaken(candidate)) {
    candidate = `${base}-${i++}`
    if (i > 100) throw new Error('Slug generation exceeded 100 attempts')
  }
  return candidate
}
