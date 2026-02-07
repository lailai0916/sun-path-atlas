export type ExportTarget = 'svg' | 'png'

export type ExportOptions = {
  target: ExportTarget
  svgId: string
  filenameBase?: string
  background?: string
  scale?: number
}

const DEFAULT_STYLE = `
.horizon { fill: rgba(239, 107, 58, 0.03); stroke: rgba(29, 30, 34, 0.2); stroke-width: 1.2; }
.grid-ring { fill: none; stroke: rgba(29, 30, 34, 0.08); stroke-dasharray: 3 4; }
.grid-axis { stroke: rgba(29, 30, 34, 0.15); stroke-width: 1; }
.cardinal { font-size: 12px; fill: #5a5e66; font-family: "SF Pro Text", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
.path { fill: none; stroke-linecap: round; stroke-width: 2.4; }
.path-muted { stroke: rgba(29, 30, 34, 0.2); stroke-dasharray: 5 6; }
.path-solid { stroke: #ef6b3a; }
.path-golden { stroke: rgba(239, 107, 58, 0.8); stroke-width: 3; }
.path-blue { stroke: rgba(59, 130, 246, 0.6); stroke-width: 3; }
.current-glow { fill: rgba(239, 107, 58, 0.3); }
.current-point { fill: #ef6b3a; stroke: #fff; stroke-width: 2; }
`

function serializeSvg(svg: SVGSVGElement, background?: string): string {
  const clone = svg.cloneNode(true) as SVGSVGElement
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
  clone.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink')

  const viewBox = clone.getAttribute('viewBox')
  if (viewBox) {
    const [, , width, height] = viewBox.split(' ').map(Number)
    if (!Number.isNaN(width) && !Number.isNaN(height)) {
      clone.setAttribute('width', `${width}`)
      clone.setAttribute('height', `${height}`)
    }
  }

  if (background) {
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
    rect.setAttribute('x', '0')
    rect.setAttribute('y', '0')
    rect.setAttribute('width', '100%')
    rect.setAttribute('height', '100%')
    rect.setAttribute('fill', background)
    clone.insertBefore(rect, clone.firstChild)
  }

  let defs = clone.querySelector('defs')
  if (!defs) {
    defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs')
    clone.insertBefore(defs, clone.firstChild)
  }
  const style = document.createElementNS('http://www.w3.org/2000/svg', 'style')
  style.textContent = DEFAULT_STYLE
  defs.appendChild(style)

  const serializer = new XMLSerializer()
  return serializer.serializeToString(clone)
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

async function exportSvg(svg: SVGSVGElement, filename: string) {
  const svgString = serializeSvg(svg)
  const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' })
  downloadBlob(blob, filename)
}

async function exportPng(svg: SVGSVGElement, filename: string, scale = 2, background = '#ffffff') {
  const svgString = serializeSvg(svg, background)
  const svgUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgString)}`
  const img = new Image()

  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve()
    img.onerror = () => reject(new Error('Failed to load SVG for PNG export'))
    img.src = svgUrl
  })

  const viewBox = svg.getAttribute('viewBox')
  const viewBoxParts = viewBox ? viewBox.split(' ').map(Number) : [0, 0, 0, 0]
  const widthRaw = viewBoxParts[2]
  const heightRaw = viewBoxParts[3]
  const width = Number.isFinite(widthRaw) ? widthRaw : svg.clientWidth
  const height = Number.isFinite(heightRaw) ? heightRaw : svg.clientHeight

  const canvas = document.createElement('canvas')
  canvas.width = Math.round(width * scale)
  canvas.height = Math.round(height * scale)
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  ctx.scale(scale, scale)
  ctx.drawImage(img, 0, 0, width, height)

  canvas.toBlob((blob) => {
    if (blob) downloadBlob(blob, filename)
  }, 'image/png')
}

export async function exportSunPath(options: ExportOptions): Promise<void> {
  const svg = document.getElementById(options.svgId) as SVGSVGElement | null
  if (!svg) return
  const filenameBase = options.filenameBase ?? 'sun-path'

  if (options.target === 'svg') {
    await exportSvg(svg, `${filenameBase}.svg`)
    return
  }

  await exportPng(svg, `${filenameBase}.png`, options.scale ?? 2, options.background)
}
