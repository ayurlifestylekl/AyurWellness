// Email delivery smoke test — works with any SMTP provider (Resend, Brevo, SES, …).
//
//   node scripts/test-email.mjs you@example.com
//
// Reads SMTP_HOST / SMTP_PORT / SMTP_SECURE / SMTP_USER / SMTP_PASS / EMAIL_FROM
// from the environment first, then fills any gaps from .env.local. Sends one
// plain test message and says, in words, what went wrong if it can't.
//
// For Resend: SMTP_HOST=smtp.resend.com  SMTP_PORT=465  SMTP_SECURE=true
//             SMTP_USER=resend           SMTP_PASS=<your API key>
//             EMAIL_FROM="Ayurvedic Wellness Centre <noreply@yourdomain>"
import { existsSync, readFileSync } from 'node:fs'
import nodemailer from 'nodemailer'

const env = {}
const file = new URL('../.env.local', import.meta.url)
if (existsSync(file)) {
  for (const line of readFileSync(file, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
    if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '')
  }
}
for (const k of ['SMTP_HOST', 'SMTP_PORT', 'SMTP_SECURE', 'SMTP_USER', 'SMTP_PASS', 'EMAIL_FROM']) {
  if (process.env[k]) env[k] = process.env[k] // real environment wins over the file
}

const to = process.argv[2]
const missing = ['SMTP_HOST', 'SMTP_USER', 'SMTP_PASS', 'EMAIL_FROM'].filter((k) => !env[k])
if (!to || missing.length) {
  if (!to) console.error('❌  Say where to send it:  node scripts/test-email.mjs you@example.com')
  if (missing.length) console.error(`❌  Not set: ${missing.join(', ')}`)
  process.exit(1)
}

const transport = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: Number(env.SMTP_PORT ?? 587),
  secure: env.SMTP_SECURE === 'true',
  auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
})

console.log(`Sending via ${env.SMTP_HOST}:${env.SMTP_PORT ?? 587} as "${env.SMTP_USER}"`)
console.log(`From: ${env.EMAIL_FROM}`)
console.log(`To:   ${to}\n`)

try {
  const info = await transport.sendMail({
    from: env.EMAIL_FROM,
    to,
    subject: 'Ayurvedic Wellness Centre — email test',
    text: 'This is a test email from the Ayurvedic Wellness Centre website. If you can read this, booking emails will be delivered.',
    html: '<p>This is a <strong>test email</strong> from the Ayurvedic Wellness Centre website.</p><p>If you can read this, booking emails will be delivered.</p>',
  })
  console.log('✅ Accepted by the mail server.')
  console.log('   messageId:', info.messageId)
  console.log('   accepted :', info.accepted.join(', ') || '(none)', '| rejected:', info.rejected.join(', ') || '(none)')
  console.log('\nNow check the inbox — and the spam folder. "Accepted" means the provider took it, not that it arrived.')
} catch (err) {
  console.error('❌ Send failed:', err.message, '\n')
  const m = String(err.message + ' ' + (err.responseCode ?? ''))
  if (/ENOTFOUND|EAI_AGAIN/.test(m)) console.error('→ The SMTP host name doesn’t resolve. Check SMTP_HOST (Resend: smtp.resend.com).')
  else if (/ECONNREFUSED|ETIMEDOUT|ECONNECTION/.test(m)) console.error('→ Couldn’t connect. Check SMTP_PORT; Resend uses 465 (with SMTP_SECURE=true) or 587.')
  else if (/535|EAUTH|Invalid login|authentication/i.test(m)) console.error('→ Login refused. For Resend, SMTP_USER must be exactly "resend" and SMTP_PASS the API key.')
  else if (/403|not verified|domain|from/i.test(m)) console.error('→ The sending domain isn’t verified yet (or EMAIL_FROM isn’t on it). Check the domain shows "Verified" in Resend.')
  else if (/wrong version number|SSL|TLS/i.test(m)) console.error('→ Port and SMTP_SECURE don’t match: port 465 needs SMTP_SECURE=true; port 587 needs it unset/false.')
  process.exit(1)
}
