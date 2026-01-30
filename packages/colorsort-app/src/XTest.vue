<style></style>
<template>
  <div>
    <div class="d-flex">
      <div class="v-col-7 px-8">
        <div>
          <div @click="click(colors)" class="">
            <div class="text-grey" style="min-width: 48px;">Input</div>
            <x-palette :min-height="50" :colors="colors" />
          </div>
          <div @click="click(sorted.colors)" class="my-8">
            <div class="text-grey" style="min-width: 48px;">Sorted: {{ sorted.mid }}</div>
            <x-palette :min-height="50" :colors="sorted.colors" />
          </div>
        </div>
      </div>
      <div class="v-col-5 px-8">
        <div class="text-grey" style="min-width: 48px;">Input</div>
        <v-textarea density="compact" v-model="editedColors" autocomplete="off" @update:model-value="editedColorsChanged" />
        <v-btn-group>
          <v-btn density="compact" @click="shiftL(-.1)">L&minus;</v-btn>
          <v-btn density="compact" @click="shiftL()">L+</v-btn>
          <v-btn density="compact" @click="shiftC(-.1)">C&minus;</v-btn>
          <v-btn density="compact" @click="shiftC()">C+</v-btn>
          <v-btn density="compact" @click="shiftH(-45)">H&minus;</v-btn>
          <v-btn density="compact" @click="shiftH()">H+</v-btn>
        </v-btn-group>
      </div>
    </div>
    <!-- Controls -->
    <div class="mx-8">
      <div class="text-grey" style="min-width: 48px;">Fingerprint</div>
      <v-table>
        <thead>
          <tr>
            <th v-for="th in THS" class="text-right pr-5">{{ th }}</th>
            <th class="text-right">Similarity</th>
            <th></th>
            <th>Method</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="({colors, fingerprint, similarity, auto}, fi) in fingerprints.slice(0, 7)">
            <td v-for="(v, vi) in fingerprint" class="text-right">
              {{ v.toFixed(3) }}
              <template v-if="fingerprints[fi+1]">
                <v-icon v-if="v > fingerprints[fi+1].fingerprint[vi]" icon="mdi-arrow-up" size="16" color="#4f4" />
                <v-icon v-if="v < fingerprints[fi+1].fingerprint[vi]" icon="mdi-arrow-down" size="16" color="#f44" />
                <v-icon v-if="v === fingerprints[fi+1].fingerprint[vi]" icon="mdi-arrow-left" size="16" color="transparent" />
              </template>
              <v-icon v-else icon="mdi-arrow-left" size="16" color="transparent" />
            </td>
            <td class="text-right" style="width: 60px;">{{similarity}}</td>
            <td style="min-width: 110px;">
              <x-palette :min-height="10" :colors="colors" />
            </td>
            <td>{{auto}}</td>
          </tr>
        </tbody>
      </v-table>
    </div>
  </div>
</template>
<script>
import {
  normalizeUp,
  MASTER_LCH,
  metricsFftFingerprint,
  getAuto,
  roundAll,
  oklch,
  oklch2hex,
  SORTING_METHODS,
  cosineSimilarity
} from 'colorsort-js'

import TRAINED from 'colorsort-data-trained/trained.json' with { type: 'json' }
import XPalette from './XPalette.vue'

const THS = [
  'Hue HFR',
  'Chr HFR',
  'Chr Var',
  'Lig Var',
  'Hue Gap',
  'Hue MxG',
  'Chromatic'
]

let id = 0

export default {
  components: { XPalette },
  props: {
    colors: {
      type: Array,
      default: () => []
    }
  },
  data: () => ({
    editedColors: '',
    parsedColors: [],
    colorHistory: []
  }),
  computed: {
    THS () {return THS},
    sorted () {
      const { colors } = this
      const mid = getAuto(colors, TRAINED)[0]
      const sorted = SORTING_METHODS.find((x) => x.mid === mid)?.fn(new Set(colors).values().toArray())

      normalizeUp(sorted)

      return {
        mid,
        colors: sorted
      }
    },
    fingerprint () {
      return roundAll(metricsFftFingerprint(this.colors.map(MASTER_LCH)).analysis.fingerprint)
    },
    fingerprints () {
      return this.colorHistory
          .map(colors => ({
            colors,
            fingerprint: roundAll(metricsFftFingerprint(colors.map(MASTER_LCH)).analysis.fingerprint),
            auto: getAuto(colors, TRAINED)[0]
          }))
          .map((x, i, array) => ({
            ...x,
            similarity: array[i + 1] ? roundAll(cosineSimilarity(x.fingerprint, array[i + 1].fingerprint)) : undefined
          }))
    }
  },
  methods: {
    click (colors) {
      console.log(metricsFftFingerprint(colors.map(MASTER_LCH)))
      id++
      console.log(`const colors_${id} = [${colors.map(x => `'${x}'`).join(', ')}]`)
    },
    editedColorsChanged (newValue) {
      const colors = newValue.match(/(?<!\w)#[0-9a-fA-F]{6}(?!\w)/g)

      if (!colors || !colors.length) {
        return
      }

      this.parsedColors = colors

      this.$router.replace({
        path: '/test',
        query: {
          c: encodeURIComponent(colors.map(x => x.slice(1)).join('-'))
        }
      })
    },
    shiftL(v=.1){
      const colors = this.colors.map(oklch).map(x => [x[0] + v, x[1], x[2]]).map(oklch2hex)

      this.$router.replace({
        path: '/test',
        query: {
          c: encodeURIComponent(colors.map(x => x.slice(1)).join('-'))
        }
      })
    },
    shiftC(v=.1){
      const colors = this.colors.map(oklch).map(x => [x[0], x[1] + v, x[2]]).map(oklch2hex)

      this.$router.replace({
        path: '/test',
        query: {
          c: encodeURIComponent(colors.map(x => x.slice(1)).join('-'))
        }
      })
    },
    shiftH(v=45){
      const colors = this.colors.map(oklch).map(x => [x[0], x[1], x[2]  + v]).map(oklch2hex)

      this.$router.replace({
        path: '/test',
        query: {
          c: encodeURIComponent(colors.map(x => x.slice(1)).join('-'))
        }
      })
    }
  },
  watch: {
    colors: {
      immediate: true,
      handler (newValue) {
        if (!this.colorHistory[0] || (newValue.join(' ') !== this.colorHistory[0].join(' '))) {
          this.colorHistory.unshift(newValue)
        }

        if (newValue.join(' ') === this.parsedColors.join(' ')) {
          return
        }

        this.editedColors = newValue.join(' ')
      }
    },
  }
}
</script>
