import { compareColors, compareColorsH, Vector3 } from '../vector.ts'
import { compareLumLCH, deltaE } from '../color.ts'
import { ColorHelperDelta, methodRunner } from '../method-runner.ts'

interface HarmonizeOptions {
  selectStart: (colors: Vector3[]) => Vector3
  distance: (a: Vector3, b: Vector3) => number
  compareColors: (a: Vector3, b: Vector3) => number
}

export function harmonize(colors: Vector3[], options: HarmonizeOptions): Vector3[] {
  if (colors.length === 0) {
    return []
  }

  if (colors.length === 1) {
    return colors
  }

  const { selectStart, distance, compareColors } = options

  // Build complete graph edges
  const edges = new Map<Vector3, Vector3[]>()

  for (const color of colors) {
    edges.set(
      color,
      colors.filter((c) => c !== color)
    )
  }

  // Start greedy traversal
  let current = selectStart(colors)

  const result: Vector3[] = [current]
  const visited = new Set<Vector3>([current])

  // Greedily pick nearest unvisited neighbor
  while (result.length < colors.length) {
    const neighbors = edges.get(current)!
    const unvisited = neighbors.filter((n) => !visited.has(n))

    // Find closest unvisited neighbor
    let nearest = unvisited[0]
    let minDistance = distance(current, nearest)

    for (let i = 1; i < unvisited.length; i++) {
      const candidate = unvisited[i]
      const d = distance(current, candidate)

      // Use lexicographic comparison as tie-breaker
      if (d < minDistance || (d === minDistance && compareColors(candidate, nearest) < 0)) {
        minDistance = d
        nearest = candidate
      }
    }

    current = nearest
    visited.add(current)
    result.push(current)
  }

  return result
}

export function harmonizeModel(colors: string[], model: 'hsl' | 'hsv' | 'oklch' | 'oklab' | 'okhsl' | 'okhsv' | 'lch' | 'lab' | 'rgb' | 'cmyk' = 'rgb', start: 'bright' | 'dark' = 'bright', distance: 'euclidean' | 'delta' = 'euclidean') {
  return methodRunner(
    colors,
    function (this: ColorHelperDelta, data: Vector3[]) {
      const { toColors } = this

      function selectBrightest(colors: Vector3[]): Vector3 {
        const hexes = toColors(colors)

        const hex = hexes.reduce((brightest, color) => {
          return compareLumLCH(color, brightest) > 0 ? color : brightest
        })

        return colors[hexes.indexOf(hex)]
      }

      function selectDarkest(colors: Vector3[]): Vector3 {
        const hexes = toColors(colors)

        const hex = hexes.reduce((darkest, color) => {
          return compareLumLCH(color, darkest) < 0 ? color : darkest
        })

        return colors[hexes.indexOf(hex)]
      }

      return harmonize(data, {
        selectStart: start === 'bright' ? selectBrightest : selectDarkest,
        distance: distance === 'euclidean' ? this.distance : this.delta,
        compareColors: model.at(-3) === 'h' ? compareColorsH : compareColors
      })
    },
    model,
    { fn: deltaE, color: true }
  )
}

harmonizeModel.params = [
  { name: 'model', values: ['hsl', 'hsv', 'oklch', 'oklab', 'okhsl', 'okhsv', 'lch', 'lab', 'rgb', 'cmyk'] },
  { name: 'start', values: ['bright', 'dark'] }
]

export function harmonizeDelta(colors: string[], start: 'bright' | 'dark' = 'bright') {
  return harmonizeModel(colors, 'rgb', start, 'delta')
}

harmonizeDelta.params = [{ name: 'start', values: ['bright', 'dark'] }]
