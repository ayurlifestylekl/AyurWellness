#!/usr/bin/env node
import 'dotenv/config'
import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

config({ path: '.env.local', override: true })

const EMAIL = 'demo-admin@kerala-ayurvedic.dev'
const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const admin = createClient(url, serviceKey, { auth: { persistSession: false } })

// 1. List auth users matching the email
const list = await admin.auth.admin.listUsers()
const authUser = list.data?.users?.find((u) => u.email === EMAIL)
console.log('AUTH USER:', authUser ? {
  id: authUser.id,
  email: authUser.email,
  email_confirmed_at: authUser.email_confirmed_at,
  created_at: authUser.created_at,
  banned_until: authUser.banned_until,
  last_sign_in_at: authUser.last_sign_in_at,
} : 'NOT FOUND')

// 2. Profile row
if (authUser) {
  const { data: profile } = await admin.from('users').select('id, email, role, full_name').eq('id', authUser.id).maybeSingle()
  console.log('PROFILE:', profile ?? 'NOT FOUND')
}

// 3. Try password sign-in via the anon client (same path the app uses)
const anon = createClient(url, anonKey, { auth: { persistSession: false } })
const signIn = await anon.auth.signInWithPassword({ email: EMAIL, password: 'Demo1234!' })
console.log('SIGN-IN ATTEMPT:', signIn.error
  ? { error: signIn.error.message, status: signIn.error.status }
  : { success: true, user_id: signIn.data.user?.id })
