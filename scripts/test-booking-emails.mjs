// One-off: preview the customer-facing booking lifecycle emails (request received,
// approved, confirmed, cancelled, managed cancellation, managed reschedule, payment
// reminder) with sample data. Mirrors the `shell()` HTML from src/lib/booking/notify.ts
// but sends ONLY the customer email — no Telegram alert, no staff email — so this is
// safe to run without touching the live ops channel.
// Run: node scripts/test-booking-emails.mjs <to-address>
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
  console.error('Usage: node scripts/test-booking-emails.mjs <to-address>')
  process.exit(1)
}

const SITE = 'https://keralaayurvediclifestyle.com.my'
const WHEN_OLD = 'Sat, 18 Jul 2026, 10:00 AM'
const WHEN_NEW = 'Mon, 20 Jul 2026, 2:00 PM'

function shell(heading, lines, cta) {
  const para = lines.map((l) => `<p style="margin:0 0 12px;color:#3a3a3a;font-size:15px;line-height:1.6">${l}</p>`).join('')
  const button = cta
    ? `<a href="${cta.url}" style="display:inline-block;margin-top:8px;background:#1e5b4b;color:#fff;text-decoration:none;padding:12px 22px;border-radius:10px;font-weight:600;font-size:14px">${cta.label}</a>`
    : ''
  const html = `<div style="max-width:520px;margin:0 auto;font-family:Georgia,serif">
    <h1 style="color:#5b0f1c;font-size:22px;margin:0 0 16px">${heading}</h1>${para}${button}
    <p style="margin:20px 0 0;color:#b08a3e;font-size:12.5px">Don&rsquo;t see this in your inbox next time? Please check your Spam / Junk folder — some mail providers file us there.</p>
    <p style="margin:8px 0 0;color:#9a9a9a;font-size:12px">Kerala Ayurvedic Lifestyle · Brickfields, Kuala Lumpur</p>
  </div>`
  const text = `${heading}\n\n${lines.join('\n')}\n${cta ? `\n${cta.label}: ${cta.url}\n` : ''}\nDon't see this in your inbox next time? Please check your Spam / Junk folder — some mail providers file us there.\nKerala Ayurvedic Lifestyle · Brickfields, Kuala Lumpur`
  return { html, text }
}

const emails = [
  {
    subject: 'Your booking request — Kerala Ayurvedic Lifestyle',
    ...shell('We’ve received your request', [
      `Hi Sanjay, thank you for your treatment request for <strong>Abhyangam Full Body Massage</strong>.`,
      `Preferred time: <strong>${WHEN_OLD}</strong>.`,
      'Our team will review it shortly and confirm your slot.',
    ]),
  },
  {
    subject: 'Approved — pay to confirm your appointment',
    ...shell(
      'Approved — please complete payment',
      [
        `Hi Sanjay, your treatment for <strong>Abhyangam Full Body Massage</strong> on <strong>${WHEN_OLD}</strong> has been approved.`,
        'Please pay <strong>RM249</strong> to secure your appointment.',
      ],
      { label: 'Pay RM249', url: `${SITE}/pay/sample` },
    ),
  },
  {
    subject: 'Your appointment is confirmed — Kerala Ayurvedic Lifestyle',
    ...shell(
      'Your appointment is confirmed',
      [
        `Hi Sanjay, your appointment for <strong>Abhyangam Full Body Massage</strong> is confirmed for <strong>${WHEN_OLD}</strong>.`,
        'You can manage or reschedule your booking online. Late cancellations are non-refundable.',
      ],
      { label: 'Manage booking', url: `${SITE}/status/sample` },
    ),
  },
  {
    subject: 'Reminder: complete your payment — Kerala Ayurvedic Lifestyle',
    ...shell(
      'Reminder — complete your payment',
      [
        `Hi Sanjay, your appointment for <strong>Abhyangam Full Body Massage</strong> is approved but not yet paid.`,
        `Please pay by <strong>${WHEN_OLD}</strong> to keep your slot — after that it will be released for others.`,
      ],
      { label: 'Pay now', url: `${SITE}/pay/sample` },
    ),
  },
  {
    subject: 'Appointment cancelled — Kerala Ayurvedic Lifestyle',
    ...shell(
      'Your appointment was cancelled',
      [
        `Hi Sanjay, your appointment for <strong>Abhyangam Full Body Massage</strong> has been cancelled.`,
        'As this was cancelled in good time, any payment is eligible for a refund — our team will be in touch.',
      ],
      { label: 'Book again', url: `${SITE}/book` },
    ),
  },
  {
    subject: 'Appointment cancelled — Kerala Ayurvedic Lifestyle',
    ...shell(
      'Your appointment has been cancelled',
      [
        `Hi Sanjay, your appointment for <strong>Abhyangam Full Body Massage</strong> has been cancelled.`,
        'Your refund has been confirmed and will be returned through the original payment method.',
      ],
      { label: 'Book again', url: `${SITE}/book` },
    ),
  },
  {
    subject: 'Appointment rescheduled — Kerala Ayurvedic Lifestyle',
    ...shell(
      'Your appointment has been rescheduled',
      [
        `Hi Sanjay, your appointment for <strong>Abhyangam Full Body Massage</strong> has been rescheduled.`,
        `New time: <strong>${WHEN_NEW}</strong> (previously ${WHEN_OLD}).`,
        'Your booking remains confirmed and paid — a therapist will be assigned for your new time before your visit.',
      ],
      { label: 'Manage booking', url: `${SITE}/status/sample` },
    ),
  },
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
