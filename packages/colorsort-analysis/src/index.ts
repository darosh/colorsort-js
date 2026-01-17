// Extract all unique algorithms and their performance
import type { PaletteRecordGrouped, PaletteRecord, SortRecord } from 'colorsort-compute'

export type PaletteType = {
  scores: number[]
  bestCount: number
}

export type AlgoStat = {
  mid: string
  name: string
  scores: number[]
  bestCount: number
  onlyBestCount: number
  totalCount: number
  avgScore: number
  medianScore: number
  stdDev: number
  winRate: number
  paletteTypes: Map<string, PaletteType>
  palettes: string[]
}

export function algorithmStats(records: PaletteRecordGrouped[]) {
  if (!records.length) {
    return []
  }

  const algoMap = new Map<string, AlgoStat>()

  for (const palette of records) {
    for (const group of palette.groups) {
      // Each group has multiple methods that tested the same grouped result
      for (const methodInfo of group.methods) {
        const mid = methodInfo.method?.mid

        if (!mid) {
          continue
        }

        if (!algoMap.has(mid)) {
          algoMap.set(mid, {
            mid,
            name: methodInfo.method.name,
            scores: [],
            bestCount: 0,
            onlyBestCount: 0,
            totalCount: 0,
            avgScore: 0,
            medianScore: 0,
            stdDev: 0,
            winRate: 0,
            paletteTypes: new Map(),
            palettes: []
          })
        }

        const stat = <AlgoStat>algoMap.get(mid)
        stat.scores.push(<number>group.record.score)
        stat.totalCount++

        const isBest = methodInfo.best || group.methods.some((m) => m.best)

        if (isBest) {
          stat.bestCount++
          stat.palettes.push(palette.key)
        }

        if (isBest && group.methods.length === 1) {
          stat.onlyBestCount++
        }

        // Track performance by palette type
        const pType = palette.type?.type || 'unknown'

        if (!stat.paletteTypes.has(pType)) {
          stat.paletteTypes.set(pType, { scores: [], bestCount: 0 })
        }

        const pt = <PaletteType>stat.paletteTypes.get(pType)

        pt.scores.push(<number>group.record.score)

        if (isBest) {
          pt.bestCount++
        }
      }
    }
  }

  // Calculate statistics
  algoMap.forEach((stat) => {
    stat.scores.sort((a, b) => a - b)
    stat.avgScore = stat.scores.reduce((a, b) => a + b, 0) / stat.scores.length
    stat.medianScore = stat.scores[Math.floor(stat.scores.length / 2)]
    const variance = stat.scores.reduce((sum, val) => sum + Math.pow(val - stat.avgScore, 2), 0) / stat.scores.length
    stat.stdDev = Math.sqrt(variance)
    stat.winRate = (stat.bestCount / stat.totalCount) * 100 //.toFixed(1)
  })

  return Array.from(algoMap.values()).sort((a, b) => a.avgScore - b.avgScore)
}

export function palettesData(sr: SortRecord[]) {
  const obj = sr.reduce(
    (acc: { [k: string]: PaletteRecord }, item) => {
      acc[item.palette.key] = acc[item.palette.key] || item.palette

      return acc
    },
    <{ [k: string]: PaletteRecord }>{}
  )

  return Object.values(obj)
}

export function palettesCovered(palettes: { [k: string]: PaletteRecord }, algoStats: AlgoStat[]) {
  const covered = <
    {
      [k: string]: {
        key: string
        colors: number
        covered: boolean
      }
    }
  >{}

  console.log(algoStats)

  for (const { key, colors } of Object.values(palettes)) {
    covered[key] = {
      key,
      colors: colors.length,
      covered: false
    }
  }

  for (const { palettes } of algoStats) {
    for (const p of palettes) {
      covered[p].covered = true
    }
  }

  return covered
}

export function palettesByColorCount(palettes: { [k: string]: PaletteRecord }, algoStats: AlgoStat[]) {
  const pcs = palettesCovered(palettes, algoStats)
  const map = new Map()

  console.log(palettes)

  for (const { colors, covered } of Object.values(pcs)) {
    const o = map.get(colors) ?? { colors, palettes: 0, covered: 0, uncovered: 0 }

    o.palettes++

    if (covered) {
      o.covered++
    } else {
      o.uncovered++
    }

    map.set(colors, o)
  }

  return map
    .values()
    .toArray()
    .sort((a, b) => a.colors - b.colors)
}

export function topCoverageAlgorithms(algorithmStats: AlgoStat[], targetCoverage: number) {
  const palettes = new Set()
  const top = []

  for (const alst of algorithmStats) {
    if (!alst.bestCount) {
      continue
    }

    const used = alst.palettes.some((p) => !palettes.has(p))

    if (used) {
      for (const pal of alst.palettes) {
        if (!palettes.has(pal)) {
          palettes.add(pal)
        }
      }

      top.push(alst)

      if (palettes.size >= targetCoverage) {
        return top
      }
    }
  }

  return top
}

// Top performers
export function topAlgorithms(algorithmStats: AlgoStat[], minScore: number) {
  return algorithmStats
    .filter((a) => a.avgScore <= minScore)
    .map((a) => ({
      name: a.name,
      fullName: a.name,
      mid: a.mid,
      avgScore: a.avgScore,
      winRate: a.winRate,
      count: a.totalCount,
      bestCount: a.bestCount
    }))
}

export type AlgoScore = {
  scores: []
  bestCount: 0
  name: string
}

export type Characteristics = {
  avgLightnessRange: number[]
  avgChromaRange: number[]
  avgHueSpread: number[]
}

// Palette type analysis
export function paletteTypeAnalysis(records: PaletteRecordGrouped[]) {
  if (!records.length) {
    return []
  }

  const typeMap = new Map()

  for (const palette of records) {
    const pType = palette.type?.type || 'unknown'

    if (!typeMap.has(pType)) {
      typeMap.set(pType, {
        type: pType,
        count: 0,
        algoScores: new Map<string, AlgoScore>(),
        characteristics: <Characteristics>{
          avgChromaRange: [],
          avgLightnessRange: [],
          avgHueSpread: []
        }
      })
    }

    const typeData = typeMap.get(pType)
    typeData.count++

    if (palette.type?.data) {
      typeData.characteristics.avgLightnessRange.push(palette.type.data.lightnessRange || 0)
      typeData.characteristics.avgChromaRange.push(palette.type.data.chromaRange || 0)
      typeData.characteristics.avgHueSpread.push(palette.type.data.hueSpread || 0)
    }

    for (const group of palette.groups) {
      for (const methodInfo of group.methods) {
        const mid = methodInfo.method?.mid
        if (!mid || !group.record.score) {
          continue
        }

        if (!typeData.algoScores.has(mid)) {
          typeData.algoScores.set(mid, {
            scores: [],
            bestCount: 0,
            name: methodInfo.method.name
          })
        }

        typeData.algoScores.get(mid).scores.push(group.record.score)
        if (methodInfo.best) {
          typeData.algoScores.get(mid).bestCount++
        }
      }
    }
  }

  // Calculate averages
  typeMap.forEach((typeData) => {
    const chars = typeData.characteristics
    typeData.avgLightnessRange = chars.avgLightnessRange.reduce((a: number, b: number) => a + b, 0) / chars.avgLightnessRange.length
    typeData.avgChromaRange = chars.avgChromaRange.reduce((a: number, b: number) => a + b, 0) / chars.avgChromaRange.length
    typeData.avgHueSpread = chars.avgHueSpread.reduce((a: number, b: number) => a + b, 0) / chars.avgHueSpread.length

    const ae = <[string, AlgoScore][]>Array.from(typeData.algoScores.entries())

    typeData.topAlgos = ae
      .map(([mid, data]) => ({
        mid,
        name: data.name,
        avgScore: data.scores.reduce((a, b) => a + b, 0) / data.scores.length,
        winRate: ((data.bestCount / typeData.count) * 100).toFixed(1)
      }))
      .sort((a, b) => b.avgScore - a.avgScore)
  })

  return Array.from(typeMap.values())
}

// Scatter plot data for pattern detection
export function scatterData(records: PaletteRecordGrouped[], selectedAlgo: string) {
  if (!records.length || !selectedAlgo) {
    return []
  }

  return records.flatMap((palette) => {
    const group = palette.groups?.find((g) => g.methods?.some((m) => m.method?.mid === selectedAlgo))
    if (!group || !group.record.score || !palette.type?.data) {
      return []
    }

    return [
      {
        x: palette.type.data.lightnessRange || 0,
        y: group.record.score,
        chromaRange: palette.type.data.chromaRange || 0,
        hueSpread: palette.type.data.hueSpread || 0,
        type: palette.type.type
      }
    ]
  })
}
