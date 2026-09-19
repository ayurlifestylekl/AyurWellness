import 'server-only'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/database.types'

export type NotificationKind = Database['public']['Tables']['notifications']['Row']['kind']

let cached: SupabaseClient<Database> | null = null
function admin(): SupabaseClient<Database> {
  if (cached) return cached
  cached = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  )
  return cached
}

export async function createNotification(input: {
  userId: string
  kind: NotificationKind
  title: string
  body: string
  href?: string | null
}): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (admin().from('notifications') as any).insert({
    user_id: input.userId,
    kind: input.kind,
    title: input.title,
    body: input.body,
    href: input.href ?? null,
  })
  if (error) console.error('[notifications/create] failed:', error.message)
}
