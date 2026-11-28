import { strFromU8, strToU8, unzipSync, zipSync } from 'fflate'
import { CLINIC_NAME, CLINIC_PHONE_PRIMARY } from '@/lib/clinic'
import { JT_TEMPLATE_BASE64 } from './jt-template'
import { JT_INTL_TEMPLATE_BASE64 } from './jt-intl-template'

/**
 * J&T Express has no API for this account, so shop orders go to J&T as a file:
 *
 *  1. Fulfilment page → tick orders → "Download for J&T" builds J&T's own
 *     "Bulk Import Orders" file, one row per order (buildJtRows + buildJtWorkbook).
 *  2. Staff upload it in the J&T merchant portal (Order → Bulk Import Orders)
 *     and print the labels there.
 *  3. Staff export the orders from J&T (with their waybill numbers) and upload
 *     that file on the Fulfilment page; each row is matched back by our order
 *     number and the order is marked shipped (readTable + matchWaybills).
 */

// ── Settings: confirm these with the centre ──────────────────────────────────

export const JT_SETTINGS = {
  sender: {
    name: CLINIC_NAME,
    phone: CLINIC_PHONE_PRIMARY,
    postcode: '50470',
    address: 'No. 68-3, Jalan Padang Belia, Brickfields, Kuala Lumpur',
  },
  /** J&T billing for this account: 'PAYMONTHLY' or 'CASH'. null = left blank (choose in J&T). */
  paymentMethod: null as 'PAYMONTHLY' | 'CASH' | null,
  /** 'PICK UP' (J&T collects from the centre) or 'DROP OFF'. null = left blank (choose in J&T). */
  serviceType: null as 'PICK UP' | 'DROP OFF' | null,
  parcelType: 'Standard' as 'Standard' | 'Express',
  addressType: 'HOME' as 'HOME' | 'OFFICE' | 'SCHOOL',
  insurance: 'NO' as 'YES' | 'NO',
  /** Used for a product with no weight recorded (grams, packed). */
  defaultItemGrams: 300,
  /** Box and padding added to every parcel (grams). */
  packagingGrams: 100,
  /** Usual box size in cm, or null to leave blank. */
  box: null as { length: number; width: number; height: number } | null,
  remarks: 'Fragile: glass bottles',
}

// ── Building the import file ─────────────────────────────────────────────────

export interface JtOrder {
  orderNumber: string
  receiverName: string
  receiverPhone: string
  postcode: string
  addressLines: string[]
  /** ISO code as saved at checkout, e.g. MY, SG. */
  country: string
  email?: string | null
  /** Goods value (RM), shipping excluded. */
  goodsValueRm: number
  items: { name: string; quantity: number; weightGrams: number | null }[]
}

export type JtCell = string | number | null
export interface JtRow {
  orderNumber: string
  cells: JtCell[]
  /** True when a product had no weight recorded and the default was used. */
  weightEstimated: boolean
}

/** Malaysian phone in local form (0123456789), which J&T's importer accepts. */
export function localPhone(raw: string | null | undefined): string {
  let d = String(raw ?? '').replace(/\D/g, '')
  if (d.startsWith('60')) d = '0' + d.slice(2)
  else if (d && !d.startsWith('0')) d = '0' + d
  return d
}

/** Weight in kg for J&T: the items plus packaging, rounded up to 0.1 kg. */
export function parcelKg(items: JtOrder['items']): { kg: number; estimated: boolean } {
  let grams = JT_SETTINGS.packagingGrams
  let estimated = false
  for (const i of items) {
    const g = i.weightGrams && i.weightGrams > 0 ? i.weightGrams : (estimated = true, JT_SETTINGS.defaultItemGrams)
    grams += g * i.quantity
  }
  return { kg: Math.ceil(grams / 100) / 10, estimated }
}

/** The 25 columns of J&T's template, in order (A to Y). */
export function buildJtRows(orders: JtOrder[]): { rows: JtRow[]; skipped: { orderNumber: string; reason: string }[] } {
  const rows: JtRow[] = []
  const skipped: { orderNumber: string; reason: string }[] = []
  const s = JT_SETTINGS
  for (const o of orders) {
    if (!isMalaysia(o.country)) {
      skipped.push({ orderNumber: o.orderNumber, reason: `Ships to ${o.country}: use Download for J&T International.` })
      continue
    }
    if (!o.postcode || !o.addressLines.some(Boolean)) {
      skipped.push({ orderNumber: o.orderNumber, reason: 'No delivery address on the order.' })
      continue
    }
    const { kg, estimated } = parcelKg(o.items)
    const quantity = o.items.reduce((n, i) => n + i.quantity, 0)
    const goods = o.items.map((i) => `${i.quantity}x ${i.name}`).join(', ').slice(0, 200)
    rows.push({
      orderNumber: o.orderNumber,
      weightEstimated: estimated,
      cells: [
        kg, // A Actual Weight
        s.sender.name, // B Sender Name
        localPhone(s.sender.phone), // C Sender Phone Number
        s.sender.postcode, // D Deliverer Postcode
        s.sender.address, // E Sender Address
        o.receiverName.trim(), // F Receiver Name
        localPhone(o.receiverPhone), // G Receiver Phone Number
        o.postcode.trim(), // H Receiver Postcode
        s.addressType, // I Recipient address type
        o.addressLines.map((l) => l.trim()).filter(Boolean).join(', '), // J Receiver Address
        s.paymentMethod, // K Payment Method
        s.serviceType, // L Service Type
        1, // M Number of packages
        s.parcelType, // N Parcel Type
        goods, // O Goods Name
        s.box?.length ?? null, // P Item length(cm)
        s.box?.width ?? null, // Q Item width(cm)
        s.box?.height ?? null, // R Item height(cm)
        quantity, // S Quantity
        'PARCEL', // T Goods Type
        o.orderNumber, // U Customer Order Number
        s.remarks || null, // V Remarks
        Math.round(o.goodsValueRm * 100) / 100, // W Item Value
        s.insurance, // X Insurance
        null, // Y COD Value (paid online, so none)
      ],
    })
  }
  return { rows, skipped }
}

/** Spreadsheet column letters: A … Z, AA … AZ. */
const COLS = Array.from({ length: 52 }, (_, i) => (i < 26 ? '' : String.fromCharCode(64 + Math.floor(i / 26))) + String.fromCharCode(65 + (i % 26)))

function xmlText(v: string): string {
  return v
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    // Characters XML 1.0 does not allow.
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
}

function cellXml(ref: string, v: JtCell): string {
  if (v === null || v === '') return ''
  if (typeof v === 'number') return `<c r="${ref}"><v>${v}</v></c>`
  // Postcodes and phones stay text so leading zeros are kept.
  return `<c r="${ref}" t="inlineStr"><is><t xml:space="preserve">${xmlText(v)}</t></is></c>`
}

function base64ToBytes(b64: string): Uint8Array {
  if (typeof Buffer !== 'undefined') return new Uint8Array(Buffer.from(b64, 'base64'))
  const bin = atob(b64)
  return Uint8Array.from(bin, (c) => c.charCodeAt(0))
}

/**
 * A J&T template with our rows from row 2 down. Rows the template already has
 * there (its example row, empty formatted rows) are replaced; the header,
 * dropdowns and list sheets are left exactly as J&T made them.
 */
function fillTemplate(templateB64: string, rows: JtRow[], width: number): Uint8Array {
  const files = unzipSync(base64ToBytes(templateB64))
  const path = 'xl/worksheets/sheet1.xml'
  const sheet = strFromU8(files[path])
  const start = sheet.indexOf('<sheetData')
  const open = sheet.indexOf('>', start) + 1
  const close = sheet.indexOf('</sheetData>')
  const existing = new Map<number, string>()
  for (const m of Array.from(sheet.slice(open, close).matchAll(/<row\b[^>]*?r="(\d+)"[^>]*?(?:\/>|>[\s\S]*?<\/row>)/g))) existing.set(Number(m[1]), m[0])
  rows.forEach((r, i) => {
    const n = i + 2
    existing.set(n, `<row r="${n}">${r.cells.slice(0, width).map((v, c) => cellXml(`${COLS[c]}${n}`, v)).join('')}</row>`)
  })
  const body = Array.from(existing.entries()).sort((a, b) => a[0] - b[0]).map((e) => e[1]).join('')
  let out = sheet.slice(0, open) + body + sheet.slice(close)
  const lastRow = Math.max(rows.length + 1, ...Array.from(existing.keys()))
  out = out.replace(/<dimension ref="[^"]*"\/>/, `<dimension ref="A1:${COLS[width - 1]}${lastRow}"/>`)
  files[path] = strToU8(out)
  return zipSync(files, { level: 6 })
}

/** J&T's Malaysia template with the rows added under its header. */
export function buildJtWorkbook(rows: JtRow[]): Uint8Array {
  return fillTemplate(JT_TEMPLATE_BASE64, rows, 25)
}

// ── International (Singapore, Brunei, Vietnam) ──────────────────────────────

/** J&T international only goes to these; codes as in its template. */
export const JT_INTL_COUNTRIES: Record<string, { code: 'SIN' | 'BWN' | 'VNM'; name: string; area: string | null }> = {
  SG: { code: 'SIN', name: 'Singapore', area: 'Singapore' },
  BN: { code: 'BWN', name: 'Brunei', area: 'BRUNEI' },
  // Vietnam's province / city / district come from J&T's long lists; staff pick them in the file.
  VN: { code: 'VNM', name: 'Vietnam', area: null },
}

export const JT_INTL_SETTINGS = {
  /**
   * "Goods Name" must be one of J&T's list. It has no entry for oils or
   * skincare, so it stays blank until J&T confirms what to declare.
   */
  goodsName: null as string | null,
  /** 'PERSONAL' or 'BUSINESS'. null = left blank until confirmed. */
  transportationPurpose: null as 'PERSONAL' | 'BUSINESS' | null,
  /** 'DDU' (receiver pays import duty) or 'DDP' (sender pays). null = left blank until confirmed. */
  shippingTerms: null as 'DDU' | 'DDP' | null,
}

export function isMalaysia(country: string): boolean {
  return !country || /^(MY|MYS|MALAYSIA)$/i.test(country.trim())
}

/** International phone as digits with the country code, e.g. 6591234567. */
export function intlPhone(raw: string | null | undefined): string {
  return String(raw ?? '').replace(/\D/g, '')
}

/** The 39 columns of J&T's international template, in order (A to AM). */
export function buildJtIntlRows(orders: JtOrder[]): { rows: JtRow[]; skipped: { orderNumber: string; reason: string }[] } {
  const rows: JtRow[] = []
  const skipped: { orderNumber: string; reason: string }[] = []
  const s = JT_SETTINGS
  const i = JT_INTL_SETTINGS
  for (const o of orders) {
    if (isMalaysia(o.country)) {
      skipped.push({ orderNumber: o.orderNumber, reason: 'Ships within Malaysia: use Download for J&T (Malaysia).' })
      continue
    }
    const dest = JT_INTL_COUNTRIES[o.country.trim().toUpperCase()]
    if (!dest) {
      skipped.push({ orderNumber: o.orderNumber, reason: `Ships to ${o.country}; J&T international only goes to Singapore, Brunei and Vietnam.` })
      continue
    }
    if (!o.addressLines.some(Boolean)) {
      skipped.push({ orderNumber: o.orderNumber, reason: 'No delivery address on the order.' })
      continue
    }
    const { kg, estimated } = parcelKg(o.items)
    const quantity = o.items.reduce((n, it) => n + it.quantity, 0)
    const value = Math.round(o.goodsValueRm * 100) / 100
    rows.push({
      orderNumber: o.orderNumber,
      weightEstimated: estimated,
      cells: [
        kg, // A Actual Weight
        s.sender.name, // B Sender Name
        localPhone(s.sender.phone), // C Sender Phone
        s.sender.postcode, // D Sender Postcode
        s.sender.address, // E Sender Address
        dest.code, // F Destination country/area
        dest.area, // G Destination Province
        dest.area, // H Destination City
        dest.area, // I Destination District
        o.receiverName.trim(), // J Recipient Name
        intlPhone(o.receiverPhone), // K Recipient Phone
        o.postcode.trim() || null, // L Recipient Postcode
        s.addressType, // M Recipient Address Type
        o.addressLines.map((l) => l.trim()).filter(Boolean).join(', '), // N Recipient address
        o.email?.trim() || null, // O Receiver Email
        s.paymentMethod, // P Payment Method
        s.serviceType, // Q SERVICE TYPE
        s.box?.length ?? null, // R Item length(cm)
        s.box?.width ?? null, // S Item width(cm)
        s.box?.height ?? null, // T Item height(cm)
        'PARCEL', // U Goods Type
        o.orderNumber, // V Customer Order Number
        null, // W Identity Card No/Passport No
        s.remarks || null, // X Remarks
        i.goodsName, // Y Goods Name (J&T's list)
        quantity, // Z Quantity
        value, // AA Total Value
        kg, // AB Weight
        null, // AC Weight Unit
        null, // AD Origin Country
        null, // AE Record Number
        null, // AF HS Tariff Code
        i.transportationPurpose, // AG Transportation Purpose
        i.shippingTerms, // AH Shipping Terms
        'NO', // AI Old Item
        null, // AJ Brand Name
        value, // AK Item Value
        s.insurance, // AL insurance
        null, // AM COD Value
      ],
    })
  }
  return { rows, skipped }
}

/** J&T's international template with the rows from row 2 (its example row removed). */
export function buildJtIntlWorkbook(rows: JtRow[]): Uint8Array {
  return fillTemplate(JT_INTL_TEMPLATE_BASE64, rows, 39)
}

// ── Reading J&T's export back (waybill numbers) ──────────────────────────────

export type Table = string[][]

const ORDER_NO = /\bORD-\d{4}-\d{3,}\b/i

function colIndex(ref: string): number {
  const letters = ref.replace(/\d+/g, '')
  let n = 0
  for (let i = 0; i < letters.length; i++) n = n * 26 + (letters.charCodeAt(i) - 64)
  return n - 1
}

function decodeXml(s: string): string {
  return s
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(Number(d)))
    .replace(/&amp;/g, '&')
}

function textOf(xml: string): string {
  return decodeXml(Array.from(xml.matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)).map((m) => m[1]).join(''))
}

/** First sheet of an .xlsx file as rows of text. */
export function readXlsx(bytes: Uint8Array): Table {
  const files = unzipSync(bytes)
  const shared = files['xl/sharedStrings.xml']
    ? Array.from(strFromU8(files['xl/sharedStrings.xml']).matchAll(/<si>([\s\S]*?)<\/si>/g)).map((m) => textOf(m[1]))
    : []
  const sheetPath = Object.keys(files).filter((p) => /^xl\/worksheets\/sheet\d+\.xml$/.test(p)).sort()[0]
  if (!sheetPath) return []
  const xml = strFromU8(files[sheetPath])
  const table: Table = []
  for (const r of Array.from(xml.matchAll(/<row[^>]*>([\s\S]*?)<\/row>/g))) {
    const row: string[] = []
    for (const c of Array.from(r[1].matchAll(/<c ([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g))) {
      const attrs = c[1]
      const inner = c[2] ?? ''
      const ref = /r="([A-Z]+\d+)"/.exec(attrs)?.[1]
      const type = /t="([^"]+)"/.exec(attrs)?.[1]
      const v = /<v>([\s\S]*?)<\/v>/.exec(inner)?.[1]
      let val = ''
      if (type === 's' && v != null) val = shared[Number(v)] ?? ''
      else if (type === 'inlineStr') val = textOf(inner)
      else if (v != null) val = decodeXml(v)
      const idx = ref ? colIndex(ref) : row.length
      row[idx] = val.trim()
    }
    table.push(Array.from(row, (x) => x ?? ''))
  }
  return table
}

/** A CSV file as rows of text (quoted fields, commas or semicolons). */
export function readCsv(text: string): Table {
  const delim = (text.split('\n')[0].match(/;/g)?.length ?? 0) > (text.split('\n')[0].match(/,/g)?.length ?? 0) ? ';' : ','
  const rows: Table = []
  let row: string[] = []
  let cell = ''
  let quoted = false
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') { cell += '"'; i++ }
      else if (ch === '"') quoted = false
      else cell += ch
    } else if (ch === '"') quoted = true
    else if (ch === delim) { row.push(cell.trim()); cell = '' }
    else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++
      row.push(cell.trim()); rows.push(row); row = []; cell = ''
    } else cell += ch
  }
  if (cell || row.length) { row.push(cell.trim()); rows.push(row) }
  return rows.filter((r) => r.some(Boolean))
}

export function readTable(name: string, bytes: Uint8Array): Table | { error: string } {
  const isZip = bytes[0] === 0x50 && bytes[1] === 0x4b
  if (isZip) {
    try {
      return readXlsx(bytes)
    } catch {
      return { error: 'That Excel file could not be read. Please export it again from J&T.' }
    }
  }
  if (bytes[0] === 0xd0 && bytes[1] === 0xcf) {
    return { error: 'This is an old-style Excel file. Open it in Excel and use Save As → Excel Workbook (.xlsx) or CSV, then upload that.' }
  }
  if (/\.(csv|txt)$/i.test(name) || bytes.length) return readCsv(new TextDecoder().decode(bytes))
  return { error: 'Please upload the J&T export as .xlsx or .csv.' }
}

/**
 * Finds the column holding our order numbers and the column holding J&T's
 * waybill numbers, and pairs them up. The waybill column is the one whose
 * header says waybill / AWB / tracking; failing that, the column of long
 * letter-and-digit codes.
 */
export function matchWaybills(table: Table): { pairs: { orderNumber: string; waybill: string }[] } | { error: string } {
  if (!table.length) return { error: 'The file is empty.' }
  const width = Math.max(...table.map((r) => r.length))
  const count = (c: number, re: RegExp) => table.filter((r) => re.test(r[c] ?? '')).length

  let orderCol = -1
  let best = 0
  for (let c = 0; c < width; c++) {
    const n = count(c, ORDER_NO)
    if (n > best) { best = n; orderCol = c }
  }
  if (orderCol < 0) return { error: 'No website order numbers (like ORD-2026-00012) were found in the file. Make sure the export includes the "Customer Order Number" column.' }

  const headerRow = table.findIndex((r) => r.some((v) => /waybill|awb|tracking|airway/i.test(v)))
  let waybillCol = -1
  if (headerRow >= 0) {
    waybillCol = table[headerRow].findIndex((v, i) => i !== orderCol && /waybill|awb|tracking|airway/i.test(v) && !/customer|order/i.test(v))
  }
  if (waybillCol < 0) {
    const looksLikeWaybill = /^[A-Z]{0,4}\d{9,18}[A-Z]{0,3}$/i
    let top = 0
    for (let c = 0; c < width; c++) {
      if (c === orderCol) continue
      const n = count(c, looksLikeWaybill)
      if (n > top) { top = n; waybillCol = c }
    }
  }
  if (waybillCol < 0) return { error: 'No waybill numbers were found in the file. Make sure the export includes the "Waybill No." column.' }

  const seen = new Set<string>()
  const pairs: { orderNumber: string; waybill: string }[] = []
  for (const r of table) {
    const orderNumber = (r[orderCol] ?? '').match(ORDER_NO)?.[0]?.toUpperCase()
    const waybill = (r[waybillCol] ?? '').replace(/\s+/g, '')
    if (!orderNumber || !waybill || /waybill|awb|tracking/i.test(waybill) || seen.has(orderNumber)) continue
    seen.add(orderNumber)
    pairs.push({ orderNumber, waybill })
  }
  if (!pairs.length) return { error: 'The file has order numbers but no waybill numbers next to them yet.' }
  return { pairs }
}
