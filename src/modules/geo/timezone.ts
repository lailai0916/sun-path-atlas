export type TimezoneParseResult = {
  minutes: number
  isValid: boolean
}

const TZ_PATTERN = /^([+-])?(\d{1,2})(?::?(\d{2}))?$/

export function parseTimezoneOffset(input: string): TimezoneParseResult {
  const raw = input.trim().toUpperCase()
  if (!raw) {
    return { minutes: 0, isValid: false }
  }

  if (raw === 'Z' || raw === 'UTC' || raw === 'GMT') {
    return { minutes: 0, isValid: true }
  }

  const cleaned = raw.replace(/^UTC/, '').replace(/^GMT/, '')
  const match = cleaned.match(TZ_PATTERN)
  if (!match) {
    return { minutes: 0, isValid: false }
  }

  const sign = match[1] === '-' ? -1 : 1
  const hours = Number.parseInt(match[2], 10)
  const minutes = Number.parseInt(match[3] ?? '0', 10)

  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return { minutes: 0, isValid: false }
  }

  if (hours > 14 || minutes >= 60) {
    return { minutes: 0, isValid: false }
  }

  return { minutes: sign * (hours * 60 + minutes), isValid: true }
}

export function formatTimezoneOffset(totalMinutes: number): string {
  const sign = totalMinutes >= 0 ? '+' : '-'
  const abs = Math.abs(totalMinutes)
  const hours = Math.floor(abs / 60)
  const minutes = abs % 60
  return `UTC${sign}${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
}
