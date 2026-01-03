import { SORTING_METHODS } from '@/lib'
import { oklab } from '@/lib/oklab.js'

export async function timed(fn) {
  const start = performance.now()
  const result = await fn()
  const elapsed = performance.now() - start
  return { result, elapsed }
}

self.onmessage = async (msg) => {
  const { sortName, palette } = msg.data

  const fn = SORTING_METHODS.find((d) => d.name === sortName).fn

  const { result, elapsed } = await timed(async () => {
    return await fn(palette)
  })

  const first = oklab(result[0])
  const last = oklab(result.at(-1))

  if (first[0] > last[0]) {
    result.reverse()
  }

  self.postMessage({ result, elapsed })
}
