import chroma from 'chroma-js'
import { Palette, Color, timed } from '@/sort.js'
import { representations, sortingMethods } from '@/sortings.js'
import { oklab } from '@/oklab.js'

self.onmessage = async (msg) => {
  const { representationLabel, sortName, palette } = msg.data

  if (representationLabel) {
    const representation = representations.find((r) => r.label === representationLabel)

    const { result, elapsed } = await timed(() => {
      const p = new Palette(representation)

      palette.forEach((col) => p.addColor(new Color(col)))

      return p.harmonize().map((c) => chroma(c[representation.label](), representation.label).hex())
    })

    const first = oklab(result[0])
    const last = oklab(result.at(-1))

    if (first[0] > last[0]) {
      result.reverse()
    }

    self.postMessage({ result, elapsed })
  } else if (sortName) {
    const fn = sortingMethods.find((d) => d.name === sortName).fn

    const { result, elapsed } = await timed(async () => {
      return await fn(palette)
    })

    const first = oklab(result[0])
    const last = oklab(result.at(-1))

    if (first[0] > last[0]) {
      result.reverse()
    }

    self.postMessage({ result, elapsed })
  }
}
