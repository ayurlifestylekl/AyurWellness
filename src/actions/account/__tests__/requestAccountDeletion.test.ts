import { describe, it, expect, vi } from 'vitest'

// Mock next/cache + next/navigation + server-only so the server module loads.
vi.mock('server-only', () => ({}))
vi.mock('@/lib/email/send', () => ({ sendEmail: vi.fn(async () => ({ sent: true })) }))
vi.mock('@/lib/email/templates/accountDeletion', () => ({
  accountDeletionEmail: vi.fn(() => ({ subject: 's', html: '', text: '' })),
}))
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))
vi.mock('next/navigation', () => ({
  redirect: vi.fn(() => { throw new Error('REDIRECT_CALLED') }),
}))
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({
    auth: { signOut: vi.fn() },
    from: () => ({ update: () => ({ eq: () => Promise.resolve({ error: null }) }) }),
  })),
}))
vi.mock('@/lib/auth/getCurrentUser', () => ({
  getCurrentUser: vi.fn(async () => null),
}))

import { requestAccountDeletion } from '../requestAccountDeletion'

describe('requestAccountDeletion', () => {
  it('rejects when confirm phrase is wrong', async () => {
    const res = await requestAccountDeletion('please delete')
    expect(res).toEqual({ ok: false, error: 'Type "DELETE MY ACCOUNT" exactly to confirm.' })
  })

  it('rejects when confirm phrase has wrong case', async () => {
    const res = await requestAccountDeletion('delete my account')
    expect(res).toEqual({ ok: false, error: 'Type "DELETE MY ACCOUNT" exactly to confirm.' })
  })

  it('rejects when not authorised even with correct phrase', async () => {
    const res = await requestAccountDeletion('DELETE MY ACCOUNT')
    expect(res).toEqual({ ok: false, error: 'Not authorised.' })
  })
})
