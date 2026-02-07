import { deg2rad, rad2deg, normalizeDegrees, clamp } from './utils'
import { toJulianDate } from './julian'

export type SolarPosition = {
  altitude: number
  azimuth: number
  declination: number
  equationOfTime: number
}

type SolarDeclinationResult = {
  declination: number
  equationOfTime: number
}

export function solarDeclinationAndEoT(jc: number): SolarDeclinationResult {
  const geomMeanLong = normalizeDegrees(280.46646 + jc * (36000.76983 + jc * 0.0003032))
  const geomMeanAnomaly = 357.52911 + jc * (35999.05029 - 0.0001537 * jc)
  const eccentEarthOrbit = 0.016708634 - jc * (0.000042037 + 0.0000001267 * jc)

  const sunEqCenter =
    Math.sin(deg2rad(geomMeanAnomaly)) * (1.914602 - jc * (0.004817 + 0.000014 * jc)) +
    Math.sin(deg2rad(2 * geomMeanAnomaly)) * (0.019993 - 0.000101 * jc) +
    Math.sin(deg2rad(3 * geomMeanAnomaly)) * 0.000289

  const sunTrueLong = geomMeanLong + sunEqCenter
  const sunAppLong =
    sunTrueLong - 0.00569 - 0.00478 * Math.sin(deg2rad(125.04 - 1934.136 * jc))

  const meanObliq =
    23 + (26 + (21.448 - jc * (46.815 + jc * (0.00059 - jc * 0.001813))) / 60) / 60
  const obliqCorr = meanObliq + 0.00256 * Math.cos(deg2rad(125.04 - 1934.136 * jc))

  const declination = rad2deg(
    Math.asin(Math.sin(deg2rad(obliqCorr)) * Math.sin(deg2rad(sunAppLong)))
  )

  const y = Math.tan(deg2rad(obliqCorr) / 2)
  const y2 = y * y

  const equationOfTime =
    4 *
    rad2deg(
      y2 * Math.sin(2 * deg2rad(geomMeanLong)) -
        2 * eccentEarthOrbit * Math.sin(deg2rad(geomMeanAnomaly)) +
        4 *
          eccentEarthOrbit *
          y2 *
          Math.sin(deg2rad(geomMeanAnomaly)) *
          Math.cos(2 * deg2rad(geomMeanLong)) -
        0.5 * y2 * y2 * Math.sin(4 * deg2rad(geomMeanLong)) -
        1.25 *
          eccentEarthOrbit *
          eccentEarthOrbit *
          Math.sin(2 * deg2rad(geomMeanAnomaly))
    )

  return { declination, equationOfTime }
}

/**
 * NOAA-style solar position calculation.
 * Inputs: latitude/longitude in degrees, date in UTC.
 * Outputs: altitude/azimuth in degrees, declination in degrees, EoT in minutes.
 */
export function solarPosition(latitude: number, longitude: number, dateUtc: Date): SolarPosition {
  const { jc } = toJulianDate(dateUtc)
  const { declination, equationOfTime } = solarDeclinationAndEoT(jc)

  const utcMinutes =
    dateUtc.getUTCHours() * 60 +
    dateUtc.getUTCMinutes() +
    dateUtc.getUTCSeconds() / 60 +
    dateUtc.getUTCMilliseconds() / 60000

  let trueSolarTime = (utcMinutes + equationOfTime + 4 * longitude) % 1440
  if (trueSolarTime < 0) trueSolarTime += 1440

  let hourAngle = trueSolarTime / 4 - 180
  if (hourAngle < -180) hourAngle += 360

  const latitudeRad = deg2rad(latitude)
  const declinationRad = deg2rad(declination)
  const hourAngleRad = deg2rad(hourAngle)

  const cosZenith =
    Math.sin(latitudeRad) * Math.sin(declinationRad) +
    Math.cos(latitudeRad) * Math.cos(declinationRad) * Math.cos(hourAngleRad)
  const zenith = rad2deg(Math.acos(clamp(cosZenith, -1, 1)))
  const altitude = 90 - zenith

  const azimuth = normalizeDegrees(
    rad2deg(
      Math.atan2(
        Math.sin(hourAngleRad),
        Math.cos(hourAngleRad) * Math.sin(latitudeRad) -
          Math.tan(declinationRad) * Math.cos(latitudeRad)
      )
    ) + 180
  )

  return { altitude, azimuth, declination, equationOfTime }
}
