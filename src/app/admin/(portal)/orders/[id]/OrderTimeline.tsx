import { Clock } from 'lucide-react'

interface Event {
  id: string
  event_type: string
  from_status: string | null
  to_status: string | null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload: any
  is_customer_visible: boolean
  created_at: string
}

const HUMAN: Record<string, string> = {
  status_change:            'Status changed',
  payment_status_change:    'Payment status changed',
  payment_received:         'Payment received',
  tracking_added:           'Tracking added',
  practitioner_note_added:  'Practitioner note',
  internal_note_added:      'Internal note',
  refund_recorded:          'Refund recorded',
  confirmation_resent:      'Confirmation resent',
  note_added:               'Note',
}

export default function OrderTimeline({ events }: { events: Event[] }) {
  if (events.length === 0) {
    return (
      <p className="px-5 py-6 text-center text-[12.5px] italic text-[#12372D]/55">
        No events yet.
      </p>
    )
  }

  const sorted = [...events].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  )

  return (
    <ul className="divide-y divide-[#006B3C]/6">
      {sorted.map((e) => (
        <li key={e.id} className="flex items-start gap-3 px-5 py-3">
          <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#006B3C]/40" strokeWidth={1.8} />
          <div className="min-w-0 flex-1">
            <p className="font-heading text-[12.5px] font-semibold text-[#006B3C]">
              {HUMAN[e.event_type] ?? e.event_type}
              {e.from_status && e.to_status ? (
                <span className="ml-2 font-normal text-[#12372D]/60">
                  {e.from_status} → {e.to_status}
                </span>
              ) : null}
            </p>
            <p className="mt-0.5 text-[11px] text-[#12372D]/55">
              {new Date(e.created_at).toLocaleString('en-MY')}
              {!e.is_customer_visible ? ' · staff-only' : ''}
            </p>
            {e.payload?.note ? (
              <p className="mt-1 text-[12px] text-[#12372D]/70">{String(e.payload.note)}</p>
            ) : null}
            {e.payload?.amount_rm ? (
              <p className="mt-1 text-[12px] text-[#12372D]/70">
                Amount: RM {Number(e.payload.amount_rm).toFixed(2)}
              </p>
            ) : null}
            {e.payload?.tracking_number ? (
              <p className="mt-1 text-[12px] text-[#12372D]/70">
                {e.payload.carrier} · {e.payload.tracking_number}
              </p>
            ) : null}
          </div>
        </li>
      ))}
    </ul>
  )
}
