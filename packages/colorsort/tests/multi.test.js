import { test, expect } from 'vitest'
import { multiAuto, oklab } from '../src/index.ts'
import DATA from '../dist/trained.json' with { type: 'json' }

function s (sorted) {
  const first = oklab(sorted[0])
  const last = oklab(sorted.at(-1))

  if (first[0] > last[0]) {
    sorted.reverse()
  }

  return sorted
}

test('multi', () => {
  const colors_1 = ['#070000', '#661821', '#9F2131', '#FC224A', '#DCD966', '#FBFAF7', '#91908F', '#25272A']
  const colors_2 = ['#18191B', '#374A79', '#2F74BA', '#25ACDD', '#EFEFEF', '#F7B69E', '#E76EAB', '#E43A4D']
  const colors_3 = ['#0B0000', '#1C191A', '#383838', '#715430', '#BC8432', '#ECC738', '#DFC7A3', '#FEF0C2']
  const colors_4 = ['#0A2138', '#203E5F', '#4A6E89', '#95A7AA', '#E4C3A5', '#C17B73', '#985951', '#6C4138']

  const MAX = 15
  const zz = multiAuto(colors_1, DATA, MAX).at(0)

  console.log(zz.mid)

  const s1 = s(multiAuto(colors_1, DATA, MAX)[0].sorted)
  const s2 = s(multiAuto(colors_2, DATA, MAX)[0].sorted)
  const s3 = s(multiAuto(colors_3, DATA, MAX)[0].sorted)
  const s4 = s(multiAuto(colors_4, DATA, MAX)[0].sorted)

  expect(s1).toEqual(colors_1)
  expect(s2).toEqual(colors_2)
  expect(s3).toEqual(colors_3)
  expect(s4).toEqual(colors_4)
})
