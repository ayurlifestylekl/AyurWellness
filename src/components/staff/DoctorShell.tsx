'use client'

import { usePathname } from 'next/navigation'
import { LayoutDashboard, CalendarDays, Users, Stethoscope, ClipboardList, Tags, UserPlus, Receipt, Armchair, type LucideIcon } from 'lucide-react'
import { doctorNav } from '@/lib/booking/dashboard-nav'
import { PortalFrame, PortalNavLink, PortalNavSection } from '@/components/dashboard/PortalFrame'
import PortalSwitchButton from '@/components/staff/PortalSwitchButton'

const ICON_BY_LABEL: Record<string, LucideIcon> = {
  Overview: LayoutDashboard,
  Schedule: ClipboardList,
  Calendar: CalendarDays,
  Patients: Users,
  Consultations: Stethoscope,
  'Billing items': Tags,
  'Add patient': UserPlus,
  Checkout: Receipt,
  'Waiting room': Armchair,
}

export default function DoctorShell({
  role,
  userName,
  toClearCount = 0,
  children,
}: {
  role: string
  userName: string
  toClearCount?: number
  children: React.ReactNode
}) {
  const pathname = usePathname()

  return (
    <PortalFrame
      portalLabel="Vaidya Portal"
      homeHref="/doctor"
      topbarRight={<PortalSwitchButton role={role} current="doctor" />}
      user={{ name: userName, roleLabel: role === 'admin' ? 'Administrator' : 'Vaidya' }}
      nav={
        <PortalNavSection>
          {doctorNav.map((item) => (
            <PortalNavLink
              key={item.href}
              href={item.href}
              label={item.label}
              icon={ICON_BY_LABEL[item.label] ?? LayoutDashboard}
              // '/doctor' must match exactly — every other route is a prefix match.
              active={item.href === '/doctor' ? pathname === item.href : pathname.startsWith(item.href) && !doctorNav.some((o) => o.href.length > item.href.length && o.href.startsWith(item.href) && pathname.startsWith(o.href))}
              badge={item.href === '/doctor/consultations' ? toClearCount : null}
            />
          ))}
        </PortalNavSection>
      }
    >
      <div className="mx-auto max-w-6xl">{children}</div>
    </PortalFrame>
  )
}
