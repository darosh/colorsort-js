import chroma from 'chroma-js'
import { Palette, Color, timed } from '@/sort.js'
import { representations, sortingMethods } from '@/sortings.js'

self.onmessage = (msg) => {
  const { representationLabel, sortName, palette } = msg.data

  if (representationLabel) {
    const representation = representations.find((r) => r.label === representationLabel)

    const { result, elapsed } = timed(() => {
      const p = new Palette(representation)

      palette.forEach((col) => p.addColor(new Color(col)))

      return p.harmonize().map((c) => chroma(c[representation.label](), representation.label).hex())
    })

    self.postMessage({ result, elapsed })
  } else if (sortName) {
    const fn = sortingMethods.find((d) => d.name === sortName).fn
    const { result, elapsed } = timed(() => fn(palette))
    self.postMessage({ result, elapsed })
  }
}
