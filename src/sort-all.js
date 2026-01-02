import { render } from '@/render.js'
import { detectPaletteType } from '@/types.js'

function renderRow(colors, palette, label, id, key, time = null) {
  return {
    id,
    key,
    colors,
    palette,
    label,
    time
  }
}

async function pause(to = 0) {
  return new Promise((resolve) => setTimeout(resolve, to))
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

  await pause()

  entries.forEach(([key, palette], index) => {
    // Color space sorts using Palette class
    representations.forEach((representation) => {
      const row = renderRow([], index + 1, `${representation.name}`, sorted.length, key)
      sorted.push(row)

      render({ representationLabel: representation.label, palette }).then(({ result, elapsed }) => onrender({ result, elapsed, row }))
    })
  })

  await pause()

  entries.forEach(([key, palette], index) => {
    // Other sorting methods
    sortingMethods.forEach(({ name }) => {
      const row = renderRow([], index + 1, `${name}`, sorted.length, key)
      sorted.push(row)

      render({ sortName: name, palette }).then(({ result, elapsed }) => onrender({ result, elapsed, row }))
    })
  })

  await pause()

  sorted.sort((a, b) => a.palette - b.palette)

  return { sorted, types }
}
