import 'server-only'
import { createClient } from '@supabase/supabase-js'
import { getProviderByName } from './index'
import {
  ProviderRefundError,
  isSafeProviderRefundId,
  isSafeRefundIdempotencyKey,
  providerIdMatchesSensitiveValue,
  type PaymentProvider,
  type ProviderRefundResult,
  type RefundArgs,
  type RefundCallbackResult,
  type RefundStatusResult,
} from './provider'

export const REFUND_ATTEMPT_LEASE_MS = 5 * 60 * 1000

export type RefundLifecycleStatus = 'claimed' | 'pending' | 'confirmed' | 'failed' | 'exception' | 'requested' | 'rejected'

export interface RefundRecord {
  id: string
  provider: 'hitpay' | 'stub'
  providerRefundId: string | null
  status: RefundLifecycleStatus
  amountRm: number
  idempotencyKey: string
  bankCode: string | null
  bankAccountLast4: string | null
  failureReason?: string | null
  requestedAt?: string | null
  confirmedAt?: string | null
  customerReason?: string | null
  staffReason?: string | null
  bankAccountNumber?: string | null
  bankAccountHolderName?: string | null
}

export interface RefundTransition {
  providerRefundId?: string
  status?: RefundLifecycleStatus
  bankCode?: string | null
  bankAccountLast4?: string | null
  failureReason?: string | null
  requestedAt?: string | null
  confirmedAt?: string | null
}

export interface RefundStore {
  findById(id: string): Promise<RefundRecord | null>
  findByProviderRefundId(providerRefundId: string): Promise<RefundRecord | null>
  findByIdempotencyKey(idempotencyKey: string): Promise<RefundRecord | null>
  claimAttempt(
    id: string,
    expected: { status: 'claimed' | 'pending'; requestedAt: string | null },
    requestedAt: string,
  ): Promise<boolean>
  completeAttempt(id: string, requestedAt: string, patch: RefundTransition): Promise<boolean>
  applyCallback(
    id: string,
    expectedProviderRefundId: string | null,
    patch: RefundTransition,
  ): Promise<boolean>
  /** Ids of rows still awaiting a provider outcome, oldest first — feeds the reconciliation sweep/cron. */
  listPending(limit: number): Promise<string[]>
}

export interface RefundDependencies {
  store: RefundStore
  providerForName(name: string): PaymentProvider | null
  now?: () => number
}

export interface RequestProviderRefundArgs extends RefundArgs {
  refundId: string
}

/**
 * How a store resolves which payment provider a refund row belongs to.
 * `booking_refunds` carries its own `provider` column; `product_refund_requests`
 * has none — it's resolved by joining back to `product_orders.payment_provider`.
 */
export type RefundProviderResolution =
  | { kind: 'column' }
  | { kind: 'join'; table: string; column: string }

export interface RefundStoreConfig {
  table: 'booking_refunds' | 'product_refund_requests'
  provider: RefundProviderResolution
  /** `booking_refunds` has no reason/bank-detail columns — only select/patch them when the table has them. */
  extendedFields: boolean
}

function createSupabaseRefundStore(config: RefundStoreConfig): RefundStore {
  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  )

  const joinSelect = config.provider.kind === 'join'
    ? `, ${config.provider.table}(${config.provider.column})`
    : ''
  const extendedColumns = config.extendedFields
    ? ', customer_reason, staff_reason, bank_account_number, bank_account_holder_name'
    : ''
  const columns = `id, ${config.provider.kind === 'column' ? 'provider, ' : ''}provider_refund_id, status, amount_rm, idempotency_key, bank_code, bank_account_last4, failure_reason, requested_at, confirmed_at${extendedColumns}${joinSelect}`

  function resolveProvider(row: Record<string, unknown>): RefundRecord['provider'] {
    if (config.provider.kind === 'column') return row.provider as RefundRecord['provider']
    const related = row[config.provider.table]
    const relatedRow = Array.isArray(related) ? related[0] : related
    return (relatedRow as Record<string, unknown> | null | undefined)?.[config.provider.column] as RefundRecord['provider']
  }

  function record(row: Record<string, unknown> | null): RefundRecord | null {
    if (!row) return null
    const bankCode = typeof row.bank_code === 'string' && /^(?=.*[A-Za-z])[A-Za-z0-9_-]{2,20}$/.test(row.bank_code)
      ? row.bank_code
      : null
    const bankAccountLast4 = typeof row.bank_account_last4 === 'string' && /^\d{4}$/.test(row.bank_account_last4)
      ? row.bank_account_last4
      : null
    const failureReason = typeof row.failure_reason === 'string'
      ? ['Provider refund request failed.', 'Provider reported a refund exception.'].includes(row.failure_reason)
        ? row.failure_reason
        : 'Refund requires review.'
      : null
    return {
      id: String(row.id),
      provider: resolveProvider(row),
      providerRefundId: typeof row.provider_refund_id === 'string' ? row.provider_refund_id : null,
      status: row.status as RefundLifecycleStatus,
      amountRm: Number(row.amount_rm),
      idempotencyKey: String(row.idempotency_key),
      bankCode,
      bankAccountLast4,
      failureReason,
      requestedAt: typeof row.requested_at === 'string' ? row.requested_at : null,
      confirmedAt: typeof row.confirmed_at === 'string' ? row.confirmed_at : null,
      customerReason: typeof row.customer_reason === 'string' ? row.customer_reason : null,
      staffReason: typeof row.staff_reason === 'string' ? row.staff_reason : null,
      bankAccountNumber: typeof row.bank_account_number === 'string' ? row.bank_account_number : null,
      bankAccountHolderName: typeof row.bank_account_holder_name === 'string' ? row.bank_account_holder_name : null,
    }
  }

  function updateValues(patch: RefundTransition) {
    return {
      ...(patch.providerRefundId !== undefined ? { provider_refund_id: patch.providerRefundId } : {}),
      ...(patch.status !== undefined ? { status: patch.status } : {}),
      ...(patch.bankCode !== undefined ? { bank_code: patch.bankCode } : {}),
      ...(patch.bankAccountLast4 !== undefined ? { bank_account_last4: patch.bankAccountLast4 } : {}),
      ...(patch.failureReason !== undefined ? { failure_reason: patch.failureReason } : {}),
      ...(patch.requestedAt !== undefined ? { requested_at: patch.requestedAt } : {}),
      ...(patch.confirmedAt !== undefined ? { confirmed_at: patch.confirmedAt } : {}),
    }
  }

  return {
    async findById(id) {
      const { data, error } = await sb.from(config.table).select(columns).eq('id', id).maybeSingle()
      if (error) throw new Error('Refund record lookup failed.')
      return record(data as Record<string, unknown> | null)
    },
    async findByProviderRefundId(providerRefundId) {
      const { data, error } = await sb
        .from(config.table)
        .select(columns)
        .eq('provider_refund_id', providerRefundId)
        .maybeSingle()
      if (error) throw new Error('Refund record lookup failed.')
      return record(data as Record<string, unknown> | null)
    },
    async findByIdempotencyKey(idempotencyKey) {
      const { data, error } = await sb
        .from(config.table)
        .select(columns)
        .eq('idempotency_key', idempotencyKey)
        .maybeSingle()
      if (error) throw new Error('Refund record lookup failed.')
      return record(data as Record<string, unknown> | null)
    },
    async claimAttempt(id, expected, requestedAt) {
      let query = sb
        .from(config.table)
        .update({ status: 'pending', requested_at: requestedAt }, { count: 'exact' })
        .eq('id', id)
        .eq('status', expected.status)
        .is('provider_refund_id', null)
      query = expected.requestedAt === null
        ? query.is('requested_at', null)
        : query.eq('requested_at', expected.requestedAt)
      const { count, error } = await query
      if (error) throw new Error('Refund attempt claim failed.')
      return count === 1
    },
    async completeAttempt(id, requestedAt, patch) {
      const { count, error } = await sb
        .from(config.table)
        .update(updateValues(patch), { count: 'exact' })
        .eq('id', id)
        .eq('status', 'pending')
        .is('provider_refund_id', null)
        .eq('requested_at', requestedAt)
      if (error) throw new Error('Refund attempt update failed.')
      return count === 1
    },
    async applyCallback(id, expectedProviderRefundId, patch) {
      let query = sb
        .from(config.table)
        .update(updateValues(patch), { count: 'exact' })
        .eq('id', id)
        .eq('status', 'pending')
      query = expectedProviderRefundId === null
        ? query.is('provider_refund_id', null)
        : query.eq('provider_refund_id', expectedProviderRefundId)
      const { count, error } = await query
      if (error) throw new Error('Refund callback update failed.')
      return count === 1
    },
    async listPending(limit) {
      const { data, error } = await sb
        .from(config.table)
        .select('id')
        .eq('status', 'pending')
        .not('provider_refund_id', 'is', null)
        .order('requested_at', { ascending: true })
        .limit(limit)
      if (error) throw new Error('Refund pending lookup failed.')
      return (data ?? []).map((row) => String((row as { id: unknown }).id))
    },
  }
}

export function bookingRefundDependencies(): RefundDependencies {
  return {
    store: createSupabaseRefundStore({ table: 'booking_refunds', provider: { kind: 'column' }, extendedFields: false }),
    providerForName: getProviderByName,
    now: Date.now,
  }
}

export function productRefundDependencies(): RefundDependencies {
  return {
    store: createSupabaseRefundStore({
      table: 'product_refund_requests',
      provider: { kind: 'join', table: 'product_orders', column: 'payment_provider' },
      extendedFields: true,
    }),
    providerForName: getProviderByName,
    now: Date.now,
  }
}

function safeResult(
  provider: RefundRecord['provider'],
  result: ProviderRefundResult,
  rawAccountNumber?: string,
  rawAccountHolderName?: string,
): ProviderRefundResult {
  if (
    !isSafeProviderRefundId(provider, result.providerRefundId)
    || providerIdMatchesSensitiveValue(
      result.providerRefundId,
      rawAccountNumber,
      rawAccountHolderName,
    )
    || !['pending', 'confirmed'].includes(result.status)
  ) {
    throw new ProviderRefundError('ambiguous')
  }
  const bankCode = result.bankCode && /^(?=.*[A-Za-z])[A-Za-z0-9_-]{2,20}$/.test(result.bankCode)
    ? result.bankCode
    : undefined
  const bankAccountLast4 = result.bankAccountLast4 && /^\d{4}$/.test(result.bankAccountLast4)
    ? result.bankAccountLast4
    : undefined
  return {
    providerRefundId: result.providerRefundId,
    status: result.status,
    ...(bankCode ? { bankCode } : {}),
    ...(bankAccountLast4 ? { bankAccountLast4 } : {}),
  }
}

function resultFromRecord(row: RefundRecord): ProviderRefundResult | null {
  if (
    !isSafeProviderRefundId(row.provider, row.providerRefundId)
    || !['pending', 'confirmed'].includes(row.status)
  ) return null
  return {
    providerRefundId: row.providerRefundId,
    status: row.status as ProviderRefundResult['status'],
    ...(row.bankCode && /^(?=.*[A-Za-z])[A-Za-z0-9_-]{2,20}$/.test(row.bankCode)
      ? { bankCode: row.bankCode }
      : {}),
    ...(row.bankAccountLast4 && /^\d{4}$/.test(row.bankAccountLast4)
      ? { bankAccountLast4: row.bankAccountLast4 }
      : {}),
  }
}

export async function requestProviderRefund(
  args: RequestProviderRefundArgs,
  dependencies: RefundDependencies = bookingRefundDependencies(),
): Promise<ProviderRefundResult> {
  const existing = await dependencies.store.findById(args.refundId)
  if (!existing) throw new ProviderRefundError('definitive')
  const existingResult = resultFromRecord(existing)
  if (existingResult) return existingResult
  const nowMs = dependencies.now?.() ?? Date.now()
  const priorRequestedAt = existing.requestedAt ?? null
  const pendingWithoutId = existing.status === 'pending' && existing.providerRefundId === null
  const priorRequestedMs = priorRequestedAt === null ? null : Date.parse(priorRequestedAt)
  const leaseExpired = priorRequestedAt === null
    || !Number.isFinite(priorRequestedMs)
    || nowMs - (priorRequestedMs as number) >= REFUND_ATTEMPT_LEASE_MS
  if (existing.status !== 'claimed' && !(pendingWithoutId && leaseExpired)) {
    throw new ProviderRefundError(pendingWithoutId ? 'ambiguous' : 'definitive')
  }

  const provider = dependencies.providerForName(existing.provider)
  if (!provider) throw new ProviderRefundError('definitive')
  const requestedAt = new Date(nowMs).toISOString()
  const claimed = await dependencies.store.claimAttempt(existing.id, {
    status: existing.status as 'claimed' | 'pending',
    requestedAt: priorRequestedAt,
  }, requestedAt)
  if (!claimed) {
    const raced = await dependencies.store.findById(existing.id)
    const racedResult = raced ? resultFromRecord(raced) : null
    if (racedResult) return racedResult
    throw new ProviderRefundError('ambiguous')
  }

  let result: ProviderRefundResult
  try {
    result = safeResult(existing.provider, await provider.createRefund({
      billId: args.billId,
      amountRm: existing.amountRm,
      idempotencyKey: existing.idempotencyKey,
      customerEmail: args.customerEmail,
      bank: args.bank,
    }), args.bank?.accountNumber, args.bank?.accountHolderName)
  } catch (error) {
    const providerError = error instanceof ProviderRefundError
      ? error
      : new ProviderRefundError('ambiguous')
    if (providerError.category === 'definitive') {
      await dependencies.store.completeAttempt(existing.id, requestedAt, {
        status: 'exception',
        failureReason: 'Provider refund request failed.',
      }).catch(() => false)
    }
    const raced = await dependencies.store.findById(existing.id).catch(() => null)
    const racedResult = raced ? resultFromRecord(raced) : null
    if (racedResult) return racedResult
    throw providerError
  }

  let persisted: boolean
  try {
    persisted = await dependencies.store.completeAttempt(existing.id, requestedAt, {
      providerRefundId: result.providerRefundId,
      status: result.status,
      bankCode: result.bankCode ?? null,
      bankAccountLast4: result.bankAccountLast4 ?? null,
      failureReason: null,
      confirmedAt: result.status === 'confirmed' ? requestedAt : null,
    })
  } catch {
    throw new ProviderRefundError('ambiguous')
  }
  if (persisted) return result

  const raced = await dependencies.store.findById(existing.id)
  const racedResult = raced ? resultFromRecord(raced) : null
  if (racedResult) return racedResult
  throw new ProviderRefundError('ambiguous')
}

async function applyStatus(
  row: RefundRecord,
  status: RefundStatusResult['status'],
  dependencies: RefundDependencies,
): Promise<RefundRecord> {
  if (row.status !== 'pending' || status === 'pending') return row
  const now = new Date(dependencies.now?.() ?? Date.now()).toISOString()
  await dependencies.store.applyCallback(row.id, row.providerRefundId, {
    status,
    failureReason: status === 'exception' ? 'Provider reported a refund exception.' : null,
    confirmedAt: status === 'confirmed' ? now : null,
  })
  return (await dependencies.store.findById(row.id)) ?? row
}

export async function reconcileRefund(
  id: string,
  dependencies: RefundDependencies = bookingRefundDependencies(),
): Promise<RefundRecord | null> {
  const row = await dependencies.store.findById(id)
  if (!row || row.status !== 'pending' || !row.providerRefundId) return row
  const provider = dependencies.providerForName(row.provider)
  if (!provider) return row
  const status = await provider.fetchRefundStatus(row.providerRefundId)
  if (!status) return row
  return applyStatus(row, status.status, dependencies)
}

export interface ReconcileTally {
  checked: number
  confirmed: number
  exception: number
  stillPending: number
}

/**
 * Polls every refund still sitting at 'pending' through the provider's
 * authoritative status lookup and resolves it. Billplz doesn't always
 * confirm a refund instantly (bank-transfer refunds settle over hours) —
 * without this, an 'approve refund' click that comes back 'pending' would
 * never automatically complete.
 */
export async function reconcilePendingRefunds(
  dependencies: RefundDependencies,
  limit = 100,
): Promise<ReconcileTally> {
  const ids = await dependencies.store.listPending(limit)
  const tally: ReconcileTally = { checked: ids.length, confirmed: 0, exception: 0, stillPending: 0 }
  for (const id of ids) {
    const row = await reconcileRefund(id, dependencies).catch((e) => {
      console.error('[refund] reconcile failed for', id, e)
      return null
    })
    if (row?.status === 'confirmed') tally.confirmed++
    else if (row?.status === 'exception') tally.exception++
    else if (row?.status === 'pending') tally.stillPending++
  }
  return tally
}

/** Best-effort reconciliation for page loads: never throws, never blocks the page. */
export async function reconcilePendingRefundsSafe(
  dependencies: RefundDependencies,
  limit = 100,
): Promise<ReconcileTally | null> {
  try {
    return await reconcilePendingRefunds(dependencies, limit)
  } catch (e) {
    console.error('[refund] reconcilePendingRefunds sweep failed:', e)
    return null
  }
}

export async function applyRefundCallback(
  callback: RefundCallbackResult,
  dependencies: RefundDependencies = bookingRefundDependencies(),
): Promise<RefundRecord | null> {
  const safeForAnyProvider = callback.provider
    ? isSafeProviderRefundId(callback.provider, callback.providerRefundId)
    : isSafeProviderRefundId('hitpay', callback.providerRefundId)
      || isSafeProviderRefundId('stub', callback.providerRefundId)
  if (!safeForAnyProvider) return null

  let row = await dependencies.store.findByProviderRefundId(callback.providerRefundId)
  if (!row && isSafeRefundIdempotencyKey(callback.idempotencyKey)) {
    row = await dependencies.store.findByIdempotencyKey(callback.idempotencyKey)
  }
  if (row && callback.provider && row.provider !== callback.provider) return row
  if (!row || !isSafeProviderRefundId(row.provider, callback.providerRefundId)) return row
  if (row.status !== 'pending') return row
  if (row.providerRefundId && row.providerRefundId !== callback.providerRefundId) return row

  const now = new Date(dependencies.now?.() ?? Date.now()).toISOString()
  await dependencies.store.applyCallback(row.id, row.providerRefundId, {
    providerRefundId: callback.providerRefundId,
    status: callback.status,
    failureReason: callback.status === 'exception' ? 'Provider reported a refund exception.' : null,
    confirmedAt: callback.status === 'confirmed' ? now : null,
  })
  return (await dependencies.store.findById(row.id)) ?? row
}
