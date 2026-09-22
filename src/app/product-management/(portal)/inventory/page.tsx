import { redirect } from 'next/navigation'

export const metadata = { title: 'Inventory · Product Management' }

export default function ProductManagementInventoryPage() {
  redirect('/admin/inventory')
}
