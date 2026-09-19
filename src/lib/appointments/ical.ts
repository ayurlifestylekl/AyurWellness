/**
 * Minimal RFC 5545 (.ics) serializer for a single appointment. Inlined
 * because the format is small and one library-free file is cheaper than
 * pulling another dependency.
 */

import type { Database } from '@/lib/database.types'

type AppointmentRow = Database['public']['Tables']['appointments']['Row']

const CLINIC_ADDRESS = 'Ayurvedic Wellness Centre, Brickfields, Kuala Lumpur'

/** Format a Date as `YYYYMMDDTHHMMSSZ` (UTC). */
function toIcsDate(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return (
    `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}` +
    `T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`
  )
}

/** Escape a line of TEXT per RFC 5545 (backslashes, commas, semicolons, newlines). */
function escapeText(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/\n/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;')
}

interface IcsCustomer {
  fullName: string
  email: string
}

export function toIcsString(appointment: AppointmentRow, customer: IcsCustomer): string {
  const start = new Date(appointment.appointment_date_time)
  const end = new Date(start.getTime() + appointment.duration_mins * 60 * 1000)

  const isVirtual = appointment.mode === 'virtual'
  const location = isVirtual
    ? appointment.meeting_link ?? 'Virtual consultation'
    : CLINIC_ADDRESS

  const summary = `${appointment.treatment_name} with ${appointment.doctor_name}`
  const description = [
    `Treatment: ${appointment.treatment_name}`,
    `Practitioner: ${appointment.doctor_name}`,
    `Duration: ${appointment.duration_mins} minutes`,
    isVirtual && appointment.meeting_link ? `Join: ${appointment.meeting_link}` : null,
    !isVirtual ? `Location: ${CLINIC_ADDRESS}` : null,
    appointment.advance_payment_rm
      ? `Advance paid: RM ${Number(appointment.advance_payment_rm).toFixed(2)}`
      : null,
  ]
    .filter(Boolean)
    .join('\n')

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Ayurvedic Wellness Centre//Appointments//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${appointment.id}@ayurvedawellness.com.my`,
    `DTSTAMP:${toIcsDate(new Date())}`,
    `DTSTART:${toIcsDate(start)}`,
    `DTEND:${toIcsDate(end)}`,
    `SUMMARY:${escapeText(summary)}`,
    `DESCRIPTION:${escapeText(description)}`,
    `LOCATION:${escapeText(location)}`,
    isVirtual && appointment.meeting_link ? `URL:${appointment.meeting_link}` : null,
    `ORGANIZER;CN=Ayurvedic Wellness Centre:mailto:hello@ayurvedawellness.com.my`,
    `ATTENDEE;CN=${escapeText(customer.fullName)};RSVP=TRUE:mailto:${customer.email || 'unknown@ayurvedawellness.com.my'}`,
    'STATUS:CONFIRMED',
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    `DESCRIPTION:Reminder: ${escapeText(appointment.treatment_name)} in 1 hour`,
    'TRIGGER:-PT1H',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].filter((l): l is string => l !== null)

  return lines.join('\r\n') + '\r\n'
}
