/**
 * Curated Sanskrit mantras used as ornamental anchors in the catalogue.
 * All are generic, widely-attributed verses — no per-treatment data.
 * Cycled via `mantraFor(plateIndex)`.
 */
export interface Mantra {
  devanagari: string
  english: string
}

export const MANTRAS: readonly Mantra[] = [
  { devanagari: 'सर्वे भवन्तु सुखिनः', english: 'May all beings find peace.' },
  { devanagari: 'यथा पिण्डे तथा ब्रह्माण्डे', english: 'As in the body, so in the cosmos.' },
  { devanagari: 'आरोग्यं परमं भाग्यम्', english: 'Wellness is the highest fortune.' },
  { devanagari: 'चरकस्य सिद्धान्तः', english: 'The doctrine of Charaka, physician of antiquity.' },
  { devanagari: 'ओषधिभ्यो नमः', english: 'Salutations to the healing herbs.' },
] as const

export function mantraFor(index: number): Mantra {
  return MANTRAS[index % MANTRAS.length]
}
