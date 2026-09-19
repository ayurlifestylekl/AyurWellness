import type { SupabaseClient } from '@supabase/supabase-js'

export type ReviewStatus = 'pending' | 'approved' | 'rejected'

export interface ReviewSummary {
  averageRating: number
  count: number
}

export interface PublicReview {
  id: string
  rating: number
  title: string | null
  body: string
  customerName: string
  createdAt: string
}

export interface CustomerReview {
  id: string
  productId: string
  productName: string
  rating: number
  title: string | null
  body: string
  status: ReviewStatus
  rejectionReason: string | null
  createdAt: string
}

export interface AdminReviewListItem {
  id: string
  productId: string
  productName: string
  customerId: string
  customerName: string
  customerEmail: string
  rating: number
  title: string | null
  body: string
  status: ReviewStatus
  rejectionReason: string | null
  createdAt: string
}

export interface AdminReviewFilters {
  status?: ReviewStatus | 'all'
  productId?: string
  limit?: number
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SB = SupabaseClient<any>

export async function getProductReviewSummary(
  supabase: SB,
  productId: string,
): Promise<ReviewSummary> {
  const { data, error } = await supabase
    .from('reviews')
    .select('rating')
    .eq('product_id', productId)
    .eq('status', 'approved')
  if (error || !data || data.length === 0) return { averageRating: 0, count: 0 }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ratings = (data as any[]).map((r) => Number(r.rating))
  const sum = ratings.reduce((s, r) => s + r, 0)
  return { averageRating: sum / ratings.length, count: ratings.length }
}

export async function getApprovedReviewsForProduct(
  supabase: SB,
  productId: string,
  limit = 20,
): Promise<PublicReview[]> {
  const { data, error } = await supabase
    .from('reviews')
    .select('id, rating, title, body, created_at, customer:users!reviews_customer_id_fkey(full_name)')
    .eq('product_id', productId)
    .eq('status', 'approved')
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error || !data) return []
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data as any[]).map((r) => {
    const cust = Array.isArray(r.customer) ? r.customer[0] : r.customer
    return {
      id: r.id,
      rating: r.rating,
      title: r.title,
      body: r.body,
      customerName: cust?.full_name ?? 'Verified customer',
      createdAt: r.created_at,
    }
  })
}

export async function customerCanReviewProduct(
  supabase: SB,
  customerId: string,
  productId: string,
): Promise<{ canReview: boolean; orderId: string | null; reason?: string }> {
  // already reviewed?
  const { data: existing } = await supabase
    .from('reviews')
    .select('id')
    .eq('customer_id', customerId)
    .eq('product_id', productId)
    .maybeSingle()
  if (existing) {
    return { canReview: false, orderId: null, reason: 'You have already reviewed this product.' }
  }

  // has a paid order with this product?
  const { data: orderItems } = await supabase
    .from('order_items')
    .select('order_id, order:orders!inner(id, customer_id, payment_status)')
    .eq('product_id', productId)
  if (!orderItems || orderItems.length === 0) {
    return {
      canReview: false,
      orderId: null,
      reason: 'You can only review products you have purchased.',
    }
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const match = (orderItems as any[]).find((oi) => {
    const o = Array.isArray(oi.order) ? oi.order[0] : oi.order
    return o && o.customer_id === customerId && o.payment_status === 'paid'
  })
  if (!match) {
    return {
      canReview: false,
      orderId: null,
      reason: 'You can only review products from a paid order.',
    }
  }
  const orderRow = Array.isArray(match.order) ? match.order[0] : match.order
  return { canReview: true, orderId: orderRow?.id ?? null }
}

export async function listCustomerReviews(
  supabase: SB,
  customerId: string,
): Promise<CustomerReview[]> {
  const { data, error } = await supabase
    .from('reviews')
    .select(
      'id, product_id, rating, title, body, status, rejection_reason, created_at, product:products!reviews_product_id_fkey(name)',
    )
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false })
  if (error || !data) return []
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data as any[]).map((r) => {
    const p = Array.isArray(r.product) ? r.product[0] : r.product
    return {
      id: r.id,
      productId: r.product_id,
      productName: p?.name ?? 'Product',
      rating: r.rating,
      title: r.title,
      body: r.body,
      status: r.status,
      rejectionReason: r.rejection_reason,
      createdAt: r.created_at,
    }
  })
}

export async function listAdminReviews(
  supabase: SB,
  filters: AdminReviewFilters = {},
): Promise<{ items: AdminReviewListItem[]; total: number }> {
  let q = supabase
    .from('reviews')
    .select(
      'id, product_id, customer_id, rating, title, body, status, rejection_reason, created_at, product:products!reviews_product_id_fkey(name), customer:users!reviews_customer_id_fkey(full_name, email)',
      { count: 'exact' },
    )
    .order('created_at', { ascending: false })

  if (filters.status && filters.status !== 'all') q = q.eq('status', filters.status)
  if (filters.productId) q = q.eq('product_id', filters.productId)
  if (filters.limit) q = q.limit(filters.limit)

  const { data, count, error } = await q
  if (error || !data) return { items: [], total: 0 }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const items = (data as any[]).map((r) => {
    const p = Array.isArray(r.product) ? r.product[0] : r.product
    const c = Array.isArray(r.customer) ? r.customer[0] : r.customer
    return {
      id: r.id,
      productId: r.product_id,
      productName: p?.name ?? 'Product',
      customerId: r.customer_id,
      customerName: c?.full_name ?? '—',
      customerEmail: c?.email ?? '',
      rating: r.rating,
      title: r.title,
      body: r.body,
      status: r.status as ReviewStatus,
      rejectionReason: r.rejection_reason,
      createdAt: r.created_at,
    }
  })
  return { items, total: count ?? items.length }
}

export async function countPendingReviews(supabase: SB): Promise<number> {
  const { count } = await supabase
    .from('reviews')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'pending')
  return count ?? 0
}
