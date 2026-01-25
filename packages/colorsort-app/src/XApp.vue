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

.trow .color-row > div {
  border-color: rgb(18, 18, 18) !important;
}

.trow:hover .color-row > div {
  border-color: rgb(28, 28, 28) !important;
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

.trow.trow-original .color-row > div {
  border-color: #222 !important;
}

.trow.trow-original:hover {
  background: #2a2a2a;
}

.trow.trow-original:hover .color-row > div {
  border-color: #2a2a2a !important;
}

.color-row:hover > div {
  border-top-width: 10px !important;
  border-bottom-width: 10px !important;
}

.trow.trow-original + .trow {
  border-top: solid #555 1px;
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

.previewer {
  background: rgba(0, 0, 0, .87);
  border: 1px solid rgba(127, 127, 127, .4);
  border-radius: 24px;
  box-shadow: 0 0 2px rgba(128, 128, 128, .1);
}

.previewer:hover {
  background: rgba(0, 0, 0, 1);
  border-color: rgba(127, 127, 127, .4);
}

.previewer .preview-closer, .previewer .preview-buttons {
  opacity: 0;
}

.previewer:hover .preview-closer {
  opacity: .3;
}

.previewer:hover .preview-buttons {
  opacity: .3;
}

.previewer:hover .preview-closer:hover {
  opacity: .8;
}

.previewer:hover .preview-buttons:hover {
  opacity: .8;
}

.text-red-bad {
  color: #f77;
}

.text-green-good {
  color: #3f3;
}

.whitespace-nowrap {
  white-space: nowrap;
}
</style>

<template>
  <v-app theme="dark">
    <!--    <v-navigation-drawer v-model="showNav" width="423"></v-navigation-drawer>-->

    <v-app-bar overflow-x: auto; flat id="app-bar" v-model="appBar" :scroll-behavior="hideBar ? 'hide' : null" :scroll-threshold="72" color="transparent">
      <!--      <v-app-bar-nav-icon @click="showNav = !showNav" />-->
      <v-app-bar-title class="flex-0-0 mr-4" style="width: 194px;">Color Sorting R&D</v-app-bar-title>
      <v-toolbar-items class="mr-4">
        <v-btn href="./#/">Palettes</v-btn>
        <v-btn href="./#/stats">Statistics</v-btn>
      </v-toolbar-items>
      <v-spacer />
      <div v-show="routeLoaded && isWide">
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
      <template v-if="showHome && isWide">
        <v-text-field @focus="onFocusInA" @focusout="onFocusOutA" clearable prepend-icon="mdi-magnify" autocomplete="off" v-model.lazy="filterPalette" hide-details class="align-self-center mr-4 mt-1" placeholder="Palette" density="compact" variant="solo-filled" max-width="220">
          <template v-slot:append-inner>
            <v-icon id="help-p" style="cursor: help;" @mouseenter="(e) => { cursor = cxy(e); menu = true; }" @mouseleave="() => { menu = false }"> mdi-help-circle </v-icon>
          </template>
        </v-text-field>
        <v-text-field @focus="onFocusInB" @focusout="onFocusOutB" clearable v-model.lazy="filterMethod" hide-details autocomplete="off" class="align-self-center mr-4 mt-1" placeholder="Method" density="compact" variant="solo-filled" max-width="180">
          <template v-slot:append-inner>
            <v-icon id="help-m" style="cursor: help;" @mouseenter="(e) => { cursor = cxy(e); menuMethodHint = true; }" @mouseleave="() => { menuMethodHint = false }"> mdi-help-circle </v-icon>
          </template>
        </v-text-field>
        <v-btn :icon="expandedAll ? `mdi-unfold-less-horizontal` : `mdi-unfold-more-horizontal`" @click="onExpandAll"></v-btn>
      </template>

      <template v-slot:extension>
        <div v-if="showHome && routeLoaded && isWide" class="d-flex" style="width: 100%;">
          <div style="width: 230px;" class="flex-grow-0 px-8"></div>
          <div class="d-flex ext flex-grow-1" style="flex-direction: row; height: 48px; padding-top: 12px;">
            <div style="width: 210px;" class="flex-grow-0"></div>
            <div style="width: 92px;" class="text-grey flex-grow-0 text-right">Time</div>
            <div style="width: 428px;" class="text-grey flex-grow-0 text-center">Length, Avg, Dev / Curv., Avg, Dev / Curv.%</div>
            <div style="width: 120px;" class="text-grey flex-grow-0 text-center">Avg&deg;, Max&deg;</div>
            <div style="width: 120px;" class="text-grey flex-grow-0 text-center">P, H</div>
            <div style="width: 74px;" class="text-grey flex-grow-0 text-center">LCH</div>
            <div style="width: 52px;" class="text-grey flex-grow-0 text-right">Diff</div>
            <div style="width: 60px;" class="text-grey flex-grow-0 text-center">Best</div>
            <div class="flex-grow-1">{{sortFingerprint ? 'Sorted!' : ''}}</div>
          </div>
        </div>
        <div v-else-if="showStats && routeLoaded && isWide" class="d-flex ext" style="width: 100%; flex-direction: row; height: 48px; align-items: center">
          <div class="mr-8 ml-4">
            <a class="link" :href="`./#/?m=${encodeURIComponent('#')}${targetCoverage}`">Target method coverage</a>: {{ targetCoverage }} {{ targetCoverage === 1 ? 'palette' : 'palettes' }} with
            {{ algorithmStatsFilteredIncl?.length }}
            {{ algorithmStatsFilteredIncl?.length === 1 ? 'method' : 'methods' }}
          </div>
          <v-spacer />
          <v-slider step="1" min="2" max="256" thumb-label thumb-size="20" max-width="210" variant="solo-filled" hide-details density="compact" type="number" v-model="maxColors">
            <template v-slot:append><span class="ml-2">Max colors</span></template>
          </v-slider>
          <v-switch v-model="includeOriginal" hide-details label="Include original" class="mx-8"></v-switch>
          <v-switch v-model="showAll" hide-details label="Show all" class="mx-4"></v-switch>
          <v-slider thumb-label thumb-size="20" density="compact" :step="1" :min="1" :max="palettesData.length" v-model="targetCoverage" hide-details max-width="210" class="ml-8 mr-8">
            <template v-slot:append><span class="ml-2">Coverage</span></template>
          </v-slider>
        </div>
      </template>
    </v-app-bar>

    <v-main style="--v-layout-top: 96px;">
      <!-- Edit page -->
      <x-edit v-if="showEdit" :colors="editingColors" />

      <!-- Palettes page -->
      <v-container @mousemove="listMouse" v-if="showHome" fluid class="px-4 d-flex" style="flex-direction: column; padding-left: 230px !important;">
        <v-virtual-scroll :items="sortedFilteredGroups" renderless :height="tableHeight" item-key="__key" :item-height="58">
          <template v-slot:default="{ itemRef, item: { __key, groupIndex, original, group: { auto, record: {colors, palette, quality, metrics, bestDistance, bestDistanceQuality, fingerprint}, methods }, key }, index: rowIndex }">
            <div
              @mouseenter="onmouseenter(undefined, palette, __key)"
              class="trow"
              :class="{'trow-dark': rowIndex && groupIndex, 'trow-light': rowIndex && !groupIndex, 'trow-original': original}"
              style="user-select: none; position: relative; display: flex; align-items: center; cursor: default;"
              :ref="itemRef"
              @click="showPreview = selectedColors !== colors; onmouseenter(colors, palette, __key);"
            >
              <div v-if="!groupIndex" style="align-self: start; width: 230px; overflow: hidden; text-overflow: ellipsis; padding-right: 16px; white-space: nowrap; position: absolute; left: -230px; margin-top: -1px; padding-top: 16.5px;" class="pl-8 trow-first">
                <a @click.stop="() => {}" class="link" :href="`./#/?p=${encodeURIComponent(`${palette.index + 1}:${palette.key}`)}`">{{
                    `${palette.index + 1}: ${palette.key}`
                }}</a>
              </div>

              <div @mousemove="e => enterMethods(e, methods, __key)" @mouseleave="leaveMethods" class="text-pre flex-grow-0 fill" style="width: 210px;" :style="{cursor: methods.length > 1 ? 'pointer' : null}" @click.stop="expandIndex(__key)">
                <v-icon v-if="auto" size="22" icon="mdi-lightbulb-on-outline" color="#4f4" />
                {{
                  (methods.length === 1 || isExpanded(__key)) ? methods.map(m => m.method.mid).join('\n') : `${methods[0].method.mid} ...+${methods.length - 1}`
                }}
              </div>
              <template v-if="isWide">
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
              </template>

              <div style="width: 64px" class="text-center pr-0 pl-5 flex-grow-0">
                <v-checkbox-btn style="margin-right: -6px; margin-left: -4px;" :model-value="methods.some(m => m.best)" @click.stop="e => bestChange(e, key, methods[0].index, methods.some(m => m.best))" />
              </div>

              <div @click.shift.stop="palettePreviewClick(colors, __key, fingerprint)" @click.alt.stop="(e) => openEdit(colors, e)" class="d-flex pl-0 flex-grow-1 align-self-stretch" @mouseenter="onmouseenter(colors, palette, __key)">
                <div class="color-row" style="display: flex; align-items: center; width: 100%; cursor: crosshair;" v-intersect="v => onIntersect(v, __key, palette)">
                  <div
                    @mouseleave="leaveColors"
                    @mousemove="e => enterColors(e, c)"
                    v-if="!rowIndex || isVisible[__key]"
                    v-for="c in colors"
                    style="flex: 1 1; min-width: 1px; min-height: 50px; border-top: 20px solid transparent; border-bottom: 20px solid transparent; box-sizing: border-box;"
                    :style="{ background: c }"
                  />
                </div>
              </div>
            </div>
          </template>
        </v-virtual-scroll>
      </v-container>

      <!-- Palette panel -->
      <div class="fade" style="pointer-events: none; position: fixed; top:0; left: 0; width: 226px; vertical-align: top; padding: 76px 32px 16px 32px;" v-if="showFade && showHome && palette?.type?.data">
        <div style="height: 29px;">{{ palette.index + 1 }}: {{ palette.key }}</div>

        <div class="d-flex mt-8">
          <div v-for="c in  palette.colors" style="flex: 1 1; min-width: .1px; min-height: 10px" :style="{ background: c }" />
        </div>

        <v-table density="compact" class="mt-8 bg-transparent whitespace-nowrap">
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

      <!-- Stats page -->
      <v-container v-if="showStats" fluid>
        <div class="mx-auto text-center py-8" v-if="!algorithmStats.length">
          <v-progress-circular size="48" indeterminate />
        </div>

        <div class="d-flex flex-wrap align-start justify-center" v-else>
          <v-table class="mt-8 mb-8 mx-4" hover style="max-width: 600px;" striped="odd">
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
                  <a :class="{'link-grey': !incl}" class="link" :href="`./#/?m=${encodeURIComponent(alSt.mid)}`">{{
                    alSt.mid
                  }}</a>
                </td>
                <td class="text-right">{{ alSt.bestCount }}</td>
                <td class="text-right" :class="{'text-grey-darken-2': !alSt.onlyBestCount}">{{ alSt.onlyBestCount }}</td>
                <td class="text-right">{{ alSt.winRate.toFixed(1) }}%</td>
              </tr>
            </tbody>
          </v-table>
          <v-table class="mt-8 mb-8 mx-4" hover style="max-width: 600px;" striped="odd">
            <thead>
              <tr>
                <th class="text-right">Palette colors</th>
                <th class="text-right">Palettes</th>
                <th class="text-right">Uncovered</th>
                <th class="text-right">Covered</th>
                <th class="text-right">Win rate</th>
              </tr>
              <tr>
                <td class="font-italic">Total</td>
                <td class="text-right font-italic">{{ palettesByColorCountTotal.palettes }}</td>
                <td class="text-right font-italic">{{ palettesByColorCountTotal.uncovered }}</td>
                <td class="text-right font-italic">{{ palettesByColorCountTotal.covered }}</td>
                <td class="text-right font-italic">{{ (100 * palettesByColorCountTotal.covered / palettesByColorCountTotal.palettes).toFixed(1) }}%</td>
              </tr>
            </thead>
            <tbody>
              <tr v-for="{colors, covered, uncovered, palettes} in palettesByColorCount">
                <td>
                  <a class="link" :href="`./#/?p=${encodeURIComponent(`=${colors}`)}&m=${encodeURIComponent('$')}`">{{ colors }}</a>
                </td>
                <td class="text-right">{{ palettes }}</td>
                <td class="text-right" :class="{'text-grey-darken-2': !uncovered, 'text-red-bad': uncovered}">
                  {{
                  uncovered
                  }}
                </td>
                <td class="text-right" :class="{'text-grey-darken-2': !covered, 'text-green-good': covered}">
                  {{
                  covered
                  }}
                </td>
                <td class="text-right" :style="{color: scale(1 - covered / palettes)}">{{ (100 * covered / palettes).toFixed(0) }}%</td>
              </tr>
            </tbody>
          </v-table>
        </div>
      </v-container>
    </v-main>

    <!-- Preview panel -->
    <div v-if="showHome && showPreview" style="position: fixed; z-index: 2000; bottom:12px; left: 12px;" class="previewer">
      <x-preview ref="previewer" :mode3d="mode3d" :points="selectedColors" :color-model="previewModel" />
      <v-btn @click="showPreview = false" color="transparent" icon="mdi-close" class="preview-closer" density="compact" style="position: absolute; top: 13px; right: 15px;" />
      <v-btn @click="$refs.previewer.reset()" color="transparent" icon="mdi-reload" class="preview-closer" density="compact" style="position: absolute; top: 13px; left: 15px;" />
      <v-btn @click="mode3d = !mode3d" color="transparent" icon class="preview-closer" density="compact" style="position: absolute; top: 13px; left: 55px;">{{ mode3d ? '3D' : '2D' }} </v-btn>
      <div style="position: absolute; bottom: 20px; left: 0; width: 100%;" class="text-center preview-buttons">
        <v-btn-toggle variant="flat" mandatory base-color="transparent" density="compact" v-model="previewModel">
          <v-btn value="oklab">Oklab</v-btn>
          <v-btn value="lab">Lab</v-btn>
          <v-btn value="lch">LCh</v-btn>
          <v-btn value="rgb">RGB</v-btn>
        </v-btn-toggle>
      </div>
    </div>

    <!-- Filter palette tooltip -->
    <v-menu :offset="[16,12]" :model-value="menu" z-index="100000" :target="cursor">
      <v-card min-width="200" max-width="360" class="bg-surface-light">
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
              <td><b>=6</b></td>
              <td>6 colors</td>
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

    <!-- Filter method tooltip -->
    <v-menu :offset="[16,12]" :model-value="menuMethodHint" z-index="100000" :target="cursor">
      <v-card min-width="200" max-width="360" class="bg-surface-light">
        <v-table density="compact" class="mt-2 mb-2" style="background: transparent; font-size: 16px;">
          <tbody>
            <tr>
              <td><b>#50</b></td>
              <td>methods best for 50 palettes</td>
            </tr>
            <tr>
              <td><b>@</b></td>
              <td>show original</td>
            </tr>
            <tr>
              <td><b>@RAMP</b></td>
              <td>show original and RAMP</td>
            </tr>
            <tr>
              <td><b>$</b></td>
              <td>show best</td>
            </tr>
            <tr>
              <td><b>$$</b></td>
              <td>show best or original</td>
            </tr>
            <tr>
              <td><b>$$GEN3</b></td>
              <td>show best or original and GEN3</td>
            </tr>
            <tr>
              <td><b>$$$</b></td>
              <td>show best and original</td>
            </tr>
            <tr>
              <td><b>Original</b></td>
              <td>show original</td>
            </tr>
            <tr>
              <td><b>HARM:</b></td>
              <td>search by method family</td>
            </tr>
            <tr>
              <td colspan="2">search is case sensitive</td>
            </tr>
          </tbody>
        </v-table>
      </v-card>
    </v-menu>
  </v-app>

  <!-- Methods tooltip -->
  <v-menu transition="fade-transition" content-class="no-events" style="pointer-events: none;" :model-value="showMethods" :target="showMethodsTarget">
    <v-card rounded="lg" style="column-gap: 16px;" :style="{columnCount: Math.ceil(showMethodsList.length / 30)}" v-if="showMethodsList" theme="dark" class="bg-surface-light text-pre py-2 pl-4 px-5">
      {{ showMethodsList.map(m => m.method.mid).join('\n') }}
    </v-card>
  </v-menu>

  <!-- Color tooltip -->
  <v-menu :close-delay="0" transition="fade-transition" content-class="no-events" style="pointer-events: none;" :model-value="showColors" :target="showColorsTarget">
    <v-card rounded="lg" style="min-width: 150px; min-height: 44px; font-size: 18px;" :style="{background: 'red'}" theme="dark" class="bg-surface-light text-pre pa-2">
      <div class="d-flex align-center justify-center">
        <div class="mr-3 text-center" style="margin-top: -1px; width: 15px; height: 15px; border-radius: 50%; box-shadow: rgba(0,0,0,.5) 0 0 2px;" :style="{background: showColorsValue}"></div>
        <div class="mr-2" style="letter-spacing: 1px; font-family: monospace;">
          <template v-if="showColorsValue?.length === 7">
            <span>{{ showColorsValue.slice(1, 3) }}</span>
            <span class="mx-2">{{ showColorsValue.slice(3, 5) }}</span>
            <span>{{ showColorsValue.slice(5, 7) }}</span>
          </template>
          <template v-else-if="showColorsValue?.length === 4">
            <span>{{ showColorsValue.slice(1, 2) }}</span>
            <span class="mx-2">{{ showColorsValue.slice(2, 3) }}</span>
            <span>{{ showColorsValue.slice(3, 4) }}</span>
          </template>
        </div>
      </div>
      <div style="margin-left: 35px; font-size: 15px; font-variant-numeric: tabular-nums;">
        {{ oklch(showColorsValue) }}
      </div>
    </v-card>
  </v-menu>

  <v-progress-linear v-if="rendered !== renderingTotal" style="z-index: 10000; position: fixed; top: 0;" height="8" color="rgb(255,0,0)" bg-color="rgb(255,127,127)" :bg-opacity="0.6" active :model-value="100 * rendered / renderingTotal" />
</template>

<script>
import { PALETTES } from 'colorsort-data-palettes'
import TRAINED from 'colorsort-data-trained/trained.json' with { type: 'json' }
import { compareSpectralFeatures, cosineSimilarity, getAuto, oklch, SORTING_METHODS } from 'colorsort'
import XPreview from '@/XPreview.vue'
import {
  BESTIES,
  computedSerialize,
  computePlan,
  computeRender,
  updateBest,
  updateBestAndDistanceAll,
  updateDistance
} from 'colorsort-compute'
import chroma from 'chroma-js'
import { render } from 'colorsort-compute/src/render.js'
import { analyze } from './analyse.js'

import { palettesByColorCount, palettesData, topCoverageAlgorithms } from 'colorsort-analysis'

import { deserialize } from 'colorsort-compute'

import SORTED from 'colorsort-data-sorted/sorted.json' with { type: 'json' }
import { toRaw } from 'vue'
import XEdit from '@/XEdit.vue'

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
  components: { XEdit, XPreview },
  data: () => ({
    showPreview: false,
    previewModel: 'oklab',
    sorted: [],
    types: [],
    selectedColors: [],
    showNav: false,
    rendered: 0,
    renderingTotal: 1,
    flushRenders: [],
    flushTimeout: null,
    debouncedPreview: null,
    debouncedSetBarHide: null,
    expandedAll: false,
    expanded: {},
    isVisible: {},
    isVisiblePending: {},
    isVisibleTimer: null,
    cursor: [0, 0],
    menu: false,
    menuMethodHint: false,
    palette: null,
    lastMouseEnter: -Infinity,
    focusPendingA: false,
    focusPendingB: false,
    hideBar: true,
    appBar: true,
    routeLoaded: false,
    showMethods: false,
    showMethodsTarget: null,
    showMethodsList: null,
    showFade: true,
    targetCoverage: 0,
    showAll: false,
    includeOriginal: false,
    showColorsTarget: null,
    showColors: false,
    showColorsValue: '...',
    algorithmStats: [],
    mode3d: true,
    sortFingerprint: null,
    maxColors: 16
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
        updateBestAndDistanceAll(types, BESTIES)

        this.types = types
        this.sorted = sorted
      } else {
        const { sorted, types } = COMPUTED
        updateBestAndDistanceAll(types, BESTIES)
        this.types = types //.slice(0, 10)
        this.sorted = sorted
        this.rendered = 1
      }
      const records = computedSerialize(toRaw(this.types))
      this.algorithmStats = await analyze({ records, maxColors: this.maxColors })
    },
    onRender (p) {
      this.rendered = p.done
      this.renderingTotal = p.total
    },
    openEdit (colors, event) {
      if (event) {
        event.preventDefault()
      }

      this.$router.push({
        path: '/edit',
        query: {
          c: encodeURIComponent(colors.map(x => x.slice(1)).join('-'))
        }
      })
    },
    palettePreviewClick (colors, key, fingerprint) {
      this.sortFingerprint = this.sortFingerprint === fingerprint ? null : fingerprint
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

      if (!colors) {
        return
      }

      if (this.showPreview) {
        this.debouncedPreview(colors)
      } else {
        this.selectedColors = null
      }

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
    onFocusInA () {
      this.focusPendingA = true
    },
    onFocusOutA () {
      this.focusPendingA = false
    },
    onFocusInB () {
      this.focusPendingB = true
    },
    onFocusOutB () {
      this.focusPendingB = false
    },
    setBarHide (value) {
      this.hideBar = value
    },
    updateQuery (newParams) {
      this.$router.push({
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
      this.showColorsValue = color.toUpperCase()
      this.showColors = true
    },
    leaveColors () {
      this.showColors = false
    },
    cxy (e) {
      const { x, y, width, height } = e.target.getClientRects().item(0)

      return [x + width, y + height]
    },
    oklch (c) {
      return oklch(c).map((x, i) => x === undefined ? '…' : (x?.toFixed(i === 2 ? 0 : 1).replace('.0', '') + (i === 2 ? '°' : ''))).join(', ')
    }
  },
  mounted () {
    this.debouncedPreview = debounce(this.setPreview)
    this.debouncedSetBarHide = debounce(this.setBarHide)

    this.updateShowMethods = debounceFalse((v) => {
      this.showMethods = v
    }, 100)

    this.sort()
  },
  computed: {
    showHome: {
      get () {
        return this.$route.path === '/'
      },
    },
    showStats: {
      get () {
        return this.$route.path === '/stats'
      },
    },
    showEdit: {
      get () {
        return this.$route.path === '/edit'
      },
    },
    editingColors: {
      get () {
        return this.$route.query?.c
            ?.split('-')
            ?.map(x => `#${x}`)
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
    sortedFilteredGroups () {
      if (!this.sortFingerprint) {
        return this.filteredGroups
      }

      const arr = [...this.filteredGroups].sort((a, b) => {
        // return Math.random() - .5
        // return compareSpectralFeatures(this.sortFingerprint, b.group.record.spectral).structural - compareSpectralFeatures(this.sortFingerprint, a.group.record.spectral).structural
        // return compareSpectralFeatures(this.sortFingerprint, b.group.record.spectral).perceptual - compareSpectralFeatures(this.sortFingerprint, a.group.record.spectral).perceptual
        // return compareSpectralFeatures(this.sortFingerprint, b.group.record.spectral).overall - compareSpectralFeatures(this.sortFingerprint, a.group.record.spectral).overall
        // return compareSpectralFeatures(this.sortFingerprint, b.group.record.spectral).breakdown.complexitySimilarity - compareSpectralFeatures(this.sortFingerprint, a.group.record.spectral).breakdown.complexitySimilarity
        // return compareSpectralFeatures(this.sortFingerprint, b.group.record.spectral).breakdown.energyDistributionSimilarity - compareSpectralFeatures(this.sortFingerprint, a.group.record.spectral).breakdown.energyDistributionSimilarity
        // return compareSpectralFeatures(this.sortFingerprint, b.group.record.spectral).breakdown.spectrumCorrelation - compareSpectralFeatures(this.sortFingerprint, a.group.record.spectral).breakdown.spectrumCorrelation

        return (b.group.record.fingerprint && this.sortFingerprint
                ? cosineSimilarity(this.sortFingerprint, b.group.record.fingerprint)
                : 0)
            - (a.group.record.fingerprint && this.sortFingerprint
                ? cosineSimilarity(this.sortFingerprint, a.group.record.fingerprint)
                : 0)
      })

      let groupIndex = 0

      return arr.map((x, index, array) => {
        if (index && (x.key === array[index-1].key)) {
          groupIndex++
        } else {
          groupIndex = 0
        }

        return {
          ...x,
          groupIndex
        }
      })
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
    autoTypes () {
      return this.types.map(t => {
        const auto = getAuto(t.colors, TRAINED)

        return {
          ...t,
          auto,
          groups: t.groups.map(g => ({
            ...g,
            auto: g.methods.some(m => m.method.mid === auto)
          }))
        }
      })
    },
    filtered () {
      console.log(this.autoTypes)

      if (!this.routeLoaded) {
        return []
      }

      if (!this.filterPalette && !this.filterMethod) {
        return this.autoTypes
      }

      if (!this.autoTypes) {
        return []
      }

      let number

      if (this?.filterPalette?.[0] === '<' || this?.filterPalette?.[0] === '>' || this?.filterPalette?.[0] === '=') {
        number = Number.parseInt(this.filterPalette.slice(1), 10)
      }

      const more = this?.filterPalette?.at(-1) === '+'
      const text = more ? this.filterPalette.slice(0, -1) : this.filterPalette
      let afterMore = false

      const filtered = !this.filterPalette ? this.autoTypes : this.autoTypes.filter(t => {
        if (this.filterPalette[0] === '<') {
          return t.colors.length < number
        } else if (this.filterPalette[0] === '>') {
          return t.colors.length > number
        } else if (this.filterPalette[0] === '=') {
          return t.colors.length === number
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
        names = topCoverageAlgorithms(this.algorithmStatsNoOriginal, Number.parseInt(this.filterMethod.slice(1), 10))
            .map(x => x.mid)
      }

      let dlr = null
      let mtd = this.filterMethod

      if (this.filterMethod.startsWith('$$$')) {
        dlr = 3
        mtd = mtd.slice(dlr)
      } else if (this.filterMethod.startsWith('$$')) {
        dlr = 2
        mtd = mtd.slice(dlr)
      } else if (this.filterMethod.startsWith('$')) {
        dlr = 1
        mtd = mtd.slice(dlr)
      } else if (this.filterMethod.startsWith('@')) {
        dlr = 4
        mtd = mtd.slice(1)
      } else if (this.filterMethod.startsWith('?')) {
        dlr = 5
        mtd = mtd.slice(1)
      }

      return filtered
          .map(t => {
            let groups

            if (this.filterMethod[0] === '#') {
              groups = t.groups.filter(g => g.methods.some(m => names.includes(m.method.mid)))
            } else {
              if (dlr === 3) {
                groups = t.groups.filter(g => g.methods.some(x => x.best) || g.methods.some(x => x.method.mid === 'Original'))
              } else if (dlr === 2) {
                groups = t.groups.filter(g => g.methods.some(x => x.best))
                groups = groups.length ? groups : t.groups.filter(g => g.methods.some(x => x.method.mid === 'Original'))
              } else if (dlr === 1) {
                groups = t.groups.filter(g => g.methods.some(x => x.best))
              } else if (dlr === 4) {
                groups = t.groups.filter(g => g.methods.some(x => x.method.mid === 'Original'))
              } else if (dlr === 5) {
                groups = t.groups.filter(g => g.auto)
              }

              if (mtd) {
                const mGroups = t.groups.filter(g => g.methods.some(m => m.method.mid.includes(mtd)))

                if (groups) {
                  groups = new Set([...groups, ...mGroups]).values().toArray()
                } else {
                  groups = mGroups
                }
              }
            }

            return {
              ...t,
              groups
            }
          })
          .filter(t => t.groups.length)
    },
    // algorithmStats () {
    //   return algorithmStats(this.types)
    //       .sort((a, b) => b.bestCount - a.bestCount)
    // },
    algorithmStatsFilteredIncl () {
      return this.algorithmStatsFilteredAll.filter(x => x.incl)
    },
    algorithmStatsFilteredAll () {
      return this.algorithmStats
          .map(alSt => ({
            alSt,
            incl: this.topCoverageAlgorithms.some(x => alSt.mid === x.mid)
          }))
    },
    algorithmStatsFiltered () {
      if (this.showAll) {
        return this.algorithmStatsFilteredAll
      }

      return this.algorithmStatsFilteredIncl
    },
    palettesData () {
      return palettesData(this.sorted, this.maxColors)
    },
    algorithmStatsNoOriginal () {
      return this.algorithmStats.filter(x => x.mid !== 'Original')
    },
    topCoverageAlgorithms () {
      return topCoverageAlgorithms(
          this.includeOriginal
              ? this.algorithmStats
              : this.algorithmStatsNoOriginal,
          this.targetCoverage)
    },
    palettesByColorCount () {
      return palettesByColorCount(this.palettesData, this.topCoverageAlgorithms)
    },
    palettesByColorCountTotal () {
      return this.palettesByColorCount.reduce((acc, { palettes, covered, uncovered }) => {
        return {
          palettes: acc.palettes + palettes,
          covered: acc.covered + covered,
          uncovered: acc.uncovered + uncovered
        }
      }, {
        palettes: 0,
        covered: 0,
        uncovered: 0
      })
    },
    focusPending () {
      return this.focusPendingA || this.focusPendingB
    },
    isWide () {
      return this.$vuetify.display.width > 1600
    }
  },
  watch: {
    focusPending (newValue) {
      if (!newValue) {
        document.activeElement.blur()
      }

      this.debouncedSetBarHide(!newValue)
    },
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
    sortedFilteredGroups(newValue) {
      if (newValue) {
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
