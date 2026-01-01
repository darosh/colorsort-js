<template>
  <v-responsive>
    <v-app theme="dark">
      <v-main>
        <v-container max-width="1400">
          <v-table hover>
            <tbody>
              <tr
                :style="{ background: odd ? 'rgba(0,0,0,.5)' : null }"
                v-for="{
            data: { colors, label, palette, time },
            skip,
            odd,
          } in filtered"
                @click="showPreview = !showPreview"
                @mouseenter="onmouseenter(colors)"
              >
                <td style="width: 90px; vertical-align: top; padding-top: 14px" v-if="skip" :rowspan="skip">
                  {{ palette }}<br /><br /><i>{{ types[palette - 1].type }}</i>
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
                <td style="width: 90px" class="text-right">
                  {{ colors.length || '...' }}
                </td>
                <td style="width: 90px" class="text-right">
                  {{ time !== null ? `${time.toFixed(0)} ms` : '...' }}
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
      <div v-if="showPreview" style="position: fixed; bottom:0; background: rgba(0,0,0,.5);">
        <x-preview :points="selectedColors" />
      </div>
    </v-app>
  </v-responsive>
</template>

<script>
import { reactive } from 'vue'
import { sortAll } from '@/sort-all.js'
import { palettes } from '@/paletes.js'
import { representations, sortingMethods } from '@/sortings.js'
import XPreview from '@/XPreview.vue'

export default {
  components: { XPreview },
  data: () => ({
    showPreview: false,
    sorted: [],
    types: [],
    selectedColors: [],
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
    },
    onrender ({ result, elapsed, row }) {
      const r = this.sorted.find((x) => x.id === row.id)
      r.colors = result
      r.time = elapsed
    },
    formatTypes (obj) {
      return Object.fromEntries(
          Object.entries(obj).map(([k, v]) => [k, v.toFixed(2)]),
      )
    },
    onmouseenter (colors) {
      this.selectedColors = colors
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
