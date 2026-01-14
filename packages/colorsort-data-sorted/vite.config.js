import { defineConfig } from 'vite'
import { getSorted } from './src/index.js'

const VIRTUAL_ENTRY = 'virtual:noop'

function computePlugin() {
  return {
    name: 'emit-palettes',
    apply: 'build',

    resolveId(id) {
      if (id === VIRTUAL_ENTRY) return id
    },

    load(id) {
      if (id === VIRTUAL_ENTRY) {
        return 'export {}'
      }
    },

    async buildStart() {
      const palettes = await getSorted()

      if (!palettes) {
        return
      }
      
      this.emitFile({
        type: 'asset',
        fileName: 'sorted.json',
        source: palettes,
      })
    },

    generateBundle(_, bundle) {
      // 🔥 Remove all JS chunks
      for (const [fileName, item] of Object.entries(bundle)) {
        if (item.type === 'chunk') {
          delete bundle[fileName]
        }
      }
    },
  }
}

export default defineConfig({
  build: {
    emptyOutDir: true,

    rollupOptions: {
      input: VIRTUAL_ENTRY,
    },
  },

  plugins: [computePlugin()],
})