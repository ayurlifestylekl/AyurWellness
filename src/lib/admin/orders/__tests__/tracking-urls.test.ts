import { describe, it, expect } from 'vitest'
import { trackingUrlFor, supportedCarriers } from '../tracking-urls'

describe('trackingUrlFor', () => {
  it('returns a Pos Laju URL with the tracking number', () => {
    const url = trackingUrlFor('Pos Laju', 'PL123456789MY')
    expect(url).toBe('https://www.poslaju.com.my/track-trace/?trackingNo=PL123456789MY')
  })

  it('returns null for Self-Pickup', () => {
    expect(trackingUrlFor('Self-Pickup', 'anything')).toBeNull()
  })

  it('handles J&T Express, Ninja Van, GDex, DHL', () => {
    expect(trackingUrlFor('J&T Express', 'JT001')).toContain('jtexpress.my')
    expect(trackingUrlFor('Ninja Van', 'NV001')).toContain('ninjavan.co')
    expect(trackingUrlFor('GDex', 'GD001')).toContain('gdexpress.com')
    expect(trackingUrlFor('DHL', 'DH001')).toContain('dhl.com')
  })

  it('URL-encodes the tracking number to be safe', () => {
    const url = trackingUrlFor('Pos Laju', 'ABC 123')
    expect(url).toContain('ABC%20123')
  })

  it('supportedCarriers exposes all six carriers', () => {
    expect(supportedCarriers).toHaveLength(6)
    expect(supportedCarriers).toContain('Pos Laju')
    expect(supportedCarriers).toContain('Self-Pickup')
  })
})
