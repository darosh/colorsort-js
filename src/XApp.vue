<template>
  <v-app theme="dark">
    <v-navigation-drawer v-model="showNav" width="423"></v-navigation-drawer>

    <v-app-bar scroll-behavior="hide" :scroll-threshold="64">
      <v-app-bar-nav-icon @click="showNav = !showNav" />
    </v-app-bar>

    <v-main style="--v-layout-top: 64px;">
      <v-container fluid>
        <v-table hover>
          <thead>
            <tr>
              <th>Palette</th>
              <th>Algorithm</th>
              <th class="text-right">Colors</th>
              <th class="text-right">Time</th>
              <th class="text-center pr-0 pl-6" colspan="7">Length, Avg, Dev / Curv., Avg, Dev / Curv.%</th>
              <th class="text-center pr-0" colspan="2">Avg&deg;, Max&deg;</th>
              <th class="text-left" colspan="2">P, H</th>
              <th class="text-center">LCH</th>
              <th class="text-right pr-0">Diff</th>
              <th class="text-center">Best</th>
              <th style="min-width: 300px;"></th>
            </tr>
          </thead>
          <tbody>
            <tr
              :style="{ background: odd ? 'rgba(0,0,0,.5)' : null }"
              v-for="{
            data: { colors, method, palette, time, quality, best, index, bestDistance, metrics },
            skip,
            odd,
          } in filtered"
              @click="showPreview = !showPreview"
              @mouseenter="onmouseenter(colors)"
            >
              <td style="width: 90px; vertical-align: top; padding-top: 14px" v-if="skip" :rowspan="skip">
                {{ palette.index + 1 }}: {{ palette.key }}<br /><br /><i>{{ palette.type.type }}</i>
                <v-table density="compact" class="mt-6 bg-transparent">
                  <tbody>
                    <tr v-for="(value, key) in formatTypes(palette.type.data)">
                      <td class="pl-0">{{ key }}</td>
                      <td class="text-right">{{ value }}</td>
                    </tr>
                  </tbody>
                </v-table>
              </td>
              <td style="width: 230px">{{ method.mid }}</td>
              <td style="width: 72px" class="text-right">
                {{ colors.length || '...' }}
              </td>
              <td style="width: 72px" class="text-right">
                {{ time !== null ? `${time.toFixed(0)} ms` : '...' }}
              </td>
              <td style="width: 60px" class="text-right px-1" :style="{color: scale(quality?.totalDistance)}">
                <template v-if="quality?.totalDistance === 0">*</template>
                <template v-if="metrics">{{ metrics.totalDistance.toFixed(2) }}</template>
                <template v-else>...</template>
              </td>
              <td style="width: 60px" class="text-right px-1" :style="{color: scale(quality?.meanDistance)}">
                <template v-if="quality?.meanDistance === 0">*</template>
                <template v-if="metrics">{{ metrics.meanDistance.toFixed(2) }}</template>
                <template v-else>...</template>
              </td>
              <td style="width: 60px" class="text-right px-1" :style="{color: scale(quality?.devDistance)}">
                <template v-if="quality?.devDistance === 0">*</template>
                <template v-if="metrics">{{ metrics.devDistance.toFixed(2) }}</template>
                <template v-else>...</template>
              </td>

              <td style="width: 60px" class="text-right px-1" :style="{color: scale(quality?.totalCurveDistance)}">
                <template v-if="quality?.totalCurveDistance === 0">*</template>
                <template v-if="metrics">{{ metrics.totalCurveDistance.toFixed(2) }}</template>
                <template v-else>...</template>
              </td>
              <td style="width: 60px" class="text-right px-1" :style="{color: scale(quality?.meanCurveDistance)}">
                <template v-if="quality?.meanCurveDistance === 0">*</template>
                <template v-if="metrics">{{ metrics.meanCurveDistance.toFixed(2) }}</template>
                <template v-else>...</template>
              </td>
              <td style="width: 60px" class="text-right px-1" :style="{color: scale(quality?.devCurveDistance)}">
                <template v-if="quality?.devCurveDistance === 0">*</template>
                <template v-if="metrics">{{ metrics.devCurveDistance.toFixed(2) }}</template>
                <template v-else>...</template>
              </td>

              <td style="width: 60px" class="text-right px-1" :style="{color: scale(quality?.curveRatio)}">
                <template v-if="quality?.curveRatio === 0">*</template>
                <template v-if="metrics">{{ (100 * metrics.curveRatio).toFixed(1) }}%</template>
                <template v-else>...</template>
              </td>
              <td style="width: 60px" class="text-right px-1" :style="{color: scale(quality?.avgAngleChange)}">
                <template v-if="quality?.avgAngleChange === 0">*</template>
                <template v-if="metrics">{{ metrics.avgAngleChange.toFixed() }}&deg;</template>
                <template v-else>...</template>
              </td>
              <td style="width: 60px" class="text-right px-1" :style="{color: scale(quality?.maxAngleChange)}">
                <template v-if="quality?.maxAngleChange === 0">*</template>
                <template v-if="metrics">{{ metrics.maxAngleChange.toFixed() }}&deg;</template>
                <template v-else>...</template>
              </td>

              <td style="width: 60px" class="text-right px-1" :style="{color: scale(quality?.perceptualUniformity)}">
                <template v-if="quality?.perceptualUniformity === 0">*</template>
                <template v-if="metrics">{{ metrics.perceptualUniformity.toFixed(2) }}</template>
                <template v-else>...</template>
              </td>

              <td style="width: 60px" class="text-right px-1" :style="{color: scale(quality?.harmonicScore)}">
                <template v-if="quality?.harmonicScore === 0">*</template>
                <template v-if="metrics">{{ metrics.harmonicScore.toFixed(2) }}</template>
                <template v-else>...</template>
              </td>

              <td style="width: 144px; line-height: 14px; font-size: 12px;" class="text-center">
                <template v-if="metrics">
                  <span :style="{color: scale(quality?.lchAvgChange.L)}">{{ metrics.lchAvgChange.L.toFixed(0) }}</span
                  >, <span :style="{color: scale(quality?.lchAvgChange.C)}">{{ metrics.lchAvgChange.C.toFixed(0) }}</span
                  >, <span :style="{color: scale(quality?.lchAvgChange.H)}">{{ metrics.lchAvgChange.H.toFixed(0) }}</span
                  ><br />
                  <span :style="{color: scale(quality?.lchMaxChange.L)}">{{ metrics.lchMaxChange.L.toFixed(0) }}</span
                  >, <span :style="{color: scale(quality?.lchMaxChange.C)}">{{ metrics.lchMaxChange.C.toFixed(0) }}</span
                  >, <span :style="{color: scale(quality?.lchMaxChange.H)}">{{ metrics.lchMaxChange.H.toFixed(0) }}</span
                  ><br />
                  <span :style="{color: scale(quality?.lchDeviation.L)}">{{ metrics.lchDeviation.L.toFixed(0) }}</span
                  >, <span :style="{color: scale(quality?.lchDeviation.C)}">{{ metrics.lchDeviation.C.toFixed(0) }}</span
                  >, <span :style="{color: scale(quality?.lchDeviation.H)}">{{ metrics.lchDeviation.H.toFixed(0) }}</span>
                </template>
              </td>
              <td style="width: 60px" class="text-right px-1" :class="{'text-grey-darken-2': !bestDistance}">
                {{ bestDistance !== null ? (!bestDistance ? 0 : bestDistance.toFixed(2)) : '...' }}
              </td>
              <td style="width: 64px" class="pr-0">
                <v-checkbox-btn style="margin-right: -6px; margin-left: -4px;" :model-value="best" @click.stop="e => bestChange(e, index)" />
              </td>
              <td class="pl-0">
                <div style="display: flex">
                  <div v-for="c in colors" style="flex: 1 1; min-width: 1px; min-height: 10px" :style="{ background: c }" />
                </div>
              </td>
            </tr>
          </tbody>
        </v-table>
      </v-container>
    </v-main>
    <div v-if="showPreview" style="position: fixed; z-index: 2000; bottom:12px; left: 12px; background: rgba(0,0,0,.5);">
      <x-preview :points="selectedColors" />
    </div>
  </v-app>
  <v-progress-linear v-if="rendered !== renderingTotal" style="z-index: 10000; position: fixed; top: 0;" height="8" color="rgb(255,0,0)" bg-color="rgb(255,127,127)" :bg-opacity="0.6" active :model-value="100 * rendered / renderingTotal" />
</template>

<script>
import { PALETTES } from '@/palettes.js'
import { SORTING_METHODS } from '@/lib'
import XPreview from '@/XPreview.vue'
import { computePlan, computeRender, updateDistance } from '@/lib/compute.ts'
import chroma from 'chroma-js'

import { COMPUTED } from '@/deserialize.ts'
// const COMPUTED = null

function debounce (func, timeout = 25) {
  let timer

  return (...args) => {
    clearTimeout(timer)
    timer = setTimeout(() => { func.apply(this, args) }, timeout)
  }
}

const scale_ = chroma.scale(['#77f', '#fff'])

function scale (x) {
  return x === 0 ? '#2f0' : scale_(x)
}

export default {
  components: { XPreview },
  data: () => ({
    showPreview: false,
    sorted: [],
    types: [],
    selectedColors: [],
    showNav: false,
    rendered: 0,
    renderingTotal: 1,
    flushRenders: [],
    flushTimeout: null,
    debouncedPreview: null
  }),
  methods: {
    async sort () {
      if (!COMPUTED) {
        const { sorted, types } = await computePlan(
            Object.entries(PALETTES), //.slice(0, 3),
            SORTING_METHODS,
            this.onRender
        )

        this.renderingTotal = sorted.length
        this.rendered = 0

        await Promise.all(computeRender(sorted))

        this.types = types
        this.sorted = sorted
      } else {
        const { sorted, types } = COMPUTED
        this.types = types
        this.sorted = sorted
        this.rendered = 1
      }
    },
    onRender (p) {
      this.rendered = p.done
      this.renderingTotal = p.total
    },
    formatTypes (obj) {
      return Object.fromEntries(
          Object.entries(obj).map(([k, v]) => [k, v.toFixed(2)]),
      )
    },
    setPreview (colors) {
      this.selectedColors = colors
    },
    onmouseenter (colors) {
      this.debouncedPreview(colors)
    },
    scale (v) {
      return v === undefined ? null : scale(v)
    },
    bestChange (e, index) {
      const item = this.sorted.find(s => s.index === index)
      item.best = !item.best
      const besties = this.sorted.filter(d => d.best).map((s) => ({ key: s.palette.key, mid: s.method.mid }))
      console.log(JSON.stringify(besties))
      updateDistance(item.palette)
    },
  },
  mounted () {
    this.debouncedPreview = debounce(this.setPreview)
    this.sort()
  },
  computed: {
    filtered () {
      let current = { data: {}, odd: 0 }

      return this.sorted.map((data) => {
        const next = { data, skip: 0, odd: current.odd }

        if (current.data.palette === next.data.palette) {
          current.skip++
        } else {
          next.odd = (current.odd + 1) % 2
          current = next
          next.skip++
        }

        return next
      })
    },
  },
}
</script>
