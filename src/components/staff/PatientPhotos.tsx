'use client'

import { useMemo, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Camera, ImagePlus, Trash2, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { deletePhoto, savePhoto, startPhotoUpload, updatePhoto } from '@/lib/staff/patient-file-actions'
import { PHOTO_MAX_BYTES, PHOTO_MAX_SIDE, PHOTO_TAGS, PHOTO_TAG_LABEL, type PhotoTag } from '@/lib/staff/patient-photo-rules'

export interface PhotoItem {
  id: string
  takenOn: string
  tag: PhotoTag | null
  remark: string | null
  url: string | null
}

const fmtDay = (ymd: string) =>
  new Date(`${ymd}T12:00:00+08:00`).toLocaleDateString('en-MY', { timeZone: 'Asia/Kuala_Lumpur', weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })

const input = 'w-full rounded-lg border border-accent/30 bg-white px-3 py-2 font-body text-[13.5px] text-dark focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/40'

/** Shrinks large camera photos (often 4–8 MB) to a sharp ~1800px JPEG before upload. */
async function prepare(file: File): Promise<Blob> {
  if (file.size <= 1.5 * 1024 * 1024 && file.type === 'image/jpeg') return file
  try {
    const bmp = await createImageBitmap(file)
    const scale = Math.min(1, PHOTO_MAX_SIDE / Math.max(bmp.width, bmp.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(bmp.width * scale)
    canvas.height = Math.round(bmp.height * scale)
    canvas.getContext('2d')!.drawImage(bmp, 0, 0, canvas.width, canvas.height)
    const blob = await new Promise<Blob | null>((ok) => canvas.toBlob(ok, 'image/jpeg', 0.86))
    return blob ?? file
  } catch {
    return file // unreadable here (e.g. HEIC on some browsers): let the server's type check decide
  }
}

/** Date-wise photo gallery with upload, preview and before/after remarks. */
export default function PatientPhotos({ patientId, photos, today, canDelete }: { patientId: string; photos: PhotoItem[]; today: string; canDelete: boolean }) {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [takenOn, setTakenOn] = useState(today)
  const [tag, setTag] = useState<PhotoTag | ''>('')
  const [remark, setRemark] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, start] = useTransition()
  const [open, setOpen] = useState<PhotoItem | null>(null)

  const byDay = useMemo(() => {
    const m = new Map<string, PhotoItem[]>()
    for (const p of photos) m.set(p.takenOn, [...(m.get(p.takenOn) ?? []), p])
    return Array.from(m.entries())
  }, [photos])

  const choose = (f: File | null) => {
    setError(null)
    if (preview) URL.revokeObjectURL(preview)
    setFile(f)
    setPreview(f ? URL.createObjectURL(f) : null)
  }

  const reset = () => { choose(null); setTag(''); setRemark(''); setTakenOn(today); if (fileRef.current) fileRef.current.value = '' }

  const upload = () => {
    if (!file) return
    setError(null)
    start(async () => {
      const blob = await prepare(file)
      if (blob.size > PHOTO_MAX_BYTES) { setError('That photo is too large (5 MB max).'); return }
      const contentType = blob.type || file.type
      const ticket = await startPhotoUpload({ patientId, contentType, size: blob.size })
      if (!ticket.ok) { setError(ticket.error); return }
      const { error: upErr } = await createClient().storage.from('patient-photos').uploadToSignedUrl(ticket.path, ticket.token, blob, { contentType })
      if (upErr) { setError('Upload failed. Check the connection and try again.'); return }
      const saved = await savePhoto({ patientId, path: ticket.path, takenOn, tag: tag || null, remark: remark || null })
      if (!saved.ok) { setError(saved.error); return }
      reset()
      router.refresh()
    })
  }

  return (
    <section className="rounded-2xl border border-accent/20 bg-white p-4">
      <h2 className="font-heading text-[15px] font-bold text-primary">Photos</h2>

      <div className="mt-3 rounded-xl border border-dashed border-accent/40 bg-cream/40 p-3">
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          capture="environment"
          className="hidden"
          onChange={(e) => choose(e.target.files?.[0] ?? null)}
        />
        {!file ? (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex w-full items-center justify-center gap-2 rounded-lg py-3 font-heading text-[11px] font-bold uppercase tracking-[0.12em] text-accent hover:bg-cream"
          >
            <Camera className="h-4 w-4" /> Take or upload a photo
          </button>
        ) : (
          <div className="grid gap-3 sm:grid-cols-[120px_minmax(0,1fr)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {preview && <img src={preview} alt="Selected photo" className="h-28 w-28 rounded-lg object-cover" />}
            <div className="grid gap-2 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1 block font-heading text-[10px] font-semibold uppercase tracking-[0.12em] text-dark/55">Date</span>
                <input type="date" value={takenOn} max={today} onChange={(e) => setTakenOn(e.target.value)} className={input} />
              </label>
              <label className="block">
                <span className="mb-1 block font-heading text-[10px] font-semibold uppercase tracking-[0.12em] text-dark/55">Tag</span>
                <select value={tag} onChange={(e) => setTag(e.target.value as PhotoTag | '')} className={input}>
                  <option value="">None</option>
                  {PHOTO_TAGS.map((t) => <option key={t} value={t}>{PHOTO_TAG_LABEL[t]}</option>)}
                </select>
              </label>
              <label className="block sm:col-span-2">
                <span className="mb-1 block font-heading text-[10px] font-semibold uppercase tracking-[0.12em] text-dark/55">Remark (optional)</span>
                <input value={remark} onChange={(e) => setRemark(e.target.value)} maxLength={500} placeholder="e.g. Left knee, before first Kizhi" className={input} />
              </label>
              <div className="flex gap-2 sm:col-span-2">
                <button type="button" onClick={upload} disabled={pending} className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 font-heading text-[10.5px] font-bold uppercase tracking-[0.12em] text-white hover:bg-accent/90 disabled:opacity-60">
                  <ImagePlus className="h-4 w-4" /> {pending ? 'Uploading…' : 'Save photo'}
                </button>
                <button type="button" onClick={reset} disabled={pending} className="rounded-lg border border-accent/30 px-4 py-2 font-heading text-[10.5px] font-bold uppercase tracking-[0.12em] text-dark/60 hover:text-primary">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
        {error && <p className="mt-2 rounded-lg border border-red-300 bg-red-50 px-3 py-1.5 font-body text-[12.5px] text-red-700">{error}</p>}
      </div>

      {byDay.length === 0 ? (
        <p className="mt-4 font-body text-[13px] italic text-dark/45">No photos yet.</p>
      ) : (
        <div className="mt-4 space-y-4">
          {byDay.map(([day, items]) => (
            <div key={day}>
              <p className="mb-1.5 font-heading text-[10.5px] font-bold uppercase tracking-[0.12em] text-dark/55">{fmtDay(day)}</p>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {items.map((p) => (
                  <button key={p.id} type="button" onClick={() => setOpen(p)} className="group relative aspect-square overflow-hidden rounded-lg border border-accent/20 bg-cream">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {p.url && <img src={p.url} alt={p.remark ?? `Photo ${fmtDay(p.takenOn)}`} className="h-full w-full object-cover transition group-hover:scale-105" loading="lazy" />}
                    {p.tag && (
                      <span className="absolute left-1 top-1 rounded-full bg-primary/85 px-2 py-0.5 font-heading text-[9px] font-bold uppercase tracking-wide text-white">
                        {PHOTO_TAG_LABEL[p.tag]}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {open && <PhotoLightbox photo={open} today={today} canDelete={canDelete} onClose={() => setOpen(null)} />}
    </section>
  )
}

function PhotoLightbox({ photo, today, canDelete, onClose }: { photo: PhotoItem; today: string; canDelete: boolean; onClose: () => void }) {
  const router = useRouter()
  const [takenOn, setTakenOn] = useState(photo.takenOn)
  const [tag, setTag] = useState<PhotoTag | ''>(photo.tag ?? '')
  const [remark, setRemark] = useState(photo.remark ?? '')
  const [error, setError] = useState<string | null>(null)
  const [pending, start] = useTransition()
  const changed = takenOn !== photo.takenOn || (tag || null) !== photo.tag || (remark.trim() || null) !== photo.remark

  const save = () => start(async () => {
    const res = await updatePhoto({ id: photo.id, takenOn, tag: tag || null, remark: remark || null })
    if (!res.ok) { setError(res.error); return }
    onClose()
    router.refresh()
  })
  const remove = () => {
    if (!confirm('Delete this photo? This can’t be undone.')) return
    start(async () => {
      const res = await deletePhoto(photo.id)
      if (!res.ok) { setError(res.error); return }
      onClose()
      router.refresh()
    })
  }

  return (
    <div role="dialog" aria-label="Photo" className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3" onClick={onClose}>
      <div className="flex max-h-full w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-accent/15 px-4 py-2">
          <span className="font-heading text-[12px] font-bold text-primary">{fmtDay(photo.takenOn)}</span>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-lg p-1.5 text-dark/50 hover:text-primary"><X className="h-5 w-5" /></button>
        </div>
        <div className="min-h-0 flex-1 overflow-auto bg-neutral-900">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {photo.url && <img src={photo.url} alt={photo.remark ?? 'Patient photo'} className="mx-auto max-h-[60vh] object-contain" />}
        </div>
        <div className="grid gap-2 p-4 sm:grid-cols-[150px_150px_minmax(0,1fr)]">
          <input type="date" value={takenOn} max={today} onChange={(e) => setTakenOn(e.target.value)} aria-label="Date" className={input} />
          <select value={tag} onChange={(e) => setTag(e.target.value as PhotoTag | '')} aria-label="Tag" className={input}>
            <option value="">No tag</option>
            {PHOTO_TAGS.map((t) => <option key={t} value={t}>{PHOTO_TAG_LABEL[t]}</option>)}
          </select>
          <input value={remark} onChange={(e) => setRemark(e.target.value)} maxLength={500} placeholder="Remark" aria-label="Remark" className={input} />
          <div className="flex flex-wrap gap-2 sm:col-span-3">
            <button type="button" onClick={save} disabled={pending || !changed} className="rounded-lg bg-accent px-4 py-2 font-heading text-[10.5px] font-bold uppercase tracking-[0.12em] text-white hover:bg-accent/90 disabled:opacity-50">
              {pending ? 'Saving…' : 'Save changes'}
            </button>
            {canDelete && (
              <button type="button" onClick={remove} disabled={pending} className="ml-auto inline-flex items-center gap-1.5 rounded-lg border border-red-300 px-4 py-2 font-heading text-[10.5px] font-bold uppercase tracking-[0.12em] text-red-700 hover:bg-red-50 disabled:opacity-60">
                <Trash2 className="h-4 w-4" /> Delete
              </button>
            )}
          </div>
          {error && <p className="rounded-lg border border-red-300 bg-red-50 px-3 py-1.5 font-body text-[12.5px] text-red-700 sm:col-span-3">{error}</p>}
        </div>
      </div>
    </div>
  )
}
