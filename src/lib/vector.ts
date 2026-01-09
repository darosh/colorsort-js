import { ColorHelper, DistanceFn } from './method-runner.ts'

export type Vector3 = [number, number, number]
export type Vector4 = [number, number, number, number]

export function distance(a: Vector3, b: Vector3): number {
  const dx = a[0] - b[0]
  const dy = a[1] - b[1]
  const dz = a[2] - b[2]

  return Math.sqrt(dx * dx + dy * dy + dz * dz)
}

export function distance4(a: Vector4, b: Vector4): number {
  const dx = a[0] - b[0]
  const dy = a[1] - b[1]
  const dz = a[2] - b[2]
  const dw = a[3] - b[3]

  return Math.sqrt(dx * dx + dy * dy + dz * dz + dw * dw)
}

export function distanceRadial0(a: Vector3, b: Vector3) {
  let dx = Number.isNaN(a[0]) && Number.isNaN(b[0]) ? 0 : a[0] - b[0] || 0

  const dy = a[1] - b[1]
  const dz = a[2] - b[2]

  dx += dx > 180 ? -360 : dx < -180 ? 360 : 0
  dx /= 180

  return Math.sqrt(dx * dx + dy * dy + dz * dz)
}

export function distanceRadial2(a: Vector3, b: Vector3) {
  const dx = a[0] - b[0]
  const dy = a[1] - b[1]

  let dz = Number.isNaN(a[2]) && Number.isNaN(b[2]) ? 0 : a[2] - b[2] || 0

  dz += dz > 180 ? -360 : dz < -180 ? 360 : 0
  dz /= 180

  return Math.sqrt(dx * dx + dy * dy + dz * dz)
}

export function normalize(v: Vector3): Vector3 {
  const len = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2])
  if (len === 0) {
    return [0, 0, 0]
  }
  return [v[0] / len, v[1] / len, v[2] / len]
}

export function subtract(a: Vector3, b: Vector3): Vector3 {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]
}

export function dot(a: Vector3, b: Vector3): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
}

export function centroid(colors: Vector3[]): Vector3 {
  const sum = colors.reduce((acc, c) => [acc[0] + c[0], acc[1] + c[1], acc[2] + c[2]], [0, 0, 0] as Vector3)
  return [sum[0] / colors.length, sum[1] / colors.length, sum[2] / colors.length]
}

export function closest(data: Vector3[]) {
  let minDist = Infinity
  let first = null
  let last = null

  // Compare all pairs to find the closest two points
  for (let i = 0; i < data.length; i++) {
    for (let j = i + 1; j < data.length; j++) {
      const dx = data[i][0] - data[j][0]
      const dy = data[i][1] - data[j][1]
      const dz = data[i][2] - data[j][2]
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz)

      if (dist < minDist) {
        minDist = dist
        first = data[i]
        last = data[j]
      }
    }
  }

  return <[Vector3, Vector3]>[first, last]
}

export function closestList(data: Vector3[]) {
  const list = []

  for (let i = 0; i < data.length; i++) {
    for (let j = i + 1; j < data.length; j++) {
      const dx = data[i][0] - data[j][0]
      const dy = data[i][1] - data[j][1]
      const dz = data[i][2] - data[j][2]

      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz)

      list.push({ data: [data[i], data[j]], dist })
    }
  }

  list.sort((a, b) => a.dist - b.dist)

  return <[Vector3, Vector3][]>list.map((d) => d.data)
}

export function inlinest(data: Vector3[], helper: ColorHelper) {
  if (data.length === 2) {
    return <[Vector3, Vector3]>[...data]
  }

  let bestAlignment = -Infinity
  let first: Vector3 | null = null
  let mid: Vector3 | null = null
  let last: Vector3 | null = null

  // Evaluate all combinations of three points
  for (let i = 0; i < data.length; i++) {
    for (let j = 0; j < data.length; j++) {
      if (j === i) {
        continue
      }
      for (let k = 0; k < data.length; k++) {
        if (k === i || k === j) {
          continue
        }

        const dir1 = normalize(subtract(data[j], data[i]))
        const dir2 = normalize(subtract(data[k], data[j]))

        // alignment is 1 when directions are the same, -1 when opposite
        const alignment = dot(dir1, dir2)

        if (alignment > bestAlignment) {
          bestAlignment = alignment
          first = data[i]
          mid = data[j]
          last = data[k]
        }
      }
    }
  }

  if (helper.distance(<Vector3>first, <Vector3>mid) < helper.distance(<Vector3>mid, <Vector3>last)) {
    last = mid
  } else {
    first = mid
  }

  return <[Vector3, Vector3]>[first, last]
}

export function tspVectors(colors: Vector3[], distance: DistanceFn) {
  let improved = true

  while (improved) {
    improved = false

    for (let i = 0; i < colors.length - 2; i++) {
      for (let j = i + 1; j < colors.length - 1; j++) {
        const d1 = distance(colors[i], colors[i + 1]) + distance(colors[j], colors[j + 1])
        const d2 = distance(colors[i], colors[j]) + distance(colors[i + 1], colors[j + 1])

        if (d2 < d1) {
          colors = [...colors.slice(0, i + 1), ...colors.slice(i + 1, j + 1).reverse(), ...colors.slice(j + 1)]
          improved = true
        }
      }
    }
  }

  return colors
}
