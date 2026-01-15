import { compareColors, compareColorsH, Vector3 } from '../vector.ts'
import { ColorHelper, methodRunner } from '../method-runner.ts'

export function sortByHslSpiral(this: any, colors: Vector3[], model: 'hsl' | 'hsv' | 'lch' | 'okhsl' | 'okhsv' | 'oklch' = 'hsl', mode: 'outward' | 'inward' | 'bottom-up' | 'top-down' = 'bottom-up'): Vector3[] {
  // Convert all colors to HSL with original RGB reference
  const colorsWithHsl = colors.map((vec) => ({
    vec,
    hsl: model.at(-1) === 'h' ? [...vec].reverse() : vec
  }))

  // Sort based on the chosen spiral mode
  return colorsWithHsl
    .sort((a, b) => {
      let [h1, s1, l1] = a.hsl
      let [h2, s2, l2] = b.hsl

      h1 = h1 || 0
      h2 = h2 || 0

      switch (mode) {
        case 'bottom-up':
          // Sort by lightness first, then hue, then saturation
          // Creates a spiral from dark to light
          if (Math.abs(l1 - l2) > 0.05) {
            return l1 - l2
          }

          if (Math.abs(h1 - h2) > 5) {
            return h1 - h2
          }

          return s1 - s2

        case 'top-down':
          // Sort by lightness descending, then hue, then saturation
          if (Math.abs(l1 - l2) > 0.05) {
            return l2 - l1
          }

          if (Math.abs(h1 - h2) > 5) {
            return h1 - h2
          }

          return s1 - s2

        case 'outward':
          // Sort by saturation first (center to edge), then hue, then lightness
          // Creates a spiral from desaturated to saturated
          if (Math.abs(s1 - s2) > 0.05) {
            return s1 - s2
          }

          if (Math.abs(h1 - h2) > 5) {
            return h1 - h2
          }

          return l1 - l2

        case 'inward':
          // Sort by saturation descending, then hue, then lightness
          if (Math.abs(s1 - s2) > 0.05) {
            return s2 - s1
          }

          if (Math.abs(h1 - h2) > 5) {
            return h1 - h2
          }

          return l1 - l2

        default:
          return 0
      }
    })
    .map((item) => item.vec)
}

export function spiral(colors: string[], model: 'hsl' | 'hsv' | 'lch' | 'okhsl' | 'okhsv' | 'oklch' = 'hsl', mode: 'outward' | 'inward' | 'bottom-up' | 'top-down' = 'bottom-up') {
  return methodRunner(
    colors,
    function (this: ColorHelper, vectors: Vector3[]) {
      const compare = model.at(-3) ? compareColorsH : compareColors
      const preSorted = [...vectors].sort(compare)

      return sortByHslSpiral(preSorted, model, mode)
    },
    model
  )
}

spiral.params = [
  { name: 'model', values: ['hsl', 'hsv', 'lch', 'okhsl', 'okhsv', 'oklch'] },
  { name: 'mode', values: ['outward', 'inward', 'bottom-up', 'top-down'] }
]

// Alternative: Pure cylindrical spiral
export function sortByHslCylindrical(colors: Vector3[], model: 'hsl' | 'hsv' | 'lch' | 'okhsl' | 'okhsv' | 'oklch' = 'hsl', direction: 'ascending' | 'descending' = 'ascending'): Vector3[] {
  const colorsWithHsl = colors.map((vec) => {
    const hsl = model.at(-1) === 'h' ? [...vec].reverse() : vec

    // Calculate spiral parameter: combine hue (angle) and lightness (height)
    // Saturation affects the radius
    const spiralParam = (hsl[2] || 0) * 360 + hsl[0] // Lightness * 360 + Hue

    return { vec, hsl, spiralParam }
  })

  colorsWithHsl.sort((a, b) => {
    const diff = direction === 'ascending' ? a.spiralParam - b.spiralParam : b.spiralParam - a.spiralParam

    // If spiral params are similar, sort by saturation
    if (Math.abs(diff) < 1) {
      return a.hsl[1] - b.hsl[1]
    }

    return diff
  })

  return colorsWithHsl.map((item) => item.vec)
}

export function cylindrical(colors: string[], model: 'hsl' | 'hsv' | 'lch' | 'okhsl' | 'okhsv' | 'oklch' = 'hsl', direction: 'ascending' | 'descending' = 'ascending') {
  return methodRunner(
    colors,
    function (this: ColorHelper, vectors: Vector3[]) {
      const compare = model.at(-3) ? compareColorsH : compareColors
      const preSorted = [...vectors].sort(compare)
      return sortByHslCylindrical(preSorted, model, direction)
    },
    model
  )
}

cylindrical.params = [
  { name: 'model', values: ['hsl', 'hsv', 'lch', 'okhsl', 'okhsv', 'oklch'] },
  { name: 'direction', values: ['ascending', 'descending'] }
]
