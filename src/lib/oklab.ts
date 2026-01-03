import chroma from 'chroma-js'

const map = new Map()

function memoize(fn: (arg: any) => any) {
  return (a: any) => {
    if (map.has(a)) {
      return map.get(a)
    }

    const r = fn(a)
    map.set(a, r)
    return r
  }
}

export const oklab = memoize((c) => chroma(c).oklab())
export const oklab2hex = memoize((c: [number, number, number]) => chroma.oklab(...c).hex())
