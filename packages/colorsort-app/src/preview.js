import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { Line2 } from 'three/addons/lines/Line2.js'
import { LineMaterial } from 'three/addons/lines/LineMaterial.js'
import { LineGeometry } from 'three/addons/lines/LineGeometry.js'
import { Vector3 } from 'three'
import { gl, oklab, lab, normalizeLab, lch } from 'colorsort-js'
import chroma from 'chroma-js'

let renderer, scene, camera, controls
let matLine
let visualizationObjects
let innerWidth = 424 - 12 * 2
let innerHeight = 424 - 12 * 2
let DIMS

const S = 40

const scale_a = chroma.scale(['#3f3', '#f77'])
const scale_b = chroma.scale(['#33f', '#ff3'])

export function initPoints(P, M, D = '3d') {
  if (!scene || !M || !P?.length) {
    return
  }

  if (visualizationObjects) {
    visualizationObjects.forEach((o) => scene.remove(o))
  }

  visualizationObjects = []

  if (P.length < 3) {
    P = ['#000', '#777', '#fff']
  }

  const R = M === 'oklab' ? P.map((c) => oklab(c)) : M === 'rgb' ? P.map((c) => gl(c)) : M === 'lch' ? P.map((c) => lch(c)) : P.map((c) => normalizeLab(lab(c)))

  const T = {
    oklab: {
      t: {
        x: -0.5,
        y: 0,
        z: 0
      },
      s: {
        x: 1,
        y: 1.5,
        z: 1
      }
    },
    rgb: {
      t: {
        x: -0.5,
        y: -0.5,
        z: -0.5
      },
      s: {
        x: 1,
        y: 1,
        z: 1
      }
    },
    lab: {
      t: {
        x: -0.5,
        y: -0.5,
        z: -0.5
      },
      s: {
        x: 1,
        y: 1,
        z: 1
      }
    },
    lch: {
      t: {
        x: -50,
        y: -64,
        z: -180
      },
      s: {
        x: 1 / 100,
        y: 1 / 128,
        z: 1 / 360
      }
    }
  }

  const Q = T[M]

  const GC = {
    oklab: [() => '#333333', (o) => scale_a(oklab(o)[1] + 0.5).toString(), (o) => scale_b(oklab(o)[2] + 0.5).toString()],
    lab: [() => '#333333', (o) => scale_a(oklab(o)[1] + 0.5).toString(), (o) => scale_b(oklab(o)[2] + 0.5).toString()],
    lch: [() => '#333333', () => '#333333', (o) => o],
    rgb: [() => '#ff4444', () => '#449944', () => '#4488ff']
  }[M]

  const A = S / 2

  if (D === '3d') {
    const points = R.map((c) => new Vector3((c[0] + Q.t.x) * Q.s.x * S, (c[1] + Q.t.y) * Q.s.y * S, ((c[2] || 0) + Q.t.z) * Q.s.z * S))

    const positions = []
    const colors = []

    const divisions = Math.round(points.length)

    for (let i = 0, l = divisions; i < l; i++) {
      const point = points[i]
      positions.push(point.x, point.y, point.z)
      const c = gl(P[i])
      colors.push(c[0], c[1], c[2])
    }

    const geometry = new LineGeometry()
    geometry.setPositions(positions)
    geometry.setColors(colors)

    const line = new Line2(geometry, matLine)
    line.computeLineDistances()
    line.scale.set(1, 1, 1)

    visualizationObjects.push(line)
  } else {
    //const compColors = [0xff4444, 0x449944, 0x4488ff]

    const ts = [Q.t.x, Q.t.y, Q.t.z]
    const ss = [Q.s.x, Q.s.y, Q.s.z]
    const n = R.length
    const xScale = n > 1 ? S / (n - 1) : S

    for (let k = 0; k < 3; k++) {
      const positions = []
      const colors = []

      for (let i = 0; i < n; i++) {
        const x = -A + i * xScale
        const y = (((R[i][k] + ts[k]) * ss[k]) / 3 + (k - 1) / 3) * S
        const z = 3
        positions.push(x, y, z)
        const c = gl(GC[k](P[i]))
        colors.push(c[0], c[1], c[2])
      }

      const geometry = new LineGeometry()
      geometry.setPositions(positions)
      geometry.setColors(colors)

      const matLineK = new LineMaterial({
        // color: compColors[k],
        linewidth: 2,
        vertexColors: true,
        dashed: false,
        alphaToCoverage: true
      })

      const lineK = new Line2(geometry, matLineK)
      lineK.computeLineDistances()
      lineK.scale.set(1, 1, 1)

      visualizationObjects.push(lineK)
    }
  }

  let axiPositions

  if (D === '3d') {
    axiPositions = [-A, -A, -A, A, -A, -A, -A, -A, -A, -A, A, -A, -A, -A, -A, -A, -A, A]
  } else {
    axiPositions = [-A, -A, 0, A, -A, 0, -A, -A, 0, -A, A, 0, -A, -A / 3, 0, A, -A / 3, 0, A, -A / 3, 0, -A, -A / 3, 0, -A, +A / 3, 0, A, +A / 3, 0]
  }

  const axiGeometry = new LineGeometry()
  axiGeometry.setPositions(axiPositions)

  const matAxis = new LineMaterial({
    color: 0xaaaaaa,
    linewidth: 2,
    vertexColors: false,
    dashed: false,
    alphaToCoverage: true
  })

  const axis = new Line2(axiGeometry, matAxis)
  axis.computeLineDistances()
  axis.scale.set(1, 1, 1)

  visualizationObjects.push(axis)

  visualizationObjects.forEach((o) => scene.add(o))

  if (DIMS !== D) {
    DIMS = D
    reset()
  }
}

export function init(P, M, D = '3d') {
  DIMS = null
  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setPixelRatio(window.devicePixelRatio)
  renderer.setSize(innerWidth, innerHeight)
  renderer.setClearColor(0x000000, 0.0)
  renderer.setAnimationLoop(animate)
  document.body.querySelector('#container').appendChild(renderer.domElement)

  scene = new THREE.Scene()

  camera = new THREE.PerspectiveCamera(20, innerWidth / innerHeight, 1, 1000)
  camera.position.set(-S * 4, 0, 20)

  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.minDistance = 10
  controls.maxDistance = 500
  controls.saveState()
  // controls._rotateLeft((-85 * Math.PI) / 180)
  // controls._pan(0, -20)

  matLine = new LineMaterial({
    color: 0xffffff,
    linewidth: 5, // in world units with size attenuation, pixels otherwise
    vertexColors: true,
    dashed: false,
    alphaToCoverage: true
  })

  visualizationObjects = []

  initPoints(P, M, D)

  window.addEventListener('resize', onWindowResize)
  onWindowResize()
}

export function reset() {
  controls.reset()
  controls._rotateLeft((-85 * Math.PI) / 180)
  controls._pan(0, DIMS === '3d' ? -20 : -10)
}

function onWindowResize() {
  camera.aspect = 1
  camera.updateProjectionMatrix()
}

function animate() {
  renderer.setClearColor(0x000000, 0)
  renderer.setViewport(0, 0, innerWidth, innerHeight)
  controls.update()
  renderer.render(scene, camera)
}
