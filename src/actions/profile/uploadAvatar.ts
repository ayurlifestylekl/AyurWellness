'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/getCurrentUser'
import {
  AVATAR_BUCKET,
  ALLOWED_AVATAR_TYPES,
  MAX_AVATAR_BYTES,
  avatarObjectPath,
  publicAvatarUrl,
} from '@/lib/storage/avatar'

type Result = { ok: true; url: string } | { ok: false; error: string }

export async function uploadAvatar(formData: FormData): Promise<Result> {
  const me = await getCurrentUser()
  if (!me) return { ok: false, error: 'Not authorised.' }

  const file = formData.get('file')
  if (!(file instanceof File)) return { ok: false, error: 'No file received.' }
  if (file.size > MAX_AVATAR_BYTES) return { ok: false, error: 'Image must be under 2 MB.' }
  if (!ALLOWED_AVATAR_TYPES.includes(file.type as (typeof ALLOWED_AVATAR_TYPES)[number])) {
    return { ok: false, error: 'Use PNG, JPEG, or WebP.' }
  }

  const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg'
  const path = avatarObjectPath(me.authId, ext)
  const supabase = await createClient()

  const { error: upErr } = await supabase.storage.from(AVATAR_BUCKET).upload(path, file, {
    contentType: file.type,
    upsert: false,
  })
  if (upErr) {
    console.error('[uploadAvatar] storage upload failed:', upErr.message)
    return { ok: false, error: 'Upload failed. Please try again.' }
  }

  const url = publicAvatarUrl(supabase, path)

  // Cast — Supabase v2 `.update()` resolves to `never` against the hand-maintained Database type.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: dbErr } = await (supabase.from('users') as any)
    .update({ avatar_url: url })
    .eq('id', me.authId)

  if (dbErr) {
    console.error('[uploadAvatar] profile update failed:', dbErr.message)
    return { ok: false, error: 'Saved upload, but profile update failed.' }
  }

  revalidatePath('/account/profile')
  revalidatePath('/account/dashboard')
  return { ok: true, url }
}
