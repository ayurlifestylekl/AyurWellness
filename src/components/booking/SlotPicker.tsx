'use client'

import { useEffect, useState, useTransition } from 'react'
import type { Gender } from '@/types/booking'
import { getAvailableSlots, getAvailableSlotsForMixedParty, getConsultationSlots, type SlotInfo } from '@/lib/booking/actions'
import { minBookableDate } from '@/lib/booking/slots'
import { fmtMY } from '@/lib/datetime'

interface SlotPickerProps {
  treatmentId: string | null
  gender: Gender | ''
  /**
   * Consultations are conducted by the Vaidya, not a therapist — availability
   * ignores the therapist roster and gender. Treatments use same-gender matching.
   */
  mode?: 'treatment' | 'consultation'
  /**
   * For group bookings — each guest's gender + chosen treatment. When present,
   * availability finds a start time where every guest can be matched to a free
   * same-gender therapist for their own treatment length.
   */
  members?: { gender: Gender | ''; treatmentId: string | null }[]
  /** Selected slot as a UTC ISO string ('' = none). */
  value: string
  onChange: (iso: string) => void
  label: string
  required?: boolean
}

export default function SlotPicker({ treatmentId, gender, mode = 'treatment', members, value, onChange, label, required }: SlotPickerProps) {
  const [date, setDate] = useState('')
  const [slots, setSlots] = useState<SlotInfo[]>([])
  const [loading, start] = useTransition()
  const minDate = minBookableDate()

  const isConsultation = mode === 'consultation'
  const isGroup = !!members
  // Every guest must have a gender AND a chosen treatment before we can look up times.
  const groupReady =
    isGroup &&
    members!.length > 0 &&
    members!.every((m) => (m.gender === 'male' || m.gender === 'female') && !!m.treatmentId)
  const ready = isConsultation ? true : isGroup ? groupReady : !!gender

  // Stable dependency for the members list so the effect only re-runs on real changes.
  const membersKey = members ? members.map((m) => `${m.gender}:${m.treatmentId ?? ''}`).join('|') : ''

  useEffect(() => {
    if (!date || !ready) {
      setSlots([])
      return
    }
    start(async () => {
      if (isConsultation) {
        setSlots(await getConsultationSlots(date))
      } else if (isGroup) {
        setSlots(
          await getAvailableSlotsForMixedParty(
            date,
            members!.map((m) => ({ gender: m.gender as Gender, treatmentId: m.treatmentId })),
          ),
        )
      } else {
        setSlots(await getAvailableSlots(date, treatmentId, gender as Gender))
      }
    })
    // `membersKey` is the stable serialisation of `members` — depending on the
    // array itself would refetch on every keystroke-driven re-render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, gender, treatmentId, membersKey, isGroup, ready, isConsultation])

  return (
    <div className="rounded-xl border border-accent/25 bg-white/60 p-4">
      <span className="mb-2 block font-heading text-[10px] font-semibold uppercase tracking-[0.14em] text-dark/55">
        {label} {required && <span className="text-accent">*</span>}
      </span>

      {!ready ? (
        <p className="font-body text-[12.5px] italic text-dark/40">
          {isGroup ? 'Add every guest — name, gender and therapy — to see available times.' : 'Select a gender above to see available times.'}
        </p>
      ) : (
        <>
          <input
            type="date"
            min={minDate}
            value={date}
            onChange={(e) => {
              setDate(e.target.value)
              onChange('') // clear any prior selection when the date changes
            }}
            className={inputCls}
          />

          {date && (
            <div className="mt-3">
              {loading ? (
                <p className="font-body text-[12.5px] italic text-dark/55">Loading available times…</p>
              ) : slots.length === 0 ? (
                <p className="font-body text-[12.5px] italic text-dark/55">No times available for this day — please try another date.</p>
              ) : (
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {slots.map((s) => {
                    const selected = value === s.iso
                    return (
                      <button
                        key={s.time}
                        type="button"
                        disabled={!s.available}
                        onClick={() => onChange(s.iso)}
                        className={[
                          'rounded-lg border px-2 py-2 font-heading text-[12px] font-bold tracking-tight transition-colors',
                          selected
                            ? 'border-accent bg-accent text-white'
                            : s.available
                              ? 'border-accent/30 bg-white text-primary hover:border-accent hover:bg-cream'
                              : 'cursor-not-allowed border-dark/10 bg-dark/5 text-dark/30 line-through',
                        ].join(' ')}
                      >
                        {fmtMY(s.iso, { hour: '2-digit', minute: '2-digit' })}
                      </button>
                    )
                  })}
                </div>
              )}
              <p className="mt-3 font-body text-[11.5px] italic text-dark/50">
                For earlier appointments you may contact us directly —{' '}
                <a
                  href="https://wa.me/601163393436"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="not-italic font-semibold text-accent underline decoration-accent/40 underline-offset-2 hover:text-accent/80"
                >
                  WhatsApp us
                </a>
                .
              </p>
            </div>
          )}

          {value && (
            <p className="mt-2 font-body text-[12.5px] text-dark/70">
              Selected: <strong className="text-primary">{fmtMY(value, { dateStyle: 'medium', timeStyle: 'short' })}</strong>
            </p>
          )}
        </>
      )}
    </div>
  )
}

const inputCls =
  'w-full rounded-lg border border-accent/30 bg-white px-3 py-2.5 font-body text-[14px] text-dark focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/40'
