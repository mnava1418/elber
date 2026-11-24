import { useEffect, useRef, useState } from 'react'

export interface ChartPoint {
  // Position on the x axis: a day number for dates, the index for plans.
  x: number
  value: number
  // Under the axis and in the tooltip: "20 nov", "Fuerza base".
  label: string
  // Extra line in the tooltip: "4×6".
  detail?: string
}

interface Props {
  points: ChartPoint[]
  unit: string
  // The series' name, for screen readers and the table.
  name: string
}

const HEIGHT = 220
const PAD = { top: 16, right: 16, bottom: 28, left: 44 }
// Fewer labels than this many px apart would collide.
const MIN_LABEL_GAP = 64

// Round steps for the y axis: 1, 2, 2.5, 5 × 10ⁿ, about four lines.
function ticks(min: number, max: number) {
  const span = max - min || Math.abs(max) || 1
  const raw = span / 4
  const pow = 10 ** Math.floor(Math.log10(raw))
  const step = [1, 2, 2.5, 5, 10].map((m) => m * pow).find((s) => s >= raw)!
  const start = Math.floor((min - span * 0.1) / step) * step
  const end = Math.ceil((max + span * 0.1) / step) * step
  const out: number[] = []
  for (let t = start; t <= end + step / 2; t += step) out.push(Number(t.toFixed(6)))
  return out
}

const format = (n: number) => n.toLocaleString('es-MX', { maximumFractionDigits: 1 })

// The chart's width follows its container; text stays at its size.
function useWidth() {
  const ref = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(0)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new ResizeObserver(([entry]) => setWidth(entry!.contentRect.width))
    observer.observe(el)
    return () => observer.disconnect()
  }, [])
  return { ref, width }
}

// One series over time, hand-rolled in SVG: a 2px line, round markers, a
// recessive grid, and a crosshair with a tooltip on hover (or focus).
export function LineChart({ points, unit, name }: Props) {
  const { ref, width } = useWidth()
  const [active, setActive] = useState<number | null>(null)

  const values = points.map((p) => p.value)
  const yTicks = ticks(Math.min(...values), Math.max(...values))
  const yMin = yTicks[0]!
  const yMax = yTicks.at(-1)!
  const xMin = points[0]!.x
  const xSpan = points.at(-1)!.x - xMin
  const plotW = Math.max(width - PAD.left - PAD.right, 1)
  const plotH = HEIGHT - PAD.top - PAD.bottom
  // A single point sits in the middle.
  const xOf = (x: number) => PAD.left + (xSpan === 0 ? plotW / 2 : ((x - xMin) / xSpan) * plotW)
  const yOf = (v: number) => PAD.top + (1 - (v - yMin) / (yMax - yMin)) * plotH
  const coords = points.map((p) => ({ ...p, cx: xOf(p.x), cy: yOf(p.value) }))

  // Every label that fits, always the first and the last.
  const shown = new Set<number>()
  let lastX = -Infinity
  coords.forEach((c, i) => {
    const isLast = i === coords.length - 1
    if (c.cx - lastX >= MIN_LABEL_GAP || (isLast && c.cx - lastX >= MIN_LABEL_GAP / 2)) {
      shown.add(i)
      lastX = c.cx
    }
  })

  // The nearest point to the pointer, so the hit area is the whole plot.
  const pick = (clientX: number, svg: SVGSVGElement) => {
    const x = clientX - svg.getBoundingClientRect().left
    let best = 0
    coords.forEach((c, i) => {
      if (Math.abs(c.cx - x) < Math.abs(coords[best]!.cx - x)) best = i
    })
    setActive(best)
  }
  const current = active === null ? null : coords[active]

  return (
    <div className="tr-chart" ref={ref}>
      {width > 0 && (
        <svg
          width={width}
          height={HEIGHT}
          role="img"
          aria-label={`${name}: ${points.map((p) => `${p.label} ${format(p.value)} ${unit}`).join(', ')}`}
          tabIndex={0}
          onPointerMove={(e) => pick(e.clientX, e.currentTarget)}
          onPointerLeave={() => setActive(null)}
          onFocus={() => setActive(coords.length - 1)}
          onBlur={() => setActive(null)}
          onKeyDown={(e) => {
            if (e.key === 'ArrowLeft') setActive((a) => Math.max((a ?? 0) - 1, 0))
            if (e.key === 'ArrowRight') setActive((a) => Math.min((a ?? 0) + 1, coords.length - 1))
          }}
        >
          {yTicks.map((t) => (
            <g key={t}>
              <line className="tr-chart-grid" x1={PAD.left} x2={width - PAD.right} y1={yOf(t)} y2={yOf(t)} />
              <text className="tr-chart-tick" x={PAD.left - 8} y={yOf(t)} textAnchor="end" dominantBaseline="middle">
                {format(t)}
              </text>
            </g>
          ))}
          {coords.map((c, i) =>
            shown.has(i) ? (
              <text key={i} className="tr-chart-tick" x={c.cx} y={HEIGHT - 8} textAnchor={i === 0 && coords.length > 1 ? 'start' : i === coords.length - 1 && coords.length > 1 ? 'end' : 'middle'}>
                {c.label.length > 14 ? `${c.label.slice(0, 13)}…` : c.label}
              </text>
            ) : null,
          )}
          {current && <line className="tr-chart-cross" x1={current.cx} x2={current.cx} y1={PAD.top} y2={PAD.top + plotH} />}
          <polyline className="tr-chart-line" points={coords.map((c) => `${c.cx},${c.cy}`).join(' ')} />
          {coords.map((c, i) => (
            <circle key={i} className={`tr-chart-dot${i === active ? ' tr-chart-dot--on' : ''}`} cx={c.cx} cy={c.cy} r={i === active ? 5.5 : 4} />
          ))}
        </svg>
      )}
      {current && (
        <div
          className="tr-chart-tip"
          style={{ left: Math.min(Math.max(current.cx, 70), width - 70), top: current.cy }}
          aria-hidden="true"
        >
          <span className="tr-chart-tip-label">{current.label}</span>
          <span className="tr-chart-tip-value">
            {format(current.value)} {unit}
          </span>
          {current.detail && <span className="tr-chart-tip-detail">{current.detail}</span>}
        </div>
      )}
    </div>
  )
}
