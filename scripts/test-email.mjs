// One-off SMTP smoke test. Reads SMTP_* from .env.local and sends a test email.
// Run: node scripts/test-email.mjs
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

const to = process.argv[2] || env.SMTP_USER
console.log(`Sending test email via ${env.SMTP_HOST} as ${env.SMTP_USER} → ${to} …`)

try {
  const info = await transport.sendMail({
    from: env.EMAIL_FROM,
    to,
    subject: 'Kerala Ayurvedic — SMTP test ✅',
    text: 'This is a test email. If you received this, your Brevo SMTP is working.',
    html: '<p>This is a <strong>test email</strong>. If you received this, your Brevo SMTP is working. 🌿</p>',
  })
  console.log('✅ Sent. messageId:', info.messageId)
  console.log('   accepted:', info.accepted, ' rejected:', info.rejected)
} catch (err) {
  console.error('❌ Send failed:', err.message)
  process.exit(1)
}
