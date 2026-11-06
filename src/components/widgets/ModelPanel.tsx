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
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="relative mt-1.5 h-2 rounded-full bg-fg/10" aria-hidden>
                    <div className="h-full rounded-full bg-accent-fill transition-[width] duration-700" style={{ width: `${(Math.max(0, w) / maxWeight) * 100}%` }} />
                    <span className="absolute -top-0.5 h-3 w-0.5 rounded bg-fg" style={{ left: `${(Math.max(0, p) / maxWeight) * 100}%` }} />
                  </div>
                  {factors && <p className="mt-1 font-mono text-[11px] text-subtle">ahora: {Math.round(factors[f] * 100)}/100</p>}
                </li>
              )
            })}
          </ul>
        </div>

        {/* ── Check-in y precisión ─────────────── */}
        <div className="flex flex-col gap-4">
          <div role="group" aria-labelledby="checkin-question">
            <p id="checkin-question" className="text-sm font-medium text-fg">
              ¿Cómo te sientes ahora?
            </p>
            <p className="mt-0.5 text-xs text-muted">Cada respuesta reentrena el modelo con tus señales de este momento.</p>
            <div className="mt-3 grid grid-cols-5 gap-1.5">
              {RATINGS.map((r) => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => onCheckIn(r.value)}
                  aria-label={`${r.value}: ${r.label}`}
                  className="rounded-lg border border-line px-1 py-2 text-center transition hover:border-accent/50 hover:bg-accent/10"
                >
                  <span className="block font-mono text-base font-semibold text-fg">{r.value}</span>
                  <span className="block truncate text-[11px] text-muted">{r.label}</span>
                </button>
              ))}
            </div>
          </div>

          {lastResult?.lastPrediction !== undefined && (
            <p className="animate-rise rounded-lg border border-accent/30 bg-accent/10 px-3 py-2 text-xs text-fg-2" role="status">
              Predije <span className="font-mono font-semibold text-fg">{lastResult.lastPrediction}</span>, me dijiste{' '}
              <span className="font-mono font-semibold text-fg">{lastResult.lastAnswer}</span>. Ya lo he tenido en cuenta.
            </p>
          )}

          <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-line bg-line">
            <div className="bg-elevated px-3 py-2.5">
              <dt className="text-xs text-muted">Error sin aprender</dt>
              <dd className="font-mono text-lg text-fg-2 tabular-nums">
                {model.errorPrior ?? '—'}
                <span className="text-xs text-subtle"> pts</span>
              </dd>
            </div>
            <div className="bg-elevated px-3 py-2.5">
              <dt className="text-xs text-muted">Error del modelo</dt>
              <dd className="font-mono text-lg text-accent tabular-nums">
                {model.errorModel ?? '—'}
                <span className="text-xs text-subtle"> pts</span>
                {improvement !== null && improvement > 0 && <span className="ml-1.5 text-xs text-ok">−{improvement}</span>}
              </dd>
            </div>
          </dl>

          <button
            type="button"
            onClick={onReset}
            disabled={model.samples === 0}
            className="self-start rounded-md px-1 text-xs text-muted underline-offset-2 transition hover:text-danger hover:underline disabled:cursor-not-allowed disabled:no-underline disabled:opacity-50 disabled:hover:text-muted"
          >
            Olvidar lo aprendido
          </button>
        </div>
      </div>
    </Panel>
  )
}
