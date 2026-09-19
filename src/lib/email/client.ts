import 'server-only'
import nodemailer, { type Transporter } from 'nodemailer'
import { CLINIC_DOMAIN, CLINIC_NAME } from '@/lib/clinic'

/**
 * Provider-agnostic SMTP mailer. Works with any SMTP provider (Brevo, Mailjet,
 * Amazon SES, Gmail, your domain host) — just set the SMTP_* env vars. Swapping
 * providers never requires a code change.
 *
 *   SMTP_HOST   e.g. smtp-relay.brevo.com
 *   SMTP_PORT   587 (STARTTLS, default) or 465 (SSL)
 *   SMTP_USER   provider login / API username
 *   SMTP_PASS   provider SMTP key / password
 *   SMTP_SECURE 'true' only for port 465
 *   EMAIL_FROM  "Ayurvedic Wellness Centre <noreply@ayurvedawellness.com.my>"
 */

export const EMAIL_FROM =
  process.env.EMAIL_FROM || `${CLINIC_NAME} <noreply@${CLINIC_DOMAIN}>`

let cached: Transporter | null = null

function transport(): Transporter {
  if (cached) return cached
  const host = process.env.SMTP_HOST
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS
  if (!host || !user || !pass) {
    throw new Error('SMTP is not configured (set SMTP_HOST / SMTP_USER / SMTP_PASS).')
  }
  cached = nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === 'true', // false = STARTTLS (587), true = SSL (465)
    auth: { user, pass },
  })
  return cached
}

/** Send one email through the configured SMTP provider. */
export async function sendMail(opts: { to: string; subject: string; html: string; text: string }): Promise<void> {
  await transport().sendMail({ from: EMAIL_FROM, ...opts })
}
