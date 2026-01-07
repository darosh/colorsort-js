import chroma from 'chroma-js'

export function sortByHslSpiral(this: any, colors: string[], model: 'hsl' | 'hsv' | 'lch' | 'oklch' = 'hsl', mode: 'outward' | 'inward' | 'bottom-up' | 'top-down' = 'bottom-up'): string[] {
  //console.log({model, mode})

  // Convert all colors to HSL with original RGB reference
  const colorsWithHsl = colors.map((rgb) => ({
    rgb,
    hsl: model[0] === 'h' ? <number[]>(<unknown>chroma(rgb).get(model)) : (<number[]>(<unknown>chroma(rgb).get(model))).reverse()
  }))

  // Sort based on the chosen spiral mode
  return colorsWithHsl
    .sort((a, b) => {
      const [h1, s1, l1] = a.hsl
      const [h2, s2, l2] = b.hsl

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
    .map((item) => item.rgb)
}

sortByHslSpiral.params = [
  { name: 'model', values: ['hsl', 'hsv', 'lch', 'oklch'] },
  { name: 'mode', values: ['outward', 'inward', 'bottom-up', 'top-down'] }
]

// Alternative: Pure cylindrical spiral
export function sortByHslCylindrical(colors: string[], model: 'hsl' | 'hsv' | 'lch' | 'oklch' = 'hsl', direction: 'ascending' | 'descending' = 'ascending'): string[] {
  const colorsWithHsl = colors.map((rgb) => {
    const hsl = model[0] === 'h' ? <number[]>(<unknown>chroma(rgb).get(model)) : (<number[]>(<unknown>chroma(rgb).get(model))).reverse()
    // Calculate spiral parameter: combine hue (angle) and lightness (height)
    // Saturation affects the radius
    const spiralParam = hsl[2] * 360 + hsl[0] // Lightness * 360 + Hue
    return { rgb, hsl, spiralParam }
  })

  colorsWithHsl.sort((a, b) => {
    const diff = direction === 'ascending' ? a.spiralParam - b.spiralParam : b.spiralParam - a.spiralParam

    // If spiral params are similar, sort by saturation
    if (Math.abs(diff) < 1) {
      return a.hsl[1] - b.hsl[1]
    }
    return diff
  })

  return colorsWithHsl.map((item) => item.rgb)
}

sortByHslCylindrical.params = [
  { name: 'model', values: ['hsl', 'hsv', 'lch', 'oklch'] }
  // { name: 'direction', values: ['ascending', 'descending'] }
]
