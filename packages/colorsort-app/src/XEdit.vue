<template>
  <div>
    <div class="d-flex">
      <div class="v-col-7">
        <div @click="click(colors)" class="d-flex pl-4 flex-grow-1 align-self-stretch">
          <div class="mx-4 text-grey" style="min-width: 48px;">Input</div>
          <div class="color-row mx-8" style="border: 1px solid white; display: flex; align-items: center; width: 100%;">
            <div v-for="c in colors" style="flex: 1 1; min-width: 1px; min-height: 50px; border-top: 20px solid transparent; border-bottom: 20px solid transparent; box-sizing: border-box;" :style="{ background: c }" />
          </div>
        </div>
        <div @click="click(colorsEq.resampled)" class="mt-4 pl-4 d-flex flex-grow-1 align-self-stretch">
          <div class="mx-4" style="min-width: 48px;"></div>
          <div class="color-row mx-8" style="border: 1px solid white; display: flex; align-items: center; width: 100%;">
            <div v-for="c in colorsEq.resampled" style="flex: 1 1; min-height: 20px;" :style="{ background: c }" />
          </div>
        </div>
        <div @click="click(colorsEq.colors)" class="mt-8 d-flex pl-4 flex-grow-1 align-self-stretch">
          <div class="mx-4 text-grey" style="min-width: 48px;">Output</div>
          <div class="color-row mx-8" style="border: 1px solid white; display: flex; align-items: center; width: 100%;">
            <div v-for="c in colorsEq.colors" style="flex: 1 1; min-width: 1px; min-height: 50px; border-top: 20px solid transparent; border-bottom: 20px solid transparent; box-sizing: border-box;" :style="{ background: c }" />
          </div>
        </div>
        <div @click="click(colorsEq.processed)" class="mt-4 d-flex pl-4 flex-grow-1 align-self-stretch">
          <div class="mx-4" style="min-width: 48px;"></div>
          <div class="color-row mx-8" style="border: 1px solid white; display: flex; align-items: center; width: 100%;">
            <div v-for="c in colorsEq.processed" style="flex: 1 1; min-height: 20px;" :style="{ background: c }" />
          </div>
        </div>
      </div>
      <div class="v-col-5 pr-10">
        <ccv-line-chart :data="chartData" :options="chartOptions" />
      </div>
    </div>
    <!-- Controls -->
    <div class="d-flex flex-row justify-space-between mx-8 mb-8 mt-16">
      <div style="min-width: 30%">
        <v-slider v-model="lowGain" :min="-2" :max="2" thumb-label label="Low" />
      </div>
      <div style="min-width: 30%">
        <v-slider v-model="midGain" :min="-2" :max="2" thumb-label label="Mid" />
      </div>
      <div style="min-width: 30%">
        <v-slider v-model="highGain" :min="-2" :max="2" thumb-label label="High" />
      </div>
    </div>
    <div class="d-flex flex-row justify-space-between mx-8 my-8">
      <div style="min-width: 30%">
        <v-slider v-model="shift" :min="0" :max="360" step="1" thumb-label label="Phase shift" />
      </div>
      <div style="min-width: 30%">
        <v-slider v-model="width" :min="0" :max="4" thumb-label label="Width" />
      </div>
      <div style="min-width: 30%">
        <v-slider v-model="distortion" :min="0" :max="3" thumb-label label="Distortion" />
      </div>
    </div>
    <div class="d-flex flex-row justify-space-between mx-8 my-8">
      <div style="min-width: 22%">
        <v-slider v-model="decay" :min="0" :max="3" thumb-label label="Reverb decay" />
      </div>
      <div style="min-width: 22%">
        <v-slider v-model="mix" :min="0" :max="1" thumb-label label="Reverb mix" />
      </div>
      <div style="min-width: 22%">
        <v-slider v-model="exciter" :min="0" :max="1" thumb-label label="Exciter amount" />
      </div>
      <div style="min-width: 22%">
        <v-slider v-model="frequency" :min="0" :max=".5" thumb-label label="Exciter freq." />
      </div>
    </div>
    <div class="d-flex flex-row justify-space-between mx-8 my-8">
      <div style="min-width: 22%">
        <v-slider v-model="threshold" :min="0" :max=".4" thumb-label label="Comp. threshold" />
      </div>
      <div style="min-width: 22%">
        <v-slider v-model="ratio" :min="1" :max="10" thumb-label label="Comp. ratio" />
      </div>
      <div style="min-width: 22%">
        <v-slider v-model="attack" :min="0" :max="1" thumb-label label="Comp. attack" />
      </div>
      <div style="min-width: 22%">
        <v-slider v-model="release" :min="0" :max="1" thumb-label label="Comp. release" />
      </div>
    </div>
    <div class="d-flex flex-row justify-space-between mx-8 my-8">
      <div style="min-width: 22%">
        <v-slider v-model="lightnessSmoothing" :min="0" :max="1" thumb-label label="Light. smoothing" />
      </div>
      <div style="min-width: 22%">
        <v-slider v-model="spectralBlur" :min="0" :max="5" step="1" thumb-label label="Spectral blur" />
      </div>
      <div style="min-width: 22%">
        <v-slider v-model="gateThreshold" :min="0" :max="1" thumb-label label="Sp. gate threshold" />
      </div>
      <div style="min-width: 22%">
        <v-slider v-model="gateRatio" :min="0" :max="1" thumb-label label="Sp. gate ratio" />
      </div>
    </div>
    <div class="d-flex flex-row justify-space-between mx-8 my-8">
      <div style="min-width: 30%">
        <v-slider v-model="combFrequency" :min="0" :max="1" thumb-label label="Comb filter freq." />
      </div>
      <div style="min-width: 30%">
        <v-slider v-model="combFeedback" :min="0" :max="1" thumb-label label="Comb filter feedback" />
      </div>
      <div style="min-width: 30%">
        <v-slider v-model="combMix" :min="0" :max="1" thumb-label label="Comb filter mix" />
      </div>
    </div>
    <div class="d-flex flex-row justify-space-between mx-8 my-8">
      <div style="min-width: 30%">
        <v-slider v-model="fundamental" :min="0" :max="1" thumb-label label="Extract fundamental" />
      </div>
      <div style="min-width: 30%">
        <v-slider v-model="harmonics" :min="1" :max="16" step="1" thumb-label label="Extract harmonics" />
      </div>
      <div style="min-width: 30%">
        <v-slider v-model="bandwidth" :min="0" :max="1" thumb-label label="Extract bandwidth" />
      </div>
    </div>
    <div class="d-flex flex-row justify-space-between mx-8 my-8">
      <div style="min-width: 30%">
        <v-slider v-model="dc" :min="-10" :max="10" thumb-label label="DC" />
      </div>
      <div style="min-width: 30%">
        <v-slider v-model="randomize" :min="0" :max="10" thumb-label label="Randomize" />
      </div>
    </div>
  </div>
</template>
<script>
import { applySpectralProcessing, oklch, oklch2hex, oklch2oklab, randomizer } from 'colorsort'
import { CcvLineChart } from '@carbon/charts-vue'

let id = 0

export default {
  components: { CcvLineChart },
  props: {
    colors: {
      type: Array,
      default: () => []
    }
  },
  data: () => ({
    lowGain: 1,
    midGain: 1,
    highGain: 1,
    shift: 0,
    distortion: 0,
    width: 1,
    decay: 0,
    mix: 0,
    threshold: 0.2,
    ratio: 1,
    attack: 0,
    release: 0,
    exciter: 0,
    frequency: 0,
    lightnessSmoothing: 0,
    spectralBlur: 0,
    combFrequency: 0,
    combFeedback: 0,
    combMix: 0,
    gateThreshold: 0,
    gateRatio: 1,
    fundamental: 0,
    harmonics: 8,
    bandwidth: .5,
    dc: 1,
    randomize: 0,
    chartOptions: {
      theme: 'g100',
      toolbar: {
        enabled: false
      },
      color: {scale:{
        L: '#eee',
        a: '#f77',
        b: '#ff3',
        'L~': '#999',
        'a~': '#c77',
        'b~': '#cc3'
      }},
      legend: {
        position: 'left',
        enabled: true
      },
      axes: {
        bottom: {
          mapsTo: 't',
          scaleType: 'linear',
          visible: true,
          includeZero: true,
        },
        right: {
          mapsTo: 'value',
          scaleType: 'linear',
          visible: true,
        }
      },
      tooltip: {},
      height: '212px',
      grid: {
        x: {
          numberOfTicks: 4,
        },
      }
    },
    chartData: []
  }),
  computed: {
    colorsEq () {
      const lchs = this.colors.map(oklch)

      if (this.randomize) {
        const rand = randomizer(this.randomize)
        lchs.sort((a, b) => {
          if (rand() < this.randomize / 10) {
            return rand() - .5
          } else {
            return 0
          }
        })
      }


      const { lowGain, midGain, highGain } = this

      const distortion = this.distortion ? {
        type: ['soft' | 'hard' | 'tube'][Math.floor(this.distortion)],
        amount: this.distortion - Math.floor(this.distortion)
      } : undefined

      const reverb = this.mix ? {
        decay: this.decay,
        mix: this.mix
      } : undefined

      const compression = this.ratio > 1 ? {
        threshold: this.threshold,
        ratio: this.ratio,
        attack: Math.max(this.attack, .01),
        release: Math.max(this.release, .01),
      } : undefined

      const exciter = this.exciter ? {
        amount: this.exciter,
        frequency: Math.max(.01, this.frequency)
      } : undefined

      const spectralBlur = this.spectralBlur ? { amount: this.spectralBlur } : undefined

      const combFilter = this.combMix ? {
        frequency: Math.max(this.combFrequency, .01),
        mix: this.combMix,
        feedback: this.combFeedback
      } : undefined

      const spectralGate = this.gateRatio < 1 ? {
        ratio: this.gateRatio,
        threshold: this.gateThreshold
      } : undefined

      const partialExtraction = this.fundamental > 0 ? {
        fundamental: this.fundamental,
        harmonics: this.harmonics,
        bandwidth: this.bandwidth,
      } : undefined

      const eq = (lowGain !== 1 || midGain !== 1 || highGain !== 1) ? {
        lowGain, midGain, highGain
      } : undefined

      const options = {
        eq,
        dc: this.dc !== 1 ? this.dc : undefined,
        phaseShift: this.shift || undefined,
        stereoWidth: this.width !== 1 ? this.width : undefined,
        distortion,
        reverb,
        compression,
        exciter,
        lightnessSmoothing: this.lightnessSmoothing || undefined,
        spectralBlur,
        combFilter,
        spectralGate,
        partialExtraction
      }

      // console.log(JSON.stringify(options))

      const { colors, processed, resampled, spectrum } = applySpectralProcessing(lchs, options)

      const cl = colors.length - 1
      const sl = spectrum[0].length - 1
      const labs = colors.map(oklch2oklab)

      this.chartData = [
        ...spectrum[0].map((value, index) => ({ value, t: index / sl, group: 'L~' })),
        ...spectrum[1].map((value, index) => ({ value, t: index / sl, group: 'a~' })),
        ...spectrum[2].map((value, index) => ({ value, t: index / sl, group: 'b~' })),
        ...labs.map((value, index) => ({ value: value[0], t: index / cl, group: 'L'})),
        ...labs.map((value, index) => ({ value: value[1], t: index / cl, group: 'a'})),
        ...labs.map((value, index) => ({ value: value[2], t: index / cl, group: 'b'})),
      ]

      // console.log(this.chartData)

      return {
        colors: colors.map(oklch2hex),
        processed: processed.map(oklch2hex),
        resampled: resampled.map(oklch2hex)
      }
    }
  },
  methods: {
    click(colors) {
      id++
      console.log(`const colors_${id} = [${colors.map(x => `'${x}'`).join(', ')}]`)
    }
  }
}
</script>
