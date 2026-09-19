// One-off: send every real email template with sample data via the configured SMTP.
// Mirrors src/lib/email/templates/*.ts content directly (avoids importing .ts from a plain script).
// Run: node scripts/test-all-templates.mjs <to-address>
import { readFileSync } from 'node:fs'
import nodemailer from 'nodemailer'

const env = {}
for (const line of readFileSync(new URL('../.env.local', import.meta.url), 'utf8').split('\n')) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
  if (m) env[m[1]] = m[2]
}

const transport = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: Number(env.SMTP_PORT ?? 587),
  secure: env.SMTP_SECURE === 'true',
  auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
})

const to = process.argv[2]
if (!to) {
  console.error('Usage: node scripts/test-all-templates.mjs <to-address>')
  process.exit(1)
}

function welcomeEmail({ firstName }) {
  const greeting = `Hello ${firstName},`
  return {
    subject: 'Welcome to Kerala Ayurvedic Lifestyle',
    text: `${greeting}\n\nThank you for joining us. Your Vaidya will reach out within 24 hours to begin your wellness journey.\n\nVisit your dashboard: https://keralaayurvediclifestyle.com.my/account/dashboard\n\nWith warmth,\nVaidya Akhil & the Kerala Ayurvedic team`,
    html: `<div style="font-family:Georgia,serif;max-width:560px;margin:0 auto;padding:32px 24px;color:#163F33">
  <h1 style="font-family:'Helvetica Neue',sans-serif;font-size:22px;font-weight:700;margin:0 0 16px">Welcome to Kerala Ayurvedic Lifestyle</h1>
  <p style="line-height:1.65">${greeting}</p>
  <p style="line-height:1.65">Thank you for joining us. Your Vaidya will reach out within 24 hours to begin your wellness journey.</p>
  <p style="margin-top:24px"><a href="https://keralaayurvediclifestyle.com.my/account/dashboard" style="display:inline-block;background:#1E5B4B;color:#fff;padding:12px 22px;border-radius:999px;text-decoration:none;font-weight:700">Open your dashboard</a></p>
  <p style="margin-top:32px;color:#666">With warmth,<br/>Vaidya Akhil &amp; the Kerala Ayurvedic team</p>
</div>`,
  }
}

function appointmentConfirmationEmail({ firstName, treatmentName, whenLocal, doctorName, href }) {
  const greeting = `Hi ${firstName},`
  return {
    subject: `${treatmentName} confirmed — ${whenLocal}`,
    text: `${greeting}\n\nYour appointment is confirmed.\n\n  ${treatmentName}\n  ${whenLocal}\n  with ${doctorName}\n\nManage or reschedule: ${href}\n\nWith warmth,\nKerala Ayurvedic Lifestyle`,
    html: `<div style="font-family:Georgia,serif;max-width:560px;margin:0 auto;padding:32px 24px;color:#163F33">
  <h1 style="font-family:'Helvetica Neue',sans-serif;font-size:22px;font-weight:700;margin:0 0 16px">Appointment confirmed</h1>
  <p style="line-height:1.65">${greeting}</p>
  <p style="line-height:1.65">We're looking forward to seeing you.</p>
  <div style="margin:24px 0;padding:18px 20px;border:1px solid rgba(22, 63, 51,0.1);border-radius:18px;background:#F7F2E8">
    <p style="margin:0;font-weight:700;font-size:16px">${treatmentName}</p>
    <p style="margin:6px 0 0;color:#163F33">${whenLocal}</p>
    <p style="margin:6px 0 0;color:#666">with ${doctorName}</p>
  </div>
  <p><a href="${href}" style="display:inline-block;background:#1E5B4B;color:#fff;padding:12px 22px;border-radius:999px;text-decoration:none;font-weight:700">Manage booking</a></p>
  <p style="margin-top:32px;color:#666">With warmth,<br/>Kerala Ayurvedic Lifestyle</p>
</div>`,
  }
}

function orderConfirmationEmail({ firstName, orderShortId, totalRm, items, href }) {
  const greeting = `Hi ${firstName},`
  const itemsText = items.map((i) => `  • ${i.quantity}× ${i.name}`).join('\n')
  const itemsHtml = items.map((i) => `<li style="margin:4px 0">${i.quantity}× ${i.name}</li>`).join('')
  const total = `RM ${totalRm.toFixed(2)}`
  return {
    subject: `Order #${orderShortId} confirmed — ${total}`,
    text: `${greeting}\n\nWe've received your order #${orderShortId}.\n\n${itemsText}\n\nTotal: ${total}\n\nTrack it here: ${href}\n\nWith warmth,\nKerala Ayurvedic Lifestyle`,
    html: `<div style="font-family:Georgia,serif;max-width:560px;margin:0 auto;padding:32px 24px;color:#163F33">
  <h1 style="font-family:'Helvetica Neue',sans-serif;font-size:22px;font-weight:700;margin:0 0 16px">Order #${orderShortId} confirmed</h1>
  <p style="line-height:1.65">${greeting}</p>
  <p style="line-height:1.65">We've received your order. Here's what's on the way:</p>
  <ul style="line-height:1.7;padding-left:20px">${itemsHtml}</ul>
  <p style="margin-top:16px;font-weight:700;font-size:18px">Total: ${total}</p>
  <p style="margin-top:24px"><a href="${href}" style="display:inline-block;background:#1E5B4B;color:#fff;padding:12px 22px;border-radius:999px;text-decoration:none;font-weight:700">Track order</a></p>
  <p style="margin-top:32px;color:#666">With warmth,<br/>Kerala Ayurvedic Lifestyle</p>
</div>`,
  }
}

function ticketReplyEmail({ firstName, ticketSubject, preview, href }) {
  const greeting = `Hi ${firstName},`
  return {
    subject: `New reply: ${ticketSubject}`,
    text: `${greeting}\n\nVaidya has replied to your conversation: "${ticketSubject}"\n\n${preview}\n\nRead the full reply: ${href}\n\nWith warmth,\nKerala Ayurvedic Lifestyle`,
    html: `<div style="font-family:Georgia,serif;max-width:560px;margin:0 auto;padding:32px 24px;color:#163F33">
  <h1 style="font-family:'Helvetica Neue',sans-serif;font-size:22px;font-weight:700;margin:0 0 16px">New reply from Vaidya</h1>
  <p style="line-height:1.65">${greeting}</p>
  <p style="line-height:1.65">Vaidya has replied to your conversation: <em>"${ticketSubject}"</em></p>
  <blockquote style="margin:24px 0;padding:18px 20px;border-left:3px solid #D4AF37;background:#F7F2E8;color:#163F33;line-height:1.65;font-style:italic">
    ${preview}
  </blockquote>
  <p><a href="${href}" style="display:inline-block;background:#1E5B4B;color:#fff;padding:12px 22px;border-radius:999px;text-decoration:none;font-weight:700">Read full reply</a></p>
  <p style="margin-top:32px;color:#666">With warmth,<br/>Kerala Ayurvedic Lifestyle</p>
</div>`,
  }
}

function accountDeletionEmail({ firstName, cooloffEndsLocal }) {
  const greeting = `Hi ${firstName},`
  return {
    subject: 'Your Kerala Ayurvedic account is scheduled for deletion',
    text: `${greeting}\n\nWe've received your account deletion request. Your personal details have been anonymized immediately. Sign-in will be removed after the 30-day cool-off period ends on ${cooloffEndsLocal}.\n\nChanged your mind? Reply to this email within 30 days and we'll restore your account.\n\nWith care,\nKerala Ayurvedic Lifestyle`,
    html: `<div style="font-family:Georgia,serif;max-width:560px;margin:0 auto;padding:32px 24px;color:#163F33">
  <h1 style="font-family:'Helvetica Neue',sans-serif;font-size:22px;font-weight:700;margin:0 0 16px">Account deletion scheduled</h1>
  <p style="line-height:1.65">${greeting}</p>
  <p style="line-height:1.65">We've received your account deletion request. Your personal details have been anonymized immediately.</p>
  <p style="line-height:1.65">Sign-in will be removed after the 30-day cool-off period ends on <strong>${cooloffEndsLocal}</strong>.</p>
  <div style="margin:24px 0;padding:18px 20px;border:1px solid rgba(212, 175, 55,0.4);border-radius:18px;background:#F7F2E8">
    <p style="margin:0;line-height:1.65"><strong>Changed your mind?</strong> Reply to this email within 30 days and we'll restore your account.</p>
  </div>
  <p style="margin-top:32px;color:#666">With care,<br/>Kerala Ayurvedic Lifestyle</p>
</div>`,
  }
}

const emails = [
  welcomeEmail({ firstName: 'Sanjay' }),
  appointmentConfirmationEmail({
    firstName: 'Sanjay',
    treatmentName: 'Abhyangam Full Body Massage',
    whenLocal: 'Mon, 20 Jul 2026, 10:00 AM',
    doctorName: 'Dr. Akhil',
    href: 'https://keralaayurvediclifestyle.com.my/account/bookings',
  }),
  orderConfirmationEmail({
    firstName: 'Sanjay',
    orderShortId: 'A1B2C3',
    totalRm: 249.0,
    items: [{ name: 'Ayurvedic Herbal Oil', quantity: 2 }],
    href: 'https://keralaayurvediclifestyle.com.my/account/orders',
  }),
  ticketReplyEmail({
    firstName: 'Sanjay',
    ticketSubject: 'Question about my treatment plan',
    preview: 'Thank you for reaching out — based on your symptoms, I recommend...',
    href: 'https://keralaayurvediclifestyle.com.my/account/messages',
  }),
  accountDeletionEmail({ firstName: 'Sanjay', cooloffEndsLocal: '17 Aug 2026' }),
]

for (const email of emails) {
  console.log(`Sending: ${email.subject} → ${to}`)
  try {
    const info = await transport.sendMail({ from: env.EMAIL_FROM, to, ...email })
    console.log('  ✅ sent:', info.messageId)
  } catch (err) {
    console.error('  ❌ failed:', err.message)
  }
}
