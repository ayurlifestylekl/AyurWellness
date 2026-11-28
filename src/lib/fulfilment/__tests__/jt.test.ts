import { describe, expect, it } from 'vitest'
import { strFromU8, strToU8, unzipSync, zipSync } from 'fflate'
import { buildJtIntlRows, buildJtIntlWorkbook, buildJtRows, buildJtWorkbook, localPhone, matchWaybills, parcelKg, readCsv, readTable, readXlsx, type JtOrder } from '../jt'

const order = (over: Partial<JtOrder> = {}): JtOrder => ({
  orderNumber: 'ORD-2026-00012',
  receiverName: 'Priya Raj',
  receiverPhone: '+60 12-345 6789',
  postcode: '08000',
  addressLines: ['12, Jalan Mawar', 'Taman Sejati', 'Sungai Petani', 'Kedah'],
  country: 'MY',
  goodsValueRm: 158,
  items: [{ name: 'Dandra Care Oil', quantity: 2, weightGrams: null }],
  ...over,
})

describe('J&T bulk import rows', () => {
  it('fills the 25 template columns from an order', () => {
    const { rows, skipped } = buildJtRows([order()])
    expect(skipped).toEqual([])
    const c = rows[0].cells
    expect(c).toHaveLength(25)
    expect(c[0]).toBe(0.7) // 2 × 300 g + 100 g packaging
    expect(c[1]).toBe('Ayurvedic Wellness Centre')
    expect(c[2]).toBe('0322603435')
    expect(c[3]).toBe('50470')
    expect(c[5]).toBe('Priya Raj')
    expect(c[6]).toBe('0123456789')
    expect(c[7]).toBe('08000')
    expect(c[8]).toBe('HOME')
    expect(c[9]).toBe('12, Jalan Mawar, Taman Sejati, Sungai Petani, Kedah')
    expect(c[12]).toBe(1)
    expect(c[13]).toBe('Standard')
    expect(c[14]).toBe('2x Dandra Care Oil')
    expect(c[18]).toBe(2)
    expect(c[19]).toBe('PARCEL')
    expect(c[20]).toBe('ORD-2026-00012')
    expect(c[22]).toBe(158)
    expect(c[23]).toBe('NO')
    expect(c[24]).toBeNull()
    expect(rows[0].weightEstimated).toBe(true)
  })

  it('leaves out orders it cannot send, saying why', () => {
    const { rows, skipped } = buildJtRows([order({ orderNumber: 'ORD-2026-00013', country: 'SG' }), order({ orderNumber: 'ORD-2026-00014', postcode: '' })])
    expect(rows).toEqual([])
    expect(skipped.map((s) => s.orderNumber)).toEqual(['ORD-2026-00013', 'ORD-2026-00014'])
  })

  it('uses recorded product weights and rounds the parcel up to 0.1 kg', () => {
    expect(parcelKg([{ name: 'x', quantity: 1, weightGrams: 260 }])).toEqual({ kg: 0.4, estimated: false })
  })

  it('writes phones in local form', () => {
    expect(localPhone('+60 11-6339 3436')).toBe('01163393436')
    expect(localPhone('0123456789')).toBe('0123456789')
    expect(localPhone('123456789')).toBe('0123456789')
  })
})

describe('J&T workbook', () => {
  it('is J&T’s template with the rows under its header, dropdowns kept', () => {
    const { rows } = buildJtRows([order(), order({ orderNumber: 'ORD-2026-00015', receiverName: 'A & B <Co>' })])
    const files = unzipSync(buildJtWorkbook(rows))
    const sheet = strFromU8(files['xl/worksheets/sheet1.xml'])
    expect(sheet).toContain('<dimension ref="A1:Y3"/>')
    expect(sheet).toContain('Actual Weight')
    expect(sheet).toContain('"PAYMONTHLY,CASH"')
    expect(sheet).toContain('A &amp; B &lt;Co&gt;')
    expect(Object.keys(files)).toEqual(expect.arrayContaining(['xl/styles.xml', 'xl/workbook.xml', '[Content_Types].xml']))
    // Reads back as the same table.
    const table = readXlsx(buildJtWorkbook(rows))
    expect(table[0][0]).toBe('Actual Weight')
    expect(table[1][7]).toBe('08000')
    expect(table[2][5]).toBe('A & B <Co>')
    expect(table[2][20]).toBe('ORD-2026-00015')
  })
})

describe('reading J&T’s export back', () => {
  it('pairs waybill numbers with our order numbers by their headers', () => {
    const t = [
      ['Waybill No.', 'Receiver', 'Customer Order Number', 'Status'],
      ['630012345678', 'Priya', 'ORD-2026-00012', 'Picked up'],
      ['630012345679', 'Ali', 'ORD-2026-00015', 'Picked up'],
      ['', 'No order', '', ''],
    ]
    expect(matchWaybills(t)).toEqual({ pairs: [{ orderNumber: 'ORD-2026-00012', waybill: '630012345678' }, { orderNumber: 'ORD-2026-00015', waybill: '630012345679' }] })
  })

  it('finds the waybill column by its look when the header differs', () => {
    const t = [
      ['No', 'Ref', 'Code'],
      ['1', 'ord-2026-00020', 'JT630099887766'],
    ]
    expect(matchWaybills(t)).toEqual({ pairs: [{ orderNumber: 'ORD-2026-00020', waybill: 'JT630099887766' }] })
  })

  it('explains what is missing', () => {
    expect(matchWaybills([['Waybill No.'], ['630012345678']])).toHaveProperty('error')
    expect(matchWaybills([['Customer Order Number'], ['ORD-2026-00012']])).toHaveProperty('error')
  })

  it('reads CSV (quoted, comma or semicolon) and xlsx with shared strings', () => {
    expect(readCsv('a,"b, c",d\n1,"say ""hi""",3\n')).toEqual([['a', 'b, c', 'd'], ['1', 'say "hi"', '3']])
    expect(readCsv('a;b\r\n1;2')).toEqual([['a', 'b'], ['1', '2']])
    const xlsx = zipSync({
      'xl/sharedStrings.xml': strToU8('<sst><si><t>Waybill No</t></si><si><t>ORD-2026-00031</t></si></sst>'),
      'xl/worksheets/sheet1.xml': strToU8('<worksheet><sheetData><row r="1"><c r="A1" t="s"><v>0</v></c></row><row r="2"><c r="A2"><v>630011112222</v></c><c r="C2" t="s"><v>1</v></c></row></sheetData></worksheet>'),
    })
    expect(readTable('x.xlsx', xlsx)).toEqual([['Waybill No'], ['630011112222', '', 'ORD-2026-00031']])
  })

  it('asks for .xlsx or .csv when given an old-style .xls', () => {
    expect(readTable('old.xls', new Uint8Array([0xd0, 0xcf, 0x11, 0xe0]))).toHaveProperty('error')
  })
})

describe('J&T international', () => {
  it('fills the 39 columns for Singapore, with the area names J&T expects', () => {
    const { rows, skipped } = buildJtIntlRows([order({ orderNumber: 'ORD-2026-00040', country: 'SG', postcode: '238859', receiverPhone: '+65 9123 4567', email: 'a@b.sg', addressLines: ['1 Orchard Road', '#05-01', 'Singapore'] })])
    expect(skipped).toEqual([])
    const c = rows[0].cells
    expect(c).toHaveLength(39)
    expect(c.slice(5, 9)).toEqual(['SIN', 'Singapore', 'Singapore', 'Singapore'])
    expect(c[9]).toBe('Priya Raj')
    expect(c[10]).toBe('6591234567')
    expect(c[11]).toBe('238859')
    expect(c[14]).toBe('a@b.sg')
    expect(c[21]).toBe('ORD-2026-00040')
    expect(c[24]).toBeNull() // Goods Name waits for J&T's answer
    expect(c[26]).toBe(158)
    expect(c[34]).toBe('NO')
  })

  it('Brunei uses BRUNEI; Vietnam leaves the area for staff to pick', () => {
    const { rows } = buildJtIntlRows([order({ country: 'BN' }), order({ orderNumber: 'ORD-2026-00041', country: 'VN' })])
    expect(rows[0].cells.slice(5, 9)).toEqual(['BWN', 'BRUNEI', 'BRUNEI', 'BRUNEI'])
    expect(rows[1].cells.slice(5, 9)).toEqual(['VNM', null, null, null])
  })

  it('sends each order to the right file', () => {
    const mixed = [order(), order({ orderNumber: 'ORD-2026-00050', country: 'SG' }), order({ orderNumber: 'ORD-2026-00051', country: 'AU' })]
    expect(buildJtRows(mixed).rows.map((r) => r.orderNumber)).toEqual(['ORD-2026-00012'])
    const intl = buildJtIntlRows(mixed)
    expect(intl.rows.map((r) => r.orderNumber)).toEqual(['ORD-2026-00050'])
    expect(intl.skipped.find((s) => s.orderNumber === 'ORD-2026-00051')?.reason).toMatch(/Singapore, Brunei and Vietnam/)
  })

  it('replaces J&T’s example row and keeps the list sheet', () => {
    const { rows } = buildJtIntlRows([order({ country: 'SG', receiverName: 'First' }), order({ orderNumber: 'ORD-2026-00042', country: 'BN', receiverName: 'Second' })])
    const bytes = buildJtIntlWorkbook(rows)
    const files = unzipSync(bytes)
    expect(Object.keys(files)).toEqual(expect.arrayContaining(['xl/worksheets/sheet2.xml', 'xl/tables/table2.xml']))
    const table = readXlsx(bytes)
    expect(table[0][0]).toBe('Actual Weight')
    expect(table[0][38]).toBe('COD Value')
    expect(table[1][9]).toBe('First')
    expect(table[2][9]).toBe('Second')
    expect(table.flat()).not.toContain('test')
    // Each row number appears once.
    const sheet = strFromU8(files['xl/worksheets/sheet1.xml'])
    expect(sheet.match(/<row r="2"/g)).toHaveLength(1)
    expect(sheet.match(/<row r="3"/g)).toHaveLength(1)
  })
})
