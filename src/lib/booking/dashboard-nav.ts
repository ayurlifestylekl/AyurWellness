export interface DashboardNavItem {
  href: string
  label: string
  roles?: string[] // Optional: if specified, only show to these roles
}

// Single source of truth for the front-desk console sidebar — both the
// tab-based views (rendered by src/app/(staff)/console/page.tsx's TABS) and
// the console's own sub-routes (schedule, blocks, announcements). ConsoleShell
// attaches its Lucide icons locally, keyed off `label`, so this stays plain
// data and is trivially testable in Node.
export const consoleNav: DashboardNavItem[] = [
  { href: '/console', label: 'Overview' },
  { href: '/console?tab=needs-therapist', label: 'Needs therapist' },
  { href: '/console?tab=today', label: 'Today' },
  { href: '/console?tab=awaiting', label: 'Awaiting payment' },
  { href: '/console?tab=confirmed', label: 'Confirmed' },
  { href: '/console?tab=refunds', label: 'Refunds' },
  { href: '/console/doctors', label: 'Doctors' },
  { href: '/console?tab=all', label: 'All' },
  { href: '/console/schedule', label: 'Schedule' },
  { href: '/console/blocks', label: 'Availability' },
  { href: '/console/announcements', label: 'Announcements' },
  { href: '/console/roster', label: 'Staff Roster' },
]

export const doctorNav: DashboardNavItem[] = [
  { href: '/doctor', label: 'Overview' },
  { href: '/doctor/schedule', label: 'Schedule' },
  { href: '/doctor/calendar', label: 'Calendar' },
  { href: '/doctor/patients', label: 'Patients' },
  { href: '/doctor/consultations', label: 'Consultations' },
]
