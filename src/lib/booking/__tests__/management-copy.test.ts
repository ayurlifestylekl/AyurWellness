import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const root = join(process.cwd(), 'src')
const source = (sub: string) => readFileSync(join(root, sub), 'utf8')

describe('Task 9: Management Copy and Queries', () => {
  it('includes Manage booking link in customer emails', () => {
    const statusPage = source('app/(public)/book/request/[id]/page.tsx')
    const active = [
      source('lib/booking/notify.ts'),
      source('lib/email/templates/appointmentConfirmation.ts'),
      statusPage,
      source('app/account/appointments/page.tsx'),
      source('app/account/messages/[ticketId]/page.tsx'),
      source('components/booking/PolicyDisclaimers.tsx'),
      source('lib/booking/policy.ts'),
    ].join('\n')

    expect(active).toContain('Manage booking')
    expect(active).toContain('Manage your booking')
    expect(active).not.toMatch(/WhatsApp.*reschedul|Cal\.com|Once approved|Some guests are still being approved|Cancellations within 12 hours|48 hours' notice required to cancel/i)
    expect(active).not.toMatch(/12 hours|12–24|48 hours.{0,40}notice required to cancel|message us on WhatsApp.{0,40}(?:reschedul|appointment time)/i)
    expect(active).not.toContain('whatsappRescheduleLink')
    expect(statusPage).not.toContain('Your booking request')
  })

  it('exposes pending/exception refunds in staff query', () => {
    const staffQuery = source('lib/staff/appointments.ts')
    expect(staffQuery).toContain(".in('status', ['pending', 'exception'])")
  })

  it('claims management_reminder_sent_at in the 72-73h window cron', () => {
    const reminders = source('app/api/cron/appointment-reminders/route.ts')
    expect(reminders).toContain('management_reminder_sent_at')
    expect(reminders).toContain('72 * 60 * 60 * 1000')
    expect(reminders).toContain('73 * 60 * 60 * 1000')
  })
})
