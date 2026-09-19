'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function RangePicker({ start, end }: { start: string; end: string }) {
  const router = useRouter()
  const [s, setS] = useState(start.slice(0, 10))
  const [e, setE] = useState(end.slice(0, 10))

  function apply() {
    router.push(`/admin/finance?start=${s}&end=${e}`)
  }

  function presetThisMonth() {
    const now = new Date()
    const start = new Date(now.getFullYear(), now.getMonth(), 1)
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    setS(start.toISOString().slice(0, 10))
    setE(end.toISOString().slice(0, 10))
    router.push(
      `/admin/finance?start=${start.toISOString().slice(0, 10)}&end=${end.toISOString().slice(0, 10)}`,
    )
  }

  function presetLastMonth() {
    const now = new Date()
    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const end = new Date(now.getFullYear(), now.getMonth(), 0)
    setS(start.toISOString().slice(0, 10))
    setE(end.toISOString().slice(0, 10))
    router.push(
      `/admin/finance?start=${start.toISOString().slice(0, 10)}&end=${end.toISOString().slice(0, 10)}`,
    )
  }

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-[#006B3C]/10 bg-white p-2.5">
      <input
        type="date"
        value={s}
        onChange={(ev) => setS(ev.target.value)}
        className="rounded-lg border border-[#006B3C]/15 px-2 py-1 text-[12px]"
      />
      <span className="text-[12px] text-[#12372D]/55">→</span>
      <input
        type="date"
        value={e}
        onChange={(ev) => setE(ev.target.value)}
        className="rounded-lg border border-[#006B3C]/15 px-2 py-1 text-[12px]"
      />
      <button
        type="button"
        onClick={apply}
        className="rounded-lg bg-[#006B3C] px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-[#006B3C]"
      >
        Apply
      </button>
      <span className="ml-1 flex gap-1">
        <button
          type="button"
          onClick={presetThisMonth}
          className="rounded-md border border-[#006B3C]/15 bg-white px-2 py-1 text-[11px] hover:bg-[#EDF4E7]/60"
        >
          This month
        </button>
        <button
          type="button"
          onClick={presetLastMonth}
          className="rounded-md border border-[#006B3C]/15 bg-white px-2 py-1 text-[11px] hover:bg-[#EDF4E7]/60"
        >
          Last month
        </button>
      </span>
    </div>
  )
}
