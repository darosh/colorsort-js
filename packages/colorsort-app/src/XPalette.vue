<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'XPalette',
  props: {
    colors: {
      type: Array<string>,
      default: () => []
    },
    minHeight: {
      type: Number,
      default: 10
    }
  }
})
</script>

<template>
  <div class="color-row" style="border: 1px solid white; display: flex; align-items: center; width: 100%;">
    <div v-for="c in colors" style="flex: 1 1; min-width: 1px;" :style="{ background: c, minHeight: `${minHeight}px` }" />
  </div>
</template>

<style scoped>
.color-row > div {
  transition: background-color 400ms;
}
</style>
