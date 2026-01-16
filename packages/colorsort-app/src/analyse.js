function AnalyseWorker() {
  return new Worker(new URL('./analyse.worker.js', import.meta.url), { type: 'module' })
}

const worker = new AnalyseWorker()
let pending

worker.addEventListener('message', (event) => {
  pending(event.data)
})

export function analyze(task) {
  return new Promise((resolve) => {
    worker.postMessage(task)
    pending = resolve
  })
}
