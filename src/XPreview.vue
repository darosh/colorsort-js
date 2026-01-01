<template>
  <div id="container" />
</template>

<script>
import { init, initPoints } from '@/preview.js'

export default {
  props: {
    points: {
      type: Array,
      default: () => ['#000', '#f00', '#fff']
    }
  },
  data: () => ({}),
  mounted () {
    init(this.points)
  },
  watch: {
    points: {
      immediate: true,
      handler (newVal, oldVal) {
        initPoints(this.points)
      }
    }
  }
}
</script>
