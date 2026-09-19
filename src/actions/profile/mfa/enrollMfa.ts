'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/getCurrentUser'

type Result =
  | { ok: true; factorId: string; qrSvg: string; secret: string }
  | { ok: false; error: string }

export async function enrollMfa(): Promise<Result> {
  const me = await getCurrentUser()
  if (!me) return { ok: false, error: 'Not authorised.' }

  const supabase = await createClient()

  // Clean up any half-finished factors (user bailed mid-enroll previously).
  const factors = await supabase.auth.mfa.listFactors()
  if (factors.data) {
    // factor.status is typed as 'verified' in some SDK versions; cast through
    // unknown to read the runtime 'unverified' value safely.
    for (const f of factors.data.totp) {
      if ((f as unknown as { status: string }).status !== 'verified') {
        await supabase.auth.mfa.unenroll({ factorId: f.id })
      }
    }
  }

  const { data, error } = await supabase.auth.mfa.enroll({
    factorType: 'totp',
    friendlyName: 'Ayurvedic Wellness Centre Authenticator',
  })
  if (error || !data) return { ok: false, error: error?.message ?? 'Could not start MFA enrolment.' }

  return {
    ok: true,
    factorId: data.id,
    qrSvg: data.totp.qr_code,
    secret: data.totp.secret,
  }
}
