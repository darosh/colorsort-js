import chroma from 'chroma-js'
import { distance, dot, normalize, subtract } from '@/vector.ts'

export function metrics(colors) {
  const vectors = colors.map((c) => chroma(c).oklab())

  if (vectors.length < 2) {
    return { totalDistance: 0, avgAngleChange: 0, maxAngleChange: 0 }
  }

  let totalDistance = 0
  let angleChanges = []
  let prevDirection = null

  for (let i = 1; i < vectors.length; i++) {
    const dist = distance(vectors[i - 1], vectors[i])
    totalDistance += dist

    const direction = normalize(subtract(vectors[i], vectors[i - 1]))

    if (prevDirection && dist > 0) {
      const dotProd = Math.max(-1, Math.min(1, dot(prevDirection, direction)))
      const angle = Math.acos(dotProd) * (180 / Math.PI)
      angleChanges.push(angle)
    }

    prevDirection = direction
  }

  const avgAngleChange = angleChanges.length > 0 ? angleChanges.reduce((a, b) => a + b, 0) / angleChanges.length : 0

  const maxAngleChange = angleChanges.length > 0 ? Math.max(...angleChanges) : 0

  return { totalDistance, avgAngleChange, maxAngleChange }
}
