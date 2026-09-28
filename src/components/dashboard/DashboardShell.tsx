'use client'

import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Package,
  Calendar,
  User,
  ShoppingBag,
  ClipboardList,
  Sparkles,
  MessageSquare,
  TrendingUp,
  Sun,
  Stethoscope,
  Gift,
  Inbox,
  Compass,
  Bell,
  MapPin,
  Heart,
  Boxes,
  Users,
  Store,
  Settings,
  Star,
  BarChart3,
  History,
  type LucideIcon,
} from 'lucide-react'
import type { IconName, NavItem, PortalChrome } from '@/lib/dashboard/nav-types'
import NotificationsRealBell from '@/components/account/NotificationsRealBell'
import { PortalFrame, PortalNavLink, PortalNavSection } from './PortalFrame'

/**
 * String-ID → Lucide component lookup. Lives in this client component
 * so the icons never have to cross the RSC boundary as function refs.
 * Add a new icon here AND in IconName when introducing a new nav item.
 */
const ICONS: Record<IconName, LucideIcon> = {
  'dashboard':       LayoutDashboard,
  'package':         Package,
  'calendar':        Calendar,
  'user':            User,
  'shopping-bag':    ShoppingBag,
  'clipboard-list':  ClipboardList,
  'sparkles':        Sparkles,
  'message-square':  MessageSquare,
  'trending-up':     TrendingUp,
  'sun':             Sun,
  'stethoscope':     Stethoscope,
  'gift':            Gift,
  'inbox':           Inbox,
  'compass':         Compass,
  'map-pin':         MapPin,
  'heart':           Heart,
  'bell':            Bell,
  'boxes':           Boxes,
  'users':           Users,
  'store':           Store,
  'settings':        Settings,
  'star':            Star,
  'bar-chart':       BarChart3,
  'history':         History,
}

interface DashboardShellProps {
  user: {
    id: string
    fullName: string
    email: string
    role: 'admin' | 'customer' | 'sales_agent' | 'product_manager'
    avatarUrl?: string | null
  }
  nav: NavItem[]
  portal: PortalChrome
  initialNotifications?: import('@/lib/notifications/queries').Notification[]
  children: React.ReactNode
}

const ROLE_LABEL: Record<DashboardShellProps['user']['role'], string> = {
  admin: 'Administrator',
  sales_agent: 'Brand Partner',
  product_manager: 'Product Manager',
  customer: 'Member',
}

export default function DashboardShell({ user, nav, portal, initialNotifications, children }: DashboardShellProps) {
  const pathname = usePathname()
  const activeHref = nav
    .filter((item) => pathname === item.href || pathname.startsWith(item.href + '/'))
    .sort((a, b) => b.href.length - a.href.length)[0]?.href

  const sections: { title?: string; items: NavItem[] }[] = []
  for (const item of nav) {
    const last = sections[sections.length - 1]
    if (last && last.title === item.group) last.items.push(item)
    else sections.push({ title: item.group, items: [item] })
  }

  return (
    <PortalFrame
      portalLabel={portal.label}
      homeHref={nav[0]?.href ?? '/'}
      user={{ name: user.fullName || 'Welcome', email: user.email, roleLabel: ROLE_LABEL[user.role], avatarUrl: user.avatarUrl }}
      topbarRight={<NotificationsRealBell userId={user.id} initial={initialNotifications ?? []} />}
      nav={sections.map((section, i) => (
        <PortalNavSection key={`${section.title ?? 'main'}-${i}`} title={section.title}>
          {section.items.map((item) => (
            <PortalNavLink
              key={item.href}
              href={item.href}
              label={item.label}
              icon={ICONS[item.icon]}
              active={item.href === activeHref}
            />
          ))}
        </PortalNavSection>
      ))}
    >
      {children}
    </PortalFrame>
  )
}
