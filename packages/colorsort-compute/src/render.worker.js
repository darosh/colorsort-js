import { detectPaletteType, featuresLab, metricsFftFingerprint, SORTING_METHODS, lch, oklab, metricsEx, MASTER_LCH, normalizeUp } from 'colorsort-js'

export async function timed(fn) {
  const start = performance.now()
  const result = await fn()
  const elapsed = performance.now() - start
  return { result, elapsed }
}

self.onmessage = async (msg) => {
  const { sortName, getPaletteType, palette, getFingerprint, getSpectral } = msg.data

  if (sortName) {
    // console.log(`Worker sorting ${sortName}`)

    const fn = SORTING_METHODS.find((d) => d.mid === sortName).fn

    const { result, elapsed } = await timed(async () => {
      return await fn(palette)
    })

    normalizeUp(result)

    const metrics = metricsEx(result)

    self.postMessage({ result, metrics, elapsed })
  } else if (getPaletteType) {
    // console.log(`Worker type`)
    const lchColors = getPaletteType.map((c) => lch(c))
    self.postMessage(detectPaletteType(lchColors))
  } else if (getFingerprint) {
    // console.log(`Worker fingerprint`)
    const lchColors = getFingerprint.map((c) => MASTER_LCH(c))
    self.postMessage(metricsFftFingerprint(lchColors))
  } else if (getSpectral) {
    // console.log(`Worker spectral`)
    const labColors = getSpectral.map((c) => oklab(c))
    self.postMessage(featuresLab(labColors))
  } else {
    console.error(`Worker unknown!`, msg.data)
    throw new Error('Worker unknown!')
  }
}
