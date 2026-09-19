import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockSendMail } = vi.hoisted(() => ({ mockSendMail: vi.fn(async () => {}) }))

vi.mock('server-only', () => ({}))
vi.mock('@/lib/email/client', () => ({
  sendMail: mockSendMail,
  EMAIL_FROM: 'test@example.com',
}))

const mockSingle = vi.fn()
vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    from: () => ({ select: () => ({ eq: () => ({ single: mockSingle }) }) }),
  }),
}))

import { sendEmail } from '../send'
import { notifyGuestManagementOtp } from '@/lib/booking/notify'

beforeEach(() => {
  mockSingle.mockReset()
  mockSendMail.mockReset()
  mockSendMail.mockResolvedValue(undefined)
})

describe('sendEmail opt-in respect', () => {
  it('sends transactional emails regardless of opt-in', async () => {
    const r = await sendEmail({ to: 'a@b.com', category: 'transactional', subject: 's', html: '', text: '' })
    expect(r.sent).toBe(true)
  })

  it('skips reminder emails when user opted out', async () => {
    mockSingle.mockResolvedValue({ data: { email_reminders_opt_in: false, marketing_opt_in: true } })
    const r = await sendEmail({ to: 'a@b.com', category: 'reminder', subject: 's', html: '', text: '', userId: 'u1' })
    expect(r).toEqual({ sent: false, reason: 'reminders_opt_out' })
  })

  it('skips marketing when user opted out', async () => {
    mockSingle.mockResolvedValue({ data: { email_reminders_opt_in: true, marketing_opt_in: false } })
    const r = await sendEmail({ to: 'a@b.com', category: 'marketing', subject: 's', html: '', text: '', userId: 'u1' })
    expect(r).toEqual({ sent: false, reason: 'marketing_opt_out' })
  })

  it('sends reminder when opted in', async () => {
    mockSingle.mockResolvedValue({ data: { email_reminders_opt_in: true, marketing_opt_in: false } })
    const r = await sendEmail({ to: 'a@b.com', category: 'reminder', subject: 's', html: '', text: '', userId: 'u1' })
    expect(r.sent).toBe(true)
  })

  it('redacts recipient and provider details when delivery fails', async () => {
    const errorLog = vi.spyOn(console, 'error').mockImplementation(() => {})
    mockSendMail.mockRejectedValueOnce(new Error('SMTP rejected private-recipient@example.com with provider-secret'))

    const result = await sendEmail({
      to: 'private-recipient@example.com',
      category: 'transactional',
      subject: 's',
      html: '',
      text: '',
    })

    expect(result).toEqual({ sent: false, reason: 'send_failed' })
    expect(errorLog).toHaveBeenCalledWith('[email/send] delivery failed')
    expect(JSON.stringify(errorLog.mock.calls)).not.toContain('private-recipient@example.com')
    expect(JSON.stringify(errorLog.mock.calls)).not.toContain('provider-secret')
    errorLog.mockRestore()
  })
})

describe('guest management OTP delivery result', () => {
  it('reports successful delivery to the reservation workflow', async () => {
    await expect(notifyGuestManagementOtp({ to: 'guest@example.com', code: '123456' })).resolves.toBe(true)
  })

  it('reports failed delivery without exposing recipient details', async () => {
    const errorLog = vi.spyOn(console, 'error').mockImplementation(() => {})
    mockSendMail.mockRejectedValueOnce(new Error('failed for guest@example.com'))

    await expect(notifyGuestManagementOtp({ to: 'guest@example.com', code: '123456' })).resolves.toBe(false)
    expect(JSON.stringify(errorLog.mock.calls)).not.toContain('guest@example.com')
    errorLog.mockRestore()
  })
})
