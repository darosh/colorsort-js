import { MASTER_ROUND } from './index.ts'

type O = Record<string, any> | Array<number | any> | number

export function roundAll(obj: O) {
  if (typeof obj === 'number' && isFinite(obj)) {
    return MASTER_ROUND(obj)
  }

  if (Array.isArray(obj)) {
    for (let key = 0; key < obj.length; key++) {
      const value = obj[key]

      if (isFinite(value)) {
        obj[key] = MASTER_ROUND(value)
      } else if (typeof value === 'object') {
        roundAll(value)
      }
    }

    return obj
  } else if (typeof obj === 'object') {
    for (const [key, value] of Object.entries(obj)) {
      if (isFinite(value)) {
        obj[key] = MASTER_ROUND(value)
      } else if (typeof value === 'object') {
        roundAll(value)
      }
    }

    return obj
  }
}
