import { redirect } from 'next/navigation'
import { getCurrentUser, homeForRole } from '@/lib/auth/getCurrentUser'
import { createClient } from '@/lib/supabase/server'
import DashboardShell from '@/components/dashboard/DashboardShell'
import { agentNav, agentChrome } from '@/lib/dashboard/agent-nav'

// Routes that require each capability. Items not listed here are always shown.
const AFFILIATE_ONLY_HREFS = new Set([
  '/agent/orders',
  '/agent/marketplace-orders',
  '/agent/reports',
])
const WHOLESALE_ONLY_HREFS = new Set([
  '/agent/wholesale-shop',
  '/agent/wholesale-orders',
])

export default async function AgentLayout({ children }: { children: React.ReactNode }) {
  const me = await getCurrentUser()
  if (!me) redirect('/agent/login?next=/agent/dashboard')
  if (me.role !== 'sales_agent') redirect(homeForRole(me.role))

  // Pull capability flags so the sidebar only shows what this partner can do.
  const supabase = await createClient()
  const { data: agentRow } = await supabase
    .from('sales_agents')
    .select('can_affiliate, can_wholesale')
    .eq('user_id', me.profile.id)
    .maybeSingle()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const caps: any = agentRow ?? { can_affiliate: true, can_wholesale: false }
  const canAffiliate = Boolean(caps.can_affiliate)
  const canWholesale = Boolean(caps.can_wholesale)

  const filteredNav = agentNav.filter((item) => {
    if (AFFILIATE_ONLY_HREFS.has(item.href)) return canAffiliate
    if (WHOLESALE_ONLY_HREFS.has(item.href)) return canWholesale
    return true
  })

  return (
    <DashboardShell
      user={{
        id: me.authId,
        fullName: me.profile.full_name ?? 'Brand Partner',
        email: me.identifier,
        role: me.role,
      }}
      nav={filteredNav}
      portal={agentChrome}
    >
      {children}
    </DashboardShell>
  )
}
