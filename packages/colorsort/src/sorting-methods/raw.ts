import { compareColors, compareColorsH, Vector3 } from '../vector.ts'
import { ColorHelperDelta, methodRunner } from '../method-runner.ts'

export function raw(colors: string[], model: 'hsl' | 'hsv' | 'oklch' | 'oklab' | 'okhsl' | 'okhsv' | 'lch' | 'lab' | 'rgb' | 'cmyk' = 'rgb') {
  const compare = model.at(-3) === 'h' ? compareColorsH : compareColors

  return methodRunner(
    colors,
    function (this: ColorHelperDelta, data: Vector3[]) {
      return data.sort(compare)
    },
    model
  )
}

raw.params = [{ name: 'model', values: ['hsl', 'hsv', 'oklch', 'oklab', 'okhsl', 'okhsv', 'lch', 'lab', 'rgb', 'cmyk'] }]
