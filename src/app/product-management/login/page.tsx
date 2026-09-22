import type { Metadata } from 'next'
import AuthCanvas from '@/components/auth/AuthCanvas'
import ProductManagementLoginForm from './ProductManagementLoginForm'

export const metadata: Metadata = {
  title: 'Product Management · Sign In',
  description: 'Ayurvedic Wellness Centre Product Management — catalog, inventory & fulfillment access only.',
  alternates: { canonical: '/product-management/login' },
  robots: { index: false, follow: false },
}

export default function ProductManagementLoginPage({
  searchParams,
}: {
  searchParams: { reset?: string; next?: string }
}) {
  return (
    <AuthCanvas>
      <ProductManagementLoginForm
        resetSuccess={searchParams.reset === 'success'}
        nextPath={searchParams.next}
      />
    </AuthCanvas>
  )
}
