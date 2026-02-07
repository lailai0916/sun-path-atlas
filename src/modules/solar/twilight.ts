import { deg2rad, rad2deg, clamp } from './utils'
import { toJulianDate } from './julian'
import { solarDeclinationAndEoT } from './solarPosition'

export type TwilightBand = {
  start: number | null
  end: number | null
}

export type TwilightTimes = {
  civil: TwilightBand
  nautical: TwilightBand
  astronomical: TwilightBand
}

function twilightBand(
  latitude: number,
  longitude: number,
  dateString: string,
  tzOffsetMinutes: number,
  sunAltitude: number
): TwilightBand {
  const [yearStr, monthStr, dayStr] = dateString.split('-')
  const year = Number.parseInt(yearStr, 10)
  const month = Number.parseInt(monthStr, 10)
  const day = Number.parseInt(dayStr, 10)

  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
    return { start: null, end: null }
  }

  const dateUtc = new Date(Date.UTC(year, month - 1, day, 0, 0, 0))
  const { jc } = toJulianDate(dateUtc)
  const { declination, equationOfTime } = solarDeclinationAndEoT(jc)

  const solarNoonUtcMinutes = 720 - 4 * longitude - equationOfTime
  const latRad = deg2rad(latitude)
  const declRad = deg2rad(declination)

  const zenith = 90 - sunAltitude
  const cosH =
    (Math.cos(deg2rad(zenith)) / (Math.cos(latRad) * Math.cos(declRad))) -
    Math.tan(latRad) * Math.tan(declRad)

  if (cosH > 1) {
    return { start: null, end: null }
  }

  if (cosH < -1) {
    return { start: null, end: null }
  }

  const hourAngle = rad2deg(Math.acos(clamp(cosH, -1, 1)))
  const startUtcMinutes = solarNoonUtcMinutes - 4 * hourAngle
  const endUtcMinutes = solarNoonUtcMinutes + 4 * hourAngle

  return {
    start: startUtcMinutes + tzOffsetMinutes,
    end: endUtcMinutes + tzOffsetMinutes,
  }
}

export function twilightTimes(
  latitude: number,
  longitude: number,
  dateString: string,
  tzOffsetMinutes: number
): TwilightTimes {
  return {
    civil: twilightBand(latitude, longitude, dateString, tzOffsetMinutes, -6),
    nautical: twilightBand(latitude, longitude, dateString, tzOffsetMinutes, -12),
    astronomical: twilightBand(latitude, longitude, dateString, tzOffsetMinutes, -18),
  }
}
