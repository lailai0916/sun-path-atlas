export type SolarWindow = {
  start: number
  end: number
}

export type PhotoWindows = {
  golden: SolarWindow[]
  blue: SolarWindow[]
}

const GOLDEN_DEFAULT: [number, number] = [0, 6]
const BLUE_DEFAULT: [number, number] = [-6, 0]

export function computePhotoWindows(
  altitudeByMinute: Array<{ minute: number; altitude: number }>,
  goldenRange: [number, number] = GOLDEN_DEFAULT,
  blueRange: [number, number] = BLUE_DEFAULT
): PhotoWindows {
  const golden = findWindows(altitudeByMinute, goldenRange[0], goldenRange[1])
  const blue = findWindows(altitudeByMinute, blueRange[0], blueRange[1])

  return { golden, blue }
}

function findWindows(
  series: Array<{ minute: number; altitude: number }>,
  minAlt: number,
  maxAlt: number
): SolarWindow[] {
  const windows: SolarWindow[] = []
  let start: number | null = null
  let lastMinute: number | null = null
  for (const point of series) {
    const inRange = point.altitude >= minAlt && point.altitude <= maxAlt
    if (inRange) {
      if (start === null) start = point.minute
      lastMinute = point.minute
    } else if (start !== null) {
      windows.push({ start, end: lastMinute ?? start })
      start = null
      lastMinute = null
    }
  }
  if (start !== null) {
    windows.push({ start, end: lastMinute ?? start })
  }
  return windows
}
