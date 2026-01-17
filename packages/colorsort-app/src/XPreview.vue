<template>
  <div id="container" />
</template>

<script>
import { init, initPoints, reset } from '@/preview.js'

export default {
  props: {
    points: {
      type: Array,
      default: () => ['#000', '#f00', '#fff']
    },
    colorModel: {
      type: String,
      default: 'oklab'
    }
  },
  data: () => ({}),
  mounted () {
    init(this.points, this.colorModel)
  },
  methods: {
    reset () {
      reset()
    }
  },
  watch: {
    points: {
      immediate: true,
      handler (newVal, oldVal) {
        initPoints(this.points, this.colorModel)
      }
    },
    colorModel: {
      immediate: true,
      handler (newVal, oldVal) {
        initPoints(this.points, this.colorModel)
      }
    }

  }
}
</script>
