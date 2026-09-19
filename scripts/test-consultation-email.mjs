// One-off: send the REAL, current consultation confirmation email using the
// live template from src/lib/booking/confirmation-copy.ts, so the preview is
// accurate rather than a stale hardcoded sample.
// Run: node scripts/test-consultation-email.mjs <to-address>
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
  console.error('Usage: node scripts/test-consultation-email.mjs <to-address>')
  process.exit(1)
}

// Exact template from confirmation-copy.ts, kind === 'consultation'
const customerHeading = 'Your free consultation is confirmed'
const template = 'Hi {name}, your consultation appointment <strong>to discuss</strong> {treatment} is confirmed for {when}. Please arrive 10 minutes early for your session with our Vaidya.'

// Sample values, mirroring how notify.ts substitutes them
const name = 'Sanjay'
const treatment = 'Herbal Bandage — Affected Joints'
const when = 'Wednesday, 22 July 2026 at 10:30 am'
const line = template.replaceAll('{name}', name).replaceAll('{treatment}', treatment).replaceAll('{when}', when)

const secondLine = 'You can manage or reschedule your booking online up to 24 hours beforehand.'
const SITE = 'https://keralaayurvediclifestyle.com.my'
const statusUrl = `${SITE}/book/request/sample-id?t=sample-token`

// Exact shell() from notify.ts
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

const { html, text } = shell(customerHeading, [line, secondLine], { label: 'Manage booking', url: statusUrl })

console.log(`Sending real consultation confirmation email → ${to}`)
try {
  const info = await transport.sendMail({
    from: env.EMAIL_FROM,
    to,
    subject: `${customerHeading} — Kerala Ayurvedic Lifestyle`,
    html,
    text,
  })
  console.log('  ✅ sent:', info.messageId)
} catch (err) {
  console.error('  ❌ failed:', err.message)
}
