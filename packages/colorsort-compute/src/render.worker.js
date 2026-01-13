import { detectPaletteType, SORTING_METHODS } from 'colorsort'
import { lch, oklab } from 'colorsort'
import { metricsEx } from 'colorsort'

export async function timed(fn) {
  const start = performance.now()
  const result = await fn()
  const elapsed = performance.now() - start
  return { result, elapsed }
}

self.onmessage = async (msg) => {
  const { sortName, getPaletteType, palette } = msg.data

  if (sortName) {
    const fn = SORTING_METHODS.find((d) => d.name === sortName).fn

    const { result, elapsed } = await timed(async () => {
      return await fn(palette)
    })

    const first = oklab(result[0])
    const last = oklab(result.at(-1))

    if (first[0] > last[0]) {
      result.reverse()
    }

    const metrics = metricsEx(result)

    self.postMessage({ result, metrics, elapsed })
  } else if (getPaletteType) {
    const lchColors = getPaletteType.map((c) => lch(c))
    self.postMessage(detectPaletteType(lchColors))
  }
}
