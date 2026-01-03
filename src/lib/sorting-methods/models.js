import chroma from 'chroma-js'
import { oklab as fastOklab } from '../oklab.js'

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

  cmyk() {
    return this.color.cmyk()
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
    return fastOklab(this.value)
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

function model(palette, representation) {
  const p = new Palette(representation)
  palette.forEach((col) => p.addColor(new Color(col)))
  return p.harmonize().map((c) => chroma(c[representation.label](), representation.label).hex())
}

export function hsl(colors) {
  return model(colors, {
    label: 'hsl',
    points: (color) => {
      const [h, s, l] = color.hsl()
      return [h / 360 || 0, s / 100, l / 100]
    }
  })
}

export function hcl(colors) {
  return model(colors, {
    label: 'hcl',
    points: (color) => color.hcl().map((v, i) => (v || 0) * [1 / 360, 1 / 100, 1 / 100][i])
  })
}

export function oklch(colors) {
  return model(colors, {
    label: 'oklch',
    points: (color) => color.oklch().map((v, i) => (v || 0) * [1 / 200, 1 / 100, 1 / 360][i])
  })
}

export function oklab(colors) {
  return model(colors, {
    label: 'oklab',
    points: (color) => color.oklab()
  })
}

export function lab(colors) {
  return model(colors, {
    label: 'lab',
    points: (color) => color.lab().map((v, i) => (v || 0) * [1 / 100, 1 / 95, 1 / 115][i])
  })
}

export function rgb(colors) {
  return model(colors, {
    label: 'rgb',
    points: (color) => color.rgb().map((v) => v / 255)
  })
}

export function cmyk(colors) {
  return model(colors, {
    label: 'cmyk',
    points: (color) => color.cmyk().map((v) => v / 255)
  })
}
