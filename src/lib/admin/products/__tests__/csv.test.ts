import { describe, it, expect } from 'vitest'
import { parseProductsCsv, productsToCsv } from '../csv'

describe('parseProductsCsv', () => {
  it('parses a valid two-row CSV with headers', () => {
    const csv =
      'name,sku,price_rm,stock_qty,status\n' +
      'Kesha Oil,KSH-100,85,42,active\n' +
      'Brahmi,BRH-60,45,18,active\n'
    const { rows, errors } = parseProductsCsv(csv)
    expect(errors).toEqual([])
    expect(rows).toHaveLength(2)
    expect(rows[0].name).toBe('Kesha Oil')
    expect(rows[0].price_rm).toBe(85)
    expect(rows[0].status).toBe('active')
  })

  it('reports an error when a row is missing required columns', () => {
    const csv =
      'name,sku,price_rm,stock_qty,status\n' +
      'No-SKU,,80,1,active\n'
    const { rows, errors } = parseProductsCsv(csv)
    expect(rows).toHaveLength(0)
    expect(errors).toHaveLength(1)
    expect(errors[0].line).toBe(2)
    expect(errors[0].message).toContain('sku')
  })

  it('handles quoted fields containing commas', () => {
    const csv =
      'name,sku,price_rm,stock_qty,status\n' +
      '"Triphala, organic",TRI-100,35,12,active\n'
    const { rows } = parseProductsCsv(csv)
    expect(rows[0].name).toBe('Triphala, organic')
  })

  it('rejects invalid status values', () => {
    const csv =
      'name,sku,price_rm,stock_qty,status\n' +
      'Bad,BAD-1,10,1,foobar\n'
    const { rows, errors } = parseProductsCsv(csv)
    expect(rows).toHaveLength(0)
    expect(errors[0].message).toContain('status')
  })

  it('rejects negative prices and non-integer stock', () => {
    const csv =
      'name,sku,price_rm,stock_qty,status\n' +
      'Bad,BAD-1,-5,1,active\n' +
      'Bad2,BAD-2,10,1.5,active\n'
    const { rows, errors } = parseProductsCsv(csv)
    expect(rows).toHaveLength(0)
    expect(errors).toHaveLength(2)
  })
})

describe('productsToCsv', () => {
  it('emits headers and rows with quoted fields where needed', () => {
    const out = productsToCsv([
      {
        name: 'Triphala, organic',
        sku: 'TRI-100',
        price_rm: 35,
        stock_qty: 12,
        status: 'active',
      },
    ])
    expect(out.split('\n')[0]).toContain('name,sku,price_rm,stock_qty,status')
    expect(out).toContain('"Triphala, organic"')
  })

  it('emits empty cells for missing optional fields', () => {
    const out = productsToCsv([
      {
        name: 'Plain',
        sku: 'PLN-1',
        price_rm: 10,
        stock_qty: 5,
        status: 'active',
      },
    ])
    // Plain,PLN-1,10,5,active,,,,,,,,,,,,,,,,,,,
    const dataLine = out.split('\n')[1]
    expect(dataLine.startsWith('Plain,PLN-1,10,5,active,')).toBe(true)
  })
})
