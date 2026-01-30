import { test, expect } from 'vitest'

import { SORTING_METHODS } from '@'
import { COLORS_BAD_SCAN, COLORS_EXTREME_2_HALF } from './fixtures/colors.js'

for(const m of SORTING_METHODS) {
    if (m.valid && !m.valid(COLORS_BAD_SCAN)) {
        test(`snapshot:${m.mid}`, () => {
            const sorted = m.fn(COLORS_EXTREME_2_HALF)
            expect(sorted).toMatchSnapshot()
        })
        
        continue
    }
    
    test(`snapshot:${m.mid}`, () => {
        const sorted = m.fn(COLORS_BAD_SCAN)
        expect(sorted).toMatchSnapshot()
    })
}
