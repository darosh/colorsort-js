export const extreme2 = ((extremes) => extremes.flatMap((r) => extremes.flatMap((g) => extremes.map((b) => `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`))))([0x00, 0x01, 0x7f, 0x80, 0xfe, 0xff])
export const extreme2half = extreme2.slice(0, Math.ceil(extreme2.length))
