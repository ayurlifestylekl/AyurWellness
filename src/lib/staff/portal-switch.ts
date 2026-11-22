/**
 * Switching between the Front desk and the Doctor portal.
 *
 * Admin can open both, so for admin it is a plain jump. A front desk or doctor
 * account is kept out of the other portal on purpose (the doctor side holds
 * clinical notes, the console holds billing), so for them "switch" means:
 * sign out and open the other portal's sign-in page.
 */

export type Portal = 'console' | 'doctor'

/** Where the front desk signs in (this site's own sign-in page). */
export const FRONT_DESK_LOGIN = '/frontdesk'

export const PORTALS: Record<Portal, { label: string; home: string; login: string }> = {
  console: { label: 'Front desk', home: '/console', login: FRONT_DESK_LOGIN },
  doctor: { label: 'Doctor', home: '/doctor', login: '/doctor/login' },
}

export const otherPortal = (p: Portal): Portal => (p === 'console' ? 'doctor' : 'console')

export type SwitchOutcome = { kind: 'go'; to: string } | { kind: 'sign-in'; to: string }

/** What switching to `target` does for this role. */
export function switchOutcome(role: string | null | undefined, target: Portal): SwitchOutcome {
  const t = PORTALS[target]
  const mine = (target === 'console' && role === 'front_desk') || (target === 'doctor' && role === 'doctor')
  if (role === 'admin' || mine) return { kind: 'go', to: t.home }
  return { kind: 'sign-in', to: `${t.login}?switched=1` }
}

/** The button for the portal a person is in now, or null when it doesn't apply. */
export function switchButton(role: string | null | undefined, current: Portal): { target: Portal; label: string; instant: boolean; confirm: string | null } | null {
  if (role !== 'admin' && role !== 'front_desk' && role !== 'doctor') return null
  const target = otherPortal(current)
  const instant = switchOutcome(role, target).kind === 'go'
  return {
    target,
    label: `Switch to ${PORTALS[target].label}`,
    instant,
    confirm: instant ? null : `You'll be signed out. Then sign in with the ${PORTALS[target].label} account.`,
  }
}

/** The note on a sign-in page after a switch. */
export function switchedNotice(portal: Portal): string {
  return `You’ve been signed out. Sign in with the ${PORTALS[portal].label} account to continue.`
}
