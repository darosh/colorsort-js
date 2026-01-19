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
    },
    mode3d: {
      type: Boolean,
      default: true
    }
  },
  data: () => ({}),
  mounted () {
    init(this.points, this.colorModel, this.mode3d ? '3d' : '2d')
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
        initPoints(this.points, this.colorModel, this.mode3d ? '3d' : '2d')
      }
    },
    colorModel: {
      immediate: true,
      handler (newVal, oldVal) {
        initPoints(this.points, this.colorModel, this.mode3d ? '3d' : '2d')
      }
    },
    mode3d: {
      immediate: true,
      handler (newVal, oldVal) {
        initPoints(this.points, this.colorModel, this.mode3d ? '3d' : '2d')
      }
    }
  }
}
</script>
