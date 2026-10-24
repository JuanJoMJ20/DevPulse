import type { HumanErrorContent } from '../types'

interface HumanErrorProps extends HumanErrorContent {
  onRetry?: () => void
  onDismiss?: () => void
  retryLabel?: string
}

// Patrones que delatan jerga técnica. Solo avisa en desarrollo.
const TECHNICAL_JARGON =
  /\b(exception|stack|null|undefined|NaN|timeout|ECONN\w*|ETIMEDOUT|ENOTFOUND|HTTP|status|[45]\d{2}|0x[0-9a-f]+|failed to fetch)\b/i

function warnIfTechnical(fields: HumanErrorContent) {
  if (!import.meta.env.DEV) return
  for (const [key, text] of Object.entries(fields)) {
    if (TECHNICAL_JARGON.test(text)) {
      console.warn(`[HumanError] "${key}" contiene lenguaje técnico: "${text}". Reescríbelo para una persona.`)
    }
  }
}

const STEPS = [
  { key: 'what', label: 'Qué pasó' },
  { key: 'why', label: 'Por qué' },
  { key: 'next', label: 'Qué hacer ahora' },
] as const

/**
 * Alerta humanizada. Las tres partes (what / why / next) son obligatorias
 * por tipo: el componente no compila si falta alguna.
 */
export function HumanError({ what, why, next, onRetry, onDismiss, retryLabel = 'Intentar de nuevo' }: HumanErrorProps) {
  warnIfTechnical({ what, why, next })
  const content = { what, why, next }

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="animate-rise relative w-full max-w-sm overflow-hidden rounded-2xl border border-warn/30 bg-elevated p-5 shadow-[var(--shadow-pop)]"
    >
      <div aria-hidden className="absolute inset-y-0 left-0 w-[3px] bg-gradient-to-b from-warn-fill via-warn-fill/60 to-transparent" />

      <div className="flex items-start gap-3">
        <span aria-hidden className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-full bg-warn/10 text-warn ring-1 ring-warn/30">
          <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
            <path d="M12 8v5M12 16.5v.01" />
            <circle cx="12" cy="12" r="9" />
          </svg>
        </span>

        <ol className="min-w-0 flex-1 space-y-3">
          {STEPS.map((step, i) => (
            <li key={step.key}>
              <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-subtle">
                <span className="text-warn">0{i + 1}</span> · {step.label}
              </p>
              <p className={i === 0 ? 'mt-0.5 text-[15px] font-semibold leading-snug text-fg' : 'mt-0.5 text-sm leading-snug text-muted'}>{content[step.key]}</p>
            </li>
          ))}
