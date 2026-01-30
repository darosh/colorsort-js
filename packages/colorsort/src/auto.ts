import { cosineSimilarity, isValidMethodId, MASTER_LCH } from './index.ts'
import { compareColors } from './vector.ts'
import { metricsFftFingerprint } from './metrics-fft.ts'

const SIMILARITY = cosineSimilarity

export interface Trained {
  mid: string
  colors: number
  fingerprint: number[]
  fingerprints: number
}

export function getAuto(colors: string[], trained: Trained[]) {
  const lchColors = colors.map(MASTER_LCH).sort(compareColors)

  let selected: Trained[] = []
  let selected2: Trained[] = []
  let num = colors.length

  while (!selected.length && num > 1) {
    selected = trained
      .filter((t) => t.colors === num)
      .filter(t => isValidMethodId(t.mid, colors))
    
    num--
  }

  while (!selected2.length && num > 1) {
    selected2 = trained
      .filter((t) => t.colors === num)
      .filter(t => isValidMethodId(t.mid, colors))

    num--
  }

  const { fingerprint } = metricsFftFingerprint(lchColors).analysis

  selected.sort((a, b) => (b.fingerprint && fingerprint ? SIMILARITY(fingerprint, b.fingerprint) : 0) - (a.fingerprint && fingerprint ? SIMILARITY(fingerprint, a.fingerprint) : 0))
  selected2.sort((a, b) => (b.fingerprint && fingerprint ? SIMILARITY(fingerprint, b.fingerprint) : 0) - (a.fingerprint && fingerprint ? SIMILARITY(fingerprint, a.fingerprint) : 0))

  if (selected.length) {
    // const close = selected.filter((x) => Math.abs(1 - cosineSimilarity(selected[0].fingerprint, x.fingerprint)) < 0.001)
    //
    // if (close.length === 1) {
    //   return close.map((d) => d.mid)
    // }

    if (selected.length > 1) {
      const multi = selected.filter((x) => Math.abs(1 - cosineSimilarity(selected[0].fingerprint, x.fingerprint)) < 0.5)

      if (multi.length > 1) {
        multi.sort((a, b) => {
          const d = b.fingerprints - a.fingerprints

          if (d !== 0) {
            return d
          }

          const aCount = trained.filter((t) => t.mid === a.mid && t.colors <= colors.length && t.colors >= colors.length / 2).length
          const bCount = trained.filter((t) => t.mid === b.mid && t.colors <= colors.length && t.colors >= colors.length / 2).length

          // console.log({aCount, bCount})

          return bCount - aCount
        })

        // console.log(multi.map((x) => x.mid))

        // return multi[0].mid
        return multi.map((d) => d.mid)
      }
    }

    // return selected[0].mid
    return selected.map((d) => d.mid)
  }

  // return selected2[0].mid
  return selected2.map((d) => d.mid)
}
