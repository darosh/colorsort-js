// @ts-ignore
import { srgb_transfer_function_inv, srgb_transfer_function, srgb_to_okhsl, srgb_to_okhsv } from './oklab-conversion.js'

const map = new Map()

function memoize(fn: (arg: any) => any) {
  return (a: any) => {
    if (map.has(a)) {
      return map.get(a)
    }

    const r = fn(a)
    map.set(a, r)
    return r
  }
}

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

export const oklab = memoize((c) => rgb2oklab(hexToRgb(c)))
export const okhsl = memoize((c) => rgb2okhsl(c))
export const okhsv = memoize((c) => rgb2okhsv(c))

// https://bottosson.github.io/posts/oklab/
export function rgb2oklab([r_, g_, b_]: [number, number, number]) {
  const r = srgb_transfer_function_inv(r_)
  const g = srgb_transfer_function_inv(g_)
  const b = srgb_transfer_function_inv(b_)

  const l = 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b
  const m = 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b
  const s = 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b

  const l_ = Math.cbrt(l)
  const m_ = Math.cbrt(m)
  const s_ = Math.cbrt(s)

  return [0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_, 1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_, 0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_]
}

export function oklab2rgb([L, a, b]: [number, number, number]) {
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b
  const s_ = L - 0.0894841775 * a - 1.291485548 * b

  const l = l_ * l_ * l_
  const m = m_ * m_ * m_
  const s = s_ * s_ * s_

  return [srgb_transfer_function(+4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s), srgb_transfer_function(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s), srgb_transfer_function(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s)]
}

export function rgb2okhsl(hex: string) {
  return srgb_to_okhsl(hexToRgb(hex))
}

export function rgb2okhsv(hex: string) {
  return srgb_to_okhsv(hexToRgb(hex))
}

export function flatRgb(hexes: string[]) {
  return hexes.map((c) => hexToRgb(c)).flat()
}
