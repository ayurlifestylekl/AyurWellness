import { type BookingEventRow } from '@/lib/staff/appointments'

function fmt(dt: string | null) {
  return dt ? new Date(dt).toLocaleString('en-MY', { timeZone: 'Asia/Kuala_Lumpur', dateStyle: 'medium', timeStyle: 'short' }) : '—'
}

export default function BookingEventHistory({ events }: { events: BookingEventRow[] }) {
  if (!events || events.length === 0) return null

  return (
    <div className="rounded-xl border border-accent/30 bg-white p-5">
      <h3 className="mb-3 font-heading text-[12px] font-bold uppercase tracking-[0.16em] text-accent">Event History</h3>
      <div className="space-y-4 font-body text-[13.5px]">
        {events.map((e) => (
          <div key={e.id} className="relative pl-4 border-l-2 border-accent/20">
            <p className="mb-1 text-dark/50 text-[12px]">
              <span className="font-semibold text-dark/75">{fmt(e.createdAt)}</span> • {e.actorType}
            </p>
            <p className="font-medium text-dark/85">
              {e.eventType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </p>
            {e.newData?.reason && (
              <p className="text-dark/60 mt-1 italic">&quot;{e.newData.reason}&quot;</p>
            )}
            {e.newData?.refundStatus && (
              <p className="text-dark/60 mt-1">Refund status: {e.newData.refundStatus}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
