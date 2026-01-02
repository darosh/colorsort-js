import chroma from 'chroma-js'
import { oklab } from './oklab.js'

export class Color {
  constructor(value) {
    this.value = value
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
    // return this.color.oklab()
    return oklab(this.value)
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

export async function timed(fn) {
  const start = performance.now()
  const result = await fn()
  const elapsed = performance.now() - start
  return { result, elapsed }
}
