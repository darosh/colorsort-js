import { defineConfig } from 'vite'
import { getPalettes } from './src/index.js'

const VIRTUAL_ENTRY = 'virtual:noop'

function palettesPlugin() {
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
      const palettes = await getPalettes()

      this.emitFile({
        type: 'asset',
        fileName: 'palettes.json',
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

// function getPalettes() {
//   return {
//     primary: ['#ff0000', '#00ff00', '#0000ff'],
//   }
// }

export default defineConfig({
  build: {
    emptyOutDir: true,

    rollupOptions: {
      input: VIRTUAL_ENTRY,
    },
  },

  plugins: [palettesPlugin()],
})