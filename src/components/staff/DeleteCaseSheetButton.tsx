'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'
import { deleteCaseSheet } from '@/lib/staff/patient-file-actions'

export default function DeleteCaseSheetButton({ id, afterHref }: { id: string; afterHref: string }) {
  const router = useRouter()
  const [pending, start] = useTransition()
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (!confirm('Delete this case sheet? This can’t be undone.')) return
        start(async () => {
          const res = await deleteCaseSheet(id)
          if (!res.ok) { alert(res.error); return }
          router.push(afterHref)
          router.refresh()
        })
      }}
      className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-red-300 px-4 font-heading text-[10.5px] font-bold uppercase tracking-[0.12em] text-red-700 hover:bg-red-50 disabled:opacity-60"
    >
      <Trash2 className="h-4 w-4" /> {pending ? 'Deleting…' : 'Delete sheet'}
    </button>
  )
}
