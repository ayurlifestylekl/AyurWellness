'use client'

import { usePathname } from 'next/navigation'
import { LayoutDashboard, CalendarDays, Users, Stethoscope, ClipboardList, type LucideIcon } from 'lucide-react'
import { doctorNav } from '@/lib/booking/dashboard-nav'
import { PortalFrame, PortalNavLink, PortalNavSection } from '@/components/dashboard/PortalFrame'

const ICON_BY_LABEL: Record<string, LucideIcon> = {
  Overview: LayoutDashboard,
  Schedule: ClipboardList,
  Calendar: CalendarDays,
  Patients: Users,
  Consultations: Stethoscope,
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
              active={item.href === '/doctor' ? pathname === item.href : pathname.startsWith(item.href)}
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
