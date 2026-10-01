import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { format } from 'date-fns'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { asMYWallClock, mytTodayRange } from '../datetime'
import { defaultMonthRange } from '../admin/finance/queries'

// Vercel's servers run in UTC; staff and customers are in Malaysia (UTC+8).
// Every test runs under several machine zones to prove the output doesn't move.
const ZONES = ['UTC', 'Asia/Kuala_Lumpur', 'America/New_York']
const savedTZ = process.env.TZ
afterEach(() => {
  process.env.TZ = savedTZ
  vi.useRealTimers()
})

describe('asMYWallClock (for date-fns format)', () => {
  it('prints Malaysia time whatever zone the machine is in', () => {
    for (const tz of ZONES) {
      process.env.TZ = tz
      // 02:30 UTC = 10:30 in Malaysia
      expect(format(asMYWallClock('2026-11-11T02:30:00Z'), 'd MMM yyyy, h:mm a')).toBe('11 Nov 2026, 10:30 AM')
    }
  })

  it('crosses midnight correctly (late UTC evening is the next Malaysian day)', () => {
    for (const tz of ZONES) {
      process.env.TZ = tz
      expect(format(asMYWallClock('2026-11-11T20:15:00Z'), 'dd MMM yyyy HH:mm')).toBe('12 Nov 2026 04:15')
    }
  })
})

describe("Malaysia's 'today' and 'this month'", () => {
  it("mytTodayRange is the Malaysian day, even at 4am Malaysia (still yesterday in UTC)", () => {
    for (const tz of ZONES) {
      process.env.TZ = tz
      // 2026-10-01T20:00Z = 2 Oct 04:00 in Malaysia
      const r = mytTodayRange(new Date('2026-10-01T20:00:00Z'))
      expect(r.startISO).toBe('2026-10-01T16:00:00.000Z') // 2 Oct 00:00 MYT
      expect(r.endISO).toBe('2026-10-02T16:00:00.000Z')
    }
  })

  it('finance defaultMonthRange is the Malaysian month at a month boundary', () => {
    for (const tz of ZONES) {
      process.env.TZ = tz
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2026-09-30T20:00:00Z')) // 1 Oct 04:00 in Malaysia
      const { start, end } = defaultMonthRange()
      const myDay = (d: Date) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kuala_Lumpur' }).format(d)
      expect(myDay(start)).toBe('2026-10-01')
      expect(myDay(end)).toBe('2026-10-31')
      vi.useRealTimers()
    }
  })
})

describe('guard: no date is formatted without Malaysia time', () => {
  const ROOT = join(process.cwd(), 'src')
  const files: string[] = []
  const walk = (dir: string) => {
    for (const name of readdirSync(dir)) {
      const p = join(dir, name)
      if (statSync(p).isDirectory()) { if (name !== '__tests__' && name !== 'node_modules') walk(p) }
      else if (/\.(tsx?|jsx?)$/.test(name)) files.push(p)
    }
  }
  walk(ROOT)

  // The argument list of a call starting at `from` (balanced parentheses).
  const argsOf = (s: string, from: number) => {
    let depth = 1, j = from
    while (j < s.length && depth) { if (s[j] === '(') depth++; else if (s[j] === ')') depth--; j++ }
    return s.slice(from, j - 1)
  }

  it('every toLocale*String and Intl.DateTimeFormat names a time zone', () => {
    const offenders: string[] = []
    for (const f of files) {
      const s = readFileSync(f, 'utf8')
      for (const m of Array.from(s.matchAll(/toLocale(?:Date|Time)?String\(|Intl\.DateTimeFormat\(/g))) {
        if (!/timeZone/.test(argsOf(s, m.index! + m[0].length))) {
          offenders.push(`${f.replace(ROOT, 'src')}:${s.slice(0, m.index).split('\n').length}`)
        }
      }
    }
    // On Vercel (UTC) these would show times 8 hours off. Add timeZone: 'Asia/Kuala_Lumpur'.
    expect(offenders).toEqual([])
  })

  it("date-fns format() is only ever given asMYWallClock(...) dates", () => {
    const offenders: string[] = []
    for (const f of files) {
      const s = readFileSync(f, 'utf8')
      if (!/from 'date-fns'/.test(s) || !/\bformat\b/.test(s)) continue
      for (const m of Array.from(s.matchAll(/(?<![.\w])format\(/g))) {
        const args = argsOf(s, m.index! + m[0].length).trim()
        if (!args.startsWith('asMYWallClock(')) offenders.push(`${f.replace(ROOT, 'src')}:${s.slice(0, m.index).split('\n').length}`)
      }
    }
    expect(offenders).toEqual([])
  })
})
