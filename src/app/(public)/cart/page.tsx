import type { Metadata } from 'next'
import CartContents from './CartContents'

export const metadata: Metadata = {
  title: 'Your Cart',
  description:
    'Review the herbal formulas, oils, and treatment items saved to your bag at Ayurvedic Wellness Centre.',
  alternates: { canonical: '/cart' },
  robots: { index: false, follow: false },
}

export default function CartPage() {
  return <CartContents />
}
