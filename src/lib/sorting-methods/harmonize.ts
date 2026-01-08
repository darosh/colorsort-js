import chroma from 'chroma-js'
import { ColorHelper, colorVectors, distance4, Vector3 } from '../vector.ts'

interface HarmonizeOptions {
  selectStart: (colors: Vector3[]) => Vector3
  distance: (a: Vector3, b: Vector3) => number
}

export function harmonize(colors: Vector3[], options: HarmonizeOptions): Vector3[] {
  if (colors.length === 0) {
    return []
  }

  if (colors.length === 1) {
    return colors
  }

  const { selectStart, distance } = options

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
      const d = distance(current, unvisited[i])

      if (d < minDistance) {
        minDistance = d
        nearest = unvisited[i]
      }
    }

    current = nearest
    visited.add(current)
    result.push(current)
  }

  return result
}

export function harmonizeModel(colors: string[], model: 'hsl' | 'hcl' | 'hsv' | 'oklch' | 'oklab' | 'okhsl' | 'okhsv' | 'lch' | 'lab' | 'rgb' | 'cmyk' = 'rgb', start: 'bright' | 'dark' = 'bright', distance: 'euclidean' | 'delta' = 'euclidean') {
  return colorVectors(
    colors,
    function (this: ColorHelper, data: Vector3[]) {
      const { toColors } = this

      function selectBrightest(colors: Vector3[]): Vector3 {
        const hexes = toColors(colors)

        const hex = hexes.reduce((brightest, color) => {
          return chroma(color).luminance() > chroma(brightest).luminance() ? color : brightest
        })

        return colors[hexes.indexOf(hex)]
      }

      function selectDarkest(colors: Vector3[]): Vector3 {
        const hexes = toColors(colors)

        const hex = hexes.reduce((darkest, color) => {
          return chroma(color).luminance() < chroma(darkest).luminance() ? color : darkest
        })

        return colors[hexes.indexOf(hex)]
      }

      return harmonize(data, {
        selectStart: start === 'bright' ? selectBrightest : selectDarkest,
        distance: distance === 'euclidean' ? this.distance : this.deltaE
      })
    },
    model,
    model === 'cmyk' ? <any>distance4 : undefined
  )
}

harmonizeModel.params = [
  { name: 'model', values: ['hsl', 'hcl', 'hsv', 'oklch', 'oklab', 'okhsl', 'okhsv', 'lch', 'lab', 'rgb', 'cmyk'] },
  { name: 'start', values: ['bright', 'dark'] }
]

export function harmonizeDelta(colors: string[], start: 'bright' | 'dark' = 'bright') {
  return harmonizeModel(colors, 'rgb', start, 'delta')
}

harmonizeDelta.params = [{ name: 'start', values: ['bright', 'dark'] }]
