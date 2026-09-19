'use client'

import { useState } from 'react'
import { Upload, X } from 'lucide-react'
import {
  uploadProductImage,
  deleteProductImage,
} from '@/lib/admin/products/actions'

const MAX_BYTES = 4 * 1024 * 1024 // 4MB
const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp']

export default function ImageUploader({
  productId,
  initialImageUrls,
  initialPrimaryUrl,
}: {
  productId: string
  initialImageUrls: string[]
  initialPrimaryUrl: string | null
}) {
  const [urls, setUrls] = useState<string[]>(initialImageUrls)
  const [primary, setPrimary] = useState<string | null>(initialPrimaryUrl)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleFile(file: File) {
    setError(null)
    if (!ACCEPTED.includes(file.type)) {
      setError('Use JPEG, PNG, or WebP.')
      return
    }
    if (file.size > MAX_BYTES) {
      setError('File must be under 4 MB.')
      return
    }
    setPending(true)
    const bytes = await file.arrayBuffer()
    const r = await uploadProductImage({
      productId,
      fileName: file.name,
      fileBytes: bytes,
      contentType: file.type,
    })
    setPending(false)
    if (!r.ok) {
      setError(r.error)
      return
    }
    const newUrl = (r as { ok: true; data?: { url: string } }).data?.url
    if (newUrl) {
      setUrls((u) => [...u, newUrl])
      if (!primary) setPrimary(newUrl)
    }
  }

  async function handleDelete(url: string) {
    setPending(true)
    setError(null)
    const r = await deleteProductImage({ productId, imageUrl: url })
    setPending(false)
    if (!r.ok) {
      setError(r.error)
      return
    }
    const remaining = urls.filter((u) => u !== url)
    setUrls(remaining)
    if (primary === url) setPrimary(remaining[0] ?? null)
  }

  return (
    <div className="rounded-2xl border border-[#006B3C]/8 bg-white p-4">
      <div className="flex items-center justify-between">
        <h3 className="font-heading text-[12.5px] font-semibold text-[#006B3C]">Images</h3>
        <span className="text-[10px] text-[#12372D]/55">JPEG / PNG / WebP, ≤ 4 MB</span>
      </div>

      {urls.length > 0 ? (
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {urls.map((u) => (
            <div key={u} className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={u}
                alt=""
                className={`h-28 w-full rounded-lg border object-cover ${
                  u === primary
                    ? 'border-[#B58A3B] ring-2 ring-[#B58A3B]/30'
                    : 'border-[#006B3C]/10'
                }`}
              />
              {u === primary ? (
                <span className="absolute left-1 top-1 rounded-full bg-[#B58A3B] px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-white">
                  Primary
                </span>
              ) : null}
              <button
                type="button"
                onClick={() => handleDelete(u)}
                disabled={pending}
                className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-white/90 text-red-600 shadow disabled:opacity-50"
                aria-label="Remove image"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-3 rounded-lg border border-dashed border-[#006B3C]/15 bg-[#EDF4E7]/40 p-6 text-center text-[12px] italic text-[#12372D]/55">
          No images yet.
        </p>
      )}

      <label className="mt-3 inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-[#006B3C]/20 bg-white px-3 py-1.5 text-[12px] font-semibold text-[#006B3C] hover:bg-[#EDF4E7]/60">
        <Upload className="h-3.5 w-3.5" />
        {pending ? 'Uploading…' : 'Upload image'}
        <input
          type="file"
          accept={ACCEPTED.join(',')}
          disabled={pending}
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) handleFile(f)
            e.currentTarget.value = ''
          }}
        />
      </label>

      {error ? <p className="mt-2 text-[12px] text-red-600">{error}</p> : null}
    </div>
  )
}
