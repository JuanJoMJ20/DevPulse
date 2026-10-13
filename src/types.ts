export type StressLevel = 'low' | 'medium' | 'high'

/** Preferencias de cada cuenta (el tema es del equipo y va aparte) */
export interface Settings {
  focusMinutes: number
  shortMinutes: number
  longMinutes: number
  /** Cada cuánto pregunta la IA cómo te sientes; 0 = nunca */
  checkInMinutes: number
  /** Activar el bloqueador al entrar en Enfoque Absoluto */
  autoBlock: boolean
}

export const DEFAULT_SETTINGS: Settings = {
  focusMinutes: 25,
  shortMinutes: 5,
  longMinutes: 15,
  checkInMinutes: 25,
  autoBlock: true,
}

export interface User {
  id: string
  name: string
  email: string
  createdAt: number
}

export type AuthErrorCode = 'name' | 'email' | 'weak' | 'exists' | 'credentials'

export type AuthResult = { ok: true; user: User; isFirst?: boolean } | { ok: false; code: AuthErrorCode }

export type WidgetId = 'pomodoro' | 'code' | 'metrics' | 'model' | 'heatmap' | 'blocker' | 'notifications'

export type FactorKey = 'fragmentation' | 'noBreak' | 'corrections' | 'rhythm'

/** Estado del modelo personal de fatiga (regresión logística en el equipo) */
export interface ModelSummary {
  features: FactorKey[]
  weights: number[]
  prior: number[]
  bias: number
  samples: number
  /** Error medio en puntos (0–100) de los pesos iniciales sobre tus respuestas */
  errorPrior: number | null
  /** Error medio en puntos del modelo ya entrenado */
  errorModel: number | null
  trainedAt: number | null
  lastCheckIn: number | null
  /** Solo en la respuesta a un check-in: lo que predijo antes de aprender de ti */
  lastPrediction?: number
  lastAnswer?: number
}

export interface HumanErrorContent {
  /** Qué pasó, en lenguaje humano */
  what: string
