export type JulianDate = {
  jd: number
  jc: number
}

/**
 * Converts a UTC Date into Julian Day (JD) and Julian Century (JC).
 * JD formula uses Unix epoch reference: JD = UnixDays + 2440587.5
 */
export function toJulianDate(date: Date): JulianDate {
  const unixDays = date.getTime() / 86400000
  const jd = unixDays + 2440587.5
  const jc = (jd - 2451545.0) / 36525
  return { jd, jc }
}
