/**
 * Whether customer and Brand Partner accounts can be used yet.
 *
 * Member sign-in needs an emailed 6-digit code, sign-up needs an emailed
 * confirmation, password reset needs an emailed link, and partner invites are
 * emailed. Those emails are sent by Supabase's own mailer, which the app can't
 * see into — so rather than guess from other settings, this is an explicit
 * switch: set MEMBER_ACCOUNTS_OPEN=true on the host once email delivery is set
 * up (Resend, and Supabase's custom SMTP). Until then the sign-in and sign-up
 * pages say "opening soon" instead of letting someone register and wait for an
 * email that never arrives.
 *
 * Staff are unaffected: they sign in with a password and no emailed code.
 * Outside production it's always open, so local development and the tests keep
 * working unchanged. Server-only — read it in a server component or action and
 * pass the result down.
 */
export function memberAccountsOpen(): boolean {
  if (process.env.NODE_ENV !== 'production') return true
  return process.env.MEMBER_ACCOUNTS_OPEN === 'true'
}

/** Returned by the email-sending auth actions while accounts aren't open. */
export const ACCOUNTS_CLOSED_MESSAGE =
  'Member accounts open soon. You can still book a free consultation as a guest, or WhatsApp us.'
