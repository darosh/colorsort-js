import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { Line2 } from 'three/addons/lines/Line2.js'
import { LineMaterial } from 'three/addons/lines/LineMaterial.js'
import { LineGeometry } from 'three/addons/lines/LineGeometry.js'
import { Vector3 } from 'three'
import { gl, oklab, lab, normalizeLab, lch } from 'colorsort'

let line, renderer, scene, camera, controls
let geometry
let matLine
let innerWidth = 424 - 12 * 2
let innerHeight = 424 - 12 * 2

const S = 40

export function initPoints(P, M) {
  if (!scene || !M || !P?.length) {
    return
  }

  geometry = new LineGeometry()

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

  const points = R.map((c) => new Vector3((c[0] + Q.t.x) * Q.s.x * S, (c[1] + Q.t.y) * Q.s.y * S, ((c[2] || 0) + Q.t.z) * Q.s.z * S))

  // Position and THREE.Color Data

  const positions = []
  const colors = []

  const divisions = Math.round(points.length)

  for (let i = 0, l = divisions; i < l; i++) {
    const point = points[i]
    positions.push(point.x, point.y, point.z)
    const c = gl(P[i])
    colors.push(c[0], c[1], c[2])
  }

  geometry.setPositions(positions)
  geometry.setColors(colors)

  if (line) {
    scene.remove(line)
  }

  line = new Line2(geometry, matLine)
  line.computeLineDistances()
  line.scale.set(1, 1, 1)

  scene.add(line)
}

export function init(P, M) {
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
  controls._rotateLeft((-85 * Math.PI) / 180)
  controls._pan(1, -20)

  matLine = new LineMaterial({
    color: 0xffffff,
    linewidth: 5, // in world units with size attenuation, pixels otherwise
    vertexColors: true,
    dashed: false,
    alphaToCoverage: true
  })

  const matAxis = new LineMaterial({
    color: 0xffffff,
    linewidth: 2, // in world units with size attenuation, pixels otherwise
    vertexColors: false,
    dashed: false,
    alphaToCoverage: true
  })

  initPoints(P, M)

  //

  const A = 20
  const axiGeometry = new LineGeometry()
  axiGeometry.setPositions([-A, -A, -A, -A, -A, A, -A, -A, -A, -A, A, -A, -A, -A, -A, A, -A, -A])

  const axis = new Line2(axiGeometry, matAxis)
  axis.computeLineDistances()
  axis.scale.set(1, 1, 1)

  scene.add(axis)

  window.addEventListener('resize', onWindowResize)
  onWindowResize()
}

export function reset() {
  controls.reset()
  controls._rotateLeft((-85 * Math.PI) / 180)
  controls._pan(1, -20)
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
