export function formatDegrees(value: number, positiveLabel: string, negativeLabel: string): string {
  const abs = Math.abs(value)
  const label = value >= 0 ? positiveLabel : negativeLabel
  return `${abs.toFixed(4)}°${label}`
}
