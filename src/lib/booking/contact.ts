/**
 * Customer contact helpers. Normalises Malaysian phone numbers to E.164-ish
 * digits so wa.me / tel: links work regardless of how the number was typed
 * (e.g. "016-407 1129", "0164071129", "+60164071129").
 */

/** Strip everything but digits, then map a local 0-prefixed MY number to 60…. */
export function normalizePhone(raw: string | null | undefined): string | null {
  if (!raw) return null
  let d = raw.replace(/[^\d]/g, '')
  if (!d) return null
  if (d.startsWith('0')) d = '60' + d.slice(1)
  else if (!d.startsWith('60') && d.length <= 10) d = '60' + d
  return d
}

/** WhatsApp deep link to the customer (optionally pre-filled message). */
export function customerWaLink(phone: string | null | undefined, text?: string): string | null {
  const d = normalizePhone(phone)
  if (!d) return null
  return `https://wa.me/${d}${text ? `?text=${encodeURIComponent(text)}` : ''}`
}

/** tel: link to the customer. */
export function customerTelLink(phone: string | null | undefined): string | null {
  const d = normalizePhone(phone)
  return d ? `tel:+${d}` : null
}
