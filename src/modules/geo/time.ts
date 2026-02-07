export function getUtcDateFromLocal(dateString: string, minutesLocal: number, offsetMinutes: number): Date | null {
  const [yearStr, monthStr, dayStr] = dateString.split('-')
  const year = Number.parseInt(yearStr, 10)
  const month = Number.parseInt(monthStr, 10)
  const day = Number.parseInt(dayStr, 10)

  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
    return null
  }

  const baseUtc = Date.UTC(year, month - 1, day, 0, 0, 0)
  if (Number.isNaN(baseUtc)) {
    return null
  }

  const utcMinutes = minutesLocal - offsetMinutes
  const utcMs = baseUtc + utcMinutes * 60 * 1000
  return new Date(utcMs)
}

export function formatMinutes(totalMinutes: number): string {
  const minutes = Math.round(totalMinutes)
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`
}

export function formatTimeWithOffset(totalMinutes: number): string {
  let minutes = Math.round(totalMinutes)
  let dayOffset = 0
  while (minutes < 0) {
    minutes += 1440
    dayOffset -= 1
  }
  while (minutes >= 1440) {
    minutes -= 1440
    dayOffset += 1
  }
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  const base = `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`
  if (dayOffset === 0) return base
  const sign = dayOffset > 0 ? '+' : ''
  return `${base} (${sign}${dayOffset})`
}

export function formatDuration(totalMinutes: number): string {
  const minutes = Math.max(0, Math.round(totalMinutes))
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${hours}h ${mins}m`
}
