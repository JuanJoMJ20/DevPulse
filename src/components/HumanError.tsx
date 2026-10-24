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
