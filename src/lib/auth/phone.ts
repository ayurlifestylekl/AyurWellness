/**
 * Normalize a Malaysian phone number to E.164 format (+60XXXXXXXXX).
 *
 * Accepts common input shapes:
 *   "+60 12 345 6789"   → "+60123456789"
 *   "60123456789"        → "+60123456789"
 *   "0123456789"         → "+60123456789"
 *   "012-345 6789"       → "+60123456789"
 *   "123456789"          → "+60123456789"  (bare number starting with 1)
 *
 * Returns null when the input doesn't look like a valid Malaysian mobile.
 * Malaysian mobile numbers (after +60) are 9 or 10 digits and start with 1.
 */
export function normalizeMalaysianPhone(input: string): string | null {
  if (!input) return null

  // Strip everything except digits and a leading '+'
  const cleaned = input.trim().replace(/[^\d+]/g, '')

  let core: string

  if (cleaned.startsWith('+60')) {
    core = cleaned.slice(3)
  } else if (cleaned.startsWith('60')) {
    core = cleaned.slice(2)
  } else if (cleaned.startsWith('0')) {
    core = cleaned.slice(1)
  } else {
    core = cleaned
  }

  // Malaysian mobiles: 9 or 10 digits after the +60 prefix, must start with '1'
  if (!/^1\d{8,9}$/.test(core)) return null

  return `+60${core}`
}

/** Format a normalized E.164 Malaysian number for display: "+60 12 345 6789". */
export function formatMalaysianPhoneForDisplay(e164: string | null): string {
  if (!e164 || !e164.startsWith('+60')) return e164 ?? ''
  const rest = e164.slice(3)
  if (rest.length === 9) {
    return `+60 ${rest.slice(0, 2)} ${rest.slice(2, 5)} ${rest.slice(5)}`
  }
  if (rest.length === 10) {
    return `+60 ${rest.slice(0, 2)} ${rest.slice(2, 6)} ${rest.slice(6)}`
  }
  return e164
}
