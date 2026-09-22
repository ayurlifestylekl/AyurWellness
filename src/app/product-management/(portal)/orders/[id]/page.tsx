import { notFound } from 'next/navigation'
import { getProductOrderById } from '@/lib/product-management/queries'
import OrderDetailClient from './OrderDetailClient'

export const metadata = { title: 'Order Detail · Product Management' }
export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function ProductOrderDetailPage({ params }: PageProps) {
  const { id } = await params
  const order = await getProductOrderById(id)
  if (!order) notFound()
  return <OrderDetailClient order={order} />
}
