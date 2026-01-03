import chroma from 'chroma-js'
import { Vector3 } from '../vector.ts'

/**
 * Convert 3D coordinates to Hilbert curve index
 * This ensures spatially close points stay close in the sorted order
 */
function hilbertIndex(x: number, y: number, z: number, order: number = 8): number {
  let index = 0

  for (let i = order - 1; i >= 0; i--) {
    const mask = 1 << i
    const px = x & mask ? 1 : 0
    const py = y & mask ? 1 : 0
    const pz = z & mask ? 1 : 0

    index = (index << 3) | hilbertPointToIndex(px, py, pz)
  }

  return index
}

function hilbertPointToIndex(x: number, y: number, z: number): number {
  // Simplified 3D Hilbert curve mapping (one octant)
  return (x << 2) | (y << 1) | z
}

export function sortByHilbertCurve(colors: Vector3[]): Vector3[] {
  return [...colors].sort((a, b) => {
    const indexA = hilbertIndex(a[0], a[1], a[2])
    const indexB = hilbertIndex(b[0], b[1], b[2])

    return indexA - indexB
  })
}

export function hilbertRgb(colors: string[]) {
  const vectorMap = new Map()

  colors
    .map((c) => [chroma(c).gl(), c])
    .forEach(([key, value]) => {
      vectorMap.set(key, value)
    })

  const vectors = <Vector3[]>(<unknown>vectorMap.keys())
  const sorted = sortByHilbertCurve(vectors)

  return sorted.map((c) => vectorMap.get(c))
}

export function hilbertOklab(colors: string[]) {
  const vectorMap = new Map()

  colors
    .map((c) => [chroma(c).oklab(), c])
    .forEach(([key, value]) => {
      vectorMap.set(key, value)
    })

  const vectors = <Vector3[]>(<unknown>vectorMap.keys())
  const sorted = sortByHilbertCurve(vectors)

  return sorted.map((c) => vectorMap.get(c))
}
