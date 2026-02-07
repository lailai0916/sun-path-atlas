import { useEffect, useMemo, useState } from 'react'
import ControlsPanel from './components/ControlsPanel'
import SunPathChart, { type SunPoint } from './components/SunPathChart'
import YearOverviewChart, { type YearCurve } from './components/YearOverviewChart'
import StatsCards from './components/StatsCards'
import { solarPosition } from './modules/solar/solarPosition'
import { sunriseSunset } from './modules/solar/sunriseSunset'
import { twilightTimes } from './modules/solar/twilight'
import { computePhotoWindows } from './modules/solar/photography'
import { parseTimezoneOffset } from './modules/geo/timezone'
import { formatDuration, formatTimeWithOffset, getUtcDateFromLocal } from './modules/geo/time'
import { exportSunPath } from './modules/export'
import { createTranslator, I18nContext, useI18n, type Language } from './modules/i18n'

type ThemeMode = 'system' | 'light' | 'dark'

type DateParts = {
  year: number
  month: number
  day: number
}

const SAMPLE_STEP_MINUTES = 5
const YEAR_CURVE_STEP_MINUTES = 10
const YEAR_REFERENCE_DAY = 21
const THEME_STORAGE_KEY = 'sunpath-theme'
const LANGUAGE_STORAGE_KEY = 'sunpath-lang'

const MONTH_COLORS = [
  '#3b82f6',
  '#4f83e3',
  '#5d88cf',
  '#6f90b8',
  '#8f9b8b',
  '#b3a36b',
  '#d09f57',
  '#e2924f',
  '#d57e5c',
  '#bc6a6d',
  '#8a6da1',
  '#5f74bf',
]

const buildDemoPath = (): SunPoint[] => {
  const points: SunPoint[] = []
  for (let i = 0; i <= 180; i += 1) {
    const t = i / 180
    const azimuth = 60 + 240 * t
    const altitude = 65 * Math.sin(Math.PI * t) - 6
    points.push({ azimuth, altitude })
  }
  return points
}

function parseDateParts(dateString: string): DateParts | null {
  const [yearStr, monthStr, dayStr] = dateString.split('-')
  const year = Number.parseInt(yearStr, 10)
  const month = Number.parseInt(monthStr, 10)
  const day = Number.parseInt(dayStr, 10)
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) return null
  if (month < 1 || month > 12 || day < 1 || day > 31) return null
  return { year, month, day }
}

function toDateString(year: number, month: number, day: number): string {
  return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`
}

export default function App() {
  const [language, setLanguage] = useState<Language>(() => {
    const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY)
    return stored === 'zh' ? 'zh' : 'en'
  })
  const [theme, setTheme] = useState<ThemeMode>(() => {
    const stored = localStorage.getItem(THEME_STORAGE_KEY)
    if (stored === 'light' || stored === 'dark' || stored === 'system') return stored
    return 'system'
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem(THEME_STORAGE_KEY, theme)
  }, [theme])

  useEffect(() => {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, language)
  }, [language])

  const translator = useMemo(() => createTranslator(language), [language])
  const i18nValue = useMemo(() => ({ lang: language, t: translator }), [language, translator])

  return (
    <I18nContext.Provider value={i18nValue}>
      <AppContent language={language} setLanguage={setLanguage} theme={theme} setTheme={setTheme} />
    </I18nContext.Provider>
  )
}

type AppContentProps = {
  language: Language
  setLanguage: (lang: Language) => void
  theme: ThemeMode
  setTheme: (mode: ThemeMode) => void
}

function AppContent({ language, setLanguage, theme, setTheme }: AppContentProps) {
  const { t } = useI18n()
  const [latitude, setLatitude] = useState('39.9042')
  const [longitude, setLongitude] = useState('116.4074')
  const [date, setDate] = useState('2026-02-04')
  const [tzOffset, setTzOffset] = useState('UTC+08:00')
  const [dstEnabled, setDstEnabled] = useState(false)
  const [timeMinutes, setTimeMinutes] = useState(760)
  const [mode, setMode] = useState<'day' | 'year'>('day')

  const locale = language === 'zh' ? 'zh-CN' : 'en-US'
  const monthFormatter = useMemo(
    () => new Intl.DateTimeFormat(locale, { month: 'short', timeZone: 'UTC' }),
    [locale]
  )
  const monthDayFormatter = useMemo(
    () => new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric', timeZone: 'UTC' }),
    [locale]
  )

  const demoPath = useMemo(() => buildDemoPath(), [])
  const dateParts = useMemo(() => parseDateParts(date), [date])

  const latValue = Number.parseFloat(latitude)
  const lonValue = Number.parseFloat(longitude)

  const latitudeError =
    latitude.trim() === ''
      ? t('error.latRequired')
      : Number.isNaN(latValue)
        ? t('error.latNumber')
        : latValue < -90 || latValue > 90
          ? t('error.latRange')
          : undefined

  const longitudeError =
    longitude.trim() === ''
      ? t('error.lonRequired')
      : Number.isNaN(lonValue)
        ? t('error.lonNumber')
        : lonValue < -180 || lonValue > 180
          ? t('error.lonRange')
          : undefined

  const tzParsed = parseTimezoneOffset(tzOffset)
  const tzError =
    tzOffset.trim() === ''
      ? t('error.tzRequired')
      : tzParsed.isValid
        ? undefined
        : t('error.tzFormat')

  const offsetMinutes = tzParsed.isValid ? tzParsed.minutes + (dstEnabled ? 60 : 0) : 0
  const canCompute = !latitudeError && !longitudeError && tzParsed.isValid && date.trim() !== '' && dateParts !== null

  const currentSolar = useMemo(() => {
    if (!canCompute) return null
    const utcDate = getUtcDateFromLocal(date, timeMinutes, offsetMinutes)
    if (!utcDate) return null
    return solarPosition(latValue, lonValue, utcDate)
  }, [canCompute, date, timeMinutes, offsetMinutes, latValue, lonValue])

  const events = useMemo(() => {
    if (!canCompute) return null
    return sunriseSunset(latValue, lonValue, date, offsetMinutes)
  }, [canCompute, latValue, lonValue, date, offsetMinutes])

  const twilight = useMemo(() => {
    if (!canCompute) return null
    return twilightTimes(latValue, lonValue, date, offsetMinutes)
  }, [canCompute, latValue, lonValue, date, offsetMinutes])

  const { path, altitudeSeries } = useMemo(() => {
    if (!canCompute) return { path: demoPath, altitudeSeries: [] }
    const points: SunPoint[] = []
    const series: Array<{ minute: number; altitude: number }> = []
    for (let minutes = 0; minutes <= 1440; minutes += SAMPLE_STEP_MINUTES) {
      const utcDate = getUtcDateFromLocal(date, minutes, offsetMinutes)
      if (!utcDate) continue
      const { altitude, azimuth } = solarPosition(latValue, lonValue, utcDate)
      points.push({ altitude, azimuth })
      series.push({ minute: minutes, altitude })
    }
    if (points.length === 0) {
      return { path: demoPath, altitudeSeries: [] }
    }
    return { path: points, altitudeSeries: series }
  }, [canCompute, date, offsetMinutes, latValue, lonValue, demoPath])

  const yearCurves = useMemo(() => {
    if (!canCompute || !dateParts) return [] as YearCurve[]
    const curves: YearCurve[] = []

    for (let month = 1; month <= 12; month += 1) {
      const referenceDate = toDateString(dateParts.year, month, YEAR_REFERENCE_DAY)
      const monthPoints: SunPoint[] = []
      for (let minutes = 0; minutes <= 1440; minutes += YEAR_CURVE_STEP_MINUTES) {
        const utcDate = getUtcDateFromLocal(referenceDate, minutes, offsetMinutes)
        if (!utcDate) continue
        const { altitude, azimuth } = solarPosition(latValue, lonValue, utcDate)
        monthPoints.push({ altitude, azimuth })
      }
      curves.push({
        monthIndex: month,
        label: monthFormatter.format(new Date(Date.UTC(dateParts.year, month - 1, 1))),
        color: MONTH_COLORS[month - 1],
        emphasized: month === dateParts.month,
        points: monthPoints,
      })
    }

    return curves
  }, [canCompute, dateParts, offsetMinutes, latValue, lonValue, monthFormatter])

  const currentIndex = Math.round((timeMinutes / 1440) * (path.length - 1))
  const current = currentSolar ? { altitude: currentSolar.altitude, azimuth: currentSolar.azimuth } : path[currentIndex]

  const photoWindows = useMemo(() => {
    if (!altitudeSeries.length) return null
    return computePhotoWindows(altitudeSeries)
  }, [altitudeSeries])

  const formatWindowList = (windows?: Array<{ start: number; end: number }>) => {
    if (!windows || windows.length === 0) return '—'
    const segments = windows.slice(0, 2).map((window) => {
      return `${formatTimeWithOffset(window.start)}–${formatTimeWithOffset(window.end)}`
    })
    return segments.join(' / ')
  }

  const altitudeValue = currentSolar ? `${currentSolar.altitude.toFixed(1)}°` : '—'
  const azimuthValue = currentSolar ? `${currentSolar.azimuth.toFixed(1)}°` : '—'

  const sunriseValue = events?.sunriseMinutes != null ? formatTimeWithOffset(events.sunriseMinutes) : '—'
  const sunsetValue = events?.sunsetMinutes != null ? formatTimeWithOffset(events.sunsetMinutes) : '—'
  const solarNoonValue = events?.solarNoonMinutes != null ? formatTimeWithOffset(events.solarNoonMinutes) : '—'
  const daylightValue = events?.daylightMinutes != null ? formatDuration(events.daylightMinutes) : '—'

  const civilValue =
    twilight?.civil.start != null && twilight.civil.end != null
      ? `${formatTimeWithOffset(twilight.civil.start)}–${formatTimeWithOffset(twilight.civil.end)}`
      : '—'
  const nauticalValue =
    twilight?.nautical.start != null && twilight.nautical.end != null
      ? `${formatTimeWithOffset(twilight.nautical.start)}–${formatTimeWithOffset(twilight.nautical.end)}`
      : '—'
  const astronomicalValue =
    twilight?.astronomical.start != null && twilight.astronomical.end != null
      ? `${formatTimeWithOffset(twilight.astronomical.start)}–${formatTimeWithOffset(twilight.astronomical.end)}`
      : '—'

  const goldenValue = formatWindowList(photoWindows?.golden)
  const blueValue = formatWindowList(photoWindows?.blue)

  const polarNote =
    events?.status === 'polar-day'
      ? t('notes.polarDay')
      : events?.status === 'polar-night'
        ? t('notes.polarNight')
        : undefined

  const solarNoonNote =
    events?.status === 'polar-day'
      ? t('notes.sunAbove')
      : events?.status === 'polar-night'
        ? t('notes.sunBelow')
        : undefined

  const dayStats = useMemo(
    () => [
      { label: t('stats.sunrise'), value: sunriseValue, note: polarNote },
      { label: t('stats.solarNoon'), value: solarNoonValue, note: solarNoonNote },
      { label: t('stats.sunset'), value: sunsetValue, note: polarNote },
      { label: t('stats.daylight'), value: daylightValue, note: events ? t('notes.localDayLength') : undefined },
      { label: t('stats.civil'), value: civilValue, note: t('notes.sunMinus6') },
      { label: t('stats.nautical'), value: nauticalValue, note: t('notes.sunMinus12') },
      { label: t('stats.astronomical'), value: astronomicalValue, note: t('notes.sunMinus18') },
      { label: t('stats.golden'), value: goldenValue, note: t('notes.sun0to6') },
      { label: t('stats.blue'), value: blueValue, note: t('notes.sunMinus6to0') },
      { label: t('stats.azimuth'), value: azimuthValue, note: t('notes.selectedTime') },
      { label: t('stats.altitude'), value: altitudeValue, note: t('notes.selectedTime') },
    ],
    [
      t,
      sunriseValue,
      solarNoonValue,
      sunsetValue,
      daylightValue,
      polarNote,
      solarNoonNote,
      events,
      civilValue,
      nauticalValue,
      astronomicalValue,
      goldenValue,
      blueValue,
      azimuthValue,
      altitudeValue,
    ]
  )

  const yearStats = useMemo(() => {
    if (!canCompute || !dateParts) {
      return []
    }

    let longestDaylight = -1
    let shortestDaylight = Number.POSITIVE_INFINITY
    let longestDate = ''
    let shortestDate = ''
    let maxNoonAltitude = Number.NEGATIVE_INFINITY
    let minNoonAltitude = Number.POSITIVE_INFINITY
    let maxNoonDate = ''
    let minNoonDate = ''

    for (let month = 1; month <= 12; month += 1) {
      const daysInMonth = new Date(Date.UTC(dateParts.year, month, 0)).getUTCDate()
      for (let day = 1; day <= daysInMonth; day += 1) {
        const dayString = toDateString(dateParts.year, month, day)
        const dayEvents = sunriseSunset(latValue, lonValue, dayString, offsetMinutes)
        const daylight = dayEvents.daylightMinutes ?? 0

        if (daylight > longestDaylight) {
          longestDaylight = daylight
          longestDate = dayString
        }
        if (daylight < shortestDaylight) {
          shortestDaylight = daylight
          shortestDate = dayString
        }

        if (dayEvents.solarNoonMinutes != null) {
          const noonUtc = getUtcDateFromLocal(dayString, dayEvents.solarNoonMinutes, offsetMinutes)
          if (noonUtc) {
            const noonAltitude = solarPosition(latValue, lonValue, noonUtc).altitude
            if (noonAltitude > maxNoonAltitude) {
              maxNoonAltitude = noonAltitude
              maxNoonDate = dayString
            }
            if (noonAltitude < minNoonAltitude) {
              minNoonAltitude = noonAltitude
              minNoonDate = dayString
            }
          }
        }
      }
    }

    const formatDateLabel = (dateString: string) => {
      const parts = parseDateParts(dateString)
      if (!parts) return dateString
      return monthDayFormatter.format(new Date(Date.UTC(parts.year, parts.month - 1, parts.day)))
    }

    const selectedMonthLabel = monthFormatter.format(new Date(Date.UTC(dateParts.year, dateParts.month - 1, 1)))

    return [
      { label: t('stats.yearReference'), value: `${dateParts.year}` },
      { label: t('stats.yearReferenceDate'), value: selectedMonthLabel },
      {
        label: t('stats.yearLongest'),
        value: longestDaylight >= 0 ? formatDuration(longestDaylight) : '—',
        note: longestDate ? formatDateLabel(longestDate) : undefined,
      },
      {
        label: t('stats.yearShortest'),
        value: Number.isFinite(shortestDaylight) ? formatDuration(shortestDaylight) : '—',
        note: shortestDate ? formatDateLabel(shortestDate) : undefined,
      },
      {
        label: t('stats.yearMaxNoon'),
        value: Number.isFinite(maxNoonAltitude) ? `${maxNoonAltitude.toFixed(1)}°` : '—',
        note: maxNoonDate ? formatDateLabel(maxNoonDate) : undefined,
      },
      {
        label: t('stats.yearMinNoon'),
        value: Number.isFinite(minNoonAltitude) ? `${minNoonAltitude.toFixed(1)}°` : '—',
        note: minNoonDate ? formatDateLabel(minNoonDate) : undefined,
      },
    ]
  }, [canCompute, dateParts, latValue, lonValue, offsetMinutes, t, monthDayFormatter, monthFormatter])

  const dayStatusLabel =
    events?.status === 'polar-day'
      ? t('status.polarDay')
      : events?.status === 'polar-night'
        ? t('status.polarNight')
        : t('status.noaa')

  const selectedYear = dateParts?.year ?? 2026
  const selectedMonthIndex = dateParts?.month ?? 1

  const exportFilenameBase =
    mode === 'year'
      ? `sunpath-year-${selectedYear}-${latValue.toFixed(2)}-${lonValue.toFixed(2)}`
      : `sunpath-${date}-${latValue.toFixed(2)}-${lonValue.toFixed(2)}`

  return (
    <div className="app">
      <header className="topbar">
        <div>
          <p className="eyebrow">{t('app.eyebrow')}</p>
          <h1>{t('app.title')}</h1>
          <p className="subtitle">{t('app.subtitle')}</p>
        </div>
        <div className="topbar-controls">
          <div className="control-group">
            <span className="control-label">{t('app.language')}</span>
            <div className="segment">
              <button
                type="button"
                className={language === 'en' ? 'segment-button active' : 'segment-button'}
                onClick={() => setLanguage('en')}
              >
                {t('lang.en')}
              </button>
              <button
                type="button"
                className={language === 'zh' ? 'segment-button active' : 'segment-button'}
                onClick={() => setLanguage('zh')}
              >
                {t('lang.zh')}
              </button>
            </div>
          </div>
          <div className="control-group">
            <span className="control-label">{t('app.theme')}</span>
            <div className="segment">
              <button
                type="button"
                className={theme === 'system' ? 'segment-button active' : 'segment-button'}
                onClick={() => setTheme('system')}
              >
                {t('theme.system')}
              </button>
              <button
                type="button"
                className={theme === 'light' ? 'segment-button active' : 'segment-button'}
                onClick={() => setTheme('light')}
              >
                {t('theme.light')}
              </button>
              <button
                type="button"
                className={theme === 'dark' ? 'segment-button active' : 'segment-button'}
                onClick={() => setTheme('dark')}
              >
                {t('theme.dark')}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="content">
        <ControlsPanel
          mode={mode}
          latitude={latitude}
          longitude={longitude}
          date={date}
          tzOffset={tzOffset}
          dstEnabled={dstEnabled}
          timeMinutes={timeMinutes}
          latitudeError={latitudeError}
          longitudeError={longitudeError}
          tzError={tzError}
          onLatitudeChange={setLatitude}
          onLongitudeChange={setLongitude}
          onDateChange={setDate}
          onTzOffsetChange={setTzOffset}
          onDstChange={setDstEnabled}
          onTimeChange={setTimeMinutes}
          onModeChange={setMode}
          exportDisabled={!canCompute}
          onExportSvg={() =>
            exportSunPath({ target: 'svg', svgId: 'sun-path-svg', filenameBase: exportFilenameBase })
          }
          onExportPng={() =>
            exportSunPath({
              target: 'png',
              svgId: 'sun-path-svg',
              filenameBase: exportFilenameBase,
              background: '#ffffff',
              scale: 2,
            })
          }
        />

        <section className="main-panel">
          {mode === 'day' ? (
            <SunPathChart
              path={path}
              current={current}
              statusLabel={canCompute ? dayStatusLabel : t('status.noaa')}
              golden={Boolean(photoWindows?.golden.length)}
              blue={Boolean(photoWindows?.blue.length)}
              svgId="sun-path-svg"
              title={t('chart.title')}
            />
          ) : (
            <YearOverviewChart
              curves={yearCurves}
              selectedMonthIndex={selectedMonthIndex}
              svgId="sun-path-svg"
              title={t('chart.yearTitle')}
              statusLabel={`${t('status.year')} ${selectedYear}`}
            />
          )}
          <StatsCards items={mode === 'day' ? dayStats : yearStats} />
        </section>
      </main>

      <footer className="footer">
        <p>{t('footer.note')}</p>
      </footer>
    </div>
  )
}
