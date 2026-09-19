import { Calendar, Activity, Sprout } from 'lucide-react'
import StatTile from './StatTile'

interface AppointmentSummaryProps {
  upcomingCount: number
  completedThisYear: number
  memberSinceLabel: string
}

export default function AppointmentSummary({
  upcomingCount,
  completedThisYear,
  memberSinceLabel,
}: AppointmentSummaryProps) {
  return (
    <section className="grid grid-cols-1 gap-2.5 sm:grid-cols-3 sm:gap-3">
      <StatTile
        label="Upcoming visits"
        value={String(upcomingCount)}
        sub={
          upcomingCount === 0
            ? 'None on the calendar'
            : upcomingCount === 1
              ? '1 visit ahead'
              : `${upcomingCount} visits ahead`
        }
        icon={Calendar}
        accent="sage"
      />
      <StatTile
        label="Visits this year"
        value={String(completedThisYear)}
        sub={
          completedThisYear === 0
            ? 'Begin your wellness rhythm'
            : completedThisYear === 1
              ? '1 visit completed'
              : `${completedThisYear} visits completed`
        }
        icon={Activity}
        accent="gold"
      />
      <StatTile
        label="Member since"
        value={memberSinceLabel}
        sub="Continuing care"
        icon={Sprout}
        accent="olive"
      />
    </section>
  )
}
