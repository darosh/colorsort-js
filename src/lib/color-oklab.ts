// https://bottosson.github.io/posts/oklab/
import { Vector3 } from './vector.ts'
import { srgb_to_okhsl, srgb_to_okhsv, srgb_transfer_function, srgb_transfer_function_inv } from './color-oklab-conversion.ts'
import { hexToRgb } from './color.ts'

export function rgb2oklab([r_, g_, b_]: [number, number, number]) {
  const r = srgb_transfer_function_inv(r_ / 255)
  const g = srgb_transfer_function_inv(g_ / 255)
  const b = srgb_transfer_function_inv(b_ / 255)

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

  return [srgb_transfer_function(+4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s) * 255, srgb_transfer_function(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s) * 255, srgb_transfer_function(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s) * 255]
}

export function rgb2okhsl(hex: string) {
  return srgb_to_okhsl(hexToRgb(hex))
}

export function rgb2okhsv(hex: string) {
  return srgb_to_okhsv(hexToRgb(hex))
}

// https://www.w3.org/TR/css-color-4/#color-conversion-code
const RAD2DEG = 180 / Math.PI

export function OKLab_to_OKLCH(OKLab: [number, number, number]) {
  const chroma = Math.sqrt(Math.pow(OKLab[1], 2) + Math.pow(OKLab[2], 2)) // Chroma
  let hue = Math.atan2(OKLab[2], OKLab[1]) * RAD2DEG

  if (hue < 0) {
    hue = hue + 360
  }

  if (chroma <= 0.000004) {
    hue = NaN
  }

  return [
    OKLab[0], // L is still L
    chroma, // Chroma
    hue // Hue, in degrees [0 to 360)
  ]
}

// https://github.com/w3c/csswg-drafts/issues/6642#issuecomment-945714988
const OK2_SCALE = (2.016 + 2.045) / 2

export function distanceOk2([L1, a1, b1]: Vector3, [L2, a2, b2]: Vector3) {
  let dL = L1 - L2
  let da = OK2_SCALE * (a1 - a2)
  let db = OK2_SCALE * (b1 - b2)
  return Math.sqrt(dL ** 2 + da ** 2 + db ** 2)
}

// const DEG2RAD = Math.PI / 180

/*
function Lab_to_LCH (Lab: [number, number, number]) {
  const chroma = Math.sqrt(Math.pow(Lab[1], 2) + Math.pow(Lab[2], 2)) // Chroma
  let hue = Math.atan2(Lab[2], Lab[1]) * RAD2DEG

  if (hue < 0) {
    hue = hue + 360
  }

  if (chroma <= 0.0015) {
    hue = NaN
  }

  return [
    Lab[0], // L is still L
    chroma, // Chroma
    hue // Hue, in degrees [0 to 360)
  ]
}

function LCH_to_Lab (LCH: [number, number, number]) {
  // Convert from polar form
  return [
    LCH[0], // L is still L
    LCH[1] * Math.cos(LCH[2] * DEG2RAD), // a
    LCH[1] * Math.sin(LCH[2] * DEG2RAD) // b
  ]
}
*/
