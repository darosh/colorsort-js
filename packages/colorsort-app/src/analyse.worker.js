import { algorithmStats } from 'colorsort-analysis'

self.onmessage = async (msg) => {
  const { records } = msg.data

  self.postMessage(algorithmStats(records).sort((a, b) => b.bestCount - a.bestCount))
}
