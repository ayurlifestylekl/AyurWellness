'use client'

import { useRef, useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Camera, Trash2 } from 'lucide-react'
import InitialsAvatar from './InitialsAvatar'
import { uploadAvatar } from '@/actions/profile/uploadAvatar'
import { removeAvatar } from '@/actions/profile/removeAvatar'

interface AvatarUploaderProps {
  userId: string
  fullName: string | null
  initialUrl: string | null
}

export default function AvatarUploader({ userId, fullName, initialUrl }: AvatarUploaderProps) {
  const [url, setUrl] = useState<string | null>(initialUrl)
  const [isPending, startTransition] = useTransition()
  const inputRef = useRef<HTMLInputElement>(null)

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    const fd = new FormData()
    fd.append('file', f)
    startTransition(async () => {
      const res = await uploadAvatar(fd)
      if (res.ok) {
        setUrl(res.url)
        toast.success('Avatar updated.')
      } else {
        toast.error(res.error)
      }
      if (inputRef.current) inputRef.current.value = ''
    })
  }

  function handleRemove() {
    startTransition(async () => {
      const res = await removeAvatar()
      if (res.ok) {
        setUrl(null)
        toast.success('Avatar removed.')
      } else {
        toast.error(res.error)
      }
    })
  }

  return (
    <div className="flex items-center gap-4">
      <InitialsAvatar
        name={fullName}
        seed={userId}
        size="lg"
        avatarUrl={url}
      />
      <div className="flex flex-col items-start gap-1.5">
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={handleFile}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={isPending}
          className="inline-flex items-center gap-2 rounded-full bg-[#006B3C] px-4 py-2 font-heading text-[11px] font-bold uppercase tracking-[0.14em] text-white transition-all hover:bg-[#006B3C] active:scale-[0.98] disabled:opacity-50"
        >
          <Camera className="h-3.5 w-3.5" />
          {url ? 'Change photo' : 'Upload photo'}
        </button>
        {url && (
          <button
            type="button"
            onClick={handleRemove}
            disabled={isPending}
            className="inline-flex items-center gap-1.5 font-heading text-[11px] font-semibold text-red-700 hover:underline disabled:opacity-50"
          >
            <Trash2 className="h-3 w-3" />
            Remove
          </button>
        )}
        <p className="font-body text-[10.5px] text-[#12372D]/55">PNG, JPEG or WebP. Max 2 MB.</p>
      </div>
    </div>
  )
}
