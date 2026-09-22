import { redirect } from 'next/navigation'

export const metadata = { title: 'Fulfillment · Product Management' }

export default function ProductManagementFulfillmentPage() {
  redirect('/product-management/orders')
}
