/** Photo attachment rules, shared by the uploader (browser) and the server. */

export const PHOTO_MAX_BYTES = 5 * 1024 * 1024
export const PHOTO_TYPES: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }
export const PHOTO_TAGS = ['before', 'after', 'progress'] as const
export type PhotoTag = (typeof PHOTO_TAGS)[number]
export const PHOTO_TAG_LABEL: Record<PhotoTag, string> = { before: 'Before', after: 'After', progress: 'Progress' }
/** Phone/tablet photos are resized to this longest side before upload. */
export const PHOTO_MAX_SIDE = 1800
