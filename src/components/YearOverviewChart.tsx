import { useMemo } from 'react'
import { clamp, deg2rad } from '../modules/solar/utils'
import { useI18n } from '../modules/i18n'
import type { SunPoint } from './SunPathChart'

export type YearCurve = {
  monthIndex: number
  label: string
  color: string
  emphasized: boolean
  points: SunPoint[]
}

type YearOverviewChartProps = {
  curves: YearCurve[]
  selectedMonthIndex: number
  title?: string
  statusLabel?: string
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

export default function YearOverviewChart({
  curves,
  selectedMonthIndex,
  title,
  statusLabel,
  svgId = 'sun-path-svg',
}: YearOverviewChartProps) {
  const { t } = useI18n()

  const prepared = useMemo(
    () =>
      curves.map((curve) => ({
        ...curve,
        abovePath: buildPath(curve.points, (point) => point.altitude >= 0),
        belowPath: buildPath(curve.points, (point) => point.altitude < 0),
      })),
    [curves]
  )

  const altitudeRings = [80, 60, 40, 20, 0]

  return (
    <div className="card chart-card">
      <div className="card-header">
        <div>
          <p className="eyebrow">{t('chart.eyebrow')}</p>
          <h2>{title ?? t('chart.yearTitle')}</h2>
        </div>
        <span className="pill">{statusLabel ?? t('status.year')}</span>
      </div>
      <div className="chart-wrapper">
        <svg id={svgId} viewBox={`0 0 ${SIZE} ${SIZE}`} role="img" aria-label="Year overview sun path chart">
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
          {prepared.map((curve) => {
            const width = curve.emphasized ? 2.8 : 1.4
            const opacity = curve.emphasized ? 0.95 : 0.55
            const belowOpacity = curve.emphasized ? 0.45 : 0.2
            return (
              <g key={`curve-${curve.monthIndex}`}>
                {curve.belowPath ? (
                  <path
                    d={curve.belowPath}
                    className="path"
                    style={{ stroke: curve.color, opacity: belowOpacity, strokeDasharray: '5 6', strokeWidth: width }}
                  />
                ) : null}
                {curve.abovePath ? (
                  <path
                    d={curve.abovePath}
                    className="path"
                    style={{ stroke: curve.color, opacity, strokeWidth: width }}
                  />
                ) : null}
              </g>
            )
          })}
        </svg>

        <div className="month-strip" aria-label={t('chart.legend.monthSet')}>
          {prepared.map((curve) => {
            const active = curve.monthIndex === selectedMonthIndex
            return (
              <span
                key={`month-${curve.monthIndex}`}
                className={active ? 'month-chip active' : 'month-chip'}
                style={{ borderColor: curve.color }}
                title={curve.label}
              >
                <span className="month-dot" style={{ backgroundColor: curve.color }} />
                {curve.label}
              </span>
            )
          })}
        </div>

        <div className="chart-legend">
          <span className="legend-item">
            <span className="legend-swatch solid" />{t('chart.legend.monthSet')}
          </span>
          <span className="legend-item">
            <span className="legend-swatch muted" />{t('chart.legend.below')}
          </span>
        </div>
      </div>
    </div>
  )
}
