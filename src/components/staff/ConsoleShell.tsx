'use client'

import { Suspense } from 'react'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import {
  Plus, LayoutDashboard, CalendarDays, CreditCard, CheckCircle2, UserPlus, LayoutList, CalendarOff, CalendarRange, Megaphone, Banknote, Stethoscope, Users,
  type LucideIcon,
} from 'lucide-react'
import { consoleNav } from '@/lib/booking/dashboard-nav'
import { PortalFrame, PortalNavLink, PortalNavSection } from '@/components/dashboard/PortalFrame'

// Icons and grouping are rendering concerns and stay local to the shell —
// dashboard-nav.ts stays plain data so it's trivially testable in Node.
const ICON_BY_LABEL: Record<string, LucideIcon> = {
  Overview: LayoutDashboard,
  'Needs therapist': UserPlus,
  Today: CalendarDays,
  'Awaiting payment': CreditCard,
  Confirmed: CheckCircle2,
  Refunds: Banknote,
  Doctors: Stethoscope,
  All: LayoutList,
  Schedule: CalendarRange,
  Availability: CalendarOff,
  Announcements: Megaphone,
  'Staff Roster': Users,
}

const GROUP_BY_LABEL: Record<string, string> = {
  'Needs therapist': 'Bookings',
  Today: 'Bookings',
  'Awaiting payment': 'Bookings',
  Confirmed: 'Bookings',
  Refunds: 'Bookings',
  All: 'Bookings',
  Doctors: 'Team',
  Schedule: 'Team',
  Availability: 'Team',
  'Staff Roster': 'Team',
  Announcements: 'Team',
}

/** True when `href` (a consoleNav entry) is the currently active page/tab. */
function isActiveHref(href: string, pathname: string, params: URLSearchParams): boolean {
  const [hrefPath, hrefQuery] = href.split('?')
  if (hrefPath !== '/console') return pathname.startsWith(hrefPath)
  if (pathname !== '/console' || params.get('q')) return false
  const hrefTab = new URLSearchParams(hrefQuery).get('tab')
  return params.get('tab') === hrefTab
}

/** Nav list — isolates useSearchParams() so it can sit under a Suspense boundary. */
function NavLinks({ role }: { role: string }) {
  const pathname = usePathname()
  const params = useSearchParams()
  const items = consoleNav.filter((item) => !item.roles || item.roles.includes(role))
  const groups = ['', 'Bookings', 'Team'].map((g) => ({ title: g, items: items.filter((i) => (GROUP_BY_LABEL[i.label] ?? '') === g) }))

  return (
    <>
      {groups.filter((g) => g.items.length).map((g) => (
        <PortalNavSection key={g.title || 'main'} title={g.title || undefined}>
          {g.items.map((item) => (
            <PortalNavLink
              key={item.href}
              href={item.href}
              label={item.label}
              icon={ICON_BY_LABEL[item.label] ?? LayoutList}
              active={isActiveHref(item.href, pathname, params)}
            />
          ))}
        </PortalNavSection>
      ))}
    </>
  )
}

export default function ConsoleShell({
  role,
  userName,
  children,
}: {
  role: string
  userName: string
  children: React.ReactNode
}) {
  const pathname = usePathname()

  return (
    <PortalFrame
      portalLabel="Front Desk"
      homeHref="/console"
      user={{ name: userName, roleLabel: role === 'admin' ? 'Administrator' : 'Front Desk' }}
      sidebarAction={
        <Link
          href="/console/new"
          className={[
            'flex h-11 items-center justify-center gap-2 rounded-xl font-heading text-[11.5px] font-bold uppercase tracking-[0.16em] text-[#12372D] transition-all',
            'bg-gradient-to-b from-[#E4C384] to-[#B58A3B] shadow-[0_12px_24px_-12px_rgba(181,138,59,0.8)] hover:brightness-105',
            pathname === '/console/new' ? 'ring-2 ring-[#E4C384]/60 ring-offset-2 ring-offset-[#12372D]' : '',
          ].join(' ')}
        >
          <Plus className="h-4 w-4" strokeWidth={2.2} />
          New booking
        </Link>
      }
      nav={
        <Suspense fallback={<div className="px-3 py-2 font-body text-[12px] text-white/40">Loading…</div>}>
          <NavLinks role={role} />
        </Suspense>
      }
    >
      <div className="mx-auto max-w-6xl">{children}</div>
    </PortalFrame>
  )
}
