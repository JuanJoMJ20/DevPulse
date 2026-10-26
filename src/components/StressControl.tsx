import type { StressLevel } from '../types'

const LEVEL_META: Record<StressLevel, { label: string; text: string; bar: string }> = {
  low: { label: 'Baja', text: 'text-accent', bar: 'bg-accent-fill' },
  medium: { label: 'Media', text: 'text-warn', bar: 'bg-warn-fill' },
  high: { label: 'Alta', text: 'text-danger', bar: 'bg-danger-fill' },
}

const OPTIONS: { value: StressLevel | 'auto'; label: string; hint: string }[] = [
  { value: 'auto', label: 'IA', hint: 'La IA decide la vista según tu carga' },
  { value: 'low', label: 'Baja', hint: 'Fijar la vista completa' },
  { value: 'medium', label: 'Media', hint: 'Fijar la vista equilibrada' },
  { value: 'high', label: 'Alta', hint: 'Fijar Enfoque Absoluto' },
]

interface StressControlProps {
  load: number
  /** Nivel que corresponde a la carga, no al layout elegido */
  loadLevel: StressLevel
  /** Layout fijado a mano (si auto es false) */
  level: StressLevel
  auto: boolean
  onOverride: (level: StressLevel | 'auto') => void
  /** Solo existe en modo navegador, donde la carga es simulada */
  onSpike?: () => void
}

export function StressControl({ load, loadLevel, level, auto, onOverride, onSpike }: StressControlProps) {
  const meta = LEVEL_META[loadLevel]
  const selected = auto ? 'auto' : level

  return (
    <div className="flex items-center gap-3">
      {/* Anchos fijos: el número y la palabra cambian, pero nada se desplaza */}
      <div data-tour="stress" className="flex w-[260px] shrink-0 items-center gap-3 rounded-xl border border-line bg-surface px-3 py-2 backdrop-blur-xl">
        <div className="w-[112px] shrink-0">
          <p className="font-mono text-[11px] whitespace-nowrap uppercase tracking-[0.08em] text-subtle">Carga mental</p>
          <p className="flex items-baseline text-sm font-semibold">
            <span className={`inline-block w-12 transition-colors duration-700 ${meta.text}`}>{meta.label}</span>
            <span className="inline-block w-8 text-right font-mono font-normal tabular-nums text-muted">{load}</span>
          </p>
        </div>
        <div
          className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-fg/10"
          role="meter"
          aria-valuenow={load}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuetext={`${load} de 100, carga ${meta.label.toLowerCase()}`}
          aria-label="Carga mental"
        >
          <div className={`h-full rounded-full transition-[width,background-color] duration-700 ${meta.bar}`} style={{ width: `${load}%` }} />
          <span aria-hidden className="absolute inset-y-0 left-[70%] w-px bg-fg/40" />
        </div>
      </div>

      <div data-tour="layout-control" role="radiogroup" aria-label="Control de la vista" className="inline-flex shrink-0 rounded-xl border border-line bg-surface p-1 backdrop-blur-xl">
        {OPTIONS.map((o) => (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={selected === o.value}
            title={o.hint}
            onClick={() => onOverride(o.value)}
            className={`rounded-lg px-2.5 py-1 text-xs font-medium transition ${selected === o.value ? 'bg-fg/10 text-fg' : 'text-muted hover:text-fg'}`}
          >
            {o.value === 'auto' && <span aria-hidden className={`mr-1.5 inline-block size-1.5 rounded-full ${auto ? 'animate-pulse-soft bg-accent-fill' : 'bg-subtle'}`} />}
            {o.label}
          </button>
        ))}
      </div>

      {onSpike && (
        <button
          type="button"
          onClick={onSpike}
          className="rounded-xl border border-danger/30 bg-danger/10 px-3 py-2 text-xs font-medium text-danger transition hover:border-danger/50"
        >
          Simular pico de fatiga
        </button>
      )}
    </div>
  )
}
