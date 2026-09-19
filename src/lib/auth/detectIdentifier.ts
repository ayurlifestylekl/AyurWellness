import { normalizeMalaysianPhone } from './phone'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export type DetectedIdentifier =
  | { type: 'email'; value: string }
  | { type: 'phone'; value: string }

/**
 * Parse a free-text sign-in identifier and figure out whether the user
 * typed an email or a Malaysian phone number. Returns the normalized
 * value (lowercased email, or E.164 phone) or null if neither.
 */
export function detectIdentifier(raw: string): DetectedIdentifier | null {
  const trimmed = raw.trim()
  if (!trimmed) return null

  // Email: anything with an @
  if (trimmed.includes('@')) {
    const lowered = trimmed.toLowerCase()
    return EMAIL_RE.test(lowered) ? { type: 'email', value: lowered } : null
  }

  // Otherwise try to interpret as a Malaysian phone number
  const phone = normalizeMalaysianPhone(trimmed)
  return phone ? { type: 'phone', value: phone } : null
}
