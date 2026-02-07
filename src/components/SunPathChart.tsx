import { useMemo } from 'react'
import { deg2rad, clamp } from '../modules/solar/utils'
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

const SIZE = 440
const RADIUS = 180
const CENTER = SIZE / 2

function polarToCartesian(azimuth: number, altitude: number) {
  const clampedAlt = clamp(altitude, -90, 90)
  const r = ((90 - clampedAlt) / 90) * RADIUS
  const rad = deg2rad(azimuth)
  const x = CENTER + r * Math.sin(rad)
  const y = CENTER - r * Math.cos(rad)
  return { x, y }
}

function buildPath(points: SunPoint[], shouldDraw?: (point: SunPoint) => boolean) {
  if (points.length === 0) return ''
  let d = ''
  let started = false
  for (const point of points) {
    if (shouldDraw && !shouldDraw(point)) {
      started = false
      continue
    }
    const { x, y } = polarToCartesian(point.azimuth, point.altitude)
    if (!started) {
      d += `M ${x.toFixed(2)} ${y.toFixed(2)}`
      started = true
    } else {
      d += ` L ${x.toFixed(2)} ${y.toFixed(2)}`
    }
  }
  return d
}

function buildPathForWindow(points: SunPoint[], predicate: (altitude: number) => boolean) {
  return buildPath(points, (point) => predicate(point.altitude))
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
  const belowPath = useMemo(() => buildPath(path, (point) => point.altitude < 0), [path])
  const abovePath = useMemo(() => buildPath(path, (point) => point.altitude >= 0), [path])
  const goldenPath = useMemo(
    () => (golden ? buildPathForWindow(path, (alt) => alt >= 0 && alt <= 6) : ''),
    [path, golden]
  )
  const bluePath = useMemo(
    () => (blue ? buildPathForWindow(path, (alt) => alt >= -6 && alt <= 0) : ''),
    [path, blue]
  )

  const currentPoint = current ? polarToCartesian(current.azimuth, current.altitude) : null
  const altitudeRings = [80, 60, 40, 20, 0]

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
        <svg id={svgId} viewBox={`0 0 ${SIZE} ${SIZE}`} role="img" aria-label="Sun path chart">
          <defs>
            <linearGradient id="sunPathGlow" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.9" />
              <stop offset="100%" stopColor="var(--accent-soft)" stopOpacity="0.6" />
            </linearGradient>
          </defs>
          <circle cx={CENTER} cy={CENTER} r={RADIUS} className="horizon" />
          {altitudeRings.map((altitude) => {
            const r = ((90 - altitude) / 90) * RADIUS
            return <circle key={altitude} cx={CENTER} cy={CENTER} r={r} className="grid-ring" />
          })}
          <line x1={CENTER} y1={CENTER - RADIUS} x2={CENTER} y2={CENTER + RADIUS} className="grid-axis" />
          <line x1={CENTER - RADIUS} y1={CENTER} x2={CENTER + RADIUS} y2={CENTER} className="grid-axis" />
          <text x={CENTER} y={CENTER - RADIUS - 16} className="cardinal" textAnchor="middle">
            N
          </text>
          <text x={CENTER + RADIUS + 16} y={CENTER + 4} className="cardinal" textAnchor="middle">
            E
          </text>
          <text x={CENTER} y={CENTER + RADIUS + 20} className="cardinal" textAnchor="middle">
            S
          </text>
          <text x={CENTER - RADIUS - 16} y={CENTER + 4} className="cardinal" textAnchor="middle">
            W
          </text>
          {belowPath && <path d={belowPath} className="path path-muted" />}
          {abovePath && <path d={abovePath} className="path path-solid" />}
          {bluePath && <path d={bluePath} className="path path-blue" />}
          {goldenPath && <path d={goldenPath} className="path path-golden" />}
          {currentPoint && (
            <g>
              <circle cx={currentPoint.x} cy={currentPoint.y} r={9} className="current-glow" />
              <circle cx={currentPoint.x} cy={currentPoint.y} r={4.5} className="current-point" />
            </g>
          )}
        </svg>
        <div className="chart-legend">
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
