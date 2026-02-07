import { useMemo, useRef } from 'react'
import type { MouseEvent } from 'react'
import { feature } from 'topojson-client'
import { geoEquirectangular, geoPath } from 'd3-geo'
import type { Feature, FeatureCollection, Geometry } from 'geojson'
import world from 'world-atlas/countries-110m.json'
import { clamp } from '../modules/solar/utils'
import { useI18n } from '../modules/i18n'

type WorldMapPickerProps = {
  latitude: number | null
  longitude: number | null
  onSelect: (lat: number, lon: number) => void
}

const WIDTH = 360
const HEIGHT = 180

type Topology = {
  objects: Record<string, Geometry | { type: string }>
}

export default function WorldMapPicker({ latitude, longitude, onSelect }: WorldMapPickerProps) {
  const svgRef = useRef<SVGSVGElement | null>(null)
  const { t } = useI18n()

  const geojson = useMemo(() => {
    const topology = world as unknown as Topology
    const objectKey = Object.keys(topology.objects)[0]
    const geo = feature(topology as never, topology.objects[objectKey] as never) as
      | FeatureCollection<Geometry>
      | Feature<Geometry>
    return geo.type === 'FeatureCollection' ? geo : ({ type: 'FeatureCollection', features: [geo] } as FeatureCollection)
  }, [])

  const projection = useMemo(() => {
    const proj = geoEquirectangular()
    proj.fitSize([WIDTH, HEIGHT], geojson)
    return proj
  }, [geojson])

  const pathGenerator = useMemo(() => geoPath(projection), [projection])

  const paths = useMemo(() => {
    return geojson.features
      .map((item) => pathGenerator(item) || '')
      .filter((d) => d.length > 0)
  }, [geojson, pathGenerator])

  const marker = useMemo(() => {
    if (latitude == null || longitude == null || Number.isNaN(latitude) || Number.isNaN(longitude)) return null
    const projected = projection([longitude, latitude])
    if (!projected) return null
    return { x: projected[0], y: projected[1] }
  }, [latitude, longitude, projection])

  const handlePick = (event: MouseEvent<SVGSVGElement>) => {
    const svg = svgRef.current
    if (!svg) return
    const rect = svg.getBoundingClientRect()
    const x = ((event.clientX - rect.left) / rect.width) * WIDTH
    const y = ((event.clientY - rect.top) / rect.height) * HEIGHT

    const inverted = projection.invert ? projection.invert([x, y]) : null
    if (!inverted) return
    const lon = clamp(inverted[0], -180, 180)
    const lat = clamp(inverted[1], -90, 90)
    onSelect(Number(lat.toFixed(4)), Number(lon.toFixed(4)))
  }

  const meridians = [-120, -60, 0, 60, 120]
  const parallels = [-60, -30, 0, 30, 60]

  return (
    <div className="map-card">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="map-svg"
        role="img"
        aria-label="World map picker"
        onClick={handlePick}
      >
        <rect x={0} y={0} width={WIDTH} height={HEIGHT} className="map-ocean" />
        {meridians.map((lon) => {
          const start = projection([lon, -90])
          const end = projection([lon, 90])
          if (!start || !end) return null
          return (
            <line
              key={`m-${lon}`}
              x1={start[0]}
              y1={start[1]}
              x2={end[0]}
              y2={end[1]}
              className="map-grid"
            />
          )
        })}
        {parallels.map((lat) => {
          const start = projection([-180, lat])
          const end = projection([180, lat])
          if (!start || !end) return null
          return (
            <line
              key={`p-${lat}`}
              x1={start[0]}
              y1={start[1]}
              x2={end[0]}
              y2={end[1]}
              className="map-grid"
            />
          )
        })}
        {paths.map((d, index) => (
          <path key={`c-${index}`} d={d} className="map-land" />
        ))}
        {marker ? (
          <g>
            <circle cx={marker.x} cy={marker.y} r={4.5} className="map-marker" />
            <circle cx={marker.x} cy={marker.y} r={10} className="map-marker-ring" />
          </g>
        ) : null}
      </svg>
      <p className="map-hint">{t('controls.mapHint')}</p>
    </div>
  )
}
