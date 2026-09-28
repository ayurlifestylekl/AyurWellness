import StaffSignInForm from '@/components/auth/StaffSignInForm'
import { CLINIC_WHATSAPP } from '@/lib/clinic'

export default function AgentLoginForm({ resetSuccess, nextPath }: { resetSuccess?: boolean; nextPath?: string }) {
  const apply = `https://wa.me/${CLINIC_WHATSAPP}?text=${encodeURIComponent("Hi, I'd like to apply to the Brand Partner program.")}`
  return (
    <StaffSignInForm
      portal="Partner Hub"
      title="Welcome back."
      subtitle="Track your referrals, commissions and payouts as an Ayurvedic Wellness Centre Brand Partner."
      emailLabel="Partner email"
      emailPlaceholder="creator@example.com"
      ctaLabel="Enter Partner Hub"
      defaultRedirect="/agent/dashboard"
      crossLink={{ prompt: 'Not a partner?', label: 'Member sign-in', href: '/auth/login' }}
      extra={
        <p className="mt-2 text-center font-body text-[13px] text-[#12372D]/55">
          Want to join?{' '}
          <a href={apply} target="_blank" rel="noopener noreferrer" className="font-semibold text-[#006B3C] underline-offset-4 hover:text-[#B58A3B] hover:underline">
            Apply on WhatsApp
          </a>
        </p>
      }
      resetSuccess={resetSuccess}
      nextPath={nextPath}
    />
  )
}
