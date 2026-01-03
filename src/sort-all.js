import { render } from '@/render.js'
import { detectPaletteType, metrics } from '@/lib'
import { paletteDistance } from '@/palette-distance.js'

import BESTIES from '@/besties.json' with { type: 'json' }

function renderRow(colors, palette, label, id, mid, key, speed, time = null) {
  return {
    id,
    mid,
    key,
    speed,
    colors,
    palette,
    label,
    time,
    best: BESTIES.some((d) => d.key === key && d.mid === mid),
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

    r.dist = paletteDistance(theBest.colors, r.colors)
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
      maxAngleChange: Number.POSITIVE_INFINITY,
      meanDistance: Number.POSITIVE_INFINITY,
      devDistance: Number.POSITIVE_INFINITY
    }

    const b = bests[r.palette]

    b.totalDistance = Math.min(b.totalDistance, r.metrics.totalDistance)
    b.avgAngleChange = Math.min(b.avgAngleChange, r.metrics.avgAngleChange)
    b.maxAngleChange = Math.min(b.maxAngleChange, r.metrics.maxAngleChange)
    b.meanDistance = Math.min(b.meanDistance, r.metrics.meanDistance)
    b.devDistance = Math.min(b.devDistance, r.metrics.devDistance)
  })

  return bests
}

export async function sortAll(palettes, sortingMethods = [], onrender) {
  const sorted = []
  const types = []
  const entries = Object.entries(palettes)

  entries.forEach(([key, palette], index) => {
    // Original unsorted
    const mid = 'Original'
    sorted.push(renderRow(palette, index + 1, 'Original', sorted.length, mid, key, 0, 0))
    types.push({ ...detectPaletteType(palette), id: index + 1 })
  })

  entries.forEach(([key, palette], index) => {
    sortingMethods.forEach(({ name, speed, mid }) => {
      const row = renderRow([], index + 1, `${name}`, sorted.length, mid, key, speed)
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
