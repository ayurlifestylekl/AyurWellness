/**
 * Lightweight CSV parser + emitter for the bulk-import / export flow.
 * Stays in-house (no Papa Parse dep) because our needs are simple:
 * known columns, quoted field support, per-row error reporting.
 */

export interface ProductCsvRow {
  name: string
  sku: string
  price_rm: number
  stock_qty: number
  status: 'active' | 'draft' | 'archived'
  category?: string
  short_description?: string
  description?: string
  ingredients?: string
  dosage_instructions?: string
  contraindications?: string
  certifications?: string
  dosha_indication?: 'vata' | 'pitta' | 'kapha' | 'tridosha' | 'none'
  sale_price_rm?: number
  member_price_rm?: number
  weight_grams?: number
  low_stock_threshold?: number
  expiry_date?: string
  tags?: string // comma-separated in CSV; split on import
  meta_title?: string
  meta_description?: string
  featured?: boolean
  allow_backorder?: boolean
  image_url?: string
}

export interface CsvParseError {
  line: number
  message: string
}

const REQUIRED = ['name', 'sku', 'price_rm', 'stock_qty', 'status'] as const

function splitCsvLine(line: string): string[] {
  const out: string[] = []
  let cur = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const c = line[i]
    if (inQuotes) {
      if (c === '"' && line[i + 1] === '"') {
        cur += '"'
        i++
      } else if (c === '"') {
        inQuotes = false
      } else {
        cur += c
      }
    } else {
      if (c === '"') inQuotes = true
      else if (c === ',') {
        out.push(cur)
        cur = ''
      } else cur += c
    }
  }
  out.push(cur)
  return out
}

function parseBool(v: string | undefined): boolean | undefined {
  if (v === undefined || v === '') return undefined
  return v.toLowerCase() === 'true' || v === '1' || v.toLowerCase() === 'yes'
}

function parseNum(v: string | undefined): number | undefined {
  if (v === undefined || v === '') return undefined
  const n = Number(v)
  return Number.isFinite(n) ? n : undefined
}

export function parseProductsCsv(csv: string): {
  rows: ProductCsvRow[]
  errors: CsvParseError[]
} {
  const lines = csv.split(/\r?\n/).filter((l) => l.length > 0)
  if (lines.length === 0) return { rows: [], errors: [{ line: 0, message: 'Empty CSV' }] }
  const headers = splitCsvLine(lines[0]).map((h) => h.trim())
  const rows: ProductCsvRow[] = []
  const errors: CsvParseError[] = []
  for (let i = 1; i < lines.length; i++) {
    const cells = splitCsvLine(lines[i])
    const obj: Record<string, string> = {}
    headers.forEach((h, idx) => {
      obj[h] = (cells[idx] ?? '').trim()
    })
    const missing = REQUIRED.filter((k) => !obj[k])
    if (missing.length > 0) {
      errors.push({
        line: i + 1,
        message: `Missing required: ${missing.join(', ')}`,
      })
      continue
    }
    const priceRm = parseNum(obj.price_rm)
    const stockQty = parseNum(obj.stock_qty)
    if (priceRm === undefined || priceRm < 0) {
      errors.push({ line: i + 1, message: 'price_rm must be a non-negative number' })
      continue
    }
    if (stockQty === undefined || !Number.isInteger(stockQty) || stockQty < 0) {
      errors.push({ line: i + 1, message: 'stock_qty must be a non-negative integer' })
      continue
    }
    if (!['active', 'draft', 'archived'].includes(obj.status)) {
      errors.push({ line: i + 1, message: 'status must be active|draft|archived' })
      continue
    }
    rows.push({
      name: obj.name,
      sku: obj.sku,
      price_rm: priceRm,
      stock_qty: stockQty,
      status: obj.status as ProductCsvRow['status'],
      category: obj.category || undefined,
      short_description: obj.short_description || undefined,
      description: obj.description || undefined,
      ingredients: obj.ingredients || undefined,
      dosage_instructions: obj.dosage_instructions || undefined,
      contraindications: obj.contraindications || undefined,
      certifications: obj.certifications || undefined,
      dosha_indication: (obj.dosha_indication as ProductCsvRow['dosha_indication']) || undefined,
      sale_price_rm: parseNum(obj.sale_price_rm),
      member_price_rm: parseNum(obj.member_price_rm),
      weight_grams: parseNum(obj.weight_grams),
      low_stock_threshold: parseNum(obj.low_stock_threshold),
      expiry_date: obj.expiry_date || undefined,
      tags: obj.tags || undefined,
      meta_title: obj.meta_title || undefined,
      meta_description: obj.meta_description || undefined,
      featured: parseBool(obj.featured),
      allow_backorder: parseBool(obj.allow_backorder),
      image_url: obj.image_url || undefined,
    })
  }
  return { rows, errors }
}

function csvCell(v: unknown): string {
  if (v == null) return ''
  const s = String(v)
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`
  }
  return s
}

const EXPORT_HEADERS = [
  'name',
  'sku',
  'price_rm',
  'stock_qty',
  'status',
  'category',
  'short_description',
  'description',
  'ingredients',
  'dosage_instructions',
  'contraindications',
  'certifications',
  'dosha_indication',
  'sale_price_rm',
  'member_price_rm',
  'weight_grams',
  'low_stock_threshold',
  'expiry_date',
  'tags',
  'meta_title',
  'meta_description',
  'featured',
  'allow_backorder',
  'image_url',
] as const

export function productsToCsv(rows: Partial<ProductCsvRow>[]): string {
  const head = EXPORT_HEADERS.join(',')
  const body = rows
    .map((r) => EXPORT_HEADERS.map((h) => csvCell(r[h])).join(','))
    .join('\n')
  return head + '\n' + body + (rows.length > 0 ? '\n' : '')
}
