import type { SupabaseClient } from '@supabase/supabase-js'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SB = SupabaseClient<any, 'public', any>

export interface Lead {
  id: string
  name: string | null
  email: string | null
  phone: string | null
  source: string
  createdAt: string
}

const SOURCE_LABEL: Record<string, string> = {
  welcome_popup: 'Welcome popup',
  whatsapp_gate: 'WhatsApp',
  unknown: 'Other',
}
export const sourceLabel = (s: string) => SOURCE_LABEL[s] ?? s

/** All captured leads, newest first (admin session; RLS: is_admin). */
export async function listLeads(sb: SB): Promise<Lead[]> {
  const { data, error } = await sb
    .from('leads')
    .select('id, name, email, phone, source, created_at')
    .order('created_at', { ascending: false })
    .limit(5000)
  if (error) {
    console.error('[admin/leads] listLeads:', error.message)
    return []
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data ?? []).map((r: any) => ({
    id: r.id,
    name: r.name ?? null,
    email: r.email ?? null,
    phone: r.phone ?? null,
    source: r.source ?? 'unknown',
    createdAt: r.created_at ?? '',
  }))
}

const cell = (v: string) => `"${v.replace(/"/g, '""')}"`

/** Excel-friendly CSV of the leads. */
export function leadsToCsv(rows: Lead[]): string {
  const header = ['Name', 'Email', 'Phone', 'Source', 'Captured at']
  const body = rows.map((r) =>
    [r.name ?? '', r.email ?? '', r.phone ?? '', sourceLabel(r.source), r.createdAt].map((c) => cell(String(c))).join(','),
  )
  return [header.map(cell).join(','), ...body].join('\r\n')
}
