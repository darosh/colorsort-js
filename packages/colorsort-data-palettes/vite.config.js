import { fileURLToPath, URL } from 'node:url'
import { dirname, resolve } from 'node:path'
import { defineConfig } from 'vite'

const __dirname = dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.js'),
      name: 'colorsortDataPalettes',
      // the proper extensions will be added
      fileName: 'colorsort-data-palettes',
    },
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  }
})
