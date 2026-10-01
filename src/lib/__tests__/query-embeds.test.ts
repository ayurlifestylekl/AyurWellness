import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * These tables have MORE THAN ONE foreign key to `users` (e.g. the customer and
 * the admin who created/approved/assigned the row). Embedding `users(...)` from
 * them — or embedding them from `users` — without naming which key to follow
 * makes PostgREST reject the whole query ("more than one relationship was
 * found"). The calling code then logs the error and shows an EMPTY list, which
 * looks like "no data" rather than a failure — that's how the admin Customers
 * page and the dashboard's "Today's consultations" ended up always empty.
 *
 * Name the key: users!orders_customer_id_fkey(...) / orders!orders_customer_id_fkey(...)
 * If a migration adds a second user FK to another table, add it here.
 */
const AMBIGUOUS_WITH_USERS = [
  'agent_invites', 'appointments', 'marketplace_orders', 'orders',
  'reviews', 'support_tickets', 'wholesale_orders',
]

describe('guard: embeds between users and multi-link tables name the foreign key', () => {
  it('has no ambiguous users <-> table embeds', () => {
    const ROOT = join(process.cwd(), 'src')
    const files: string[] = []
    const walk = (dir: string) => {
      for (const name of readdirSync(dir)) {
        const p = join(dir, name)
        if (statSync(p).isDirectory()) { if (name !== '__tests__') walk(p) }
        else if (/\.(tsx?|jsx?)$/.test(name)) files.push(p)
      }
    }
    walk(ROOT)

    const offenders: string[] = []
    for (const f of files) {
      const s = readFileSync(f, 'utf8')
      for (const m of Array.from(s.matchAll(/\.from\('([a-z_]+)'\)\s*\.select\(\s*([`'"])([\s\S]*?)\2/g))) {
        const table = m[1], select = m[3]
        for (const e of Array.from(select.matchAll(/(?:[a-z_]+:)?([a-z_]+)(![a-z_]+)?\s*\(/g))) {
          if (e[2]) continue // key named — fine
          const target = e[1]
          const ambiguous =
            (AMBIGUOUS_WITH_USERS.includes(table) && target === 'users') ||
            (table === 'users' && AMBIGUOUS_WITH_USERS.includes(target))
          if (ambiguous) {
            offenders.push(`${f.replace(ROOT, 'src')}:${s.slice(0, m.index).split('\n').length} from('${table}') embeds ${e[0].trim()}`)
          }
        }
      }
    }
    expect(offenders).toEqual([])
  })
})
