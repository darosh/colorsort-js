import { render } from '@/render.js'
import { detectPaletteType } from '@/types.js'
import BESTIES from '@/besties.json' with { type: 'json' }
import { distance } from '@/distance.js'
import { metrics } from '@/metrics.js'

function renderRow(colors, palette, label, id, key, time = null) {
  return {
    id,
    key,
    colors,
    palette,
    label,
    time,
    best: BESTIES.some((d) => d.key === key && d.label === label),
    dist: null,
    metrics: colors.length ? metrics(colors) : null,
    bestMetrics: null
  }
}

function updateDistance(row, sorted) {
  if (row.dist !== null) {
    return
  }

  const same = sorted.filter((r) => r.palette === row.palette)
  const theBest = same.find((r) => r.best)

  if (!theBest || !theBest.colors.length) {
    return
  }

  for (const r of same) {
    if (!r.colors.length || r.dist !== null) {
      continue
    }

    r.dist = distance(theBest.colors, r.colors)
  }
}

export function updateDistances(sorted) {
  sorted.forEach((r) => updateDistance(r, sorted))
}

export function updateDistancesPalette(sorted, palette) {
  sorted.forEach((r) => {
    if (r.palette === palette) {
      r.dist = null
      updateDistance(r, sorted)
    }
  })
}

export function bestMetrics(sorted) {
  const bests = {}

  sorted.forEach((r) => {
    bests[r.palette] = bests[r.palette] || {
      totalDistance: Number.POSITIVE_INFINITY,
      avgAngleChange: Number.POSITIVE_INFINITY,
      maxAngleChange: Number.POSITIVE_INFINITY
    }

    const b = bests[r.palette]

    b.totalDistance = Math.min(b.totalDistance, r.metrics.totalDistance)
    b.avgAngleChange = Math.min(b.avgAngleChange, r.metrics.avgAngleChange)
    b.maxAngleChange = Math.min(b.maxAngleChange, r.metrics.maxAngleChange)
  })

  return bests
}

export async function sortAll(palettes, representations = [], sortingMethods = [], onrender) {
  const sorted = []
  const types = []
  const entries = Object.entries(palettes)

  entries.forEach(([key, palette], index) => {
    // Original unsorted
    sorted.push(renderRow(palette, index + 1, 'Original', sorted.length, key, 0))
    types.push({ ...detectPaletteType(palette), id: index + 1 })
  })

  entries.forEach(([key, palette], index) => {
    // Color space sorts using Palette class
    representations.forEach((representation) => {
      const row = renderRow([], index + 1, `${representation.name}`, sorted.length, key)
      sorted.push(row)
      row.render = () =>
        render({ representationLabel: representation.label, palette }).then(({ result, elapsed }) => {
          // updateDistance(row, sorted)
          onrender({ result, elapsed, row })
        })
    })
  })

  entries.forEach(([key, palette], index) => {
    // Other sorting methods
    sortingMethods.forEach(({ name }) => {
      const row = renderRow([], index + 1, `${name}`, sorted.length, key)
      sorted.push(row)
      row.render = () =>
        render({ sortName: name, palette }).then(({ result, elapsed }) => {
          // updateDistance(row, sorted)
          onrender({ result, elapsed, row })
        })
    })
  })

  sorted.sort((a, b) => a.palette - b.palette)

  return { sorted, types }
}
