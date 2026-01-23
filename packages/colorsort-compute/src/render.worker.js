import { detectPaletteType, featuresLab, metricsFftFingerprint, SORTING_METHODS, lch, oklab, metricsEx } from 'colorsort'

export async function timed(fn) {
  const start = performance.now()
  const result = await fn()
  const elapsed = performance.now() - start
  return { result, elapsed }
}

self.onmessage = async (msg) => {
  const { sortName, getPaletteType, palette, getFingerprint, getSpectral } = msg.data

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
  } else if (getFingerprint) {
    const lchColors = getFingerprint.map((c) => lch(c))
    self.postMessage(metricsFftFingerprint(lchColors))
  } else if (getSpectral) {
    const labColors = getSpectral.map((c) => oklab(c))
    self.postMessage(featuresLab(labColors))
  }
}
