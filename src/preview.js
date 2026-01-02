import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { Line2 } from 'three/addons/lines/Line2.js'
import { LineMaterial } from 'three/addons/lines/LineMaterial.js'
import { LineGeometry } from 'three/addons/lines/LineGeometry.js'
import { Vector3 } from 'three'
import chroma from 'chroma-js'

let line, renderer, scene, camera, controls
let geometry
let matLine
let innerWidth = 424 - 12 * 2
let innerHeight = 424 - 12 * 2

const S = 40

export function initPoints(P) {
  if (!scene) {
    return
  }

  geometry = new LineGeometry()

  if (P.length < 3) {
    P = ['#000', '#777', '#fff']
  }

  const R = P.map((c) => chroma(c).oklab())
  const points = R.map((c) => new Vector3((c[0] - 0.5) * S, (c[1] - 0) * S * 1.5, (c[2] - 0) * S))

  // Position and THREE.Color Data

  const positions = []
  const colors = []

  const divisions = Math.round(points.length)

  for (let i = 0, l = divisions; i < l; i++) {
    const point = points[i]
    positions.push(point.x, point.y, point.z)
    const c = chroma(P[i]).gl()
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

export function init(P) {
  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setPixelRatio(window.devicePixelRatio)
  renderer.setSize(innerWidth, innerHeight)
  renderer.setClearColor(0x000000, 0.0)
  renderer.setAnimationLoop(animate)
  document.body.querySelector('#container').appendChild(renderer.domElement)

  scene = new THREE.Scene()

  camera = new THREE.PerspectiveCamera(20, innerWidth / innerHeight, 1, 1000)
  camera.position.set(-S * 2, 0, 60)

  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.minDistance = 10
  controls.maxDistance = 500

  matLine = new LineMaterial({
    color: 0xffffff,
    linewidth: 5, // in world units with size attenuation, pixels otherwise
    vertexColors: true,

    dashed: false,
    alphaToCoverage: true
  })

  initPoints(P)

  //

  window.addEventListener('resize', onWindowResize)
  onWindowResize()
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
