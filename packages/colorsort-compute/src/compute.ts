import type { PaletteType, MetricsEx } from 'colorsort'
import { getMetricsExRange, metricsExQuality, metricsExQualitySum } from 'colorsort'
import BESTIES from './besties.json' with { type: 'json' }
import { paletteDistance, paletteMap } from './palette-distance.ts'
import { extract } from 'colorgram'
// @ts-ignore
import { isArtist } from 'colorsort-data-palettes'
import { flatRgb } from 'colorsort'

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

export type PaletteGroup = {
  record: SortRecordGrouped
  methods: { index: number; best: boolean; method: Method; time: number; render: Function }[]
}

export type PaletteRecord = {
  key: string
  index: number
  colors: string[]
  type: PaletteType
  records: SortRecord[]
  metricsRange: MetricsEx<[number, number]> | null
  gram: [number, number, number, number][]
}

export type PaletteRecordGrouped = PaletteRecord & {
  groups: PaletteGroup[]
}

export type SortRecord = {
  index: number
  colors: string[] | null
  time: number | null
  palette: PaletteRecord | PaletteRecordGrouped
  method: Method
  metrics: MetricsEx<number> | null
  quality: MetricsEx<number> | null
  score: number | null
  render: Function
  best: boolean
  bestDistance: number | null
  bestDistanceQuality: number | null
}

export type SortRecordGrouped = Omit<SortRecord, 'time' | 'method' | 'render' | 'index' | 'best'>

function groupRecords(palette: PaletteRecord) {
  const groupsMap = new Map<string[], PaletteGroup>()

  for (const record of palette.records) {
    // Skip records without colors
    if (!record.colors) {
      continue
    }

    // Find existing group with matching colors
    let existingKey: string[] | null = null
    for (const [key] of groupsMap) {
      if (colorsEqual(key, record.colors)) {
        existingKey = key
        break
      }
    }

    if (existingKey) {
      // Add to existing group
      const group = groupsMap.get(existingKey)!
      group.methods.push({
        index: record.index,
        best: record.best,
        method: record.method,
        time: record.time ?? 0, // Handle null time
        render: record.render
      })
    } else {
      // Create new group
      groupsMap.set(record.colors, {
        record: {
          colors: record.colors,
          palette: record.palette,
          metrics: record.metrics,
          quality: record.quality,
          score: record.score,
          bestDistance: record.bestDistance,
          bestDistanceQuality: record.bestDistanceQuality
        },
        methods: [
          {
            index: record.index,
            best: record.best,
            method: record.method,
            time: record.time ?? 0,
            render: record.render
          }
        ]
      })
    }
  }

  ;(<PaletteRecordGrouped>palette).groups = Array.from(groupsMap.values())
}

function colorsEqual(a: string[], b: string[]): boolean {
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) {
      return false
    }
  }

  return true
}

function updateRangeAndQuality(palette: PaletteRecordGrouped) {
  palette.metricsRange = getMetricsExRange(palette.groups.map((r) => <MetricsEx<number>>r.record.metrics))

  for (const { record: r, methods } of palette.groups) {
    r.quality = metricsExQuality(<MetricsEx<number>>r.metrics, palette.metricsRange)

    for (const { index } of methods) {
      const qr = palette.records.find((pr) => pr.index === index)

      if (!qr) {
        continue
      }

      qr.quality = r.quality
    }
  }
}

export function updateBest(palette: PaletteRecordGrouped, groupIndex: number, value: boolean) {
  const group = palette.groups[groupIndex]
  const method = group.methods[0]

  for (const g of palette.groups) {
    for (const m of g.methods) {
      m.best = m === method ? value : false

      const fr = palette.records.find((r) => r.index === m.index)

      if (!fr) {
        continue
      }

      fr.best = m.best
    }
  }
}

export function updateDistance(palette: PaletteRecordGrouped) {
  const theBest = palette.records.find((r) => r.best)

  if (!theBest) {
    for (const r of palette.records) {
      r.bestDistance = null
      r.bestDistanceQuality = null
    }

    for (const r of palette.groups) {
      r.record.bestDistance = null
      r.record.bestDistanceQuality = null
    }

    return
  }

  const theBestMap = paletteMap(<string[]>theBest.colors)

  let maxBestDistance = 0

  for (const r of palette.groups) {
    r.record.bestDistance = paletteDistance(theBestMap, <string[]>r.record.colors)

    for (const { index } of r.methods) {
      const qr = palette.records.find((pr) => pr.index === index)

      if (!qr) {
        continue
      }

      qr.bestDistance = r.record.bestDistance
      maxBestDistance = Math.max(maxBestDistance, qr.bestDistance)
    }
  }

  for (const r of palette.groups) {
    r.record.bestDistanceQuality = <number>r.record.bestDistance / maxBestDistance

    for (const { index } of r.methods) {
      const qr = palette.records.find((pr) => pr.index === index)

      if (!qr) {
        continue
      }

      qr.bestDistanceQuality = r.record.bestDistanceQuality
    }
  }
}

export function updateScore(palette: PaletteRecordGrouped) {
  for (const g of palette.groups) {
    g.record.score = metricsExQualitySum(<MetricsEx<number>>g.record.quality) //+ <number>g.record.bestDistanceQuality

    for (const { index } of g.methods) {
      const qr = palette.records.find((pr) => pr.index === index)

      if (!qr) {
        continue
      }

      qr.score = g.record.score
    }
  }
}

export async function computePlan(palettes: [key: string, colors: string[]][], sortingMethods: Method[], render: Function, onRender?: Function) {
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
      groups: null,
      metricsRange: null,
      type: await render({ getPaletteType: colors }),
      gram: extract(
        {
          data: flatRgb(colors),
          channels: 3
        },
        colors.length
      ).sort((a, b) => b[3] - a[3])
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
        score: null,
        best: (method.mid === 'Original' && isArtist(key)) || BESTIES.some((d) => d.key === key && d.mid === method.mid),
        bestDistance: null,
        bestDistanceQuality: null,
        render: () =>
          render({ sortName: method.name, palette: colors })
            // @ts-ignore
            .then(({ result, metrics, elapsed }) => {
              row.colors = result
              row.time = elapsed
              row.metrics = metrics

              if (row.palette.records.filter((r) => r.colors).length === sortingMethods.length) {
                groupRecords(row.palette)
                updateRangeAndQuality(<PaletteRecordGrouped>row.palette)
                updateDistance(<PaletteRecordGrouped>row.palette)
                updateScore(<PaletteRecordGrouped>row.palette)

                ;(<PaletteRecordGrouped>row.palette).groups.sort((a, b) => <number>a.record.score - <number>b.record.score)
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

export function computedSerialize(types: PaletteRecordGrouped[]) {
  return types.map((r) => ({
    ...r,
    records: null,
    groups: r.groups.map((g) => ({
      record: { ...g.record, palette: null },
      methods: g.methods.map((m) => ({
        ...m,
        method: { mid: m.method.mid }
      }))
    }))
  }))
}
