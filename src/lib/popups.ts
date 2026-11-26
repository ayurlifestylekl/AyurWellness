/** Fired on window when the welcome (sign-up) popup is closed, so the hiring popup can follow it instead of covering it. */
export const WELCOME_POPUP_CLOSED = 'awc:welcome-popup-closed'
export const WELCOME_SEEN_KEY = 'kal-welcome-seen'

/** Pages where a popup must never appear: booking, payment and account flows, and the Careers page itself. */
const NO_POPUP_PREFIXES = ['/careers', '/book', '/checkout', '/cart', '/account', '/auth', '/order', '/cancellation', '/privacy', '/terms']

export function popupAllowedOn(pathname: string | null): boolean {
  if (!pathname) return false
  return !NO_POPUP_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + '/'))
}
