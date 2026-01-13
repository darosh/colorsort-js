import { ColorHelper } from './method-runner.ts'
import { dot, normalize, subtract, Vector3 } from './vector.ts'

export function closest(data: Vector3[]) {
  return closestList(data)[0]
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
