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
            {load}
            <span className="text-lg text-subtle">/100</span>
          </p>
          <p className="mt-1 text-xs text-muted">
            {!signals ? 'Simulada (modo navegador)' : signals.model.samples > 0 ? `Predicha por tu modelo personal (${signals.model.samples} respuestas)` : 'Predicha con los pesos de partida'}
          </p>
        </div>
        <div className="text-right">
          <p className="font-mono text-2xl font-medium text-accent tabular-nums">{efficiency === null ? '—' : `${efficiency}%`}</p>
          <p className="text-xs text-muted">Eficiencia</p>
        </div>
      </div>

      <div className="mt-4">
        <Sparkline data={history} />
        <div className="mt-1 flex justify-between font-mono text-[11px] text-subtle">
          <span>hace 2 min</span>
          <span className="text-danger">umbral de fatiga</span>
          <span>ahora</span>
        </div>
      </div>

      {signals && (
        <ul className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2">
          {(Object.keys(FACTOR_LABELS) as (keyof Signals['factors'])[]).map((k) => (
            <li key={k}>
              <div className="flex justify-between text-xs text-muted">
                <span>{FACTOR_LABELS[k]}</span>
                <span className="font-mono tabular-nums">{Math.round(signals.factors[k] * 100)}</span>
              </div>
              <div className="mt-1 h-1 overflow-hidden rounded-full bg-fg/10" aria-hidden>
                <div className="h-full rounded-full bg-accent-fill transition-[width] duration-700" style={{ width: `${signals.factors[k] * 100}%` }} />
              </div>
            </li>
          ))}
        </ul>
      )}
      {signals && !signals.keyboard && <p className="mt-2 text-xs text-warn">No pude leer el ritmo de tecleo; uso solo las demás señales.</p>}

      <dl className="mt-5 grid grid-cols-3 gap-px overflow-hidden rounded-xl border border-line bg-line">
        {stats.map((s) => (
          <div key={s.label} className="bg-elevated px-3 py-2.5">
            <dt className="truncate text-xs text-muted">{s.label}</dt>
            <dd className="mt-0.5 font-mono text-lg font-medium text-fg tabular-nums">{s.value}</dd>
            <dd className="truncate text-[11px] text-subtle">{s.hint}</dd>
          </div>
        ))}
      </dl>
    </Panel>
  )
}
