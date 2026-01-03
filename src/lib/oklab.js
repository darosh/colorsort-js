import chroma from 'chroma-js'

const map = new Map()

function memoize(fn) {
  return (a) => {
    if (map.has(a)) {
      return map.get(a)
    }

    const r = fn(a)
    map.set(a, r)
    return r
  }
}

export const oklab = memoize((c) => chroma(c).oklab())
