import { Vector3 } from './vector.ts'

export function metrics(colors: string[] | Vector3[]): {
  totalDistance: number
  avgAngleChange: number
  maxAngleChange: number
  meanDistance: number
  devDistance: number
}
