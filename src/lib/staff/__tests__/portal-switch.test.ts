import { describe, expect, it } from 'vitest'
import { FRONT_DESK_LOGIN, PORTALS, otherPortal, switchButton, switchOutcome, switchedNotice } from '../portal-switch'

describe('switching between front desk and doctor', () => {
  it('lets admin jump straight to either portal', () => {
    expect(switchOutcome('admin', 'doctor')).toEqual({ kind: 'go', to: '/doctor' })
    expect(switchOutcome('admin', 'console')).toEqual({ kind: 'go', to: '/console' })
  })

  it('signs a front desk account out and opens the doctor sign-in', () => {
    expect(switchOutcome('front_desk', 'doctor')).toEqual({ kind: 'sign-in', to: '/doctor/login?switched=1' })
  })

  it('signs a doctor account out and opens the front desk sign-in', () => {
    expect(switchOutcome('doctor', 'console')).toEqual({ kind: 'sign-in', to: `${FRONT_DESK_LOGIN}?switched=1` })
  })

  it('never opens a portal the role may not use', () => {
    expect(switchOutcome('customer', 'doctor').kind).toBe('sign-in')
    expect(switchOutcome(null, 'console').kind).toBe('sign-in')
    expect(switchOutcome('product_manager', 'doctor').kind).toBe('sign-in')
    // Your own portal is just a jump home, not a sign-out.
    expect(switchOutcome('front_desk', 'console')).toEqual({ kind: 'go', to: '/console' })
    expect(switchOutcome('doctor', 'doctor')).toEqual({ kind: 'go', to: '/doctor' })
  })

  it('shows the button to the three staff roles only, pointing at the other portal', () => {
    expect(switchButton('admin', 'console')).toMatchObject({ target: 'doctor', label: 'Switch to Doctor', instant: true, confirm: null })
    expect(switchButton('admin', 'doctor')).toMatchObject({ target: 'console', label: 'Switch to Front desk', instant: true })
    const fd = switchButton('front_desk', 'console')
    expect(fd).toMatchObject({ target: 'doctor', instant: false })
    expect(fd?.confirm).toMatch(/signed out.*Doctor account/)
    expect(switchButton('doctor', 'doctor')).toMatchObject({ target: 'console', instant: false })
    expect(switchButton('customer', 'console')).toBeNull()
    expect(switchButton(null, 'doctor')).toBeNull()
  })

  it('describes the sign-in page note and the other portal', () => {
    expect(otherPortal('console')).toBe('doctor')
    expect(switchedNotice('doctor')).toBe('You’ve been signed out. Sign in with the Doctor account to continue.')
    expect(PORTALS.doctor.login).toBe('/doctor/login')
  })
})
