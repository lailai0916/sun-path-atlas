import type { ChangeEvent } from 'react'
import WorldMapPicker from './WorldMapPicker'
import { formatDegrees } from '../modules/geo/format'
import { useI18n } from '../modules/i18n'

export type ControlsPanelProps = {
  mode: 'day' | 'year'
  latitude: string
  longitude: string
  date: string
  tzOffset: string
  dstEnabled: boolean
  timeMinutes: number
  latitudeError?: string
  longitudeError?: string
  tzError?: string
  onLatitudeChange: (value: string) => void
  onLongitudeChange: (value: string) => void
  onDateChange: (value: string) => void
  onTzOffsetChange: (value: string) => void
  onDstChange: (value: boolean) => void
  onTimeChange: (value: number) => void
  onModeChange: (mode: 'day' | 'year') => void
  onExportSvg: () => void
  onExportPng: () => void
  exportDisabled?: boolean
}

function minutesToLabel(minutes: number) {
  const total = Math.round(minutes)
  const hours = Math.floor(total / 60)
  const mins = total % 60
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`
}

export default function ControlsPanel({
  mode,
  latitude,
  longitude,
  date,
  tzOffset,
  dstEnabled,
  timeMinutes,
  latitudeError,
  longitudeError,
  tzError,
  onLatitudeChange,
  onLongitudeChange,
  onDateChange,
  onTzOffsetChange,
  onDstChange,
  onTimeChange,
  onModeChange,
  onExportSvg,
  onExportPng,
  exportDisabled = false,
}: ControlsPanelProps) {
  const { t } = useI18n()
  const handleInput = (handler: (value: string) => void) => (event: ChangeEvent<HTMLInputElement>) =>
    handler(event.target.value)

  const latClass = latitudeError ? 'input-error' : undefined
  const lonClass = longitudeError ? 'input-error' : undefined
  const tzClass = tzError ? 'input-error' : undefined
  const latValue = Number.parseFloat(latitude)
  const lonValue = Number.parseFloat(longitude)
  const latDisplay = Number.isFinite(latValue)
    ? formatDegrees(latValue, t('geo.north'), t('geo.south'))
    : '—'
  const lonDisplay = Number.isFinite(lonValue)
    ? formatDegrees(lonValue, t('geo.east'), t('geo.west'))
    : '—'

  return (
    <div className="panel">
      <div className="panel-section">
        <h3>{t('app.mode.label')}</h3>
        <div className="mode-switch">
          <button
            type="button"
            className={mode === 'day' ? 'mode-option active' : 'mode-option'}
            onClick={() => onModeChange('day')}
          >
            {t('app.mode.day')}
          </button>
          <button
            type="button"
            className={mode === 'year' ? 'mode-option active' : 'mode-option'}
            onClick={() => onModeChange('year')}
          >
            {t('app.mode.year')}
          </button>
        </div>
      </div>

      <div className="panel-section">
        <div className="panel-header">
          <h3>{t('controls.location')}</h3>
          <span className="tag">{t('controls.map')}</span>
        </div>
        <div className="field-row field-row-2">
          <label className="field">
            <span>{t('controls.latitude')}</span>
            <input
              type="number"
              inputMode="decimal"
              step="0.0001"
              value={latitude}
              onChange={handleInput(onLatitudeChange)}
              placeholder={t('controls.latPlaceholder')}
              className={latClass}
            />
            {latitudeError ? <span className="error">{latitudeError}</span> : null}
          </label>
          <label className="field">
            <span>{t('controls.longitude')}</span>
            <input
              type="number"
              inputMode="decimal"
              step="0.0001"
              value={longitude}
              onChange={handleInput(onLongitudeChange)}
              placeholder={t('controls.lonPlaceholder')}
              className={lonClass}
            />
            {longitudeError ? <span className="error">{longitudeError}</span> : null}
          </label>
        </div>
        <p className="helper">{t('controls.helper')}</p>
        <WorldMapPicker
          latitude={Number.isFinite(latValue) ? latValue : null}
          longitude={Number.isFinite(lonValue) ? lonValue : null}
          onSelect={(lat, lon) => {
            onLatitudeChange(lat.toFixed(4))
            onLongitudeChange(lon.toFixed(4))
          }}
        />
        <div className="map-meta">
          <span>{latDisplay}</span>
          <span>{lonDisplay}</span>
        </div>
      </div>

      <div className="panel-section">
        <h3>{t('controls.dateTime')}</h3>
        <div className="field-row field-row-2">
          <label className="field">
            <span>{t('controls.date')}</span>
            <input type="date" value={date} onChange={handleInput(onDateChange)} />
          </label>
          <label className="field">
            <span>{t('controls.timezone')}</span>
            <input
              type="text"
              value={tzOffset}
              onChange={handleInput(onTzOffsetChange)}
              placeholder={t('controls.tzPlaceholder')}
              className={tzClass}
            />
            {tzError ? <span className="error">{tzError}</span> : null}
          </label>
        </div>
        <label className="field inline">
          <span>{t('controls.dst')}</span>
          <input
            type="checkbox"
            checked={dstEnabled}
            onChange={(event) => onDstChange(event.target.checked)}
          />
        </label>
        <div className="field">
          <span>{t('controls.time')}</span>
          <div className="slider">
            <input
              type="range"
              min={0}
              max={1440}
              step={5}
              value={timeMinutes}
              onChange={(event) => onTimeChange(Number(event.target.value))}
            />
            <div className="slider-meta">
              <span className="time-pill">{minutesToLabel(timeMinutes)}</span>
              <span className="muted">{t('controls.timeHint')}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="panel-section">
        <h3>{t('controls.export')}</h3>
        <div className="export-row">
          <button
            type="button"
            className="secondary-button export-button"
            onClick={onExportSvg}
            disabled={exportDisabled}
          >
            <span className="button-icon" aria-hidden="true">
              <svg viewBox="0 0 20 20" width="14" height="14">
                <path d="M10 2v9m0 0-3-3m3 3 3-3M4 13v3h12v-3" />
              </svg>
            </span>
            {t('controls.exportSvg')}
          </button>
          <button
            type="button"
            className="secondary-button export-button"
            onClick={onExportPng}
            disabled={exportDisabled}
          >
            <span className="button-icon" aria-hidden="true">
              <svg viewBox="0 0 20 20" width="14" height="14">
                <path d="M10 2v9m0 0-3-3m3 3 3-3M4 13v3h12v-3" />
              </svg>
            </span>
            {t('controls.exportPng')}
          </button>
        </div>
      </div>
    </div>
  )
}
