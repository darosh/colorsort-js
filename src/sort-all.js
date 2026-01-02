import { render } from '@/render.js'
import { detectPaletteType } from '@/types.js'
import BESTIES from '@/besties.json' with { type: 'json' }

function renderRow(colors, palette, label, id, key, time = null) {
  return {
    id,
    key,
    colors,
    palette,
    label,
    time,
    best: BESTIES.some(d => d.key === key && d.label === label)
  }
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
      row.render = () => render({ representationLabel: representation.label, palette }).then(({ result, elapsed }) => onrender({ result, elapsed, row }))
    })
  })

  entries.forEach(([key, palette], index) => {
    // Other sorting methods
    sortingMethods.forEach(({ name }) => {
      const row = renderRow([], index + 1, `${name}`, sorted.length, key)
      sorted.push(row)
      row.render = () => render({ sortName: name, palette }).then(({ result, elapsed }) => onrender({ result, elapsed, row }))
    })
  })

  sorted.sort((a, b) => a.palette - b.palette)

  return { sorted, types }
}
