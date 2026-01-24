import { algorithmStats } from 'colorsort-analysis'

self.onmessage = async (msg) => {
  const { records, maxColors } = msg.data

  self.postMessage(algorithmStats(records, maxColors).sort((a, b) => b.bestCount - a.bestCount))
}
