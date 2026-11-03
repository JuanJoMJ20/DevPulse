import { formatMinutes } from '../../lib/time'
import type { Signals } from '../../types'
import { Panel } from '../Panel'
import { FACTOR_LABELS } from './ModelPanel'

interface MetricsPanelProps {
  className?: string
  load: number
  history: number[]
  /** null si aún no hay tiempo activo suficiente para calcularla */
  efficiency: number | null
  focusMinutesToday: number
  signals: Signals | null
}

function Sparkline({ data }: { data: number[] }) {
  const w = 240
  const h = 56
  const step = w / (data.length - 1)
  const points = data.map((v, i) => `${(i * step).toFixed(1)},${(h - (v / 100) * h).toFixed(1)}`)
  const line = `M${points.join(' L')}`
  const area = `${line} L${w},${h} L0,${h} Z`
  const threshold = h - 0.7 * h

  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="h-14 w-full overflow-visible" role="img" aria-label="Evolución de la carga en los últimos 2 minutos">
      <defs>
        <linearGradient id="spark-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" style={{ stopColor: 'var(--accent-fill)', stopOpacity: 0.25 }} />
          <stop offset="100%" style={{ stopColor: 'var(--accent-fill)', stopOpacity: 0 }} />
        </linearGradient>
      </defs>
      <line x1="0" x2={w} y1={threshold} y2={threshold} style={{ stroke: 'var(--danger)', strokeOpacity: 0.5 }} strokeDasharray="3 4" vectorEffect="non-scaling-stroke" />
      <path d={area} fill="url(#spark-fill)" />
      <path d={line} fill="none" style={{ stroke: 'var(--accent-fill)' }} strokeWidth="1.5" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
    </svg>
  )
}

export function MetricsPanel({ className, load, history, efficiency, focusMinutesToday, signals }: MetricsPanelProps) {
  const stats = [
    { label: 'Flujo hoy', value: formatMinutes(focusMinutesToday), hint: 'en sesiones de enfoque' },
    { label: 'Cambios de app', value: signals ? String(signals.today.switches) : '—', hint: signals ? `${signals.switchesPerMin}/min ahora` : 'sin datos' },
    { label: 'Sin pausa', value: signals ? `${Math.round(signals.continuousMin)}m` : '—', hint: signals ? `${signals.kpm} teclas/min` : 'sin datos' },
  ]

  return (
    <Panel id="metrics" eyebrow="Bienestar · En vivo" title="Carga cognitiva" className={className}>
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="font-mono text-4xl font-medium tracking-tight text-fg tabular-nums">
