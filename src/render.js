// import RenderWorkerU from './render.worker.js?worker&url'

// const workerUrl = new URL(RenderWorkerU, import.meta.url)

export function RenderWorker() {
  return new Worker(new URL('./render.worker.js', import.meta.url), { type: 'module' })
}

const concurrency = Math.max(globalThis.navigator.hardwareConcurrency, 4)

// console.log(`Using ${concurrency} threads.`)

const workers = []
const pending = []

for (let i = 0; i < concurrency; i++) {
  const worker = new RenderWorker()
  const job = {
    id: i,
    busy: false,
    resolve: null,
    worker
  }

  workers.push(job)

  worker.addEventListener('message', (event) => {
    job.resolve(event.data)
    job.busy = false

    if (!pending.length) {
      return
    }

    const { task, resolve } = pending.shift()

    const w = workers.find((w) => !w.busy)

    w.busy = true
    w.resolve = resolve
    w.worker.postMessage(task)
  })
}

export function render(task) {
  return new Promise((resolve) => {
    const w = workers.find((w) => !w.busy)

    if (w) {
      w.busy = true
      w.resolve = resolve
      w.worker.postMessage(task)
    } else {
      pending.push({ task, resolve })
    }
  })
}
