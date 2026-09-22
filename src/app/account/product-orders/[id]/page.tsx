import { notFound, redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth/getCurrentUser'
import { getProductOrderById } from '@/lib/product-management/queries'
import AccountOrderDetailClient from './OrderDetailClient'

export const metadata = { title: 'Order Detail · Member Portal' }
export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function AccountProductOrderDetailPage({ params }: PageProps) {
  const me = await getCurrentUser()
  if (!me) redirect('/auth/login?next=/account/product-orders')

  const { id } = await params
  const order = await getProductOrderById(id)
  if (!order) notFound()

  const isOwner = order.customer_id === me.authId || order.email === me.email
  if (!isOwner) notFound()

  return <AccountOrderDetailClient order={order} />
}
