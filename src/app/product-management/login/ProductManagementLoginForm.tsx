import StaffSignInForm from '@/components/auth/StaffSignInForm'

export default function ProductManagementLoginForm({ resetSuccess, nextPath }: { resetSuccess?: boolean; nextPath?: string }) {
  return (
    <StaffSignInForm
      portal="Product Management"
      title="Welcome back."
      subtitle="Catalog, inventory and order fulfilment — dedicated access, separate from the admin portal."
      emailLabel="Product Management email"
      emailPlaceholder="product@ayurvedawellness.com.my"
      ctaLabel="Enter Product Management"
      defaultRedirect="/product-management"
      crossLink={{ prompt: 'Not product management?', label: 'Admin sign-in', href: '/admin/login' }}
      resetSuccess={resetSuccess}
      nextPath={nextPath}
    />
  )
}
