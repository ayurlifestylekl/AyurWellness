import { redirect } from 'next/navigation'

export const metadata = { title: 'Catalog · Product Management' }

export default function ProductManagementCatalogPage() {
  redirect('/admin/products')
}
