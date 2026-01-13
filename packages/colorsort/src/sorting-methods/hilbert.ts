import { Vector3 } from '../vector.ts'
import { methodRunner } from '../method-runner.ts'

/**
 * Convert 3D (0 to 255) coordinates to Hilbert curve index
 * This ensures spatially close points stay close in the sorted order
 */
export function hilbertIndex([x, y, z]: [number, number, number]): number {
  let index = 0

  for (let i = 8 - 1; i >= 0; i--) {
    const mask = 1 << i
    const px = x & mask ? 1 : 0
    const py = y & mask ? 1 : 0
    const pz = z & mask ? 1 : 0

    index = (index << 3) | hilbertPointToIndex([px, py, pz])
  }

  return index
}

function hilbertPointToIndex([x, y, z]: [number, number, number]): number {
  // Simplified 3D Hilbert curve mapping (one octant)
  return (x << 2) | (y << 1) | z
}

export function sortByHilbertCurve(colors: Vector3[]): Vector3[] {
  const cache = new Map<Vector3, number>()

  return [...colors].sort((a, b) => {
    let indexA
    let indexB

    if (cache.has(a)) {
      indexA = <number>cache.get(a)
    } else {
      indexA = hilbertIndex(a)
      cache.set(a, indexA)
    }

    if (cache.has(b)) {
      indexB = <number>cache.get(b)
    } else {
      indexB = hilbertIndex(b)
      cache.set(b, indexB)
    }

    return indexA - indexB
  })
}

export function hilbert(colors: string[], model: 'rgb' | 'lab_int' = 'rgb') {
  return methodRunner(colors, sortByHilbertCurve, model)
}

hilbert.params = [{ name: 'model', values: ['rgb', 'lab_int'] }]
