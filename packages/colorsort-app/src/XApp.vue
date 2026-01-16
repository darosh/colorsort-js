<style>
#app-bar .v-toolbar__content {
  background: rgb(33, 33, 33);
}

#app-bar .ext {
  background: rgb(33, 33, 33);
}

.fade {
  background: linear-gradient(to right, transparent, rgba(18, 18, 18, 0) 8px, rgba(18, 18, 18, 1) 24px, rgba(18, 18, 18, 1) calc(100% - 24px), rgba(18, 18, 18, 0) calc(100% - 8px), transparent);
}

.trow:hover {
  background: rgb(28, 28, 28);
}

.no-events, .no-events * {
  pointer-events: none;
}

.trow.trow-dark {
  border-top: solid #303030 1px;
}

.trow.trow-light, .trow > .trow-first {
  border-top: solid #505050 1px;
}

.trow.trow-original {
  border-top: solid #555 1px;
  background: #222;
}

.trow.trow-original + .trow {
  border-top: solid #555 1px ;
}

.fill {
  align-self: stretch; /* fills row height */
  display: flex;
  align-items: center; /* centers content vertically */
}

a.link {
  color: #3090ff;
  text-decoration: none;
}

a.link:hover {
  text-decoration: underline;
}

a.link-grey {
  color: #aaaaaa;
}
</style>

<template>
  <v-app theme="dark" class="">
    <!--    <v-navigation-drawer v-model="showNav" width="423"></v-navigation-drawer>-->

    <v-app-bar flat id="app-bar" :scroll-behavior="focusPending ? null : 'hide'" :scroll-threshold="72" color="transparent">
      <!--      <v-app-bar-nav-icon @click="showNav = !showNav" />-->
      <v-app-bar-title class="flex-0-0 mr-4" style="width: 194px;">Color Sorting R&D</v-app-bar-title>
      <v-toolbar-items class="mr-4">
        <v-btn href="./#/">Palettes</v-btn>
        <v-btn href="./#/stats">Statistics</v-btn>
      </v-toolbar-items>
      <v-spacer />
      <div v-show="routeLoaded">
        <span class="ml-4 text-grey-lighten-1"
          >{{ number(methodsCount) }}
          {{
            methodsCount === 1 ? 'method' : 'methods'
          }}</span
        >
        <span class="ml-8 text-grey-lighten-1" v-show="filtered.length === types.length"
          >{{
            number(types.length)
          }}
          {{ types.length === 1 ? 'palette' : 'palettes' }}</span
        >
        <span class="ml-8 text-grey-lighten-3" v-show="filtered.length < types.length"
          >{{
            number(filtered.length)
          }}
          of {{ number(types.length) }} {{ types.length === 1 ? 'palette' : 'palettes' }}</span
        >
        <span class="mx-8 text-grey-lighten-1" v-show="filteredGroups.length === totalGroups"
          >{{
            number(totalGroups)
          }}
          {{ types.length === 1 ? 'result' : 'results' }}</span
        >
        <span class="mx-8 text-grey-lighten-3" v-show="filteredGroups.length < totalGroups"
          >{{
            number(filteredGroups.length)
          }}
          of {{ number(totalGroups) }} {{ totalGroups === 1 ? 'result' : 'results' }}</span
        >
      </div>
      <template v-if="!showStats">
        <v-text-field @focus="onFocusIn" @focusout="onFocusOut" id="help" clearable prepend-icon="mdi-magnify" autocomplete="off" v-model.lazy="filterPalette" hide-details class="align-self-center mr-4 mt-1" placeholder="Palette" density="compact" variant="solo-filled" max-width="220">
          <template v-slot:append-inner>
            <v-icon style="cursor: help;" @mouseenter="() => { menu = true }" @mouseleave="() => { menu = false }"> mdi-help-circle </v-icon>
          </template>
        </v-text-field>
        <v-text-field @focus="onFocusIn" @focusout="onFocusOut" clearable v-model.lazy="filterMethod" hide-details autocomplete="off" class="align-self-center mr-4 mt-1" placeholder="Method" density="compact" variant="solo-filled" max-width="180" />
        <v-btn :icon="expandedAll ? `mdi-unfold-less-horizontal` : `mdi-unfold-more-horizontal`" @click="onExpandAll"></v-btn>
      </template>

      <template v-slot:extension>
        <div v-if="!showStats && routeLoaded" class="d-flex" style="width: 100%;">
          <div style="width: 226px;" class="flex-grow-0 px-8"></div>
          <div class="d-flex ext flex-grow-1" style="flex-direction: row; height: 48px; padding-top: 12px;">
            <div style="width: 214px;" class="flex-grow-0"></div>
            <div style="width: 92px;" class="text-grey flex-grow-0 text-right">Time</div>
            <div style="width: 428px;" class="text-grey flex-grow-0 text-center">Length, Avg, Dev / Curv., Avg, Dev / Curv.%</div>
            <div style="width: 120px;" class="text-grey flex-grow-0 text-center">Avg&deg;, Max&deg;</div>
            <div style="width: 120px;" class="text-grey flex-grow-0 text-center">P, H</div>
            <div style="width: 74px;" class="text-grey flex-grow-0 text-center">LCH</div>
            <div style="width: 52px;" class="text-grey flex-grow-0 text-right">Diff</div>
            <div style="width: 68px;" class="text-grey flex-grow-0 text-center">Best</div>
            <div class="flex-grow-1"></div>
          </div>
        </div>
        <div v-else-if="showStats && routeLoaded" class="d-flex ext" style="width: 100%; flex-direction: row; height: 48px; align-items: center">
          <v-spacer />
          <v-switch v-model="includeOriginal" hide-details label="Include original" class="mx-8"></v-switch>
          <v-switch v-model="showAll" hide-details label="Show all" class="mx-4"></v-switch>
          <v-slider density="compact" :step="1" :min="1" :max="palettesData.length" v-model="targetCoverage" hide-details max-width="210" class="ml-8"></v-slider>
          <div class="mr-8 ml-4 text-right" style="min-width: 288px;"><a class="link" :href="`./#/?m=${encodeURIComponent('#')}${targetCoverage}`">Target method coverage</a>: {{targetCoverage}} palettes</div>
        </div>
      </template>
    </v-app-bar>

    <v-menu :model-value="menu" z-index="100000" target="#help">
      <v-card min-width="200" class="bg-surface-light">
        <v-table density="compact" class="mt-2 mb-2" style="background: transparent; font-size: 16px;">
          <tbody>
            <tr>
              <td><b>&lt;12</b></td>
              <td>less than 12 colors</td>
            </tr>
            <tr>
              <td><b>&gt;64</b></td>
              <td>more than 64 colors</td>
            </tr>
            <tr>
              <td><b>100</b></td>
              <td>search number</td>
            </tr>
            <tr>
              <td><b>nintendo</b></td>
              <td>search name</td>
            </tr>
            <tr>
              <td><b>random+</b></td>
              <td>show all after name</td>
            </tr>
            <tr>
              <td><b>42+</b></td>
              <td>show all after number</td>
            </tr>
            <tr>
              <td><b>lo-</b></td>
              <td>palettes from lospec.com</td>
            </tr>
            <tr>
              <td><b>poline-</b></td>
              <td>palettes generated with poline</td>
            </tr>
            <tr>
              <td colspan="2">search is case sensitive</td>
            </tr>
          </tbody>
        </v-table>
      </v-card>
    </v-menu>

    <v-main style="--v-layout-top: 96px;">
      <v-container @mousemove="listMouse" v-if="!showStats" fluid class="px-4 d-flex" style="flex-direction: column; padding-left: 230px !important;">
        <v-virtual-scroll :items="filteredGroups" renderless :height="tableHeight" item-key="__key" :item-height="58">
          <template v-slot:default="{ itemRef, item: { __key, groupIndex, original, group: { record: {colors, palette, quality, metrics, bestDistance, bestDistanceQuality}, methods }, key }, index: rowIndex }">
            <div class="trow" :class="{'trow-dark': rowIndex && groupIndex, 'trow-light': rowIndex && !groupIndex, 'trow-original': original}" style="position: relative; display: flex; align-items: center;" :ref="itemRef" @click="showPreview = !showPreview" @mouseenter="onmouseenter(colors, palette, __key)">
              <div v-if="!groupIndex" style="align-self: start; width: 230px; overflow: hidden; text-overflow: ellipsis; padding-right: 16px; white-space: nowrap; position: absolute; left: -230px; margin-top: -1px; padding-top: 16.5px;" class="pl-8 trow-first">
                <a @click.stop="() => {}" class="link" :href="`./#/?p=${encodeURIComponent(`${palette.index + 1}:${palette.key}`)}`">{{ `${palette.index + 1}: ${palette.key}` }}</a>
              </div>

              <div @mousemove="e => enterMethods(e, methods, __key)" @mouseleave="leaveMethods" class="text-pre flex-grow-0 fill" style="width: 210px; cursor: pointer;" @click.stop="expandIndex(__key)">
                {{
                  (methods.length === 1 || isExpanded(__key)) ? methods.map(m => m.method.mid).join('\n') : `${methods[0].method.mid} ...+${methods.length - 1}`
                }}
              </div>
              <div class="text-pre text-right flex-grow-0" style="width: 90px; cursor: pointer;" @click.stop="expandIndex(__key)">
                {{
                  (methods.length === 1 || isExpanded(__key)) ? methods.map(({ time }) => time !== null ? `${time.toFixed(0)} ms` : '...').join('\n') : `... ${methods[0].time.toFixed(0)}ms`
                }}
              </div>

              <div style="width: 60px" class="text-right px-1 flex-grow-0" :style="{color: scale(quality?.totalDistance)}">
                <template v-if="quality?.totalDistance === 0">*</template>
                <template v-if="metrics">{{ metrics.totalDistance.toFixed(2) }}</template>
                <template v-else>...</template>
              </div>
              <div style="width: 60px" class="text-right px-1 flex-grow-0" :style="{color: scale(quality?.meanDistance)}">
                <template v-if="quality?.meanDistance === 0">*</template>
                <template v-if="metrics">{{ metrics.meanDistance.toFixed(2) }}</template>
                <template v-else>...</template>
              </div>
              <div style="width: 60px" class="text-right px-1 flex-grow-0" :style="{color: scale(quality?.devDistance)}">
                <template v-if="quality?.devDistance === 0">*</template>
                <template v-if="metrics">{{ metrics.devDistance.toFixed(2) }}</template>
                <template v-else>...</template>
              </div>

              <div style="width: 60px" class="text-right px-1 flex-grow-0" :style="{color: scale(quality?.totalCurveDistance)}">
                <template v-if="quality?.totalCurveDistance === 0">*</template>
                <template v-if="metrics">{{ metrics.totalCurveDistance.toFixed(2) }}</template>
                <template v-else>...</template>
              </div>
              <div style="width: 60px" class="text-right px-1 flex-grow-0" :style="{color: scale(quality?.meanCurveDistance)}">
                <template v-if="quality?.meanCurveDistance === 0">*</template>
                <template v-if="metrics">{{ metrics.meanCurveDistance.toFixed(2) }}</template>
                <template v-else>...</template>
              </div>
              <div style="width: 60px" class="text-right px-1 flex-grow-0" :style="{color: scale(quality?.devCurveDistance)}">
                <template v-if="quality?.devCurveDistance === 0">*</template>
                <template v-if="metrics">{{ metrics.devCurveDistance.toFixed(2) }}</template>
                <template v-else>...</template>
              </div>

              <div style="width: 60px" class="text-right px-1 flex-grow-0" :style="{color: scale(quality?.curveRatio)}">
                <template v-if="quality?.curveRatio === 0">*</template>
                <template v-if="metrics">{{ (100 * metrics.curveRatio).toFixed(1) }}%</template>
                <template v-else>...</template>
              </div>
              <div style="width: 60px" class="text-right px-1 flex-grow-0" :style="{color: scale(quality?.avgAngleChange)}">
                <template v-if="quality?.avgAngleChange === 0">*</template>
                <template v-if="metrics">{{ metrics.avgAngleChange.toFixed() }}&deg;</template>
                <template v-else>...</template>
              </div>
              <div style="width: 60px" class="text-right px-1 flex-grow-0" :style="{color: scale(quality?.maxAngleChange)}">
                <template v-if="quality?.maxAngleChange === 0">*</template>
                <template v-if="metrics">{{ metrics.maxAngleChange.toFixed() }}&deg;</template>
                <template v-else>...</template>
              </div>

              <div style="width: 60px" class="text-right px-1 flex-grow-0" :style="{color: scale(quality?.perceptualUniformity)}">
                <template v-if="quality?.perceptualUniformity === 0">*</template>
                <template v-if="metrics">{{ metrics.perceptualUniformity.toFixed(2) }}</template>
                <template v-else>...</template>
              </div>

              <div style="width: 60px" class="text-right px-1 flex-grow-0" :style="{color: scale(quality?.harmonicScore)}">
                <template v-if="quality?.harmonicScore === 0">*</template>
                <template v-if="metrics">{{ metrics.harmonicScore.toFixed(2) }}</template>
                <template v-else>...</template>
              </div>

              <div style="width: 100px; line-height: 14px; font-size: 12px;" class="text-center text-no-wrap flex-grow-0 py-2">
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
              </div>
              <div style="width: 32px" class="text-right px-1 flex-grow-0" :style="{color: scale(bestDistanceQuality)}">
                {{ bestDistance !== null ? (!bestDistance ? 0 : bestDistance.toFixed(2)) : '...' }}
              </div>
              <div style="width: 64px" class="text-center pr-0 pl-5 flex-grow-0">
                <v-checkbox-btn style="margin-right: -6px; margin-left: -4px;" :model-value="methods.some(m => m.best)" @click.stop="e => bestChange(e, key, methods[0].index, methods.some(m => m.best))" />
              </div>

              <div class="pl-0 flex-grow-1">
                <div style="display: flex; min-width: 80px; cursor: crosshair;" v-intersect="v => onIntersect(v, __key, palette)">
                  <div @mouseleave="leaveColors" @mousemove="e => enterColors(e, c)" v-if="!rowIndex || isVisible[__key]" v-for="c in colors" style="flex: 1 1; min-width: 1px; min-height: 10px" :style="{ background: c }" />
                </div>
              </div>
            </div>
          </template>
        </v-virtual-scroll>
      </v-container>

      <div class="fade" style="pointer-events: none; position: fixed; top:0; left: 0; width: 226px; vertical-align: top; padding: 76px 32px 16px 32px;" v-if="showFade && !showStats && palette?.type?.data">
        <div style="height: 29px;">{{ palette.index + 1 }}: {{ palette.key }}</div>

        <div class="d-flex mt-8">
          <div v-for="c in  palette.colors" style="flex: 1 1; min-width: .1px; min-height: 10px" :style="{ background: c }" />
        </div>

        <v-table density="compact" class="mt-8 bg-transparent">
          <tbody>
            <tr v-for="(value, key) in formatTypes(palette.type.data)">
              <td class="pl-0 px-0">{{ key }}</td>
              <td class="text-right px-0">{{ value }}</td>
            </tr>
            <tr>
              <td class="pl-0 px-0">groups</td>
              <td class="text-right px-0">{{ palette.groups.length }} / {{ (100 * palette.groups.length / algorithmStats.length).toFixed(0) }}%</td>
            </tr>
            <tr>
              <td colspan="2" class="font-italic text-right px-0">{{ palette.type.type }}</td>
            </tr>
          </tbody>
        </v-table>

        <div style="display: flex; align-items: center" class="mt-6">
          <div style="height: 10px;" :style="{width: `${v * 100}%`, background: `rgb(${r},${g},${b})`}" v-for="[r,g,b,v] in palette.gram"></div>
          <div class="text-no-wrap pl-2">{{ palette.gram.length }} / {{ palette.colors.length }}</div>
        </div>
      </div>

      <v-container v-if="showStats">
        <v-table class="mt-8 mb-8 mx-auto" hover style="max-width: 600px;" striped="odd">
          <thead>
            <tr>
              <th>Method</th>
              <th class="text-right">Best count</th>
              <th class="text-right">Only best count</th>
              <th class="text-right">Win rate</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="{alSt, incl} in algorithmStatsFiltered">
              <td>
                <a :class="{'link-grey': !incl}" class="link" :href="`./#/?m=${encodeURIComponent(alSt.mid)}`">{{ alSt.mid }}</a>
              </td>
              <td class="text-right">{{ alSt.bestCount }}</td>
              <td class="text-right" :class="{'text-grey-darken-2': !alSt.onlyBestCount}">{{ alSt.onlyBestCount }}</td>
              <td class="text-right">{{ alSt.winRate.toFixed(1) }}%</td>
            </tr>
          </tbody>
        </v-table>
      </v-container>
    </v-main>

    <div v-if="!showStats && showPreview" style="position: fixed; z-index: 2000; bottom:12px; left: 12px; background: rgba(0,0,0,.5);">
      <x-preview :points="selectedColors" />
    </div>
  </v-app>
  <v-menu transition="fade-transition" content-class="no-events" style="pointer-events: none;" :model-value="showMethods" :target="showMethodsTarget">
    <v-card style="column-gap: 16px;" :style="{columnCount: Math.ceil(showMethodsList.length / 30)}" v-if="showMethodsList" theme="dark" class="bg-surface-light text-pre pa-4">
      {{ showMethodsList.map(m => m.method.mid).join('\n') }}
    </v-card>
  </v-menu>
  <v-menu transition="fade-transition" content-class="no-events" style="pointer-events: none;" :model-value="!!showColors" :target="showColorsTarget">
    <v-card style="letter-spacing: 2px; font-family: monospace; min-width: 100px; min-height: 44px; font-size: 18px;" :style="{background: 'red'}" theme="dark" class="bg-surface-light text-pre pa-2 text-center">
      {{(showColors && showColors.slice(1)) || ''}}
    </v-card>
  </v-menu>
  <v-progress-linear v-if="rendered !== renderingTotal" style="z-index: 10000; position: fixed; top: 0;" height="8" color="rgb(255,0,0)" bg-color="rgb(255,127,127)" :bg-opacity="0.6" active :model-value="100 * rendered / renderingTotal" />
</template>

<script>
import { PALETTES } from 'colorsort-data-palettes'
import { SORTING_METHODS } from 'colorsort'
import XPreview from '@/XPreview.vue'
import { computePlan, computeRender, updateBest, updateDistance } from 'colorsort-compute'
import chroma from 'chroma-js'
import { render } from 'colorsort-compute/src/render.js'

import { algorithmStats, palettesData, topCoverageAlgorithms } from 'colorsort-analysis'

import { deserialize } from 'colorsort-compute'

import SORTED from 'colorsort-data-sorted/sorted.json' with { type: 'json' }

const COMPUTED = deserialize(SORTED)

// const COMPUTED = null

function debounce (func, timeout = 25) {
  let timer

  return (...args) => {
    clearTimeout(timer)
    timer = setTimeout(() => { func.apply(this, args) }, timeout)
  }
}

function debounceFalse (func, timeout = 25) {
  let timer

  return (...args) => {
    clearTimeout(timer)
    timer = setTimeout(() => { func.apply(this, args) }, args[0] ? 0 : timeout)
  }
}

const scale_ = chroma.scale(['#3f3', '#ff3', '#f77'])

function scale (x) {
  return x === 0 ? '#fff' : scale_(x)
}

const number = new Intl.NumberFormat('en-US').format

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
    isVisible: {},
    isVisiblePending: {},
    isVisibleTimer: null,
    menu: false,
    palette: null,
    lastMouseEnter: -Infinity,
    focusPending: false,
    routeLoaded: false,
    showMethods: false,
    showMethodsTarget: null,
    showMethodsList: null,
    showFade: true,
    targetCoverage: 0,
    showAll: false,
    includeOriginal: false,
    showColorsTarget: null,
    showColors: false
  }),
  methods: {
    async sort () {
      if (!COMPUTED) {
        const { sorted, types } = await computePlan(
            Object.entries(PALETTES),
            // Object.entries(PALETTES).slice(0, 10),
            // Object.entries(PALETTES).slice(0, 100),
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
          Object.entries(obj).map(([k, v]) => [
              k.replace(/([a-z])([A-Z])/g, '$1 $2')
                  .split(' ')
                  .map((x, i) => i && x.length > 1 ? x.toLowerCase() : x)
                  .join(' '),
            v.toFixed(2)]),
      )
    },
    setPreview (colors) {
      this.selectedColors = colors
    },
    onmouseenter (colors, palette, key) {
      this.palette = palette
      this.debouncedPreview(colors)
      this.lastMouseEnter = Date.now()
      // this.isVisible[key] = true
      this.isVisiblePending[key] = true
      this.scheduleVisibleUpdate()
    },
    scale (v) {
      return v === undefined ? null : scale(v)
    },
    bestChange (e, key, methodsIndex, value) {
      const set = this.types.find(d => d.key === key)

      updateBest(set, methodsIndex, !value)
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
    },
    onIntersect (visible, key, palette) {
      if (visible && palette && ((this.lastMouseEnter + 400) < Date.now())) {
        this.palette = palette
      }

      // this.isVisiblePending[key] = visible
      this.isVisiblePending[key] = true
      this.scheduleVisibleUpdate()
    },
    scheduleVisibleUpdate () {
      if (this.isVisibleTimer) {
        clearTimeout(this.isVisibleTimer)
      }

      this.isVisibleTimer = setTimeout(() => {
        requestAnimationFrame(() => {
          Object.assign(this.isVisible, this.isVisiblePending)
        })
      }, 0)
    },
    number,
    onFocusIn () { this.focusPending = true },
    onFocusOut () { this.focusPending = false },
    updateQuery (newParams) {
      this.$router.replace({
        path: '/',
        query: {
          ...this.$route.query,
          ...newParams
        }
      })
    },
    enterMethods (event, methods, index) {
      if (methods.length === 1) {
        this.showMethods = false
        return
      }

      this.showMethodsList = methods
      this.updateShowMethods(methods.length === 1 ? false : !this.isExpanded(index))
      this.showMethodsTarget = [event.clientX + 16, event.clientY + 16]
    },
    leaveMethods () {
      this.updateShowMethods(false)
    },
    listMouse (event) {
      this.showFade = event.clientX > 220
    },
    enterColors (event, color) {
      this.showColorsTarget = [event.clientX + 16, event.clientY + 16]
      this.showColors = color
    },
    leaveColors () {
      this.showColors = false
    }
  },
  mounted () {
    this.debouncedPreview = debounce(this.setPreview)

    this.updateShowMethods = debounceFalse((v) => {
      this.showMethods = v
    }, 100)

    this.sort()
  },
  computed: {
    showStats: {
      get () {
        return this.$route.path === '/stats'
      },
    },
    filterMethod: {
      get () {
        return this.$route.query.m || ''
      },
      set (value) {
        this.updateQuery({ m: value })
      }
    },

    filterPalette: {
      get () {
        return this.$route.query.p || ''
      },
      set (value) {
        this.updateQuery({ p: value })
      }
    },
    methodsCount () {
      return SORTING_METHODS.length
    },
    tableHeight () {
      return this.$vuetify.display.height - 128 + 32
    },
    totalGroups () {
      return this.types.reduce((acc, { groups }) => acc + groups.length, 0)
    },
    filteredGroups () {
      return this.filtered.reduce((acc, { groups, key }) => {
        return [...acc, ...groups.map((group, index) => ({
          groupIndex: index,
          group,
          key,
          original: group.methods.some(m => m.method.mid === 'Original'),
          __key: `${key}_${group.methods[0].method.mid}`
        }))]
      }, [])
    },
    filtered () {
      if (!this.routeLoaded) {
        return []
      }

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

      const more = this?.filterPalette?.at(-1) === '+'
      const text = more ? this.filterPalette.slice(0, -1) : this.filterPalette
      let afterMore = false

      const filtered = !this.filterPalette ? this.types : this.types.filter(t => {
        if (this.filterPalette[0] === '<') {
          return t.colors.length < number
        } else if (this.filterPalette[0] === '>') {
          return t.colors.length > number
        }

        const match = afterMore || `${t.index + 1}:${t.key}`.includes(text)

        afterMore = more && match

        return match
      })

      if (!this.filterMethod) {
        return filtered
      }

      let names
      if (this.filterMethod[0] === '#') {
        names = topCoverageAlgorithms(this.algorithmStats.slice(1), Number.parseInt(this.filterMethod.slice(1), 10))
            .map(x => x.mid)
      }

      return filtered
          .map(t => {
            let groups

            if (this.filterMethod[0] === '#') {
              groups = t.groups.filter(g => g.methods.some(m => names.includes(m.method.mid)))
            } else {
              groups = t.groups.filter(g => g.methods.some(m => m.method.mid.includes(this.filterMethod)))
            }

            return {
              ...t,
              groups
            }
          })
          .filter(t => t.groups.length)
    },
    algorithmStats () {
      return algorithmStats(this.types)
          .sort((a, b) => b.bestCount - a.bestCount)
    },
    algorithmStatsFiltered () {
      const all = this.algorithmStats
          .map(alSt => ({
            alSt,
            incl: this.topCoverageAlgorithms.some(x => alSt.mid === x.mid)
          }))

      if (this.showAll) {
        return all
      }

      return all.filter(x => x.incl)
    },
    palettesData () {
      return palettesData(this.sorted)
    },
    topCoverageAlgorithmsNoOriginal () {
      return topCoverageAlgorithms(this.algorithmStats.slice(1), this.targetCoverage)
    },
    topCoverageAlgorithms () {
      return topCoverageAlgorithms(this.includeOriginal ? this.algorithmStats : this.topCoverageAlgorithmsNoOriginal, this.targetCoverage)
    }
  },
  watch: {
    '$route.matched.length' (newValue) {
      this.routeLoaded = this.routeLoaded || (newValue > 0)
    },
    '$route.matched' (newValue) {
      if (newValue.length) {
        setTimeout(() => {
          window.scrollTo({ top: 0, behavior: 'instant' })
        }, 0)
      }
    },
    showStats (newValue) {
      this.targetCoverage = this.targetCoverage || this.palettesData.length
    },
    filteredGroups (newValue) {
      if (newValue?.length && !this.palette) {
        this.palette = newValue[0].group.record.palette
      }

      if (!newValue?.length && this.palette) {
        this.palette = null
      }

      if (newValue.length) {
        const count = Math.min(newValue.length, Math.ceil(this.$vuetify.display.height / 48))

        for (let i = 0; i < count; i++) {
          const { __key } = newValue[i]

          this.isVisiblePending[__key] = true
        }

        this.scheduleVisibleUpdate()
      }
    }
  }
}
</script>
