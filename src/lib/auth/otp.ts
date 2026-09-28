/**
 * Customers must confirm sign-in with an emailed code. Production always
 * requires it; NEXT_PUBLIC_REQUIRE_OTP=false only relaxes local development.
 */
export function customerOtpRequired(): boolean {
  return process.env.NODE_ENV === 'production' || process.env.NEXT_PUBLIC_REQUIRE_OTP !== 'false'
}
