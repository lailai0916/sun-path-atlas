export const DEG2RAD = Math.PI / 180
export const RAD2DEG = 180 / Math.PI

export function deg2rad(deg: number): number {
  return deg * DEG2RAD
}

export function rad2deg(rad: number): number {
  return rad * RAD2DEG
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

export function normalizeDegrees(angle: number): number {
  const normalized = angle % 360
  return normalized < 0 ? normalized + 360 : normalized
}
