export interface GroupManagementRow {
  id: string
  group_management_active?: boolean | null
}

export interface GroupBillMember {
  payable_amount_rm?: number | null
  group_management_active?: boolean | null
}

/** Sum amount and count from active group members only (excludes detached rows). */
export function groupBillTotals(members: GroupBillMember[]): { count: number; amountRm: number } {
  const active = members.filter((m) => m.group_management_active !== false)
  return {
    count: active.length,
    amountRm: active.reduce((sum, m) => sum + Number(m.payable_amount_rm ?? 0), 0),
  }
}

export interface GroupRescheduleChange {
  appointmentId: string
  newStart: string
  detachFromGroup: boolean
}

export function activeManagementMembers<T extends GroupManagementRow>(rows: T[]): T[] {
  return rows.filter((row) => row.group_management_active !== false)
}

export function buildGroupRescheduleChanges(
  rows: GroupManagementRow[],
  selections: Record<string, string>,
  options: { wholeGroup?: boolean } = {},
): GroupRescheduleChange[] {
  const selectedIds = Object.keys(selections)
  const candidates = options.wholeGroup ? activeManagementMembers(rows) : rows
  const candidateIds = new Set(candidates.map((row) => row.id))

  if (options.wholeGroup) {
    if (candidates.length === 0
      || selectedIds.length !== candidates.length
      || selectedIds.some((id) => !candidateIds.has(id))) {
      throw new Error('Choose a new time for every active group member.')
    }
  } else if (selectedIds.length !== 1 || !candidateIds.has(selectedIds[0])) {
    throw new Error('Choose exactly one group member to reschedule.')
  }

  return candidates
    .filter((row) => options.wholeGroup || row.id === selectedIds[0])
    .map((row) => ({
      appointmentId: row.id,
      newStart: selections[row.id],
      detachFromGroup: options.wholeGroup ? false : row.group_management_active !== false,
    }))
}
