import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import RegisterForm from './RegisterForm'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'Create Account',
  description: 'Create a Ayurvedic Wellness Centre account to track orders and consultations.',
  alternates: { canonical: '/auth/register' },
  robots: { index: false, follow: false },
}

interface InvitePrefill {
  token: string
  email: string
  fullName: string
}

async function lookupInvite(token: string): Promise<InvitePrefill | null> {
  const supabase = await createClient()
  const { data: row } = await supabase
    .from('agent_invites')
    .select('email, full_name')
    .eq('token', token)
    .is('used_at', null)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle()
  // Cast: hand-maintained Database type predates v2 inference metadata.
  const invite = row as { email: string; full_name: string } | null
  if (!invite) return null
  return { token, email: invite.email, fullName: invite.full_name }
}

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: { invite?: string; next?: string }
}) {
  // Customer signups now live on /auth/login?tab=signup. This page is reserved
  // for Brand Partner invite-based signups; redirect everyone else there.
  if (!searchParams.invite) {
    const params = new URLSearchParams({ tab: 'signup' })
    if (searchParams.next) params.set('next', searchParams.next)
    redirect(`/auth/login?${params.toString()}`)
  }

  const invite = await lookupInvite(searchParams.invite)
  return <RegisterForm invite={invite} inviteTokenRaw={searchParams.invite} nextPath={searchParams.next} />
}
