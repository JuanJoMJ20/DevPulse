import type { FactorKey, ModelSummary } from '../../types'
import { Panel } from '../Panel'

export const FACTOR_LABELS: Record<FactorKey, string> = {
  fragmentation: 'Saltos entre apps',
  noBreak: 'Tiempo sin pausa',
  corrections: 'Correcciones al teclear',
  rhythm: 'Ritmo irregular',
}

export const RATINGS = [
  { value: 1, label: 'Fresco' },
  { value: 2, label: 'Bien' },
  { value: 3, label: 'Normal' },
  { value: 4, label: 'Cansado' },
  { value: 5, label: 'Agotado' },
]

interface ModelPanelProps {
  className?: string
  model: ModelSummary | null
  factors: Record<FactorKey, number> | null
  /** Respuesta del último check-in, para enseñar qué predijo y qué dijiste */
  lastResult: ModelSummary | null
  onCheckIn: (rating: number) => void
  /** Pide confirmación antes de borrar lo aprendido */
  onReset: () => void
}

/**
 * IA · Modelo personal. Muestra qué ha aprendido la regresión logística:
 * el peso de cada señal frente al de partida y cuánto ha bajado el error.
 */
export function ModelPanel({ className, model, factors, lastResult, onCheckIn, onReset }: ModelPanelProps) {
  if (!model) {
    return (
      <Panel id="model" eyebrow="IA · Modelo personal" title="Lo que he aprendido de ti" className={className}>
        <p className="text-sm text-muted">El modelo se entrena con tu actividad real y solo funciona en la app de escritorio.</p>
      </Panel>
    )
  }

  const maxWeight = Math.max(4, ...model.weights.map(Math.abs), ...model.prior.map(Math.abs))
  const improvement = model.errorPrior !== null && model.errorModel !== null ? model.errorPrior - model.errorModel : null
  const order = model.features.map((f, i) => ({ f, i })).sort((a, b) => model.weights[b.i] - model.weights[a.i])

  return (
    <Panel
      id="model"
      eyebrow="IA · Modelo personal"
      title="Lo que he aprendido de ti"
      className={className}
      actions={
        <span className="font-mono text-xs text-subtle">
          <span className="text-fg tabular-nums">{model.samples}</span> respuestas
        </span>
      }
    >
      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        {/* ── Pesos aprendidos ─────────────────── */}
        <div>
          <p className="mb-3 text-xs text-muted">Peso de cada señal en tu fatiga. La marca vertical es el valor de partida; la barra, lo aprendido.</p>
          <ul className="space-y-3">
            {order.map(({ f, i }) => {
              const w = model.weights[i]
              const p = model.prior[i]
              const delta = w - p
              return (
                <li key={f}>
                  <div className="flex items-baseline justify-between text-[13px]">
                    <span className="text-fg-2">{FACTOR_LABELS[f]}</span>
                    <span className="font-mono text-muted tabular-nums">
                      {w.toFixed(2)}
                      {Math.abs(delta) >= 0.05 && (
                        <span className={delta > 0 ? 'ml-1.5 text-danger' : 'ml-1.5 text-ok'}>
                          {delta > 0 ? '▲ sube' : '▼ baja'} {Math.abs(delta).toFixed(2)}
