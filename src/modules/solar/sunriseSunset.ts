import { deg2rad, rad2deg, clamp } from './utils'
import { toJulianDate } from './julian'
import { solarDeclinationAndEoT } from './solarPosition'

export type SunEventTimes = {
  sunriseMinutes: number | null
  sunsetMinutes: number | null
  solarNoonMinutes: number | null
  daylightMinutes: number | null
  status: 'normal' | 'polar-day' | 'polar-night'
}

export type SunEventOptions = {
  sunAltitude?: number
}

/**
 * Computes sunrise, sunset, and solar noon times for a given date.
 * Inputs: latitude/longitude degrees, date string (YYYY-MM-DD), timezone offset minutes.
 * Outputs: minutes from local midnight.
 * Option: sunAltitude (degrees, default -0.833 for standard sunrise/sunset).
 */
export function sunriseSunset(
  latitude: number,
  longitude: number,
  dateString: string,
  tzOffsetMinutes: number,
  options: SunEventOptions = {}
): SunEventTimes {
  const [yearStr, monthStr, dayStr] = dateString.split('-')
  const year = Number.parseInt(yearStr, 10)
  const month = Number.parseInt(monthStr, 10)
  const day = Number.parseInt(dayStr, 10)

  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
    return {
      sunriseMinutes: null,
      sunsetMinutes: null,
      solarNoonMinutes: null,
      daylightMinutes: null,
      status: 'normal',
    }
  }

  const dateUtc = new Date(Date.UTC(year, month - 1, day, 0, 0, 0))
  const { jc } = toJulianDate(dateUtc)
  const { declination, equationOfTime } = solarDeclinationAndEoT(jc)

  const solarNoonUtcMinutes = 720 - 4 * longitude - equationOfTime
  const solarNoonMinutes = solarNoonUtcMinutes + tzOffsetMinutes

  const latRad = deg2rad(latitude)
  const declRad = deg2rad(declination)
  const zenith = 90 - (options.sunAltitude ?? -0.833)
  const cosH =
    (Math.cos(deg2rad(zenith)) / (Math.cos(latRad) * Math.cos(declRad))) -
    Math.tan(latRad) * Math.tan(declRad)

  if (cosH > 1) {
    return {
      sunriseMinutes: null,
      sunsetMinutes: null,
      solarNoonMinutes,
      daylightMinutes: 0,
      status: 'polar-night',
    }
  }

  if (cosH < -1) {
    return {
      sunriseMinutes: null,
      sunsetMinutes: null,
      solarNoonMinutes,
      daylightMinutes: 1440,
      status: 'polar-day',
    }
  }

  const hourAngle = rad2deg(Math.acos(clamp(cosH, -1, 1)))
  const sunriseUtcMinutes = solarNoonUtcMinutes - 4 * hourAngle
  const sunsetUtcMinutes = solarNoonUtcMinutes + 4 * hourAngle

  return {
    sunriseMinutes: sunriseUtcMinutes + tzOffsetMinutes,
    sunsetMinutes: sunsetUtcMinutes + tzOffsetMinutes,
    solarNoonMinutes,
    daylightMinutes: 8 * hourAngle,
    status: 'normal',
  }
}
