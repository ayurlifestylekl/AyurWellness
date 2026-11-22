import { CLINIC_DOMAIN, CLINIC_EMAIL, CLINIC_LEGAL_NAME, CLINIC_NAME, CLINIC_PHONE_PRIMARY, CLINIC_REG_NO } from '@/lib/clinic'

/** Who issues counter receipts. */
export const BILL_ISSUER = {
  tradingName: CLINIC_NAME,
  legalName: CLINIC_LEGAL_NAME,
  regNo: CLINIC_REG_NO,
  addressLines: ['No. 68-3, Jalan Padang Belia', 'Brickfields, 50470 Kuala Lumpur, Malaysia'],
  phones: [CLINIC_PHONE_PRIMARY, '+6011-6339 3436'],
  email: CLINIC_EMAIL,
  website: CLINIC_DOMAIN,
  logo: { src: '/awc-icon.png', width: 1090, height: 890, displayWidth: 64, withName: true },
  /** Receipt colours (the site's brand tokens). */
  colors: { primary: '#006B3C', accent: '#B8752A', dark: '#12372D', cream: '#EDF4E7' },
  bookingLine: 'To book a session, WhatsApp us on +6011-6339 3436.',
}

/** How a bill line is printed. */
export function receiptLineName(_kind: string, description: string): string {
  return description
}
