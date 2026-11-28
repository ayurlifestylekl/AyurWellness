import { strFromU8, strToU8, unzipSync, zipSync } from 'fflate'
import { CLINIC_NAME, CLINIC_PHONE_PRIMARY } from '@/lib/clinic'
import { JT_TEMPLATE_BASE64 } from './jt-template'

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
  country: string
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
    if (o.country && !/^(MY|MYS|MALAYSIA)$/i.test(o.country.trim())) {
      skipped.push({ orderNumber: o.orderNumber, reason: `Ships to ${o.country}; this J&T account is for Malaysia.` })
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

const COLS = 'ABCDEFGHIJKLMNOPQRSTUVWXY'.split('')

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

/** J&T's template with the rows added under its header. */
export function buildJtWorkbook(rows: JtRow[]): Uint8Array {
  const files = unzipSync(base64ToBytes(JT_TEMPLATE_BASE64))
  const path = 'xl/worksheets/sheet1.xml'
  let sheet = strFromU8(files[path])
  const body = rows
    .map((r, i) => {
      const n = i + 2
      return `<row r="${n}">${r.cells.map((v, c) => cellXml(`${COLS[c]}${n}`, v)).join('')}</row>`
    })
    .join('\n')
  sheet = sheet.replace('</sheetData>', `${body}\n</sheetData>`)
  sheet = sheet.replace(/<dimension ref="[^"]*"\/>/, `<dimension ref="A1:Y${rows.length + 1}"/>`)
  files[path] = strToU8(sheet)
  return zipSync(files, { level: 6 })
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
