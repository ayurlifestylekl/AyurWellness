import type { Metadata } from 'next'
import StaffLoginSplit from '@/components/auth/StaffLoginSplit'
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
    <StaffLoginSplit
      eyebrow="Product Management"
      headline="Catalogue, stock and fulfilment."
      blurb="Manage products, orders, cancellations and refunds."
      image="/about/centre-lounge.jpg"
    >
      <ProductManagementLoginForm
        resetSuccess={searchParams.reset === 'success'}
        nextPath={searchParams.next}
      />
    </StaffLoginSplit>
  )
}
