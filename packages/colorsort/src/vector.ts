import { nonH } from './color.ts'

export type Vector3 = [number, number, number]
export type Vector4 = [number, number, number, number]

export function distance(a: Vector3, b: Vector3): number {
  const dx = a[0] - b[0]
  const dy = a[1] - b[1]
  const dz = a[2] - b[2]

  return Math.sqrt(dx * dx + dy * dy + dz * dz)
}

export function distance12(a: Vector3, b: Vector3): number {
  const dy = a[1] - b[1]
  const dz = a[2] - b[2]

  return Math.sqrt(dy * dy + dz * dz)
}

export function distance4(a: Vector4, b: Vector4): number {
  const dx = a[0] - b[0]
  const dy = a[1] - b[1]
  const dz = a[2] - b[2]
  const dw = a[3] - b[3]

  return Math.sqrt(dx * dx + dy * dy + dz * dz + dw * dw)
}

export function distanceRadial0(a: Vector3, b: Vector3) {
  let dx = nonH(a[0]) && nonH(b[0]) ? 0 : a[0] - b[0] || 0

  const dy = a[1] - b[1]
  const dz = a[2] - b[2]

  dx += dx > 180 ? -360 : dx < -180 ? 360 : 0
  dx /= 180

  return Math.sqrt(dx * dx + dy * dy + dz * dz)
}

export function distanceRadial2(a: Vector3, b: Vector3) {
  const dx = a[0] - b[0]
  const dy = a[1] - b[1]

  let dz = nonH(a[2]) && nonH(b[2]) ? 0 : a[2] - b[2] || 0

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

export function add(a: Vector3, b: Vector3): Vector3 {
  return [a[0] + b[0], a[1] + b[1], a[2] + b[2]]
}

export function dot(a: Vector3, b: Vector3): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
}

export function centroid(colors: Vector3[]): Vector3 {
  const sum = colors.reduce((acc, c) => [acc[0] + c[0], acc[1] + c[1], acc[2] + c[2]], [0, 0, 0] as Vector3)

  return [sum[0] / colors.length, sum[1] / colors.length, sum[2] / colors.length]
}

export function compareColors(a: Vector3, b: Vector3): number {
  if (a[0] !== b[0]) {
    return a[0] - b[0]
  }

  if (a[1] !== b[1]) {
    return a[1] - b[1]
  }

  return a[2] - b[2]
}

export function compareColorsH(a: Vector3, b: Vector3): number {
  if (a[1] !== b[1]) {
    return a[1] - b[1]
  }

  if (a[2] !== b[2]) {
    return a[2] - b[2]
  }

  return a[0] - b[0]
}

export function compareColors210(a: Vector3, b: Vector3): number {
  if (a[2] !== b[2]) {
    return (a[2] ?? 0) - (b[2] ?? 0)
  }

  if (a[1] !== b[1]) {
    return a[1] - b[1]
  }

  return a[0] - b[0]
}
