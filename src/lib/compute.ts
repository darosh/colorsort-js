import { PaletteType } from './types.ts'
import { getMetricsExRange, MetricsEx, metricsExQuality } from './metrics.ts'
import { render } from '../render.js'
import BESTIES from '../besties.json' with { type: 'json' }
import { paletteDistance, paletteMap } from '../palette-distance.ts'

export type Method = {
  name: string
  fn: Function
  speed: number
  mid: string
  description: {
    model: any
    method: any
    diff: any
  }
}

export type PaletteRecord = {
  key: string
  index: number
  colors: string[]
  type: PaletteType
  records: SortRecord[]
  metricsRange: MetricsEx<[number, number]> | null
}

export type SortRecord = {
  index: number
  colors: string[] | null
  time: number | null
  palette: PaletteRecord
  method: Method
  metrics: MetricsEx<number> | null
  quality: MetricsEx<number> | null
  render: Function
  best: boolean
  bestDistance: number | null
}

function updateRangeAndQuality(palette: PaletteRecord) {
  palette.metricsRange = getMetricsExRange(palette.records.map((r) => <MetricsEx<number>>r.metrics))

  for (const r of palette.records) {
    r.quality = metricsExQuality(<MetricsEx<number>>r.metrics, palette.metricsRange)
  }

  const theBest = palette.records.find((r) => r.best)

  if (!theBest) {
    return
  }

  const theBestMap = paletteMap(<string[]>theBest.colors)

  for (const r of palette.records) {
    r.bestDistance = paletteDistance(theBestMap, <string[]>r.colors)
  }
}

export async function computePlan(palettes: [key: string, colors: string[]][], sortingMethods: Method[], onRender?: Function) {
  const sorted = []
  const types = <PaletteRecord[]>[]
  let index = 0
  let paletteIndex = 0
  let done = 0
  let donePalettes = 0

  for (const [key, colors] of palettes) {
    const palette = {
      key,
      index: paletteIndex,
      colors: colors,
      records: <SortRecord[]>[],
      metricsRange: null,
      type: await render({ getPaletteType: colors })
    }

    types.push(palette)

    paletteIndex++

    for (const method of sortingMethods) {
      const row = <SortRecord>{
        index,
        colors: null,
        time: null,
        palette,
        method,
        metrics: null,
        quality: null,
        best: BESTIES.some((d) => d.key === key && d.mid === method.mid),
        bestDistance: null,
        render: () =>
          render({ sortName: method.name, palette: colors })
            // @ts-ignore
            .then(({ result, metrics, elapsed }) => {
              row.colors = result
              row.time = elapsed
              row.metrics = metrics

              if (row.palette.records.filter((r) => r.colors).length === sortingMethods.length) {
                updateRangeAndQuality(row.palette)
                donePalettes++
              }

              done++

              if (onRender) {
                onRender({
                  row,
                  total: sorted.length,
                  done,
                  totalPalettes: types.length,
                  donePalettes,
                  progress: (100 * done) / sorted.length,
                  progressPalettes: (100 * donePalettes) / types.length
                })
              }
            })
      }

      palette.records.push(row)

      index++

      sorted.push(row)
    }
  }

  return { sorted, types }
}

export function computeRender(sorted: SortRecord[]) {
  const promises = []

  for (const item of sorted) {
    promises.push(item.render())
  }

  return promises
}

export function computedSerialize(computed: { sorted: SortRecord[]; types: PaletteRecord[] }) {
  return {
    sorted: computed.sorted.map((r) => ({
      ...r,
      palette: {
        index: r.palette.index
      }
    })),
    types: computed.types.map((r) => ({
      ...r,
      records: null
    }))
  }
}
