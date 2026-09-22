import 'server-only'
import { cache as reactCache } from 'react'
import { createClient as createSb } from '@supabase/supabase-js'
import type { Gender } from '@/types/booking'
import type { Therapist, Vaidya } from './therapist-format'

export type { Therapist, Vaidya } from './therapist-format'
export { therapistLabel, vaidyaLabel } from './therapist-format'

// React's `cache` is only available in the React server environment; in
// plain Node/Vitest it is undefined. Fall back to the identity function so
// these helpers remain testable without affecting request-level caching in
// production server components.
function requestCache<T>(fn: T): T {
  if (typeof reactCache !== 'function') return fn
  // React's cache accepts any function and returns the same type.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return reactCache(fn as any) as T
}

/** Service-role client for reading roster tables. */
function db() {
  return createSb(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  )
}

/**
 * Not a massage therapist — a synthetic code so the Vaidya's consultation
 * slots can be blocked (e.g. a personal day off) independently of a
 * whole-centre closure, reusing the same schedule_blocks mechanism. Never
 * appears in THERAPISTS / therapistsForGender — the Vaidya has no gender
 * matching role.
 */
export const VAIDYA_BLOCK_CODE = 'VAIDYA'

/** Fetch a therapist by code. Request-level cached. */
export const therapistByCode = requestCache(async (code: string | null | undefined): Promise<Therapist | undefined> => {
  if (!code) return undefined
  const { data } = await db().from('therapists').select('code, name, gender, active').eq('code', code).maybeSingle()
  return data ? { code: data.code, name: data.name, gender: data.gender as Gender, active: data.active } : undefined
})

/** Active therapists of a given gender (or all if no requirement). Request-level cached. */
export const therapistsForGender = requestCache(async (gender: Gender | null): Promise<Therapist[]> => {
  let q = db().from('therapists').select('code, name, gender, active').eq('active', true)
  if (gender) q = q.eq('gender', gender)
  const { data } = await q.order('sort_order')
  return (data ?? []).map((t) => ({ code: t.code, name: t.name, gender: t.gender as Gender, active: t.active }))
})

/** All therapists (active + inactive) for admin roster UI. Request-level cached. */
export const getAllTherapists = requestCache(async (): Promise<Therapist[]> => {
  const { data } = await db().from('therapists').select('code, name, gender, active').order('sort_order')
  return (data ?? []).map((t) => ({ code: t.code, name: t.name, gender: t.gender as Gender, active: t.active }))
})

/** Fetch a Vaidya by code. Request-level cached. */
export const vaidyaByCode = requestCache(async (code: string | null | undefined): Promise<Vaidya | undefined> => {
  if (!code) return undefined
  const { data } = await db().from('vaidyas').select('code, name, public_facing, active').eq('code', code).maybeSingle()
  return data ? { code: data.code, name: data.name, publicFacing: data.public_facing, active: data.active } : undefined
})

/** All Vaidyas (active + inactive) for admin roster UI. Request-level cached. */
export const getAllVaidyas = requestCache(async (): Promise<Vaidya[]> => {
  const { data } = await db().from('vaidyas').select('code, name, public_facing, active').order('code')
  return (data ?? []).map((v) => ({ code: v.code, name: v.name, publicFacing: v.public_facing, active: v.active }))
})

/** Resolve Vaidya name from code. */
export async function vaidyaName(code: string | null | undefined): Promise<string> {
  const v = await vaidyaByCode(code)
  return v?.name ?? code ?? ''
}
