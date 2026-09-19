import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/database.types'

export interface ExportBundle {
  exportedAt: string
  user: Database['public']['Tables']['users']['Row']
  addresses: Database['public']['Tables']['addresses']['Row'][]
  orders: Database['public']['Tables']['orders']['Row'][]
  appointments: Database['public']['Tables']['appointments']['Row'][]
  tickets: Database['public']['Tables']['support_tickets']['Row'][]
  promos: Database['public']['Tables']['customer_promos']['Row'][]
  quizResults: Database['public']['Tables']['quiz_results']['Row'][]
}

export async function buildExport(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any, 'public', any>,
  userId: string
): Promise<ExportBundle> {
  const [user, addresses, orders, appointments, tickets, promos, quizResults] = await Promise.all([
    supabase.from('users').select('*').eq('id', userId).single(),
    supabase.from('addresses').select('*').eq('customer_id', userId),
    supabase.from('orders').select('*').eq('customer_id', userId),
    supabase.from('appointments').select('*').eq('customer_id', userId),
    supabase.from('support_tickets').select('*').eq('customer_id', userId),
    supabase.from('customer_promos').select('*').eq('customer_id', userId),
    supabase.from('quiz_results').select('*').eq('user_id', userId),
  ])

  if (user.error || !user.data) throw new Error('User not found')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const asAny = (v: unknown) => v as any
  return {
    exportedAt: new Date().toISOString(),
    user: asAny(user.data),
    addresses: asAny(addresses.data ?? []),
    orders: asAny(orders.data ?? []),
    appointments: asAny(appointments.data ?? []),
    tickets: asAny(tickets.data ?? []),
    promos: asAny(promos.data ?? []),
    quizResults: asAny(quizResults.data ?? []),
  }
}
