import { describe, it, expect } from 'vitest'
import { barChartPath, linePath } from '../charts'

describe('barChartPath', () => {
  it('handles all zeros without dividing by zero', () => {
    const { bars, max } = barChartPath([0, 0, 0], 90, 100)
    expect(max).toBe(1)
    expect(bars).toHaveLength(3)
    expect(bars.every((b) => b.h === 0)).toBe(true)
  })

  it('scales tallest bar to full height', () => {
    const { bars } = barChartPath([5, 10, 2], 100, 100)
    const tallest = bars.reduce((a, b) => (b.h > a.h ? b : a))
    expect(tallest.h).toBeCloseTo(100, 1)
  })
})

describe('linePath', () => {
  it('returns the right number of points', () => {
    const { points } = linePath([1, 2, 3, 4], 90, 60)
    expect(points).toHaveLength(4)
  })

  it('handles single-point input', () => {
    const { d, points } = linePath([5], 100, 100)
    expect(points).toHaveLength(1)
    expect(d.startsWith('M')).toBe(true)
  })
})
