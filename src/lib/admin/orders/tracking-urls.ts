export type Carrier =
  | 'Pos Laju'
  | 'J&T Express'
  | 'Ninja Van'
  | 'GDex'
  | 'DHL'
  | 'Self-Pickup'

export const supportedCarriers: readonly Carrier[] = [
  'Pos Laju',
  'J&T Express',
  'Ninja Van',
  'GDex',
  'DHL',
  'Self-Pickup',
] as const

const URL_TEMPLATES: Record<Carrier, string | null> = {
  'Pos Laju':    'https://www.poslaju.com.my/track-trace/?trackingNo={tracking}',
  'J&T Express': 'https://www.jtexpress.my/index/query/gzquery.html?bills={tracking}',
  'Ninja Van':   'https://www.ninjavan.co/en-my/tracking?id={tracking}',
  'GDex':        'https://web.gdexpress.com/official/etracking.php?capncode={tracking}',
  'DHL':         'https://www.dhl.com/my-en/home/tracking.html?tracking-id={tracking}',
  'Self-Pickup': null,
}

export function trackingUrlFor(carrier: Carrier, trackingNumber: string): string | null {
  const tpl = URL_TEMPLATES[carrier]
  if (!tpl) return null
  return tpl.replace('{tracking}', encodeURIComponent(trackingNumber))
}
