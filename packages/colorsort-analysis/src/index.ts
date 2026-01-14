// Extract all unique algorithms and their performance
import type { MethodInfo, PaletteGroup, PaletteRecordGrouped } from 'colorsort-compute'

export type PaletteType = {
 scores: number[], bestCount: number  
}

export type AlgoStat = {
  mid: string,
  name: string,
  scores: number[],
  bestCount: number,
  totalCount: number,
  avgScore: number,
  medianScore: number,
  stdDev: number,
  winRate: number,
  paletteTypes: Map<string, PaletteType>
}

export function algorithmStats (records: PaletteRecordGrouped[]) {
  if (!records.length) return []

  const algoMap = new Map<string, AlgoStat>()

  records.forEach(palette => {
    palette.groups?.forEach((group: PaletteGroup) => {
      // Each group has multiple methods that tested the same grouped result
      group.methods?.forEach((methodInfo: MethodInfo) => {
        const mid = methodInfo.method?.mid
        if (!mid || !group.record.score) return

        if (!algoMap.has(mid)) {
          algoMap.set(mid, {
            mid,
            name: methodInfo.method.name,
            scores: [],
            bestCount: 0,
            totalCount: 0,
            avgScore: 0,
            medianScore: 0,
            stdDev: 0,
            winRate: 0,
            paletteTypes: new Map()
          })
        }

        const stat = <AlgoStat>algoMap.get(mid)
        stat.scores.push(group.record.score)
        stat.totalCount++
        if (methodInfo.best) stat.bestCount++

        // Track performance by palette type
        const pType = palette.type?.type || 'unknown'
        if (!stat.paletteTypes.has(pType)) {
          stat.paletteTypes.set(pType, { scores: [], bestCount: 0 })
        }
        
        const pt = <PaletteType>stat.paletteTypes.get(pType)
          
        pt.scores.push(group.record.score)
        
        if (methodInfo.best) {
          pt.bestCount++
        }
      })
    })
  })

  // Calculate statistics
  algoMap.forEach(stat => {
    stat.scores.sort((a, b) => a - b)
    stat.avgScore = stat.scores.reduce((a, b) => a + b, 0) / stat.scores.length
    stat.medianScore = stat.scores[Math.floor(stat.scores.length / 2)]
    const variance = stat.scores.reduce((sum, val) => sum + Math.pow(val - stat.avgScore, 2), 0) / stat.scores.length
    stat.stdDev = Math.sqrt(variance)
    stat.winRate = (stat.bestCount / stat.totalCount * 100) //.toFixed(1)
  })

  return Array.from(algoMap.values())
    .sort((a, b) => b.avgScore - a.avgScore)
}

// // Top performers
// export function topAlgorithms (algorithmStats, minScore) {
//   return algorithmStats
//     .filter(a => a.avgScore >= minScore)
//     .map(a => ({
//       name: a.name.length > 30 ? a.name.substring(0, 27) + '...' : a.name,
//       fullName: a.name,
//       mid: a.mid,
//       avgScore: parseFloat(a.avgScore.toFixed(2)),
//       winRate: parseFloat(a.winRate),
//       count: a.totalCount,
//       bestCount: a.bestCount
//     }))
// }
//
// // Palette type analysis
// export function paletteTypeAnalysis (records: PaletteRecordGrouped[]) {
//   if (!records.length) return []
//
//   const typeMap = new Map()
//
//   records.forEach(palette => {
//     const pType = palette.type?.type || 'unknown'
//     if (!typeMap.has(pType)) {
//       typeMap.set(pType, {
//         type: pType,
//         count: 0,
//         algoScores: new Map(),
//         characteristics: {
//           avgLightnessRange: [],
//           avgChromaRange: [],
//           avgHueSpread: []
//         }
//       })
//     }
//
//     const typeData = typeMap.get(pType)
//     typeData.count++
//
//     if (palette.type?.data) {
//       typeData.characteristics.avgLightnessRange.push(palette.type.data.lightnessRange || 0)
//       typeData.characteristics.avgChromaRange.push(palette.type.data.chromaRange || 0)
//       typeData.characteristics.avgHueSpread.push(palette.type.data.hueSpread || 0)
//     }
//
//     palette.groups?.forEach(group => {
//       group.methods?.forEach(methodInfo => {
//         const mid = methodInfo.method?.mid
//         if (!mid || !group.record.score) return
//
//         if (!typeData.algoScores.has(mid)) {
//           typeData.algoScores.set(mid, {
//             scores: [],
//             bestCount: 0,
//             name: methodInfo.method.name
//           })
//         }
//
//         typeData.algoScores.get(mid).scores.push(group.record.score)
//         if (methodInfo.best) {
//           typeData.algoScores.get(mid).bestCount++
//         }
//       })
//     })
//   })
//
//   // Calculate averages
//   typeMap.forEach(typeData => {
//     const chars = typeData.characteristics
//     typeData.avgLightnessRange = chars.avgLightnessRange.reduce((a, b) => a + b, 0) / chars.avgLightnessRange.length
//     typeData.avgChromaRange = chars.avgChromaRange.reduce((a, b) => a + b, 0) / chars.avgChromaRange.length
//     typeData.avgHueSpread = chars.avgHueSpread.reduce((a, b) => a + b, 0) / chars.avgHueSpread.length
//
//     typeData.topAlgos = Array.from(typeData.algoScores.entries())
//       .map(([mid, data]) => ({
//         mid,
//         name: data.name,
//         avgScore: data.scores.reduce((a, b) => a + b, 0) / data.scores.length,
//         winRate: (data.bestCount / typeData.count * 100).toFixed(1)
//       }))
//       .sort((a, b) => b.avgScore - a.avgScore)
//   })
//
//   return Array.from(typeMap.values())
// }
//
// // Scatter plot data for pattern detection
// export function scatterData (records: PaletteRecordGrouped[], selectedAlgo) {
//   if (!records.length || !selectedAlgo) return []
//
//   return records.flatMap(palette => {
//     const group = palette.groups?.find(g =>
//       g.methods?.some(m => m.method?.mid === selectedAlgo)
//     )
//     if (!group || !group.record.score || !palette.type?.data) return []
//
//     return [{
//       x: palette.type.data.lightnessRange || 0,
//       y: group.record.score,
//       chromaRange: palette.type.data.chromaRange || 0,
//       hueSpread: palette.type.data.hueSpread || 0,
//       type: palette.type.type
//     }]
//   })
// }
