<template>
  <v-app theme="dark">
    <v-navigation-drawer v-model="showNav" width="423"></v-navigation-drawer>

    <v-app-bar scroll-behavior="hide" :scroll-threshold="64">
      <v-app-bar-nav-icon @click="showNav = !showNav" />
    </v-app-bar>

    <v-main style="--v-layout-top: 64px;">
      <v-container max-width="1400">
        <v-table hover>
          <thead>
            <tr>
              <th>Palette</th>
              <th>Algorithm</th>
              <th class="text-right">Colors</th>
              <th class="text-right">Time</th>
              <th class="text-center">Best</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr
              :style="{ background: odd ? 'rgba(0,0,0,.5)' : null }"
              v-for="{
            data: { colors, label, palette, time, key, best, id },
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
              <td style="width: 230px">{{ label }}</td>
              <td style="width: 72px" class="text-right">
                {{ colors.length || '...' }}
              </td>
              <td style="width: 72px" class="text-right">
                {{ time !== null ? `${time.toFixed(0)} ms` : '...' }}
              </td>
              <td style="width: 72px">
                <v-checkbox-btn :model-value="best" @click="e => bestChange(e, id)" />
              </td>
              <td>
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
import { sortAll } from '@/sort-all.js'
import { palettes } from '@/palettes.js'
import { representations, sortingMethods } from '@/sortings.js'
import XPreview from '@/XPreview.vue'

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
          palettes,
          representations,
          sortingMethods,
          this.onrender,
      )

      this.types = types
      this.sorted = sorted

      this.renderingTotal = 0
      this.rendered = 0

      ;[...sorted].sort((a, b) => a.id - b.id).forEach(x => {
        if(x.render) {
          this.renderingTotal++
          x.render()
        }
      })
    },
    onrender ({ result, elapsed, row }) {
      const r = this.sorted.find((x) => x.id === row.id)
      this.rendered++
      this.flushRenders.push({r, result, elapsed})

      clearTimeout(this.flushTimeout)

      this.flushTimeout = setTimeout(() => {
        while (this.flushRenders.length) {
          const {r, result, elapsed} = this.flushRenders.shift()
          r.colors = result
          r.time = elapsed
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
      const besties = this.sorted.filter(d => d.best).map(({ key, label }) => ({ key, label }))
      console.log(JSON.stringify(besties))
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
