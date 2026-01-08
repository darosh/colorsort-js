<template>
  <v-app theme="dark">
    <v-navigation-drawer v-model="showNav" width="423"></v-navigation-drawer>

    <v-app-bar scroll-behavior="hide" :scroll-threshold="72">
      <v-app-bar-nav-icon @click="showNav = !showNav" />
      <v-app-bar-title class="flex-0-0 mr-4">Color Sorting R&D, Inc.</v-app-bar-title>
      <v-toolbar-items class="mr-4">
        <v-btn @click="showStats = false">Palettes</v-btn>
        <v-btn @click="showStats = true">Statistics</v-btn>
      </v-toolbar-items>
      <v-spacer />
      <span class="ml-4 text-grey-lighten-1">{{ methodsCount }} {{methodsCount === 1 ? 'method' : 'methods'}}</span>
      <span class="mx-8 text-grey-lighten-1" v-show="filtered.length === types.length">{{ types.length }} {{types.length === 1 ? 'palette' : 'palettes'}}</span>
      <span class="mx-8 text-grey-lighten-3" v-show="filtered.length < types.length">{{ filtered.length }} of {{types.length}} {{types.length === 1 ? 'palette' : 'palettes'}}</span>
      <v-text-field prepend-icon="mdi-magnify" v-model.lazy="filterPalette" hide-details class="align-self-center mr-4 mt-1" placeholder="Palette" density="compact" variant="solo-filled" max-width="180" />
      <v-text-field v-model.lazy="filterMethod" hide-details class="align-self-center mr-4 mt-1" placeholder="Method" density="compact" variant="solo-filled" max-width="140" />
      <v-btn :icon="expandedAll ? `mdi-unfold-less-horizontal` : `mdi-unfold-more-horizontal`" @click="onExpandAll"></v-btn>
    </v-app-bar>

    <v-main style="--v-layout-top: 64px;">
      <v-container v-show="!showStats" fluid :height="tableHeight" class="px-4">
        <v-virtual-scroll :items="filtered" item-key="key" renderless :height="tableHeight">
          <template v-slot:default="{ itemRef, item: { groups, key }, index: typeIndex }">
            <v-table style="background: rgb(18, 18, 18);" :ref="itemRef" hover class="mb-16" fixed-header>
              <thead>
                <tr>
                  <th>Palette</th>
                  <th>Algorithm</th>
                  <!--              <th class="text-right">Colors</th>-->
                  <th class="text-right">Time</th>
                  <th class="text-center pr-0 pl-0" colspan="7">Length, Avg, Dev / Curv., Avg, Dev / Curv.%</th>
                  <th class="text-center pr-0 pl-0" colspan="2">Avg&deg;, Max&deg;</th>
                  <th class="text-center px-0" colspan="2">P, H</th>
                  <th class="text-center px-0">LCH</th>
                  <th class="text-right pr-0">Diff</th>
                  <th class="text-center">Best</th>
                  <th style="min-width: 300px;"></th>
                </tr>
              </thead>
              <tbody>
                <!--          :style="{ background: typeIndex % 2 ? 'rgba(0,0,0,.5)' : null }"-->
                <tr :ref="itemRef" v-for="({ record: {colors, palette, quality, metrics, bestDistance, bestDistanceQuality}, methods }, rowIndex) in groups" @click="showPreview = !showPreview" @mouseenter="onmouseenter(colors)">
                  <td style="width: 90px; vertical-align: top; padding-top: 14px" v-if="!rowIndex" :rowspan="groups.length">
                    {{ palette.index + 1 }}: {{ palette.key }}<br /><br /><i>{{ palette.type.type }}</i>

                    <div style="display: flex; align-items: center" class="mt-6 pr-3">
                      <div style="height: 10px;" :style="{width: `${v * 100}%`, background: `rgb(${r},${g},${b})`}" v-for="[r,g,b,v] in palette.gram"></div>
                      <div class="text-no-wrap pl-2">{{ palette.gram.length }} / {{ palette.colors.length }}</div>
                    </div>

                    <v-table density="compact" class="mt-6 bg-transparent">
                      <tbody>
                        <tr v-for="(value, key) in formatTypes(palette.type.data)">
                          <td class="pl-0">{{ key }}</td>
                          <td class="text-right">{{ value }}</td>
                        </tr>
                      </tbody>
                    </v-table>
                  </td>

                  <td class="text-pre py-4" style="width: 210px; cursor: pointer;" @click.stop="expandIndex(`${key}:${rowIndex}`)">
                    {{
                    (methods.length === 1 || isExpanded(`${key}:${rowIndex}`)) ? methods.map(m => m.method.mid).join('\n') : `${methods[0].method.mid} ...+${methods.length - 1}`
                    }}
                  </td>
                  <td class="text-pre text-right py-4" style="width: 90px; cursor: pointer;" @click.stop="expandIndex(`${key}:${rowIndex}`)">
                    {{
                    (methods.length === 1 || isExpanded(`${key}:${rowIndex}`)) ? methods.map(({ time }) => time !== null ? `${time.toFixed(0)} ms` : '...').join('\n') : `... ${methods[0].time.toFixed(0)}ms`
                    }}
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

                  <td style="width: 144px; line-height: 14px; font-size: 12px;" class="text-center text-no-wrap">
                    <template v-if="metrics">
                      <span :style="{color: scale(quality?.lchAvgChange.L)}">{{
                        metrics.lchAvgChange.L.toFixed(0)
                      }}</span
                      >,
                      <span :style="{color: scale(quality?.lchAvgChange.C)}">{{
                        metrics.lchAvgChange.C.toFixed(0)
                      }}</span
                      >,
                      <span :style="{color: scale(quality?.lchAvgChange.H)}">{{
                      metrics.lchAvgChange.H.toFixed(0)
                      }}</span
                      ><br />
                      <span :style="{color: scale(quality?.lchMaxChange.L)}">{{ metrics.lchMaxChange.L.toFixed(0) }}</span
                      >,
                      <span :style="{color: scale(quality?.lchMaxChange.C)}">{{
                        metrics.lchMaxChange.C.toFixed(0)
                      }}</span
                      >,
                      <span :style="{color: scale(quality?.lchMaxChange.H)}">{{
                        metrics.lchMaxChange.H.toFixed(0)
                      }}</span
                      ><br />
                      <span :style="{color: scale(quality?.lchDeviation.L)}">{{ metrics.lchDeviation.L.toFixed(0) }}</span
                      >,
                      <span :style="{color: scale(quality?.lchDeviation.C)}">{{
                        metrics.lchDeviation.C.toFixed(0)
                      }}</span
                      >,
                      <span :style="{color: scale(quality?.lchDeviation.H)}">{{
                        metrics.lchDeviation.H.toFixed(0)
                      }}</span>
                    </template>
                  </td>
                  <td style="width: 32px" class="text-right px-1" :style="{color: scale(bestDistanceQuality)}">
                    {{ bestDistance !== null ? (!bestDistance ? 0 : bestDistance.toFixed(2)) : '...' }}
                  </td>
                  <td style="width: 64px" class="pr-0">
                    <v-checkbox-btn style="margin-right: -6px; margin-left: -4px;" :model-value="methods.some(m => m.best)" @click.stop="e => bestChange(e, typeIndex, rowIndex, methods.some(m => m.best))" />
                  </td>

                  <td class="pl-0">
                    <div style="display: flex">
                      <div v-for="c in colors" style="flex: 1 1; min-width: 1px; min-height: 10px" :style="{ background: c }" />
                    </div>
                  </td>
                </tr>
              </tbody>
            </v-table>
          </template>
        </v-virtual-scroll>
      </v-container>
    </v-main>

    <div v-if="!showStats && showPreview" style="position: fixed; z-index: 2000; bottom:12px; left: 12px; background: rgba(0,0,0,.5);">
      <x-preview :points="selectedColors" />
    </div>
  </v-app>
  <v-progress-linear v-if="rendered !== renderingTotal" style="z-index: 10000; position: fixed; top: 0;" height="8" color="rgb(255,0,0)" bg-color="rgb(255,127,127)" :bg-opacity="0.6" active :model-value="100 * rendered / renderingTotal" />
</template>

<script>
import { PALETTES } from '@/palettes.js'
import { SORTING_METHODS } from '@/lib'
import XPreview from '@/XPreview.vue'
import { computePlan, computeRender, updateBest, updateDistance } from '@/compute.ts'
import chroma from 'chroma-js'
import { render } from '@/render.js'

import { COMPUTED } from '@/deserialize.ts'

// const COMPUTED = null

function debounce (func, timeout = 25) {
  let timer

  return (...args) => {
    clearTimeout(timer)
    timer = setTimeout(() => { func.apply(this, args) }, timeout)
  }
}

const scale_ = chroma.scale(['#3f3', '#ff3', '#f77'])

function scale (x) {
  return x === 0 ? '#fff' : scale_(x)
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
    debouncedPreview: null,
    expandedAll: false,
    expanded: {},
    filterPalette: null,
    filterMethod: null,
    showStats: false,
  }),
  methods: {
    async sort () {
      if (!COMPUTED) {
        const { sorted, types } = await computePlan(
            Object.entries(PALETTES),
            // Object.entries(PALETTES).slice(0, 10),
            SORTING_METHODS,
            render,
            this.onRender
        )

        this.renderingTotal = sorted.length
        this.rendered = 0

        await Promise.all(computeRender(sorted))

        this.types = types
        this.sorted = sorted
      } else {
        const { sorted, types } = COMPUTED
        this.types = types //.slice(0, 10)
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
    bestChange (e, typeIndex, rowIndex, value) {
      const set = this.types[typeIndex]

      updateBest(set, rowIndex, !value)
      updateDistance(set)

      const besties = this.sorted.filter(d => d.best).map((s) => ({ key: s.palette.key, mid: s.method.mid }))
      console.log(JSON.stringify(besties))
    },
    isExpanded (index) {
      return this.expandedAll ? true : this.expanded[index]
    },
    expandIndex (index) {
      this.expanded[index] = !this.expanded[index]
    },
    onExpandAll () {
      setTimeout(() => {
        this.expandedAll = !this.expandedAll

        if (!this.expandedAll) {
          this.expanded = {}
        }

      }, 400)
    }
  },
  mounted () {
    this.debouncedPreview = debounce(this.setPreview)
    this.sort()
  },
  computed: {
    methodsCount () {
      return SORTING_METHODS.length
    },
    tableHeight () {
      return this.$vuetify.display.height - 128 + 32
    },
    filtered () {
      if (!this.filterPalette && !this.filterMethod) {
        return this.types
      }

      if (!this.types) {
        return []
      }

      let number

      if (this?.filterPalette?.[0] === '<' || this?.filterPalette?.[0] === '>') {
        number = Number.parseInt(this.filterPalette.slice(1), 10)
      }

      const filtered = !this.filterPalette ? this.types : this.types.filter(t => {
        if (this.filterPalette[0] === '<') {
          return t.colors.length < number
        } else if (this.filterPalette[0] === '>') {
          return t.colors.length > number
        }

        return `${t.key}:${t.index + 1}`.includes(this.filterPalette)
      })

      if (!this.filterMethod) {
        return filtered
      }

      return filtered
          .map(t => {
            return {
              ...t,
              groups: t.groups.filter(g => g.methods.some(m => m.method.mid.includes(this.filterMethod)))
            }
          })
          .filter(t => t.groups.length)
    }
  },
}
</script>
