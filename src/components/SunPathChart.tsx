import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { useI18n } from '../modules/i18n'

export type SunPoint = {
  azimuth: number
  altitude: number
}

type SunPathChartProps = {
  path: SunPoint[]
  current?: SunPoint
  title?: string
  statusLabel?: string
  golden?: boolean
  blue?: boolean
  svgId?: string
}

type SceneRefs = {
  renderer: THREE.WebGLRenderer
  scene: THREE.Scene
  camera: THREE.PerspectiveCamera
  controls: OrbitControls
  frameId: number | null
  resizeObserver: ResizeObserver | null
  sunMesh: THREE.Mesh
  sunGlow: THREE.Mesh
  sunLight: THREE.DirectionalLight
  abovePathLine: THREE.LineSegments
  belowPathLine: THREE.LineSegments
  goldenPathLine: THREE.LineSegments
  bluePathLine: THREE.LineSegments
}

const SKY_RADIUS = 18
const GROUND_RADIUS = SKY_RADIUS
const SUN_RADIUS = 0.8
const TOWER_HEIGHT = 3.2
const TOWER_RADIUS = 0.22
const HORIZON_EPSILON = 0.02

function toVector(point: SunPoint, radius = SKY_RADIUS) {
  const altitudeRad = THREE.MathUtils.degToRad(point.altitude)
  const azimuthRad = THREE.MathUtils.degToRad(point.azimuth)
  const horizontal = radius * Math.cos(altitudeRad)
  const x = horizontal * Math.sin(azimuthRad)
  const y = radius * Math.sin(altitudeRad)
  const z = -horizontal * Math.cos(azimuthRad)
  return new THREE.Vector3(x, y, z)
}

function buildSegmentGeometry(path: SunPoint[], predicate: (altitude: number) => boolean, radius = SKY_RADIUS) {
  const points: THREE.Vector3[] = []
  for (let index = 1; index < path.length; index += 1) {
    const prev = path[index - 1]
    const next = path[index]
    if (!predicate(prev.altitude) || !predicate(next.altitude)) continue
    points.push(toVector(prev, radius), toVector(next, radius))
  }
  return new THREE.BufferGeometry().setFromPoints(points)
}

function createCardinalLabel(text: string, position: THREE.Vector3) {
  const canvas = document.createElement('canvas')
  canvas.width = 96
  canvas.height = 52
  const ctx = canvas.getContext('2d')
  if (!ctx) return null
  ctx.fillStyle = 'rgba(17, 24, 39, 0.42)'
  ctx.beginPath()
  ctx.roundRect(6, 8, canvas.width - 12, canvas.height - 16, 8)
  ctx.fill()
  ctx.fillStyle = 'rgba(241, 245, 249, 0.9)'
  ctx.font = '600 24px "SF Pro Display", "Segoe UI", sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(text, canvas.width / 2, canvas.height / 2 + 0.5)

  const texture = new THREE.CanvasTexture(canvas)
  texture.needsUpdate = true
  const material = new THREE.SpriteMaterial({ map: texture, transparent: true })
  const sprite = new THREE.Sprite(material)
  sprite.position.copy(position)
  sprite.scale.set(2.4, 1.3, 1)
  return sprite
}

function disposeObject(obj: THREE.Object3D) {
  obj.traverse((child: THREE.Object3D) => {
    const mesh = child as THREE.Mesh
    if (mesh.geometry) {
      mesh.geometry.dispose()
    }
    const material = (mesh as { material?: THREE.Material | THREE.Material[] }).material
    const materials = Array.isArray(material) ? material : material ? [material] : []
    materials.forEach((mat) => {
      const mapped = mat as THREE.Material & { map?: THREE.Texture }
      mapped.map?.dispose()
      mat.dispose()
    })
  })
}

export default function SunPathChart({
  path,
  current,
  title = 'Sun Path Diagram',
  statusLabel = 'Sample curve',
  golden,
  blue,
  svgId = 'sun-path-svg',
}: SunPathChartProps) {
  const { t } = useI18n()
  const containerRef = useRef<HTMLDivElement | null>(null)
  const sceneRef = useRef<SceneRefs | null>(null)

  const selectedPoint = useMemo(() => {
    if (current) return current
    return path.length > 0 ? path[path.length - 1] : { altitude: -90, azimuth: 0 }
  }, [current, path])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const scene = new THREE.Scene()

    const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 600)
    camera.position.set(24, 15, 24)

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      preserveDrawingBuffer: true,
    })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    renderer.domElement.id = svgId
    renderer.domElement.setAttribute('aria-label', 'Sun path 3D canvas')
    renderer.domElement.className = 'three-canvas'
    container.appendChild(renderer.domElement)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.enablePan = false
    controls.dampingFactor = 0.06
    controls.rotateSpeed = 0.58
    controls.minDistance = 12
    controls.maxDistance = 80
    controls.maxPolarAngle = Math.PI * 0.48
    controls.target.set(0, 0, 0)
    controls.update()

    const ambient = new THREE.AmbientLight(0xf1f5f9, 0.46)
    scene.add(ambient)

    const sunLight = new THREE.DirectionalLight(0xfff2d4, 1.05)
    sunLight.castShadow = true
    sunLight.shadow.mapSize.set(1024, 1024)
    sunLight.shadow.camera.near = 0.5
    sunLight.shadow.camera.far = 120
    sunLight.shadow.camera.left = -24
    sunLight.shadow.camera.right = 24
    sunLight.shadow.camera.top = 24
    sunLight.shadow.camera.bottom = -24
    scene.add(sunLight)
    scene.add(sunLight.target)

    const skyMaterial = new THREE.MeshBasicMaterial({
      color: 0x6f87a6,
      side: THREE.BackSide,
      wireframe: true,
      transparent: true,
      opacity: 0.11,
    })
    const skySphere = new THREE.Mesh(new THREE.SphereGeometry(SKY_RADIUS, 40, 30), skyMaterial)
    scene.add(skySphere)

    const horizonRing = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(
        Array.from({ length: 145 }, (_, index) => {
          const angle = (index / 144) * Math.PI * 2
          return new THREE.Vector3(
            Math.cos(angle) * GROUND_RADIUS,
            HORIZON_EPSILON,
            Math.sin(angle) * GROUND_RADIUS
          )
        })
      ),
      new THREE.LineBasicMaterial({ color: 0x77839a, transparent: true, opacity: 0.44 })
    )
    scene.add(horizonRing)

    const ground = new THREE.Mesh(
      new THREE.CircleGeometry(GROUND_RADIUS, 96),
      new THREE.MeshStandardMaterial({
        color: 0x5a6b7b,
        roughness: 0.95,
        metalness: 0.02,
        transparent: true,
        opacity: 0.32,
      })
    )
    ground.rotation.x = -Math.PI / 2
    ground.receiveShadow = true
    scene.add(ground)

    const grid = new THREE.GridHelper(GROUND_RADIUS * 2, 16, 0x708094, 0x697586)
    grid.position.y = HORIZON_EPSILON
    const gridMaterial = grid.material as THREE.Material | THREE.Material[]
    const gridMaterials = Array.isArray(gridMaterial) ? gridMaterial : [gridMaterial]
    gridMaterials.forEach((material) => {
      material.transparent = true
      material.opacity = 0.3
    })
    scene.add(grid)

    const tower = new THREE.Mesh(
      new THREE.CylinderGeometry(TOWER_RADIUS, TOWER_RADIUS * 1.4, TOWER_HEIGHT, 24),
      new THREE.MeshStandardMaterial({ color: 0x876849, roughness: 0.87, metalness: 0.04 })
    )
    tower.position.y = TOWER_HEIGHT / 2
    tower.castShadow = true
    scene.add(tower)

    const directionMaterial = new THREE.LineBasicMaterial({ color: 0x7f8ba0, transparent: true, opacity: 0.55 })
    const cardinalAnchors: Array<{ key: string; position: THREE.Vector3 }> = [
      { key: 'N', position: new THREE.Vector3(0, 0.2, -GROUND_RADIUS - 1.6) },
      { key: 'E', position: new THREE.Vector3(GROUND_RADIUS + 1.6, 0.2, 0) },
      { key: 'S', position: new THREE.Vector3(0, 0.2, GROUND_RADIUS + 1.6) },
      { key: 'W', position: new THREE.Vector3(-GROUND_RADIUS - 1.6, 0.2, 0) },
    ]

    cardinalAnchors.forEach((cardinal) => {
      const line = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, HORIZON_EPSILON, 0), cardinal.position]),
        directionMaterial
      )
      scene.add(line)
      const sprite = createCardinalLabel(cardinal.key, cardinal.position.clone().setY(1.25))
      if (sprite) {
        scene.add(sprite)
      }
    })

    const sunMesh = new THREE.Mesh(
      new THREE.SphereGeometry(SUN_RADIUS, 32, 24),
      new THREE.MeshStandardMaterial({
        color: 0xf0b26d,
        emissive: 0xd07f3d,
        emissiveIntensity: 0.32,
        metalness: 0.04,
        roughness: 0.5,
      })
    )
    sunMesh.castShadow = true
    scene.add(sunMesh)

    const sunGlow = new THREE.Mesh(
      new THREE.SphereGeometry(SUN_RADIUS * 1.9, 24, 16),
      new THREE.MeshBasicMaterial({ color: 0xf59e0b, transparent: true, opacity: 0.08 })
    )
    scene.add(sunGlow)

    const abovePathLine = new THREE.LineSegments(
      new THREE.BufferGeometry(),
      new THREE.LineBasicMaterial({ color: 0xe37c4a, transparent: true, opacity: 0.74 })
    )
    scene.add(abovePathLine)

    const belowPathLine = new THREE.LineSegments(
      new THREE.BufferGeometry(),
      new THREE.LineBasicMaterial({ color: 0x919caf, transparent: true, opacity: 0.5 })
    )
    scene.add(belowPathLine)

    const goldenPathLine = new THREE.LineSegments(
      new THREE.BufferGeometry(),
      new THREE.LineBasicMaterial({ color: 0xe89f5d, transparent: true, opacity: 0.66 })
    )
    scene.add(goldenPathLine)

    const bluePathLine = new THREE.LineSegments(
      new THREE.BufferGeometry(),
      new THREE.LineBasicMaterial({ color: 0x7ea9d9, transparent: true, opacity: 0.62 })
    )
    scene.add(bluePathLine)

    const resize = () => {
      const width = container.clientWidth || 1
      const height = container.clientHeight || 1
      renderer.setSize(width, height, false)
      camera.aspect = width / height
      camera.updateProjectionMatrix()
    }
    resize()

    let frameId: number | null = null
    const renderFrame = () => {
      controls.update()
      renderer.render(scene, camera)
      frameId = window.requestAnimationFrame(renderFrame)
      if (sceneRef.current) {
        sceneRef.current.frameId = frameId
      }
    }
    renderFrame()

    const resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(container)

    sceneRef.current = {
      renderer,
      scene,
      camera,
      controls,
      frameId,
      resizeObserver,
      sunMesh,
      sunGlow,
      sunLight,
      abovePathLine,
      belowPathLine,
      goldenPathLine,
      bluePathLine,
    }

    return () => {
      const currentScene = sceneRef.current
      sceneRef.current = null
      if (!currentScene) return
      if (currentScene.frameId != null) {
        window.cancelAnimationFrame(currentScene.frameId)
      }
      currentScene.resizeObserver?.disconnect()
      currentScene.controls.dispose()
      disposeObject(currentScene.scene)
      currentScene.renderer.dispose()
      const currentCanvas = currentScene.renderer.domElement
      currentCanvas.remove()
    }
  }, [svgId])

  useEffect(() => {
    const live = sceneRef.current
    if (!live) return
    if (path.length === 0) {
      live.abovePathLine.geometry.dispose()
      live.abovePathLine.geometry = new THREE.BufferGeometry()
      live.belowPathLine.geometry.dispose()
      live.belowPathLine.geometry = new THREE.BufferGeometry()
      live.goldenPathLine.geometry.dispose()
      live.goldenPathLine.geometry = new THREE.BufferGeometry()
      live.bluePathLine.geometry.dispose()
      live.bluePathLine.geometry = new THREE.BufferGeometry()
      return
    }

    live.abovePathLine.geometry.dispose()
    live.abovePathLine.geometry = buildSegmentGeometry(path, (altitude) => altitude >= 0)

    live.belowPathLine.geometry.dispose()
    live.belowPathLine.geometry = buildSegmentGeometry(path, (altitude) => altitude < 0)

    live.goldenPathLine.geometry.dispose()
    if (golden) {
      live.goldenPathLine.geometry = buildSegmentGeometry(path, (altitude) => altitude >= 0 && altitude <= 6, SKY_RADIUS + 0.02)
    } else {
      live.goldenPathLine.geometry = new THREE.BufferGeometry()
    }

    live.bluePathLine.geometry.dispose()
    if (blue) {
      live.bluePathLine.geometry = buildSegmentGeometry(path, (altitude) => altitude >= -6 && altitude <= 0, SKY_RADIUS + 0.03)
    } else {
      live.bluePathLine.geometry = new THREE.BufferGeometry()
    }
  }, [path, golden, blue])

  useEffect(() => {
    const live = sceneRef.current
    if (!live) return

    const pos = toVector(selectedPoint)
    live.sunMesh.position.copy(pos)
    live.sunGlow.position.copy(pos)
    live.sunLight.position.copy(pos)
    live.sunLight.target.position.set(0, 0, 0)
    live.sunLight.target.updateMatrixWorld()

    const daylightBoost = selectedPoint.altitude > 0 ? 1 : 0.22
    live.sunLight.intensity = 0.72 + daylightBoost * 0.36
  }, [selectedPoint])

  return (
    <div className="card chart-card">
      <div className="card-header">
        <div>
          <p className="eyebrow">{t('chart.eyebrow')}</p>
          <h2>{title}</h2>
        </div>
        <span className="pill">{statusLabel}</span>
      </div>
      <div className="chart-wrapper">
        <div ref={containerRef} className="three-scene" role="img" aria-label="3D sun path and sky sphere" />
        <p className="chart-helper">{t('chart.dragHint')}</p>
        <div className="chart-legend chart-legend-3d">
          <span className="legend-item">
            <span className="legend-swatch solid" />{t('chart.legend.above')}
          </span>
          <span className="legend-item">
            <span className="legend-swatch muted" />{t('chart.legend.below')}
          </span>
          <span className="legend-item">
            <span className="legend-swatch marker" />{t('chart.legend.selected')}
          </span>
          <span className="legend-item">
            <span className="legend-swatch golden" />{t('chart.legend.golden')}
          </span>
          <span className="legend-item">
            <span className="legend-swatch blue" />{t('chart.legend.blue')}
          </span>
        </div>
      </div>
    </div>
  )
}
