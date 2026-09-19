import { CLINIC_DOMAIN, CLINIC_NAME } from '@/lib/clinic'

export function welcomeEmail(input: { firstName: string }) {
  const greeting = `Hello ${input.firstName},`
  const dashboardUrl = `https://${CLINIC_DOMAIN}/account/dashboard`
  return {
    subject: `Welcome to ${CLINIC_NAME}`,
    text: `${greeting}\n\nThank you for joining us. Your Vaidya will reach out within 24 hours to begin your wellness journey.\n\nVisit your dashboard: ${dashboardUrl}\n\nWith warmth,\n${CLINIC_NAME} team`,
    html: `<div style="font-family:Georgia,serif;max-width:560px;margin:0 auto;padding:32px 24px;color:#12372D">
  <h1 style="font-family:'Helvetica Neue',sans-serif;font-size:22px;font-weight:700;margin:0 0 16px">Welcome to ${CLINIC_NAME}</h1>
  <p style="line-height:1.65">${greeting}</p>
  <p style="line-height:1.65">Thank you for joining us. Your Vaidya will reach out within 24 hours to begin your wellness journey.</p>
  <p style="margin-top:24px"><a href="${dashboardUrl}" style="display:inline-block;background:#149447;color:#fff;padding:12px 22px;border-radius:999px;text-decoration:none;font-weight:700">Open your dashboard</a></p>
  <p style="margin-top:32px;color:#666">With warmth,<br/>${CLINIC_NAME} team</p>
</div>`,
  }
}
