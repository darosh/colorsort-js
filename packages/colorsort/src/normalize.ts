import { oklab } from './color.ts'

export function normalizeUp(colors: string[]) {
  const first = oklab(colors[0])
  const last = oklab(colors.at(-1))

  if (first[0] > last[0]) {
    colors.reverse()
  }

  return colors
}

export function normalizeDown(colors: string[]) {
  const first = oklab(colors[0])
  const last = oklab(colors.at(-1))

  if (first[0] < last[0]) {
    colors.reverse()
  }

  return colors
}
