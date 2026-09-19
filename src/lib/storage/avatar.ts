import type { SupabaseClient } from '@supabase/supabase-js'

export const AVATAR_BUCKET = 'avatars'
export const MAX_AVATAR_BYTES = 2 * 1024 * 1024 // 2 MB
export const ALLOWED_AVATAR_TYPES = ['image/png', 'image/jpeg', 'image/webp'] as const

export function avatarObjectPath(userId: string, ext: string): string {
  return `${userId}/${Date.now()}.${ext}`
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function publicAvatarUrl(supabase: SupabaseClient<any, 'public', any>, path: string): string {
  return supabase.storage.from(AVATAR_BUCKET).getPublicUrl(path).data.publicUrl
}
