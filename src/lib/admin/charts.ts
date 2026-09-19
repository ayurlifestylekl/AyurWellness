export function barChartPath(
  values: number[],
  width: number,
  height: number,
  gap = 4
): { bars: Array<{ x: number; y: number; w: number; h: number }>; max: number } {
  const max = Math.max(1, ...values)
  const count = Math.max(1, values.length)
  const barW = (width - gap * (count - 1)) / count
  const bars = values.map((v, i) => {
    const h = (v / max) * height
    return { x: i * (barW + gap), y: height - h, w: barW, h }
  })
  return { bars, max }
}

export function linePath(
  values: number[],
  width: number,
  height: number
): { d: string; max: number; points: Array<{ x: number; y: number }> } {
  const max = Math.max(1, ...values)
  const stepX = values.length > 1 ? width / (values.length - 1) : 0
  const points = values.map((v, i) => ({
    x: i * stepX,
    y: height - (v / max) * height,
  }))
  const d = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(' ')
  return { d, max, points }
}
