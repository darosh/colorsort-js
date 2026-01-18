import { fileURLToPath, URL } from 'node:url'
import { dirname, resolve } from 'node:path'
import { defineConfig } from 'vite'
// import dts from 'vite-plugin-dts'

const __dirname = dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'colorsort',
      // the proper extensions will be added
      fileName: 'colorsort',
    },
    sourcemap: true
  },
  plugins: [
    // dts({ outDir: 'dist/types' })
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  }
})
