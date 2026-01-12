import { Vector3 } from './vector.ts'
import { UniColor } from './method-runner.ts'

import { OKLab_to_OKLCH, rgb2okhsl, rgb2okhsv, rgb2oklab } from './color-oklab.ts'
import chroma from 'chroma-js'

import type { Lab, Lch, Hsl, Hsv } from 'culori/fn'
import { useMode, modeLab65, modeRgb, modeLch65, modeHsl, modeHsv } from 'culori/fn'

useMode(modeRgb)

const lab65 = useMode(modeLab65)
const lch65 = useMode(modeLch65)
const cuHsl = useMode(modeHsl)
const cuHsv = useMode(modeHsv)

function gl2luminance([r_, g_, b_]: [number, number, number]) {
  // relative luminance
  // see http://www.w3.org/TR/2008/REC-WCAG20-20081211/#relativeluminancedef
  const r = luminance_x(r_)
  const g = luminance_x(g_)
  const b = luminance_x(b_)

  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function luminance_x(x: number) {
  return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4)
}

function memoize(fn: (arg: any) => any) {
  const map = new Map()

  return (a: any) => {
    if (map.has(a)) {
      return map.get(a)
    }

    const r = fn(a)
    map.set(a, r)
    return r
  }
}

export function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

export const gl = memoize((c) => {
  const [r, g, b] = hexToRgb(c)
  return [r / 255, g / 255, b / 255]
})

export const cmyk = memoize((c) => gl2cmyk(gl(c)))
export const oklab = memoize((c) => rgb2oklab(hexToRgb(c)))
export const okhsl = memoize((c) => rgb2okhsl(c))
export const okhsv = memoize((c) => rgb2okhsv(c))
export const oklch = memoize((c) => OKLab_to_OKLCH(oklab(c)))

export const lch = memoize((c_) => {
  const { l, c, h } = <Lch>(<unknown>lch65(c_))
  return [l, c, h]
})

export const lab = memoize((c) => {
  const { l, a, b } = <Lab>(<unknown>lab65(c))
  return [l, a, b]
})

export const hsl = memoize((c) => {
  const { h, s, l } = <Hsl>(<unknown>cuHsl(c))
  return [h, s, l]
})

export const hsv = memoize((c) => {
  const { h, s, v } = <Hsv>(<unknown>cuHsv(c))
  return [h, s, v]
})

export function nonH(H: number) {
  return H === undefined || isNaN(H) || H === null
}

// export const lab2lch = memoize((c: [number, number, number]) => chroma.lab(...c).lch())

export const luminance = memoize((c: string) => gl2luminance(gl(c)))

export function flatRgb(hexes: string[]) {
  return hexes.map((c) => hexToRgb(c)).flat()
}

export function deltaE(a: string, b: string, x = 1, y = 1, z = 1) {
  return chroma.deltaE(a, b, x, y, z)
}

function normalizeLab(a: Vector3) {
  return [a[0] / 100, (a[1] + 128) / 255, (a[2] + 128) / 255]
}

function intLab(a: Vector3) {
  return [Math.round((a[0] / 100) * 255), Math.round(a[1] + 128), Math.round(a[2] + 128)]
}

function gl2cmyk([r, g, b]: number[]) {
  const k = 1 - Math.max(r, g, b)
  const f = k < 1 ? 1 / (1 - k) : 0
  const c = (1 - r - k) * f
  const m = (1 - g - k) * f
  const y = (1 - b - k) * f

  return [c, m, y, k]
}

export function convertColors(colors: string[], model: ColorType): [UniColor, string][] {
  if (model === 'rgb') {
    return colors.map((c) => [hexToRgb(c), c])
  } else if (model === 'gl') {
    return colors.map((c) => [gl(c), c])
  } else if (model === 'oklab') {
    return colors.map((c) => [oklab(c), c])
  } else if (model === 'oklch') {
    return colors.map((c) => [oklch(c), c])
  } else if (model === 'okhsl') {
    return colors.map((c) => [okhsl(c), c])
  } else if (model === 'okhsv') {
    return colors.map((c) => [okhsv(c), c])
  } else if (model === 'lab') {
    return colors.map((c) => [lab(c), c])
  } else if (model === 'lab_norm') {
    return colors.map((c) => [normalizeLab(lab(c)), c])
  } else if (model === 'lab_int') {
    return colors.map((c) => [intLab(lab(c)), c])
  } else if (model === 'lch') {
    return colors.map((c) => [lch(c), c])
  } else if (model === 'hsl') {
    return colors.map((c) => [hsl(c), c])
  } else if (model === 'hsv') {
    return colors.map((c) => [hsv(c), c])
  } else if (model === 'hex') {
    return colors.map((c) => [c, c])
  } else if (model === 'cmyk') {
    return colors.map((c) => [cmyk(c), c])
  } else {
    throw `Unknown model ${model}`
  }
}

export type ColorType = 'hex' | 'rgb' | 'gl' | 'oklab' | 'oklch' | 'okhsl' | 'okhsv' | 'lab' | 'lab_norm' | 'lab_int' | 'lch' | 'hsv' | 'hsl' | 'cmyk'

export const COLOR_TYPES = {
  rgb: 'rgb',
  oklab: 'oklab',
  lab: 'lab',
  lab_norm: 'lab_norm',
  lab_int: 'lab_int',
  oklch: 'oklch',
  okhsl: 'okhsl',
  okhsv: 'okhsv',
  hex: 'hex',
  hsv: 'hsv',
  hsl: 'hsl',
  lch: 'lch',
  gl: 'gl',
  cmyk: 'cmyk'
} as const satisfies Record<ColorType, ColorType>
