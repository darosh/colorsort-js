import chroma from 'chroma-js'
import PALETTES_DATA from 'colorsort-data-palettes-lospec/palettes.json' with { type: 'json' }
import { Poline, positionFunctions } from 'poline'
import { formatHex } from 'culori'
import { randomizer, oklab } from 'colorsort-js'

const next = randomizer()

function toHex([h, s, l]) {
  return formatHex({ mode: 'okhsl', h, s, l })
}

// const r = randomizer()
// const rp = () => {
//   return new Set(new Poline({
//     anchorColors: [
//       [r() * 180, r() * .5 + .5, r() * .5 + .5],
//       [r() * 180 + 180, r() * .5 + .5, r() * .5 + .5]
//     ],
//     numPoints: r() * 4 + 3,
//     positionFunctionX: Object.values(positionFunctions)[Math.floor(r() * 8)],
//     positionFunctionY: Object.values(positionFunctions)[Math.floor(r() * 8)],
//     positionFunctionZ: Object.values(positionFunctions)[Math.floor(r() * 8)],
//     invertedLightness: r() > .5
//   }).colors.map(toHex)).values().toArray().filter(x => x !== '#000000').filter(x => x !== '#ffffff').slice(1,-1)
// }

export const PALETTES = {
  grayscale: Array(16)
    .fill()
    .map((_, i) => chroma.rgb([i * 16, i * 16, i * 16]).hex()),
  'grayscale-red': Array(16)
    .fill()
    .map((_, i) => (!i ? '#ff0000' : chroma.rgb([i * 16, i * 16, i * 16]).hex())),
  'yellow-green-1': chroma.scale('YlGn').colors(12),
  'yellow-green-2': chroma.scale('YlGn').gamma(0.25).colors(13).slice(1),
  spectral: chroma.scale('Spectral').colors(12),
  'chroma-1': chroma.scale([chroma.lch(50, 0, 1), chroma.lch(50, 100, 1)]).colors(24),
  'chroma-2': [
    ...chroma.scale([chroma.lch(50, 0, 1), chroma.lch(50, 100, 1)]).colors(8),
    ...chroma
      .scale([chroma.lch(50, 0, 181), chroma.lch(50, 100, 181)])
      .colors(9)
      .slice(1)
  ],
  'helix-1': chroma.cubehelix().scale().colors(16),
  'helix-2': chroma.cubehelix().scale().correctLightness().colors(16),
  'helix-3': chroma.cubehelix().rotations(6).scale().colors(24),
  'helix-4': chroma.cubehelix().rotations(3).scale().correctLightness().colors(64),
  'yellow-grey': chroma.scale(['#fafa6e', '#2A4858']).mode('lch').colors(6),
  'blue-pink': chroma.scale(['blue', 'pink']).mode('oklch').colors(8),
  'extreme-1': [
    // Absolute extremes
    '#000000', // black: L=0, V=0, undefined hue
    '#FFFFFF', // white: L=100, zero chroma

    // Primary extremes (RGB corners)
    '#FF0000', // red
    '#00FF00', // green
    '#0000FF', // blue

    // Secondary extremes
    '#FFFF00', // yellow (max Lab b+)
    '#00FFFF', // cyan (negative a*)
    '#FF00FF', // magenta (extreme chroma)

    // Near-black chromatic (hue instability tests)
    '#010000',
    '#000100',
    '#000001',

    // Near-white chromatic
    '#FFFEFF',
    '#FFFFFE',
    '#FEFFFF',

    // Max saturation, medium lightness
    '#800000',
    '#008000',
    '#000080',

    // High chroma past perceptual balance
    '#FF7F00', // orange (Lab a+ b+)
    '#7FFF00', // yellow-green
    '#00FF7F', // spring green
    '#007FFF', // azure
    '#7F00FF', // violet
    '#FF007F', // rose

    // Grayscale ramp (zero chroma across L)
    '#202020',
    '#404040',
    '#808080',
    '#BFBFBF',

    // Opponent-axis stress tests (Lab & OKLab)
    // '#00FF00', // +a / -b boundary
    // '#FF00FF', // +a / +b extreme
    // '#00FFFF', // -a / -b extreme

    // Clipping-prone values
    '#FF0001',
    '#00FF01',
    '#0100FF',

    // HDR-like illusion (bright but low chroma)
    '#F8F8F8',
    '#101010',

    // Hue wrap & discontinuity
    // '#FF0000',
    '#FF0100',
    '#FE0000',

    // Brown / low-light chroma edge
    '#4B2E1E',
    '#7A5230'
  ],
  'extreme-2': ((extremes) => extremes.flatMap((r) => extremes.flatMap((g) => extremes.map((b) => `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`))))([0x00, 0x01, 0x7f, 0x80, 0xfe, 0xff]),
  'poline-1': new Poline({
    anchorColors: [
      [20, 0.42, 0.18],
      [162, 0.9, 0.86]
    ],
    numPoints: 10,
    positionFunctionX: positionFunctions.smoothStepPosition,
    positionFunctionY: positionFunctions.sinusoidalPosition,
    positionFunctionZ: positionFunctions.quarticPosition,
    invertedLightness: true
  }).colors.map(toHex),
  'poline-2': new Poline({
    anchorColors: [
      [217, 0.75, 0.32],
      [49, 0.49, 0.32]
    ],
    numPoints: 7,
    positionFunctionX: positionFunctions.linearPosition,
    positionFunctionY: positionFunctions.sinusoidalPosition,
    positionFunctionZ: positionFunctions.exponentialPosition,
    closedLoop: true,
    invertedLightness: true
  }).colors
    .slice(0, -1)
    .map(toHex),
  'poline-3': new Poline({
    anchorColors: [
      [289, 0.04, 0.28],
      [-14, 0.87, 0.33]
    ],
    numPoints: 4,
    positionFunctionX: positionFunctions.asinusoidalPosition,
    positionFunctionY: positionFunctions.sinusoidalPosition,
    positionFunctionZ: positionFunctions.asinusoidalPosition,
    invertedLightness: true
  }).colors.map(toHex),
  'poline-4': new Poline({
    anchorColors: [
      [31, 0.79, 0.09],
      [211, 0.95, 0.46]
    ],
    numPoints: 4,
    positionFunctionX: positionFunctions.sinusoidalPosition,
    positionFunctionY: positionFunctions.arcPosition,
    positionFunctionZ: positionFunctions.smoothStepPosition,
    invertedLightness: true
  }).colors.map(toHex),
  'poline-5': new Poline({
    anchorColors: [
      [21, 0.71, 0.8],
      [267, 0.04, 0.74]
    ],
    numPoints: 15,
    positionFunctionX: positionFunctions.sinusoidalPosition,
    positionFunctionY: positionFunctions.quadraticPosition,
    positionFunctionZ: positionFunctions.linearPosition
  }).colors.map(toHex),
  'poline-6': new Poline({
    anchorColors: [
      [80, 0.71, 0.68],
      [199, 0.04, 0.75]
    ],
    numPoints: 15,
    positionFunctionX: positionFunctions.sinusoidalPosition,
    positionFunctionY: positionFunctions.quadraticPosition,
    positionFunctionZ: positionFunctions.linearPosition
  }).colors.map(toHex),
  'poline-7': new Poline({
    anchorColors: [
      [57, 0.71, 0.78],
      [244, 0.04, 0.8]
    ],
    numPoints: 15,
    positionFunctionX: positionFunctions.linearPosition,
    positionFunctionY: positionFunctions.linearPosition,
    positionFunctionZ: positionFunctions.arcPosition,
    closedLoop: true
  }).colors
    .slice(0, -1)
    .map(toHex),
  'poline-8': new Poline({
    anchorColors: [
      [57, 0.71, 0.78],
      [244, 0.04, 0.8]
    ],
    numPoints: 15,
    positionFunctionX: positionFunctions.smoothStepPosition,
    positionFunctionY: positionFunctions.asinusoidalPosition,
    positionFunctionZ: positionFunctions.quarticPosition,
    closedLoop: true
  }).colors
    .slice(0, -1)
    .map(toHex),
  primary: ['#00f', '#0ff', '#000', '#fff', '#f00', '#0f0', '#ff0', '#f0f'],
  'palette-a': ['#834200', '#323213', '#2b6c21', '#888d0d', '#ffc249', '#da6d00', '#a22800', '#640000', '#000000', '#1d1d67', '#264bab', '#409e9e', '#a6da97', '#ffffff', '#9191aa', '#555555'],
  'palette-b': ['#1c1718', '#45221b', '#891420', '#4e4e52', '#865f51', '#e43040', '#87878c', '#c78a55', '#ee7976', '#e4c4ad'],
  'palette-e': ['#191520', '#2a2d3c', '#294566', '#2c6cba', '#85c4d7', '#4b7c52', '#a0b035', '#f8d877', '#ffa057', '#e93f59', '#9653a2', '#723738', '#c68c76', '#f0efdf'],
  'palette-g': ['#0b0b0b', '#09182f', '#2b2b2d', '#54565b', '#b15d2e', '#818387', '#9fa3a4', '#e69a28', '#f8c714', '#e7eae8'],
  'palette-h': ['#4f1621', '#861c36', '#a54267', '#bd3c4f', '#b26690', '#d9616e', '#e37789', '#ba8dbd', '#f18082', '#c1bbdf'],
  'palette-i': ['#453a4c', '#8a879b', '#b08778', '#e29a40', '#b7aebd', '#d8d7e4'],
  'palette-j': ['#292d3a', '#394866', '#606f85', '#bf4672', '#859e9a', '#c8c191'],
  'palette-k': ['#140c1c', '#442434', '#30346d', '#4e4a4e', '#854c30', '#346524', '#d04648', '#757161', '#597dce', '#d27d2c', '#8595a1', '#6daa2c', '#d2aa99', '#6dc2ca', '#dad45e', '#deeed6'],
  'palette-l': ['#e0dfe0', '#071315', '#111d07', '#1d1409', '#ce57ae', '#44298d', '#396c3c'],
  'palette-m': ['#f7f0e9', '#0f1510', '#e5ae76', '#3b94d8', '#acb6a5', '#d2c5d5', '#b93c34'],
  'palette-110': [
    '#f1e9cd',
    '#f2e7cf',
    '#ece6d0',
    '#f2eacc',
    '#f3e9ca',
    '#f2ebcd',
    '#e6e1c9',
    '#e2ddc6',
    '#cbc8b7',
    '#bfbbb0',
    '#bebeb3',
    '#b7b5ac',
    '#bab191',
    '#9c9d9a',
    '#8a8d84',
    '#5b5c61',
    '#555152',
    '#413f44',
    '#454445',
    '#423937',
    '#433635',
    '#252024',
    '#241f20',
    '#281f3f',
    '#1c1949',
    '#4f638d',
    '#383867',
    '#5c6b8f',
    '#657abb',
    '#6f88af',
    '#7994b5',
    '#6fb5a8',
    '#719ba2',
    '#8aa1a6',
    '#d0d5d3',
    '#8590ae',
    '#3a2f52',
    '#39334a',
    '#6c6d94',
    '#584c77',
    '#533552',
    '#463759',
    '#bfbac0',
    '#77747f',
    '#4a475c',
    '#b8bfaf',
    '#b2b599',
    '#979c84',
    '#5d6161',
    '#61ac86',
    '#a4b6a7',
    '#adba98',
    '#93b778',
    '#7d8c55',
    '#33431e',
    '#7c8635',
    '#8e9849',
    '#c2c190',
    '#67765b',
    '#ab924b',
    '#c8c76f',
    '#ccc050',
    '#ebdd99',
    '#ab9649',
    '#dbc364',
    '#e6d058',
    '#ead665',
    '#d09b2c',
    '#a36629',
    '#a77d35',
    '#f0d696',
    '#d7c485',
    '#f1d28c',
    '#efcc83',
    '#f3daa7',
    '#dfa837',
    '#ebbc71',
    '#d17c3f',
    '#92462f',
    '#be7249',
    '#bb603c',
    '#c76b4a',
    '#a75536',
    '#b63e36',
    '#b5493a',
    '#cd6d57',
    '#711518',
    '#e9c49d',
    '#eedac3',
    '#eecfbf',
    '#ce536b',
    '#b74a70',
    '#b7757c',
    '#612741',
    '#7a4848',
    '#3f3033',
    '#8d746f',
    '#4d3635',
    '#6e3b31',
    '#864735',
    '#553d3a',
    '#613936',
    '#7a4b3a',
    '#946943',
    '#c39e6d',
    '#513e32',
    '#8b7859',
    '#9b856b',
    '#766051',
    '#453b32'
  ],
  'random-8': Array(8)
    .fill()
    .map(() => chroma.random(next).hex()),
  'random-16': Array(16)
    .fill()
    .map(() => chroma.random(next).hex()),
  'random-32': Array(32)
    .fill()
    .map(() => chroma.random(next).hex()),
  'random-48': Array(48)
    .fill()
    .map(() => chroma.random(next).hex()),
  'random-128': Array(128)
    .fill()
    .map(() => chroma.random(next).hex()),
  'material-deep-purple': ['#311b92', '#4527a0', '#512da8', '#5e35b1', '#673ab7', '#7e57c2', '#9575cd', '#b39ddb', '#d1c4e9', '#ede7f6', '#6200ea', '#651fff', '#7c4dff', '#b388ff'],
  'material-teal': ['#004d40', '#00695c', '#00796b', '#00897b', '#009688', '#26a69a', '#4db6ac', '#80cbc4', '#b2dfdb', '#e0f2f1', '#00bfa5', '#1de9b6', '#64ffda', '#a7ffeb'],
  'tailwind3-red-orange-amber': [
    '#450a0a',
    '#7f1d1d',
    '#991b1b',
    '#b91c1c',
    '#dc2626',
    '#ef4444',
    '#f87171',
    '#fca5a5',
    '#fecaca',
    '#fee2e2',
    '#fef2f2',
    '#431407',
    '#7c2d12',
    '#9a3412',
    '#c2410c',
    '#ea580c',
    '#f97316',
    '#fb923c',
    '#fdba74',
    '#fed7aa',
    '#ffedd5',
    '#fff7ed',
    '#451a03',
    '#78350f',
    '#92400e',
    '#b45309',
    '#d97706',
    '#f59e0b',
    '#fbbf24',
    '#fcd34d',
    '#fde68a',
    '#fef3c7',
    '#fffbeb'
  ]
}

// Object.assign(PALETTES, Object.fromEntries(Array(28).fill().map((_,i) => [`poline-random-${i+1}`, rp()])))

Object.assign(
  PALETTES,
  Object.fromEntries(
    Object.entries(PALETTES_DATA)
    // .map(([key, value]) => [`lo-${key}`, value])
  )
)

Object.values(PALETTES).forEach((result) => {
  const first = oklab(result[0])
  const last = oklab(result.at(-1))

  if (first[0] > last[0]) {
    result.reverse()
  }
})

// export function isArtist(slug) {
//   return slug.startsWith('lo-') && PALETTES_DATA[`${slug.replace(/^lo-/g, '')}`] !== undefined
// }
