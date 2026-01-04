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
              <th class="text-center pr-0 pl-6" colspan="8">Length, Avg, Dev / Avg&deg; / Max&deg;</th>
              <th class="text-right pr-0">Diff</th>
              <th class="text-center">Best</th>
              <th style="min-width: 300px;"></th>
            </tr>
          </thead>
          <tbody>
            <tr
              :style="{ background: odd ? 'rgba(0,0,0,.5)' : null }"
              v-for="{
            data: { colors, mid, palette, time, key, best, id, dist, metrics, bestMetrics },
            skip,
            odd,
          } in filtered"
              @click="showPreview = !showPreview"
              @mouseenter="onmouseenter(colors)"
            >
              <td style="width: 90px; vertical-align: top; padding-top: 14px" v-if="skip" :rowspan="skip">
                {{ palette }}: {{ key }}<br /><br /><i>{{ types[palette - 1].type }}</i>
                <v-table density="compact" class="mt-6 bg-transparent">
                  <tbody>
                    <tr v-for="(value, key) in formatTypes(types[palette - 1].data)">
                      <td class="pl-0">{{ key }}</td>
                      <td class="text-right">{{ value }}</td>
                    </tr>
                  </tbody>
                </v-table>
              </td>
              <td style="width: 230px">{{ mid }}</td>
              <td style="width: 72px" class="text-right">
                {{ colors.length || '...' }}
              </td>
              <td style="width: 72px" class="text-right">
                {{ time !== null ? `${time.toFixed(0)} ms` : '...' }}
              </td>
              <td style="width: 60px" class="text-right px-1" :class="{'text-green-accent-3': bestMetrics?.totalDistance}">
                <template v-if="bestMetrics?.totalDistance">*</template>
                <template v-if="metrics">{{ metrics.totalDistance.toFixed(2) }}</template>
                <template v-else>...</template>
              </td>
              <td style="width: 60px" class="text-right px-1" :class="{'text-green-accent-3': bestMetrics?.meanDistance}">
                <template v-if="bestMetrics?.meanDistance">*</template>
                <template v-if="metrics">{{ metrics.meanDistance.toFixed(2) }}</template>
                <template v-else>...</template>
              </td>
              <td style="width: 60px" class="text-right px-1" :class="{'text-green-accent-3': bestMetrics?.devDistance}">
                <template v-if="bestMetrics?.devDistance">*</template>
                <template v-if="metrics">{{ metrics.devDistance.toFixed(2) }}</template>
                <template v-else>...</template>
              </td>
              <td style="width: 60px" class="text-right px-1" :class="{'text-green-accent-3': bestMetrics?.avgAngleChange}">
                <template v-if="bestMetrics?.avgAngleChange">*</template>
                <template v-if="metrics">{{ metrics.avgAngleChange.toFixed() }}&deg;</template>
                <template v-else>...</template>
              </td>
              <td style="width: 60px" class="text-right px-1" :class="{'text-green-accent-3': bestMetrics?.maxAngleChange}">
                <template v-if="bestMetrics?.maxAngleChange">*</template>
                <template v-if="metrics">{{ metrics.maxAngleChange.toFixed() }}&deg;</template>
                <template v-else>...</template>
              </td>
              <td style="width: 60px" class="text-right px-1" :class="{'text-green-accent-3': bestMetrics?.perceptualUniformity}">
                <template v-if="metrics">{{ metrics.perceptualUniformity.toFixed(2) }}</template>
                <template v-else>...</template>
              </td>
              <td style="width: 60px" class="text-right px-1" :class="{'text-green-accent-3': bestMetrics?.harmonicScore}">
                <template v-if="metrics">{{ metrics.harmonicScore.toFixed(2) }}</template>
                <template v-else>...</template>
              </td>
              <td style="width: 120px;" class="text-right">
                <template v-if="metrics">
                  <span :class="{'text-green-accent-3': bestMetrics?.lchAvgChange.L}">{{metrics.lchAvgChange.L.toFixed(0)}}</span>,
                  <span :class="{'text-green-accent-3': bestMetrics?.lchAvgChange.C}">{{metrics.lchAvgChange.C.toFixed(0)}}</span>,
                  <span :class="{'text-green-accent-3': bestMetrics?.lchAvgChange.H}">{{metrics.lchAvgChange.H.toFixed(0)}}</span><br>
                  <span :class="{'text-green-accent-3': bestMetrics?.lchMaxChange.L}">{{metrics.lchMaxChange.L.toFixed(0)}}</span>,
                  <span :class="{'text-green-accent-3': bestMetrics?.lchMaxChange.C}">{{metrics.lchMaxChange.C.toFixed(0)}}</span>,
                  <span :class="{'text-green-accent-3': bestMetrics?.lchMaxChange.H}">{{metrics.lchMaxChange.H.toFixed(0)}}</span><br>
                  <span :class="{'text-green-accent-3': bestMetrics?.lchDeviation.L}">{{metrics.lchDeviation.L.toFixed(0)}}</span>,
                  <span :class="{'text-green-accent-3': bestMetrics?.lchDeviation.C}">{{metrics.lchDeviation.C.toFixed(0)}}</span>,
                  <span :class="{'text-green-accent-3': bestMetrics?.lchDeviation.H}">{{metrics.lchDeviation.H.toFixed(0)}}</span>
                </template>
              </td>
              <td style="width: 60px" class="text-right px-1" :class="{'text-grey-darken-2': !dist}">
                {{ dist !== null ? (!dist ? 0 : dist.toFixed(2)) : '...' }}
              </td>
              <td style="width: 64px" class="pr-0">
                <v-checkbox-btn style="margin-right: -6px; margin-left: -4px;" :model-value="best" @click.stop="e => bestChange(e, id)" />
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
import { reactive } from 'vue'
import { bestMetrics, sortAll, updateDistances, updateDistancesPalette } from '@/sort-all.js'
import { PALETTES } from '@/palettes.js'
import { SORTING_METHODS, metrics } from '@/lib'
import XPreview from '@/XPreview.vue'
import { metricsEx } from '@/lib/metrics.ts'

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
    flushTimeout: null
  }),
  methods: {
    async sort () {
      const { sorted, types } = await sortAll(
          PALETTES,
          SORTING_METHODS,
          this.onrender,
      )

      this.types = types
      this.sorted = sorted

      this.renderingTotal = 0
      this.rendered = 0

      ;[...sorted].sort((a, b) => a.speed - b.speed).forEach(x => {
        if (x.render) {
          this.renderingTotal++
          x.render()
        }
      })
    },
    onrender ({ result, elapsed, row }) {
      const r = this.sorted.find((x) => x.id === row.id)
      this.rendered++
      this.flushRenders.push({ r, result, elapsed })

      clearTimeout(this.flushTimeout)

      this.flushTimeout = setTimeout(() => {
        while (this.flushRenders.length) {
          const { r, result, elapsed } = this.flushRenders.shift()
          r.colors = result
          r.time = elapsed
          r.metrics = metricsEx(result)
        }

        if (this.rendered === this.renderingTotal) {
          this.sortingDone()
        }
      }, 1)
    },
    formatTypes (obj) {
      return Object.fromEntries(
          Object.entries(obj).map(([k, v]) => [k, v.toFixed(2)]),
      )
    },
    onmouseenter (colors) {
      this.selectedColors = colors
    },
    bestChange (e, id) {
      const item = this.sorted.find(s => s.id === id)
      item.best = !item.best
      const besties = this.sorted.filter(d => d.best).map(({ key, mid }) => ({ key, mid }))
      console.log(JSON.stringify(besties))
      updateDistancesPalette(this.sorted, item.palette)
    },
    sortingDone () {
      updateDistances(this.sorted)
      const bests = bestMetrics(this.sorted)

      this.sorted.forEach(r => {
        r.bestMetrics = {
          totalDistance: bests[r.palette].totalDistance === r.metrics.totalDistance,
          avgAngleChange: bests[r.palette].avgAngleChange === r.metrics.avgAngleChange,
          maxAngleChange: bests[r.palette].maxAngleChange === r.metrics.maxAngleChange,
          meanDistance: bests[r.palette].meanDistance === r.metrics.meanDistance,
          devDistance: bests[r.palette].devDistance === r.metrics.devDistance,
          harmonicScore: bests[r.palette].harmonicScore === r.metrics.harmonicScore,
          perceptualUniformity: bests[r.palette].perceptualUniformity === r.metrics.perceptualUniformity,
          lchAvgChange: {
            L: bests[r.palette].lchAvgChange.L === r.metrics.lchAvgChange.L,
            C: bests[r.palette].lchAvgChange.C === r.metrics.lchAvgChange.C,
            H: bests[r.palette].lchAvgChange.H === r.metrics.lchAvgChange.H
          },
          lchMaxChange: {
            L: bests[r.palette].lchMaxChange.L === r.metrics.lchMaxChange.L,
            C: bests[r.palette].lchMaxChange.C === r.metrics.lchMaxChange.C,
            H: bests[r.palette].lchMaxChange.H === r.metrics.lchMaxChange.H
          },
          lchDeviation: {
            L: bests[r.palette].lchDeviation.L === r.metrics.lchDeviation.L,
            C: bests[r.palette].lchDeviation.C === r.metrics.lchDeviation.C,
            H: bests[r.palette].lchDeviation.H === r.metrics.lchDeviation.H
          }
        }
      })
    }
  },
  mounted () {
    this.sort()
  },
  computed: {
    filtered () {
      let current = { data: {}, odd: 0 }

      return this.sorted.map((data) => {
        const next = { data: reactive(data), skip: 0, odd: current.odd }

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
