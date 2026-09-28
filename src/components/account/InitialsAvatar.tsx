/**
 * Pure CSS initials avatar. Deterministic palette assignment by hashing
 * the user ID — same person always gets the same colour across surfaces.
 */

interface InitialsAvatarProps {
  /** Full name. First letter is used. */
  name: string | null | undefined
  /** User id — used to pick a stable palette tile. */
  seed?: string | null
  /** Visual size. */
  size?: 'sm' | 'md' | 'lg' | 'xl'
  /** If present, renders an image instead of the initials letter. */
  avatarUrl?: string | null
}

const PALETTES = [
  { bg: '#12372D', fg: '#E4C384' }, // forest
  { bg: '#2F5A45', fg: '#F4E8CC' }, // sage
  { bg: '#B58A3B', fg: '#12372D' }, // turmeric gold
  { bg: '#12372D', fg: '#E4C384' }, // forest
  { bg: '#8A5A3B', fg: '#F4E8CC' }, // clay
] as const

const SIZE_CLASSES: Record<NonNullable<InitialsAvatarProps['size']>, {
  box: string
  text: string
}> = {
  sm: { box: 'h-8 w-8', text: 'text-[13px]' },
  md: { box: 'h-12 w-12', text: 'text-[18px]' },
  lg: { box: 'h-16 w-16', text: 'text-[24px]' },
  xl: { box: 'h-24 w-24 sm:h-28 sm:w-28', text: 'text-[40px] sm:text-[48px]' },
}

function pickPalette(seed: string | null | undefined): (typeof PALETTES)[number] {
  if (!seed) return PALETTES[0]
  let h = 0
  for (let i = 0; i < seed.length; i++) {
    h = (h * 31 + seed.charCodeAt(i)) >>> 0
  }
  return PALETTES[h % PALETTES.length]
}

function firstInitial(name: string | null | undefined): string {
  if (!name) return '·'
  const trimmed = name.trim()
  return trimmed.length > 0 ? trimmed.charAt(0).toUpperCase() : '·'
}

export default function InitialsAvatar({
  name,
  seed,
  size = 'md',
  avatarUrl,
}: InitialsAvatarProps) {
  const sizes = SIZE_CLASSES[size]

  if (avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={avatarUrl}
        alt={name ?? ''}
        className={`inline-block shrink-0 rounded-2xl object-cover ${sizes.box}`}
        style={{
          boxShadow: '0 1px 2px rgba(18,55,45,0.05), 0 26px 50px -34px rgba(60,45,20,0.45)',
        }}
      />
    )
  }

  const palette = pickPalette(seed ?? name ?? null)
  const letter = firstInitial(name)

  return (
    <span
      aria-hidden
      className={`inline-flex shrink-0 items-center justify-center rounded-2xl font-heading font-bold ${sizes.box} ${sizes.text}`}
      style={{
        backgroundColor: palette.bg,
        color: palette.fg,
        letterSpacing: '-0.02em',
        boxShadow: '0 1px 2px rgba(18,55,45,0.05), 0 26px 50px -34px rgba(60,45,20,0.45)',
      }}
    >
      {letter}
    </span>
  )
}
