import { test, expect } from 'vitest'
import { add, distanceRadial2, subtract, Vector3 } from '../src/vector.ts'
import { oklab, oklch } from '../src'
import { distanceOk2 } from '../src/color.ts'

interface ColorInfo {
  hex: string;
  lch: Vector3
}

function getPermutations (n: number): number[][] {
  const result: number[][] = []
  const arr = Array.from({ length: n }, (_, i) => i)

  function permute (arr: number[], m: number[] = []) {
    if (arr.length === 0) {
      result.push(m)
    } else {
      for (let i = 0; i < arr.length; i++) {
        const curr = arr.slice()
        const next = curr.splice(i, 1)
        permute(curr, m.concat(next))
      }
    }
  }

  permute(arr)
  return result
}

export function sortMultiRampPalette (colors: string[], numRamps: number): string[] {
  const colorInfos: ColorInfo[] = colors.map(hex => ({
    hex,
    lch: oklch(hex)
  }))

  let sortedByLightness = [...colorInfos].sort((a, b) => a.lch[0] - b.lch[0])
  
  const permutations = getPermutations(numRamps)
  const ramps: ColorInfo[][] = Array.from({ length: numRamps }, (_, i) => [sortedByLightness[i]])

  ramps.sort((a, b) => a[0].lch[2] - b[0].lch[2])
  
  while (sortedByLightness.length) {
    sortedByLightness = sortedByLightness.slice(numRamps)
    
    if (!sortedByLightness.length) {
      break
    }

    const prevs: ColorInfo[] = ramps.map(x => <ColorInfo>x.at(-2)) 
    const lasts: ColorInfo[] = ramps.map(x => <ColorInfo>x.at(-1)) 
    
    const besties = permutations.map(per => {
      const sum = per.reduce((acc, p, i) => {
        const a = lasts[i]
        const b = sortedByLightness[p]

        // return acc + deltaE(a.hex, b.hex)
        // return acc + Math.abs(a.lch[2] - b.lch[2])
        
        if (prevs[i]) {
          // const z = subtract(a.lch, prevs[i].lch)
          // const za = add(a.lch, z)
          //
          // return acc + distanceRadial2(za, b.lch)
          
          const oka = oklab(a.hex)
          const okb = oklab(b.hex)
          const okp = oklab(prevs[i].hex)

          const z = subtract(oka, okp)
          const za = add(oka, z)

          return acc + distanceOk2(za, okb)
        } else {
          return acc + distanceRadial2(a.lch, b.lch)
        }
      }, 0)
      
      return {
        sum,
        per
      }
    })
      .sort((a, b) => a.sum - b.sum)
  
  const best = besties[0].per
    for (const p of best) {
      ramps[best.indexOf(p)].push(sortedByLightness[p])      
    }
  }

  return ramps.flatMap((x) => x.map(y => y.hex))
}

export function sortMultiRampPalette2 (colors: string[], numRamps: number): string[] {
  const colorInfos: ColorInfo[] = colors.map(hex => ({
    hex,
    lch: oklch(hex)
  }))

  let sortedByLightness = [...colorInfos].sort((a, b) => a.lch[0] - b.lch[0])

  const ramps: ColorInfo[][] = Array.from({ length: numRamps }, (_, i) => [sortedByLightness[i]])

  ramps.sort((a, b) => a[0].lch[2] - b[0].lch[2])

  sortedByLightness = sortedByLightness.slice(numRamps)

  // Change to assign one color at a time instead of layers of numRamps
  while (sortedByLightness.length) {
    const b = sortedByLightness.shift()!

    let bestCost = Infinity
    let bestI = -1

    for (let i = 0; i < numRamps; i++) {
      const a = ramps[i].at(-1)!
      const prev = ramps[i].at(-2)

      let cost: number
      if (prev) {
        const hp = prev.lch[2]
        const z = a.lch[2] - hp
        const zaH = a.lch[2] + z
        cost = Math.pow(zaH - b.lch[2], 2)
      } else {
        cost = Math.pow(a.lch[2] - b.lch[2], 2)
      }

      if (cost < bestCost) {
        bestCost = cost
        bestI = i
      }
    }

    ramps[bestI].push(b)
  }

  return ramps.flatMap((x) => x.map(y => y.hex))
}

test('rampi', () => {
// Example usage
  const palette = [
    '#450a0a', '#7f1d1d', '#991b1b', '#b91c1c', '#dc2626', '#ef4444', '#f87171', '#fca5a5', '#fecaca', '#fee2e2', '#fef2f2',
    '#431407', '#7c2d12', '#9a3412', '#c2410c', '#ea580c', '#f97316', '#fb923c', '#fdba74', '#fed7aa', '#ffedd5', '#fff7ed',
    '#451a03', '#78350f', '#92400e', '#b45309', '#d97706', '#f59e0b', '#fbbf24', '#fcd34d', '#fde68a', '#fef3c7', '#fffbeb']

  const sorted = sortMultiRampPalette2([...palette].sort(() => Math.random() - .5), 3)
  
  expect(sorted).toEqual(palette)
})
