import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  test: {
    testTimeout: 1000_000,
    diff: {
      expand: false,
      truncateThreshold: 1
    }
  }
})
