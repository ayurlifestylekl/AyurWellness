import StaffSignInForm from '@/components/auth/StaffSignInForm'

export default function AdminLoginForm({ resetSuccess, nextPath }: { resetSuccess?: boolean; nextPath?: string }) {
  return (
    <StaffSignInForm
      portal="Command Center"
      title="Welcome back."
      subtitle="Restricted to authorised personnel. Use the staff account issued to you by the centre."
      emailLabel="Staff email"
      emailPlaceholder="you@ayurvedicwellness.com.my"
      ctaLabel="Enter Command Center"
      defaultRedirect="/admin/dashboard"
      crossLink={{ prompt: 'Not staff?', label: 'Member sign-in', href: '/auth/login' }}
      resetSuccess={resetSuccess}
      nextPath={nextPath}
    />
  )
}
