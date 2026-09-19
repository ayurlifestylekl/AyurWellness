import { CLINIC_NAME } from '@/lib/clinic'

export function accountDeletionEmail(input: { firstName: string; cooloffEndsLocal: string }) {
  const greeting = `Hi ${input.firstName},`
  return {
    subject: `Your ${CLINIC_NAME} account is scheduled for deletion`,
    text: `${greeting}\n\nWe've received your account deletion request. Your personal details have been anonymized immediately. Sign-in will be removed after the 30-day cool-off period ends on ${input.cooloffEndsLocal}.\n\nChanged your mind? Reply to this email within 30 days and we'll restore your account.\n\nWith care,\n${CLINIC_NAME}`,
    html: `<div style="font-family:Georgia,serif;max-width:560px;margin:0 auto;padding:32px 24px;color:#12372D">
  <h1 style="font-family:'Helvetica Neue',sans-serif;font-size:22px;font-weight:700;margin:0 0 16px">Account deletion scheduled</h1>
  <p style="line-height:1.65">${greeting}</p>
  <p style="line-height:1.65">We've received your account deletion request. Your personal details have been anonymized immediately.</p>
  <p style="line-height:1.65">Sign-in will be removed after the 30-day cool-off period ends on <strong>${input.cooloffEndsLocal}</strong>.</p>
  <div style="margin:24px 0;padding:18px 20px;border:1px solid rgba(181, 138, 59,0.4);border-radius:18px;background:#EDF4E7">
    <p style="margin:0;line-height:1.65"><strong>Changed your mind?</strong> Reply to this email within 30 days and we'll restore your account.</p>
  </div>
  <p style="margin-top:32px;color:#666">With care,<br/>${CLINIC_NAME}</p>
</div>`,
  }
}
