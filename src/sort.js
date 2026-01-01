import chroma from 'chroma-js'

export class Color {
  constructor(value) {
    this.color = chroma(value)
  }
  hex() {
    return this.color.hex()
  }
  rgb() {
    return this.color.rgb()
  }
  hsl() {
    return this.color.hsl()
  }
  hcl() {
    return this.color.hcl()
  }
  oklch() {
    return this.color.oklch()
  }
  oklab() {
    return this.color.oklab()
  }
  lab() {
    return this.color.lab()
  }
  toString() {
    return this.hex()
  }
}

export class Palette {
  constructor(representation) {
    this.edges = {}
    this.colors = new Set()
    this.representation = representation
  }

  addColor(color) {
    this.edges[color] = []
    this.colors.forEach((c) => this.link(color, c))
    this.colors.add(color)
  }

  link(a, b) {
    this.edges[a].push(b)
    this.edges[b].push(a)
  }

  harmonize() {
    if (this.colors.size === 0) {
      return []
    }

    const colors = [...this.colors.values()]
    colors.sort((a, b) => a.color.luminance() - b.color.luminance())

    let current = colors.pop()
    const palette = new Set([current])

    while (palette.size < this.colors.size) {
      const unexplored = this.edges[current].filter((n) => !palette.has(n))
      const distances = unexplored.map((c) => ({
        color: c,
        distance: chroma.distance(current.color, c.color, this.representation.label)
      }))
      distances.sort((a, b) => a.distance - b.distance)
      current = distances[0].color
      palette.add(current)
    }

    return [...palette.values()]
  }
}

export function timed(fn) {
  const start = performance.now()
  const result = fn()
  const elapsed = performance.now() - start
  return { result, elapsed }
}
